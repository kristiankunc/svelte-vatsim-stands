import { Feature, View } from "ol";
import type { Coordinate } from "ol/coordinate.js";
import { Point } from "ol/geom.js";
import VectorLayer from "ol/layer/Vector.js";
import Fill from "ol/style/Fill.js";
import Style from "ol/style/Style.js";
import VectorSource from "ol/source/Vector.js";
import { env } from "$env/dynamic/public";
import { fromExtent } from "ol/geom/Polygon.js";
import Stroke from "ol/style/Stroke.js";

export interface StandData {
	name: string;
	occupied: boolean;
}

export interface Thresholds {
	ktsMaxGroundSpeed: number;
	kmDistanceFromCenter: number;
	mStandOccupancyRadius: number;
}

class Stand {
	name: string;
	coordinate: Coordinate;
	occupied: boolean = false;

	constructor(name: string, coordinate: Coordinate) {
		this.name = name;
		this.coordinate = coordinate;
	}
}

class Pilot {
	callsign: string;
	coordinate: Coordinate;

	constructor(callsign: string, coordinate: Coordinate) {
		this.callsign = callsign;
		this.coordinate = coordinate;
	}
}

export interface ViewParams {
	center: [number, number];
	zoom: number;
}

export class StandManager {
	private pitlosUpdatedAt: Date | undefined;
	private sourcePath: string;
	private pilots: Pilot[] = [];
	private stands: Map<string, Stand> = new Map();
	private viewParams: ViewParams;

	fileName: string;
	mapLayer: VectorLayer = new VectorLayer();
	mapSource: VectorSource = new VectorSource();
	view: View | undefined;
	thresholds: Thresholds;

	/**
	 * Creates a new instance.
	 * @param viewParams - Parameters for configuring the view, including center coordinates and zoom level
	 * @param sourcePath - Path to the source file
	 */
	constructor(viewParams: ViewParams, sourcePath: string, thresholds: Thresholds) {
		this.viewParams = viewParams;
		this.sourcePath = sourcePath;
		this.fileName = sourcePath.split("/").pop()?.split(".")[0] ?? "";
		this.thresholds = thresholds;

		this.mapLayer.setSource(this.mapSource);

		this.view = new View({
			center: viewParams.center,
			zoom: viewParams.zoom
		});
	}

	/**
	 * Initializes the StandManager instance by fetching stand data and updating the map layer.
	 * @async
	 */

	async init(): Promise<void> {
		await this.fetchStands();

		await this.update();
	}

	/**
	 * Updates the stand information by performing the following steps:
	 * 1. Fetches the latest pilot data
	 * 2. Updates the stand occupancy status
	 * 3. Refreshes the map layer with new information
	 */
	async update() {
		await this.fetchPilots();
		this.updateStandOcupancy();
		this.updateMapLayer();
	}

	/**
	 * Retrieves a specific stand by its name from the collection of stands
	 * @param name - The name of the stand to search for
	 * @returns The matching Stand object if found, undefined otherwise
	 */
	getStand(name: string): Stand | undefined {
		for (const stand of this.stands) {
			if (stand[1].name === name) {
				return stand[1];
			}
		}
	}

	/**
	 * Fetches stand data from a specified source file and populates the stands Map.
	 * The method reads the file line by line, parsing each non-empty and non-comment line
	 * to create Stand objects.
	 *
	 * @throws {Error} If the fetch request fails, includes status code and source file path in error message
	 *
	 * In development mode, the parsing stops when an "END" line is encountered.
	 * Lines starting with ";" are treated as comments and skipped.
	 * Empty lines are also skipped.
	 *
	 * @private
	 * @async
	 */
	private async fetchStands() {
		const response = await fetch(this.sourcePath);

		if (!response.ok) {
			throw new Error(`Failed to fetch stands, status code: ${response.status}, Sourcfile: ${this.sourcePath}`);
		}

		const data = await response.text();

		for (const line of data.split("\n")) {
			if (line.trim() === "" || line.startsWith(";")) continue;

			if (env.PUBLIC_NODE_ENV === "development") {
				if (line.trim() === "END") break;
			}

			const parsedLine = this.parseLine(line);
			this.stands.set(parsedLine.label, new Stand(parsedLine.label, parsedLine.coordinate));
		}
	}

	/**
	 * Parses a line in the EuroScope sectorfile format (N059.24.53.647:E024.48.02.394:M1) into coordinates and label.
	 *
	 * @param line - String in format "[N/S]DDD.MM.SS.mmm:[E/W]DDD.MM.SS.mmm:LABEL"
	 *               where D=degrees, M=minutes, S=seconds, m=milliseconds
	 *
	 * @returns An object containing:
	 *          coordinate - A tuple of [longitude, latitude] in decimal degrees
	 *          label - The stand identifier from the input
	 *
	 * @throws {Error} If the line format is invalid or coordinates are malformed
	 *
	 * @example
	 * parseLine("N059.24.53.647:E024.48.02.394:M1")
	 * // Returns: { coordinate: [24.800665, 59.414902], label: "M1" }
	 */
	private parseLine(line: string): { coordinate: Coordinate; label: string } {
		const parts = line.split(":");

		if (parts.length !== 3) {
			throw new Error(`Invalid line: ${line}`);
		}

		const latParts = parts[0].substring(1).split(".");
		const lonParts = parts[1].substring(1).split(".");

		if (latParts.length !== 4 || lonParts.length !== 4) {
			throw new Error(`Invalid coordinates: ${line}`);
		}

		const lat =
			parseFloat(latParts[0]) + parseFloat(latParts[1]) / 60 + (parseFloat(latParts[2]) + parseFloat(latParts[3]) / 1000) / 3600;

		const lon =
			parseFloat(lonParts[0]) + parseFloat(lonParts[1]) / 60 + (parseFloat(lonParts[2]) + parseFloat(lonParts[3]) / 1000) / 3600;

		const finalLat = parts[0].startsWith("S") ? -lat : lat;
		const finalLon = parts[1].startsWith("W") ? -lon : lon;

		return {
			coordinate: [finalLon, finalLat],
			label: parts[2]
		};
	}

	/**
	 * Fetches pilot data from the VATSIM network API and processes it to identify stationary aircraft.
	 *
	 * This method:
	 * 1. Retrieves the current VATSIM network data
	 * 2. Filters pilots based on specific criteria:
	 *    - Ground speed must be 1 or less
	 *    - Callsign must not contain underscore
	 *    - Must be within 10km of the view center
	 * 3. Creates new Pilot instances for qualifying aircraft
	 *
	 * @throws {Error} If the VATSIM API request fails
	 * @private
	 * @async
	 */
	private async fetchPilots() {
		const response = await fetch("https://data.vatsim.net/v3/vatsim-data.json");

		const lastModified = response.headers.get("Last-Modified");

		if (lastModified && lastModified !== this.pitlosUpdatedAt?.toUTCString()) {
			this.pitlosUpdatedAt = new Date(lastModified);
		} else {
			return;
		}

		if (!response.ok) {
			throw new Error(`Failed to vatsim data, status code: ${response.status}`);
		}

		const pilots = (await response.json()).pilots;

		for (const pilot of pilots) {
			if (pilot.groundspeed > this.thresholds.ktsMaxGroundSpeed || pilot.callsign.includes("_")) continue;

			if (pilot.latitude && pilot.longitude) {
				if (
					StandManager.getKmDistance([pilot.longitude, pilot.latitude], this.viewParams.center) >
					this.thresholds.kmDistanceFromCenter
				)
					continue;

				this.pilots.push(new Pilot(pilot.callsign, [pilot.longitude, pilot.latitude]));
			}
		}
	}

	/**
	 * Updates the map layer with pilot positions and stand features.
	 * In development mode, adds pilot positions as point features.
	 * For stands, creates rectangular features with color coding:
	 * - Green for unoccupied stands
	 * - Red for occupied stands
	 * Each stand feature is sized using a delta offset and identified by stand name.
	 * Features are added to the map source layer.
	 * @private
	 */
	private updateMapLayer() {
		this.mapSource.clear();

		if (env.PUBLIC_NODE_ENV === "development") {
			for (const pilot of this.pilots) {
				const pilotFeature = new Feature({
					geometry: new Point(pilot.coordinate)
				});

				this.mapSource.addFeature(pilotFeature);
			}
		}

		for (const stand of this.stands) {
			const value = stand[1];
			const delta = 0.0002;

			const standFeature = new Feature({
				geometry: fromExtent([
					value.coordinate[0] - delta,
					value.coordinate[1] - delta / 2,
					value.coordinate[0] + delta,
					value.coordinate[1] + delta / 2
				])
			});

			const fillColor = value.occupied ? "rgba(255, 99, 71, 0.6)" : "rgba(144, 238, 144, 0.6)";
			const strokeColor = value.occupied ? "rgba(220, 20, 60, 0.8)" : "rgba(34, 139, 34, 0.8)";

			standFeature.setStyle(
				new Style({
					fill: new Fill({
						color: fillColor
					}),
					stroke: new Stroke({
						color: strokeColor,
						width: 2
					})
				})
			);

			this.mapSource.addFeature(standFeature);

			standFeature.setId(value.name);
		}
	}

	/**
	 * Updates the occupancy status of stands based on pilot positions.
	 * Iterates through all pilots and marks stands as occupied if a pilot
	 * is within 0.04 kilometers of the stand's coordinate.
	 * @private
	 */
	private updateStandOcupancy() {
		for (const pilot of this.pilots) {
			const closestStands = this.getClosestStands(pilot.coordinate);

			for (const stand of closestStands) {
				if (StandManager.getKmDistance(pilot.coordinate, stand.coordinate) < this.thresholds.mStandOccupancyRadius / 1000) {
					stand.occupied = true;
				}
			}
		}
	}

	/**
	 * Retrieves an array of stands sorted by distance from the given coordinate.
	 *
	 * @param coordinate - The reference coordinate to measure distances from
	 * @returns Array of Stand objects sorted by ascending distance from the given coordinate
	 *
	 * @example
	 * const stands = standManager.getClosestStands({lat: 51.5074, lon: -0.1278});
	 * // Returns stands array sorted from closest to farthest from London coordinates
	 */
	private getClosestStands(coordinate: Coordinate): Stand[] {
		return Array.from(this.stands.values()).sort((a, b) => {
			const distanceA = StandManager.getKmDistance(coordinate, a.coordinate);
			const distanceB = StandManager.getKmDistance(coordinate, b.coordinate);
			return distanceA - distanceB;
		});
	}

	/**
	 * Calculates the distance between two coordinates in kilometers using the Haversine formula
	 * @param coordA - First coordinate in [longitude, latitude] format
	 * @param coordB - Second coordinate in [longitude, latitude] format
	 * @returns Distance in kilometers between the two points
	 */
	private static getKmDistance(coordA: Coordinate, coordB: Coordinate): number {
		const R = 6371;
		const dLat = StandManager.deg2rad(coordB[1] - coordA[1]);
		const dLon = StandManager.deg2rad(coordB[0] - coordA[0]);
		const a =
			Math.sin(dLat / 2) * Math.sin(dLat / 2) +
			Math.cos(StandManager.deg2rad(coordA[1])) *
				Math.cos(StandManager.deg2rad(coordB[1])) *
				Math.sin(dLon / 2) *
				Math.sin(dLon / 2);
		const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
		return R * c;
	}

	/**
	 * The name kind of gives it away, doesn't it?
	 * @param deg - The angle in degrees to convert
	 * @returns The angle converted to radians
	 */
	private static deg2rad(deg: number): number {
		return deg * (Math.PI / 180);
	}
}
