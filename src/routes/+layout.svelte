<script lang="ts">
	import { page } from '$app/stores';
	import { Polling } from '$lib/Polling.js';
	import { onMount } from 'svelte';
	import type { LayoutServerData } from './$types.js';

	export let data: LayoutServerData;
	const polling = new Polling({
		data,
		interval: 500,
		keys: 'layoutCount',
		page,
		routeId: '/',
		onPolled: () => console.log('POLLED!')
	});
	const polledData = polling.polledData;

	onMount(() => {
		polling.begin();
		return () => polling.stop();
	});
</script>

<p>data.layoutCount</p>
<p data-testid="dataLayoutCount">{data.layoutCount}</p>
<p>polledData.layoutCount</p>
<p data-testid="polledDataLayoutCount">{$polledData.layoutCount}</p>

<slot />
