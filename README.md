# Why

One way to achive realtime capabilities in an app is polling.

In sveltekit, this cound be solved from client side with a simple preiodic calling of `invalidate(...)` or `invalidateAll()`

```js
setInterval(() => {
	invalidate('custom:url');
	//OR
	invalidateAll();
}, 1000);
```

However sveltekit has its own logic about when a certain load function needs to be invoked, and in certain scenarios calling `invalidate` causes dependecy tracking to kick in, so you could end up rerunning more load functions that you ultimately want.

Invalidating a page could cause unncessary strain on the server by recalculating unchanging properties. Maybe you don't need to invalidate all properties returned by a load function, just a portion of it.

# Usage

Populate your page with a load function

```js
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ cookies }) => {
	const dbResult = await db.get('count');
	return { staticProperty: 'foo', dynamicCount: dbResult };
};
```

Create an endpoint with a GET handler in a +server file. Return an arbitrary, `devalue`-able object within `pollingResponse()` with the same keys as in your corresponding load function.

> Note: if you are using this endpoint for something else, you could guard this return statement with an `beingPolled({url})`

```js
import type { RequestHandler } from '@sveltejs/kit';
import { beingPolled, pollingResponse } from 'sveltekit-polling';

export const GET: RequestHandler = async ({ url }) => {
	if (beingPolled(url)) {
		return pollingResponse({ dynamicCount: Math.round(Math.random() * 10) });
	}

	return new Response('other usage than polling');
};
```

Use `new Polling(args)` in a `+page` and call `polling.begin()` to begin polling. Specify your polled keys.

```svelte
<script lang="ts">
	import { Polling } from 'sveltekit-polling';
	import { page } from '$app/stores';
	import type { PageData } from './$types';
	import { onMount } from 'svelte';

	export let data: PageData;
	const polling = new Polling({ page, data, interval: 1000, keys: 'dynamicCount' });
	const polledData: Writable<PageData> = polling.polledData;

	onMount(() => {
		polling.begin();
		return polling.stop();
	});
</script>

<p>{$polledData.staticProperty}</p><p>{$polledData.dynamicCount}</p>
```

`pollingData` is a store with all keys from your initial `data`. Every time `data` changes (after a form submission for example) or a polling is done, `polledData` updates.
