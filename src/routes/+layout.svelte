<script lang="ts">
	import type { LayoutServerData } from './$types.js';

	export let data: LayoutServerData;
</script>

<p>data.layoutCount</p>
<p data-testid="dataLayoutCount">{data.layoutCount}</p>

<slot />
