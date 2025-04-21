import { tileUrls } from "$lib/tiles.js";
import { expect, test } from "vitest";

test("tileUrls contains valid URLs", () => {
	for (const key in tileUrls) {
		const url = tileUrls[key as keyof typeof tileUrls];
		expect(url).toMatch(/https?:\/\/.+/);
	}
});
