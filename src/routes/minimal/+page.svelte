<script lang="ts">
	import Map from "$lib/map.svelte";
	import { tileUrls } from "$lib/tiles.js";
</script>

<Map
	tileUlr={tileUrls.SATELLITE}
	viewParams={{
		center: [-0.458491, 51.471325],
		zoom: 15
	}}
	sourcePath="/test-stands/EGLL.txt"
/>
