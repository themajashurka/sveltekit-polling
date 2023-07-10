<script lang="ts">
	import type { PageData } from './$types.js';
	export let data: PageData;
</script>

<p>foo count: {data.fooCount}</p>

<a data-testid="gotoLayout" href="/">goto layout</a>
