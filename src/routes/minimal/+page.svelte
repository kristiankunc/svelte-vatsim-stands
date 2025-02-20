<script lang="ts">
	import Map from "$lib/map.svelte";
	import { tileUrls } from "$lib/tiles.js";
</script>

<Map
	tileUlr={tileUrls.SATELLITE}
	viewParams={{
		center: [24.8085431, 59.4153153],
		zoom: 16.25
	}}
	sourcePath="/test-stands/EETN.txt"
/>
