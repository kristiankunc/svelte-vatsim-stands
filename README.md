# Svelte VATSIM Stands

A Svelte component to display VATSIM stand occupancy.

## Preview

![image](https://github.com/user-attachments/assets/b4287ed3-15c3-4100-ba5a-f4970b9816e9)

## Installation

```bash
npm install svelte-vatsim-stands
```

## Usage

Component parameters

```svelte
<!--
Using the Map component to display the map:
 	tileUlr: URL of the tile source 
    (defaults to satellite view)
 	viewParams: Initial view parameters 
    {center: [longitude, latitude], zoom: number} (defaults to center of the world)
 	sourcePath: Path to the stand data source accessible from the client 
    (can be relative or absolute)
    thresholds: Thresholds for stand occupancy and pilot distance
    bind:currentStand: Binding to the current stand data
-->

<script lang="ts">
    import { Map, tileUrls, type StandData } from "svelte-vatsim-stands";
</script>

<Map
    tileUlr={tileUrls.SATELLITE}
    viewParams={{
        center: [24.8085431, 59.4153153],
        zoom: 16.25
    }}
    sourcePath="/test-stands/EETN.txt"
    thresholds={{
        ktsMaxGroundSpeed: 15,
        kmDistanceFromCenter: 5,
        mStandOccupancyRadius: 35
    }}
    bind:currentStand
/>
```

1. Minimal example

 ```svelte
<script lang="ts">
    import { Map, tileUrls, type StandData } from "svelte-vatsim-stands";
</script>
<Map
    tileUlr={tileUrls.SATELLITE}
    viewParams={{
        center: [24.8085431, 59.4153153],
        zoom: 16.25
    }}
    sourcePath="/test-stands/EETN.txt"
/>
```

2. Example with a tooltip definded

```svelte
<script lang="ts">
    import { Map, tileUrls, type StandData } from "svelte-vatsim-stands";

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
    <div class="fixed z-[1000] rounded-lg bg-white p-4 shadow-lg" style="top: {mouseY}px; left: {mouseX}px;">
        <p>Stand: {currentStand.name}</p>
        <p>Available: {!currentStand.occupied ? "✅" : "❌"}</p>
    </div>
{/if}

<Map
    tileUlr={tileUrls.SATELLITE}
    viewParams={{
        center: [24.8085431, 59.4153153],
        zoom: 16.25
    }}
    sourcePath="/test-stands/EETN.txt"
    bind:currentStand
/>
```

### Stand source

A publicly accessible txt file following the EuroScope sectorfile format is required to be passed to the component.
`[N/S]DDD.MM.SS.mmm:[E/W]DDD.MM.SS.mmm:LABEL` is the format of each line in the file.

Empty lines and lines starting with `;` are ignored.

Exapmle files can be seen in [static/test-stands](static/test-stands).

## Thresholds

A few default thresholds are defined that can be overriden with the `thresholds` param

Pilots with the following conditions are considered not to be at the airport:

- Ground speed greater than **1**.
- Callsing includes `_`.
- Further than **10km** from the defined centerpoint.

All stands within **40m** of the pilot are considered occupied.
