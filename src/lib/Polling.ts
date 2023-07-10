import { get, writable, type Writable } from 'svelte/store';
import type { page } from '$app/stores';
import equal from 'fast-deep-equal';
import * as devalue from 'devalue';
import { dev } from '$app/environment';

export const pollingResponse = (body: any) => new Response(devalue.uneval(body));

export const beingPolled = (url: URL) => url.searchParams.get('__polling__') === 'true';

export class Polling<PageData extends { [key: string]: any }, PageDataKey extends keyof PageData> {
	polledData: Writable<PageData>;
	private polling: boolean = false;
	private page: typeof page;
	private pageUnsub: Function;
	private timeout: NodeJS.Timeout | undefined;
	private routeId: string;
	private keys: PageDataKey[];
	private interval: number;
	private get oldData() {
		return this.extractObject(get(this.polledData), this.keys);
	}
	private noWaitForResponse: boolean;
	private currentPageData!: PageData;

	private updatePolledData = (x: PageData, newData: PageData) => {
		for (const key of this.keys) {
			x[key] = newData[key];
		}
		return x;
	};
	private extractObject = <T extends {}>(obj: T, keys: (keyof T)[]) => {
		const newObj = {} as T;
		for (const key of keys) {
			newObj[key as keyof T] = obj[key];
		}
		return newObj;
	};

	constructor(args: {
		data: PageData;
		page: typeof page;
		interval: number;
		keys: PageDataKey[] | PageDataKey;
		routeId?: string;
		noWaitForResponse?: true;
	}) {
		this.routeId = args.routeId ?? get(args.page).route.id!;
		this.interval = args.interval;
		this.page = args.page;
		this.keys = Array.isArray(args.keys) ? args.keys : [args.keys];
		this.noWaitForResponse = args.noWaitForResponse ?? false;

		const allPageDataKeys = Object.keys(args.data);
		if (dev) console.log('all page data keys', allPageDataKeys);

		this.polledData = writable(args.data);
		if (dev) console.log('default page data', devalue.uneval(this.oldData));

		this.currentPageData = deepCopy(args.data);
		this.pageUnsub = this.page.subscribe((x) => {
			const newData = this.extractObject(x.data, allPageDataKeys) as PageData;
			if (dev)
				console.log(
					'page changed',
					'oldData',
					devalue.uneval(this.currentPageData),
					'newData',
					devalue.uneval(newData)
				);
			if (!equal(this.currentPageData, newData)) {
				if (dev)
					console.log(
						'page data changed',
						devalue.uneval(this.currentPageData),
						devalue.uneval(newData)
					);
				this.currentPageData = newData;
				this.polledData.update((x) => this.updatePolledData(x, newData));
			}
		});
	}

	poll = async (immediate?: true) => {
		if (!this.polling) return;
		this.timeout = setTimeout(
			async () => {
				const pollingPromise = new Promise(async (res) => {
					try {
						const newData = (await fetch(this.routeId + '?__polling__=true', { method: 'get' })
							.then(async (x) => x.text())
							.then((x) => eval('(' + x + ')'))) as PageData;
						if (dev) console.log('polled data', newData);
						if (!equal(this.oldData, newData)) {
							if (dev)
								console.log(
									'page data changed during polling',
									devalue.uneval(this.oldData),
									devalue.uneval(newData)
								);
							this.polledData.update((x) => this.updatePolledData(x, newData));
						}
					} catch (e) {
						console.error(e);
					} finally {
						res('');
					}
				});

				if (!this.noWaitForResponse) await pollingPromise;

				this.poll();
			},
			immediate ? 0 : this.interval
		);
	};

	begin = () => {
		if (this.polling) this.resume();
		this.polling = true;
		this.poll();
	};

	stop = () => {
		this.polling = false;
		clearTimeout(this.timeout);
		this.pageUnsub();
	};

	pause = () => {
		this.polling = false;
		clearTimeout(this.timeout);
	};

	resume = () => {
		if (this.polling) return;
		this.polling = true;
		this.poll(true);
	};
}

const deepCopy = <T>(data: T) => eval('(' + devalue.uneval(data) + ')') as T;
