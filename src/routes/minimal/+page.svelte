<script lang="ts">
	import Map from "$lib/map.svelte";
	import { tileUrls } from "$lib/tiles.js";
</script>

<!--
Using the Map component to display the map:
 	tileUlr: URL of the tile source (defaults to satellite view)
 	viewParams: Initial view parameters {center: [longitude, latitude], zoom: number} (defaults to center of the world)
 	sourcePath: Path to the stand data source accessible from the client (can be relative or absolute)
-->

<Map
	tileUlr={tileUrls.SATELLITE}
	viewParams={{
		center: [24.8085431, 59.4153153],
		zoom: 16.25
	}}
	sourcePath="/test-stands/EETN.txt"
/>
