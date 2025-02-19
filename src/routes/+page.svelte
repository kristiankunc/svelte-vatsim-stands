<script lang="ts">
	import Map from "$lib/map.svelte";
	import { tileUrls } from "$lib/tiles.js";
	import type { StandData } from "$lib/stands.js";

	// Defining the stand which is hovered over
	let currentStand: StandData | null = $state(null);
	let mouseX = $state(0);
	let mouseY = $state(0);

	// Function to handle mouse move event
	function handleMouseMove(event: MouseEvent) {
		mouseX = event.clientX;
		mouseY = event.clientY;
	}
</script>

<svelte:window on:mousemove={handleMouseMove} />

<!-- Using the current stand data to display a tooltip -->
{#if currentStand}
	<div class="fixed z-[1000] rounded-lg bg-white p-4 shadow-lg" style="top: {mouseY}px; left: {mouseX}px;">
		<p>Stand: {currentStand.name}</p>
		<p>Available: {!currentStand.occupied ? "✅" : "❌"}</p>
	</div>
{/if}

<!--
Using the Map component to display the map:
 	tileUlr: URL of the tile source (defaults to satellite view)
 	viewParams: Initial view parameters {center: [longitude, latitude], zoom: number} (defaults to center of the world)
 	sourcePath: Path to the stand data source accessible from the client (can be relative or absolute)
	bind:currentStand: Binding to the current stand data 
-->

<Map
	tileUlr={tileUrls.SATELLITE}
	viewParams={{
		center: [24.8085431, 59.4153153],
		zoom: 16.25
	}}
	sourcePath="/test-stands/EETN.txt"
	bind:currentStand
/>
