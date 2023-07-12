<script lang="ts">
	import { page } from '$app/stores';
	import { Polling } from '$lib/Polling.js';
	import { onMount } from 'svelte';
	import type { PageData } from './$types.js';

	export let data: PageData;
	const polling = new Polling({ data, interval: 200, keys: 'fooCount', page, routeId: '/foo' });
	const polledData = polling.polledData;

	onMount(() => {
		polling.begin();
		return () => polling.stop();
	});
</script>

<p>data.foo count: {data.fooCount}</p>
<p>polledData.foo count: {$polledData.fooCount}</p>

<a data-testid="gotoLayout" href="/">goto layout</a>
