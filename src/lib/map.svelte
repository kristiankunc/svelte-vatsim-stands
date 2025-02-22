<script lang="ts">
	import { onMount } from "svelte";
	import { Map, MapBrowserEvent } from "ol";
	import TileLayer from "ol/layer/Tile.js";
	import { XYZ } from "ol/source.js";
	import { StandManager, type StandData, type Thresholds, type ViewParams } from "$lib/stands.js";
	import { useGeographic } from "ol/proj.js";
	import { tileUrls } from "$lib/tiles.js";

	let {
		tileUlr = tileUrls.SATELLITE,
		sourcePath,
		viewParams = {
			center: [0, 0],
			zoom: 2
		},
		currentStand = $bindable(null),
		thresholds = {
			ktsMaxGroundSpeed: 1,
			kmDistanceFromCenter: 10,
			mStandOccupancyRadius: 40
		}
	}: {
		tileUlr?: string;
		sourcePath: string;
		viewParams: ViewParams;
		currentStand?: StandData | null;
		thresholds?: Thresholds;
	} = $props();

	useGeographic();
	const standManager = new StandManager(viewParams, sourcePath, thresholds);

	onMount(() => {
		standManager.init();

		const map = new Map({
			target: "map",
			layers: [
				new TileLayer({
					source: new XYZ({
						url: tileUlr
					})
				}),
				standManager.mapLayer
			],
			view: standManager.view
		});

		map.on("pointermove", (event: MapBrowserEvent<PointerEvent>) => {
			const featureId = map.forEachFeatureAtPixel(event.pixel, (feature) => feature)?.getId();

			if (!featureId) currentStand = null;

			const stand = standManager.getStand(featureId as string);
			if (stand)
				currentStand = {
					name: stand.name,
					occupied: stand.occupied,
					callsign: stand.pilot?.callsign
				};
		});

		const interval = setInterval(() => {
			standManager.update();
		}, 20000);

		return () => {
			clearInterval(interval);
		};
	});
</script>

<div id="map" class="h-[100vh] w-full"></div>
