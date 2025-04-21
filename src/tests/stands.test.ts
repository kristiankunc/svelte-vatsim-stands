import { expect, test } from "vitest";
import { StandManager, Stand, Pilot, type Thresholds, type ViewParams } from "$lib/stands.js";
import type { Coordinate } from "ol/coordinate.js";

const mockThresholds: Thresholds = {
	ktsMaxGroundSpeed: 1,
	kmDistanceFromCenter: 10,
	ftDefaultWingSpan: 50
};

const mockViewParams: ViewParams = {
	center: [0, 0],
	zoom: 2
};

test("StandManager constructor initializes correctly", () => {
	const standManager = new StandManager(mockViewParams, "mockSourcePath", mockThresholds);
	expect(standManager).toBeDefined();
	expect(standManager.thresholds).toEqual(mockThresholds);
	expect(standManager.viewParams).toEqual(mockViewParams);
});

test("StandManager parseLine parses valid line correctly", () => {
	const standManager = new StandManager(mockViewParams, "mockSourcePath", mockThresholds);
	const line = "N059.00.00.000:E024.00.00.000:M1";
	const result = standManager["parseLine"](line);
	expect(result).toEqual({
		coordinate: [24.0, 59.0],
		label: "M1"
	});
});

test("StandManager parseLine throws error on invalid line", () => {
	const standManager = new StandManager(mockViewParams, "mockSourcePath", mockThresholds);
	const invalidLine = "InvalidLine";
	expect(() => standManager["parseLine"](invalidLine)).toThrowError();
});

test("StandManager getKmDistance calculates distance correctly", () => {
	const coordA: Coordinate = [0, 0];
	const coordB: Coordinate = [1, 1];
	const distance = StandManager["getKmDistance"](coordA, coordB);
	expect(distance).toBeGreaterThan(0);
});

test("StandManager ft2m converts feet to meters correctly", () => {
	const feet = 10;
	const meters = StandManager["ft2m"](feet);
	expect(meters).toBeCloseTo(3.048);
});

test("StandManager deg2rad converts degrees to radians correctly", () => {
	const degrees = 180;
	const radians = StandManager["deg2rad"](degrees);
	expect(radians).toBeCloseTo(Math.PI);
});

test("StandManager getClosestStands sorts stands by distance", () => {
	const standManager = new StandManager(mockViewParams, "mockSourcePath", mockThresholds);
	standManager["stands"].set("A", new Stand("A", [0, 0]));
	standManager["stands"].set("B", new Stand("B", [1, 1]));
	const closestStands = standManager["getClosestStands"]([0.49, 0.49]);
	expect(closestStands[0].name).toBe("A");
});

test("StandManager updateStandOccupancy updates occupancy correctly", () => {
	const standManager = new StandManager(mockViewParams, "mockSourcePath", mockThresholds);
	const pilot = new Pilot("CALLSIGN", [0, 0], "A320");
	standManager["pilots"] = [pilot];
	standManager["stands"].set("A", new Stand("A", [0, 0]));
	standManager["updateStandOccupancy"]();
	const stand = standManager["stands"].get("A");
	expect(stand?.occupied).toBe(true);
	expect(stand?.pilot).toEqual(pilot);
});
