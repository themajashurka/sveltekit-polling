<script lang="ts">
	import type { LayoutData, PageData } from './$types.js';
	import { page } from '$app/stores';
	import { Polling } from '$lib/Polling.js';
	import { onMount } from 'svelte';
	import { enhance } from '$app/forms';
	import type { SubmitFunction } from '@sveltejs/kit';

	export let data: PageData;
	const polling = new Polling({ data, interval: 1000, keys: 'rootCount', page, routeId: '/' });
	const polledData = polling.polledData;

	onMount(() => {
		polling.begin();
		return () => polling.stop();
	});

	let rootForm: HTMLFormElement, fooForm: HTMLFormElement;
	const resetAllCounts = () => {
		rootForm.requestSubmit();
		fooForm.requestSubmit();
	};

	const _enhance: SubmitFunction = () => {
		return async ({ update }) => {
			await update();
		};
	};
</script>

<form action="?/_default" method="post" use:enhance={_enhance}>
	<button data-testid="incrementRootCount">increment data.rootCount</button>
</form>

<button data-testid="reset" on:click={resetAllCounts}>reset all counts</button>

<form action="?/reset" method="post" bind:this={rootForm} use:enhance={_enhance} />
<form action="/foo?/reset" method="post" bind:this={fooForm} use:enhance={_enhance} />

<p>data.rootCount</p>
<p data-testid="dataRootCount">{data.rootCount}</p>
<p>polledData.rootCount</p>
<p data-testid="polledDataRootCount">{$polledData.rootCount}</p>
<p>data.rootOtherCount</p>
<p data-testid="dataRootOtherCount">{data.rootOtherCount}</p>
<p>polledData.rootOtherCount</p>
<p data-testid="polledDataOtherRootCount">{$polledData.rootOtherCount}</p>

<a data-testid="gotoFoo" href="/foo">goto /foo</a>

<slot />
