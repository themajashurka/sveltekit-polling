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

	private onPolled: (() => any) | undefined;

	private extractObject = <T extends {}>(source: T, keys: (keyof T)[], target?: T) => {
		const _target = target ?? ({} as T);
		for (const key of keys) {
			_target[key as keyof T] = source[key];
		}
		return _target;
	};

	constructor(args: {
		data: PageData;
		page: typeof page;
		interval: number;
		keys: PageDataKey[] | PageDataKey;
		routeId?: string;
		noWaitForResponse?: true;
		onPolled?: () => any;
	}) {
		this.routeId = args.routeId ?? get(args.page).route.id!;
		this.interval = args.interval;
		this.page = args.page;
		this.keys = Array.isArray(args.keys) ? args.keys : [args.keys];
		this.noWaitForResponse = args.noWaitForResponse ?? false;

		const allPageDataKeys = Object.keys(args.data);
		if (dev) console.log('sveltekit-polling -> all page data keys', allPageDataKeys);

		this.polledData = writable(args.data);
		if (dev) console.log('sveltekit-polling -> default page data', devalue.uneval(this.oldData));

		this.currentPageData = this.extractObject(args.data, allPageDataKeys);
		this.pageUnsub = this.page.subscribe((x) => {
			const newData = this.extractObject(x.data, allPageDataKeys) as PageData;
			if (dev)
				console.log(
					'sveltekit-polling -> page changed',
					'oldData',
					devalue.uneval(this.currentPageData),
					'newData',
					devalue.uneval(newData)
				);
			if (!equal(this.currentPageData, newData)) {
				if (dev)
					console.log(
						'sveltekit-polling -> page data changed',
						devalue.uneval(this.currentPageData),
						devalue.uneval(newData)
					);
				this.currentPageData = newData;
				this.polledData.update((x) => this.extractObject(newData, allPageDataKeys, x));
			}
		});

		this.onPolled = args.onPolled;
	}

	private poll = async (immediate?: true, once?: boolean) => {
		if (!this.polling) return Promise.resolve();
		this.timeout = setTimeout(
			async () => {
				const pollingPromise = new Promise(async (res) => {
					try {
						const newData = (await fetch(this.routeId + '?__polling__=true', { method: 'get' })
							.then(async (x) => x.text())
							.then((x) => eval('(' + x + ')'))) as PageData;
						if (dev) console.log('sveltekit-polling -> polled data', newData);
						if (!equal(this.oldData, newData)) {
							if (dev)
								console.log(
									'sveltekit-polling -> page data changed during polling',
									devalue.uneval(this.oldData),
									devalue.uneval(newData)
								);
							this.polledData.update((x) => this.extractObject(newData, this.keys, x));
						}
					} catch (e) {
						console.error(e);
					} finally {
						res('');
					}
				});

				if (!this.noWaitForResponse) await pollingPromise;
				if (typeof this.onPolled !== 'undefined') this.onPolled();
				if (!once) this.poll();
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

	onMount = () => {
		this.begin();
		return this.stop;
	};
}

const deepCopy = <T>(data: T) => eval('(' + devalue.uneval(data) + ')') as T;
