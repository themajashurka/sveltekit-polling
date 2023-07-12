# Why

One way to achive realtime capabilities in an app is polling.

In sveltekit, this could be solved from client side with a simple periodic calling of `invalidate(...)` or `invalidateAll()`

```js
setInterval(() => {
	invalidate('custom:url');
	//OR
	invalidateAll();
}, 1000);
```

However, sveltekit has its own logic about when a load function needs to be invoked, and in certain scenarios calling `invalidate` causes dependecy tracking to kick in, so you could end up rerunning more load functions than you ultimately want.

Invalidating a whole page could cause unnecessary strain on the server by recalculating unchanging properties. Maybe you don't need to invalidate all properties returned by a load function, just a portion of it.

Taking advantage of the independency of `+server` endpoints, polling can be done with them easily.

# Usage

Populate your page with a `load` function

```js
export const load = async () => {
	const dbResult = await db.get('count');

	return { staticProperty: 'foo', dynamicCount: dbResult };
};
```

Create an endpoint with a `GET` handler in a `+server` file. Return an arbitrary, `devalue`-able object within `pollingResponse()` with the same keys as in your corresponding load function.

> Note: if you are using this endpoint for something else, you could guard this return statement with an `beingPolled({url})`

```js
import { beingPolled, pollingResponse } from 'sveltekit-polling';

export const GET = async ({ url }) => {
	if (beingPolled(url)) {
		const dbResult = await db.get('count');

		return pollingResponse({ dynamicCount: dbResult });
	}

	return new Response('other usage than polling');
};
```

Use `new Polling(args)` in a `+page` and call `polling.begin()` to begin polling. Specify your polled keys, and your `+server` location.

```svelte
<script>
	import { Polling } from 'sveltekit-polling';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';

	export let data;
	const polling = new Polling({
		page,
		data,
		interval: 1000,
		routeId: '/',
		keys: 'dynamicCount'
	});
	const polledData = polling.polledData;

	onMount(() => {
		polling.begin();
		return () => polling.stop();
	});
</script>

<p>{$polledData.staticProperty}</p><p>{$polledData.dynamicCount}</p>
```

`pollingData` is a store with all keys from your initial `data`. Every time `data` changes (after a form submission for example) or a polling is done, `polledData` updates.

> TODO: `new Polling()` constructor argument docs, type safety across `+page` and `+server` and client.
