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
	let updateInterval: number;

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

		return () => {
			clearInterval(updateInterval);
		};
	});
</script>

<svelte:window
	on:visibilitychange={() => {
		switch (document.visibilityState) {
			case "visible":
				standManager.update();

				updateInterval = setInterval(() => {
					standManager.update();
				}, 20000);

				break;

			case "hidden":
				clearInterval(updateInterval);

				break;
		}
	}}
/>

<div id="map" class="h-[100vh] w-full"></div>
