import locationsData from "@/data/locations.json";

export type Tag =
  | "spelen"
  | "kijken"
  | "restaurant"
  | "terras"
  | "zwembadbinnen"
  | "zwembadbuiten"
  | "kinderboerderij"
  | "buitenspeeltuin"
  | "binnenspeeltuin"
  | "slechtweer"
  | "gratis"
  | "buiten";

export type WeekDay = "ma" | "di" | "wo" | "do" | "vr" | "za" | "zo";

export interface OpeningHours {
  ma?: string | null;
  di?: string | null;
  wo?: string | null;
  do?: string | null;
  vr?: string | null;
  za?: string | null;
  zo?: string | null;
}

export interface Location {
  id: number;
  name: string;
  address: string;
  city: string;
  lat: number;
  lng: number;
  website: string | null;
  description: string;
  entreeKinderen: number;
  entreeVolwassenen: number;
  reistijdAutoMin: number | null;
  reistijdFietsMin: number | null;
  winterGesloten: boolean;
  tags: Tag[];
  openingHours?: OpeningHours | null;
  leeftijdMin?: number | null;
  leeftijdMax?: number | null;
  photo?: string | null;
}

// Grashoek coordinates
const GRASHOEK_LAT = 51.3917;
const GRASHOEK_LNG = 5.9417;

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function getDistanceKm(loc: Location): number {
  return haversineKm(GRASHOEK_LAT, GRASHOEK_LNG, loc.lat, loc.lng);
}

export function getDriveMinutes(loc: Location): number {
  if (loc.reistijdAutoMin !== null) return Math.max(1, loc.reistijdAutoMin);
  const km = getDistanceKm(loc);
  return Math.round(km * 1.2 + 5);
}

export function getBikeMinutes(loc: Location): number {
  if (loc.reistijdFietsMin !== null) return Math.max(1, loc.reistijdFietsMin);
  const km = getDistanceKm(loc);
  return Math.round((km / 15) * 60);
}

export function getDriveMinutesBetween(loc1: Location, loc2: Location): number {
  const km = haversineKm(loc1.lat, loc1.lng, loc2.lat, loc2.lng);
  return Math.round(km * 1.2 + 5);
}

export const WEEKDAYS: WeekDay[] = ["ma", "di", "wo", "do", "vr", "za", "zo"];
export const WEEKDAY_LABELS: Record<WeekDay, string> = {
  ma: "Ma", di: "Di", wo: "Wo", do: "Do", vr: "Vr", za: "Za", zo: "Zo",
};

export function getTodayHours(loc: Location): string | null | undefined {
  if (!loc.openingHours) return undefined; // onbekend
  // JS: 0=Sun, 1=Mon ... 6=Sat → map to our ma=0...zo=6
  const jsDay = new Date().getDay();
  const key = WEEKDAYS[jsDay === 0 ? 6 : jsDay - 1];
  return loc.openingHours[key]; // string = open, null = gesloten, undefined = onbekend
}

export function isOpenNow(loc: Location): boolean | null {
  const hours = getTodayHours(loc);
  if (hours === undefined) return null;
  if (!hours) return false;
  const match = hours.match(/^(\d{1,2}):(\d{2})-(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const sh = Number(match[1]), sm = Number(match[2]), eh = Number(match[3]), em = Number(match[4]);
  const now = new Date();
  const nowMins = now.getHours() * 60 + now.getMinutes();
  return nowMins >= sh * 60 + sm && nowMins < eh * 60 + em;
}

export function formatLeeftijd(loc: Location): string | null {
  const { leeftijdMin: min, leeftijdMax: max } = loc;
  const hasMin = min !== null && min !== undefined;
  const hasMax = max !== null && max !== undefined;
  if (!hasMin && !hasMax) return "voor alle leeftijden";
  if (hasMin && !hasMax && min === 0) return "voor alle leeftijden";
  if (hasMin && !hasMax) return `${min}+ jaar`;
  if (!hasMin && hasMax) return `t/m ${max} jaar`;
  return `${min}–${max} jaar`;
}

export function formatMinutes(min: number): string {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `${h} u` : `${h} u ${m} min`;
}

export function formatPrice(price: number): string {
  if (price === 0) return "Gratis";
  return `€ ${price.toFixed(2).replace(".", ",")}`;
}

export function getAllLocations(): Location[] {
  return locationsData as Location[];
}

export function getLocationById(id: number): Location | undefined {
  return (locationsData as Location[]).find((l) => l.id === id);
}

export const TAG_LABELS: Record<Tag, string> = {
  spelen: "Spelen",
  kijken: "Kijken",
  restaurant: "Restaurant",
  terras: "Terras",
  zwembadbinnen: "Zwembad Binnen",
  zwembadbuiten: "Zwembad Buiten",
  kinderboerderij: "Kinderboerderij",
  buitenspeeltuin: "Buitenspeeltuin",
  binnenspeeltuin: "Binnenspeeltuin",
  slechtweer: "Bij Slecht Weer",
  gratis: "Gratis",
  buiten: "Buiten",
};

export const TAG_ICONS: Record<Tag, string> = {
  spelen: "🎡",
  kijken: "👀",
  restaurant: "🍽️",
  terras: "☀️",
  zwembadbinnen: "🏊",
  zwembadbuiten: "🏖️",
  kinderboerderij: "🐄",
  buitenspeeltuin: "🌳",
  binnenspeeltuin: "🏠",
  slechtweer: "🌧️",
  gratis: "✅",
  buiten: "🌿",
};
