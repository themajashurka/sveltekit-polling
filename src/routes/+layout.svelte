<script lang="ts">
	import type { LayoutData } from './$types.js';
	import { page } from '$app/stores';
	import { Polling } from '$lib/Polling.js';
	import { onMount } from 'svelte';
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';

	export let data: LayoutData;
	const polling = new Polling({ data, interval: 1000, keys: 'layoutCount', page, routeId: '/' });
	const polledData = polling.polledData;

	onMount(() => {
		polling.begin();
		return () => polling.stop();
	});
</script>

<form method="post" use:enhance>
	<button>increment layout count</button>
</form>

<p>layout count {data.layoutCount}</p>
<p>layout polled count {$polledData.layoutCount}</p>

<slot />
