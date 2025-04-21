<script lang="ts">
	import Map from "$lib/map.svelte";
	import { tileUrls } from "$lib/tiles.js";
	import type { StandData } from "$lib/stands.js";

	let currentStand: StandData | null = $state(null);
	let mouseX = $state(0);
	let mouseY = $state(0);

	function handleMouseMove(event: MouseEvent) {
		mouseX = event.clientX;
		mouseY = event.clientY;
	}
</script>

<svelte:window on:mousemove={handleMouseMove} />

{#if currentStand}
	<div class="fixed z-[1000] rounded-lg bg-white p-4 shadow-lg" style="top: {mouseY + 10}px; left: {mouseX + 10}px;">
		<p>Stand <span class="font-bold">{currentStand.name}</span>{!currentStand.occupied ? " ✅" : " ❌"}</p>
		{#if currentStand.occupied}
			<p>Occupied by {currentStand.pilot?.callsign}</p>
		{/if}
	</div>
{/if}

<Map
	tileUlr={tileUrls.SATELLITE}
	viewParams={{
		center: [24.8085431, 59.4153153],
		zoom: 16.25
	}}
	sourcePath="/test-stands/EETN.txt"
	thresholds={{
		ktsMaxGroundSpeed: 1,
		kmDistanceFromCenter: 10,
		ftDefaultWingSpan: 50
	}}
	bind:currentStand
/>
