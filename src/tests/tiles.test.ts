import { tileUrls } from "$lib/tiles.js";
import { expect, test } from "vitest";

/*
export const tileUrls = {
	LIGHT: "https://{a-c}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
	DARK: "https://{a-c}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
	OSM: "https://{a-c}.tile.openstreetmap.org/{z}/{x}/{y}.png",
	HYBRID: "https://{a-c}.tile.openstreetmap.fr/hydda/full/{z}/{x}/{y}.png",
	SATELLITE: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
};
*/

test("tileUrls contains valid URLs", () => {
	for (const key in tileUrls) {
		const url = tileUrls[key as keyof typeof tileUrls];
		expect(url).toMatch(/https?:\/\/.+/);
	}
});
