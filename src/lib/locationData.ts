import { readFileSync, readdirSync } from "fs";
import { join } from "path";
import type { Location } from "./locations";

function loadLocations(): Location[] {
  const dir = join(process.cwd(), "src/data/locations");
  return readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => JSON.parse(readFileSync(join(dir, f), "utf-8")) as Location)
    .sort((a, b) => a.id - b.id);
}

export function getAllLocations(): Location[] {
  return loadLocations();
}

export function getLocationById(id: number): Location | undefined {
  return loadLocations().find((l) => l.id === id);
}
