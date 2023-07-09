import { get, writable, type Writable } from 'svelte/store';
import type { page } from '$app/stores';
import equal from 'fast-deep-equal';
import * as devalue from 'devalue';

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
		return this.extractObject(get(this.polledData));
	}
	private noWaitForResponse: boolean;

	private updatePolledData = (x: PageData, newData: PageData) => {
		for (const key of this.keys) {
			x[key] = newData[key];
		}
		return x;
	};
	private extractObject = (obj: any) => {
		const newObj = {} as PageData;
		for (const key of this.keys) {
			newObj[key] = obj[key];
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

		this.polledData = writable(this.extractObject(args.data));
		let currentPageData = this.extractObject(args.data);

		this.pageUnsub = this.page.subscribe((x) => {
			const newData = this.extractObject(x.data);
			if (!equal(currentPageData, newData)) {
				currentPageData = newData;
				this.polledData.update((x) => this.updatePolledData(x, newData));
				console.log('page data changed');
			}
		});
	}

	poll = async (immediate?: true) => {
		if (!this.polling) return;
		this.timeout = setTimeout(
			async () => {
				const promise = new Promise(async (res) => {
					try {
						const newData = (await fetch(this.routeId + '?__polling__=true', { method: 'get' })
							.then(async (x) => x.text())
							.then((x) => eval('(' + x + ')'))) as PageData;
						console.log('polled data', newData);
						if (!equal(this.oldData, newData)) {
							this.polledData.update((x) => this.updatePolledData(x, newData));
							console.log('page data changed during polling');
						}
						res('');
					} catch (e) {
						console.error(e);
					}
				});

				if (!this.noWaitForResponse) await promise;

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
