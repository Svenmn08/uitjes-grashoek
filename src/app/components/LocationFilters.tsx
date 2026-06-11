"use client";

import { useState, useMemo, lazy, Suspense, useEffect } from "react";
import Link from "next/link";
import {
  type Location,
  type Tag,
  TAG_LABELS,
  TAG_ICONS,
  getDriveMinutes,
  getBikeMinutes,
  getDriveMinutesBetween,
  formatMinutes,
  formatPrice,
  formatLeeftijd,
  getTodayHours,
  isOpenNow,
} from "@/lib/locations";

type RouteItem = { id: number; start: string; end: string };


const LocationMap = lazy(() => import("./LocationMap"));

const FILTER_TAGS: Tag[] = [
  "spelen",
  "kijken",
  "restaurant",
  "terras",
  "zwembadbinnen",
  "zwembadbuiten",
  "kinderboerderij",
  "dierentuin",
  "buitenspeeltuin",
  "binnenspeeltuin",
  "gratis",
];

const WEER_TAGS: Tag[] = [
  "buiten",
  "zwembadbuiten",
  "slechtweer",
  "binnenspeeltuin",
  "zwembadbinnen",
];

const WEER_DISPLAY: Record<string, { icon: string; label: string }> = {
  buiten:        { icon: "☀️", label: "Zonnig" },
  zwembadbuiten: { icon: "🌡️", label: "Warm weer" },
  slechtweer:    { icon: "🌧️", label: "Regen" },
  binnenspeeltuin: { icon: "🥶", label: "Koude dag" },
  zwembadbinnen: { icon: "⛅", label: "Bewolkt" },
};

const MAX_DRIVE_OPTIONS = [
  { label: "Alles", value: 999 },
  { label: "≤ 15 min", value: 15 },
  { label: "≤ 30 min", value: 30 },
  { label: "≤ 45 min", value: 45 },
  { label: "≤ 60 min", value: 60 },
];

const MAX_BIKE_OPTIONS = [
  { label: "Alles", value: 999 },
  { label: "≤ 15 min", value: 15 },
  { label: "≤ 30 min", value: 30 },
  { label: "≤ 60 min", value: 60 },
  { label: "≤ 90 min", value: 90 },
];

type TravelMode = "auto" | "fiets";
type ViewMode = "blok" | "lijst" | "kaart";
type SortBy = "default" | "reistijd";

function TagBadge({ tag, small }: { tag: Tag; small?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-[var(--primary)]/10 text-[var(--primary-dark)] font-medium ${small ? "text-xs px-2 py-0.5" : "text-sm px-2.5 py-1"}`}
    >
      <span>{TAG_ICONS[tag]}</span>
      {TAG_LABELS[tag]}
    </span>
  );
}

function LocationCard({
  loc,
  inRoute,
  onToggleRoute,
}: {
  loc: Location;
  inRoute: boolean;
  onToggleRoute: (e: React.MouseEvent) => void;
}) {
  const driveMin = getDriveMinutes(loc);
  const bikeMin = getBikeMinutes(loc);
  const leeftijd = formatLeeftijd(loc);
  const todayHours = getTodayHours(loc);
  const openNow = isOpenNow(loc);

  return (
    <div className="relative group">
      <Link
        href={`/locatie/${loc.id}`}
        className="block bg-white rounded-xl shadow-sm border border-[var(--border)] hover:shadow-md hover:border-[var(--primary)] transition-all duration-200 overflow-hidden"
      >
        {loc.photo && (
          <div className="h-44 overflow-hidden">
            <img
              src={loc.photo}
              alt={loc.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        )}
        <div className="p-5">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-semibold text-lg text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors leading-tight">
              {loc.name}
            </h3>
            <div className="flex flex-col items-end gap-1 shrink-0">
              {loc.winterGesloten && (
                <span className="text-xs bg-blue-100 text-blue-700 rounded-full px-2 py-0.5 font-medium">
                  ❄️ Winter dicht
                </span>
              )}
              {todayHours !== undefined && (
                <span className={`text-xs rounded-full px-2 py-0.5 font-medium ${
                  openNow === true
                    ? "bg-green-100 text-green-700"
                    : todayHours
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-red-100 text-red-700"
                }`}>
                  {openNow === true
                    ? `🟢 Nu open · ${todayHours}`
                    : todayHours
                    ? `🕐 ${todayHours}`
                    : "🔴 Vandaag dicht"}
                </span>
              )}
            </div>
          </div>

          <p className="text-sm text-[var(--muted)] mb-3 line-clamp-2">{loc.description}</p>

          <div className="flex flex-wrap gap-1.5 mb-4">
            {[...new Set(loc.tags)].map((tag) => (
              <TagBadge key={tag} tag={tag} small />
            ))}
            {leeftijd && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 text-amber-800 font-medium text-xs px-2 py-0.5">
                👶 {leeftijd}
              </span>
            )}
          </div>

          <div className="flex items-center justify-between text-sm border-t border-[var(--border)] pt-3 mt-auto">
            <div className="flex gap-3 text-[var(--muted)]">
              <span title="Reistijd auto">🚗 {formatMinutes(driveMin)}</span>
              <span title="Reistijd fiets">🚲 {formatMinutes(bikeMin)}</span>
            </div>
            <div className="text-right">
              {loc.entreeKinderen > 0 ? (
                <span className="text-[var(--accent)] font-medium">
                  v.a. {formatPrice(loc.entreeKinderen)}
                </span>
              ) : loc.tags.includes("gratis") ? (
                <span className="text-[var(--primary)] font-medium">Gratis</span>
              ) : null}
            </div>
          </div>
        </div>
      </Link>

      {/* Route toggle button — floats over the card */}
      <button
        onClick={onToggleRoute}
        title={inRoute ? "Verwijder uit dagplanning" : "Voeg toe aan dagplanning"}
        aria-label={inRoute ? "Verwijder uit dagplanning" : "Voeg toe aan dagplanning"}
        className={`absolute top-2 right-2 z-10 w-9 h-9 rounded-full flex items-center justify-center text-base font-bold shadow-md transition-all ${
          inRoute
            ? "bg-[var(--primary)] text-white scale-110"
            : "bg-white/90 text-[var(--primary)] border-2 border-[var(--primary)] hover:bg-[var(--primary)] hover:text-white"
        }`}
      >
        {inRoute ? "✓" : "+"}
      </button>
    </div>
  );
}

function LocationRow({
  loc,
  inRoute,
  onToggleRoute,
}: {
  loc: Location;
  inRoute: boolean;
  onToggleRoute: (e: React.MouseEvent) => void;
}) {
  const driveMin = getDriveMinutes(loc);
  const bikeMin = getBikeMinutes(loc);
  const leeftijd = formatLeeftijd(loc);
  const todayHours = getTodayHours(loc);
  const openNow = isOpenNow(loc);

  return (
    <div className="relative group">
      <Link
        href={`/locatie/${loc.id}`}
        className="flex items-center gap-3 bg-white rounded-xl border border-[var(--border)] hover:shadow-md hover:border-[var(--primary)] transition-all duration-200 p-3"
      >
        {loc.photo ? (
          <img
            src={loc.photo}
            alt={loc.name}
            className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg object-cover shrink-0"
          />
        ) : (
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg bg-gray-100 shrink-0 flex items-center justify-center text-3xl">
            🌳
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-0.5">
            <h3 className="font-semibold text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors leading-tight">
              {loc.name}
            </h3>
            <div className="flex flex-col items-end gap-0.5 shrink-0 ml-6">
              {loc.winterGesloten && (
                <span className="text-xs bg-blue-100 text-blue-700 rounded-full px-2 py-0.5 font-medium whitespace-nowrap">
                  ❄️ Winter dicht
                </span>
              )}
              {todayHours !== undefined && (
                <span className={`text-xs rounded-full px-2 py-0.5 font-medium whitespace-nowrap ${
                  openNow === true
                    ? "bg-green-100 text-green-700"
                    : todayHours
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-red-100 text-red-700"
                }`}>
                  {openNow === true ? `🟢 ${todayHours}` : todayHours ? `🕐 ${todayHours}` : "🔴 Dicht"}
                </span>
              )}
            </div>
          </div>
          <p className="text-xs text-[var(--muted)] line-clamp-1 mb-1.5">{loc.description}</p>
          <div className="flex flex-wrap gap-1 mb-1.5">
            {[...new Set(loc.tags)].slice(0, 5).map((tag) => (
              <TagBadge key={tag} tag={tag} small />
            ))}
            {leeftijd && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 text-amber-800 font-medium text-xs px-2 py-0.5">
                👶 {leeftijd}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 text-xs text-[var(--muted)]">
            <span>🚗 {formatMinutes(driveMin)}</span>
            <span>🚲 {formatMinutes(bikeMin)}</span>
            {loc.entreeKinderen > 0 ? (
              <span className="text-[var(--accent)] font-medium">v.a. {formatPrice(loc.entreeKinderen)}</span>
            ) : loc.tags.includes("gratis") ? (
              <span className="text-[var(--primary)] font-medium">Gratis</span>
            ) : null}
          </div>
        </div>
      </Link>
      <button
        onClick={onToggleRoute}
        title={inRoute ? "Verwijder uit dagplanning" : "Voeg toe aan dagplanning"}
        aria-label={inRoute ? "Verwijder uit dagplanning" : "Voeg toe aan dagplanning"}
        className={`absolute top-2 right-2 z-10 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shadow-md transition-all ${
          inRoute
            ? "bg-[var(--primary)] text-white scale-110"
            : "bg-white/90 text-[var(--primary)] border-2 border-[var(--primary)] hover:bg-[var(--primary)] hover:text-white"
        }`}
      >
        {inRoute ? "✓" : "+"}
      </button>
    </div>
  );
}

function RoutePlanPanel({
  routeItems,
  allLocations,
  onRemove,
  onMove,
  onClear,
  onClose,
  onUpdateTime,
}: {
  routeItems: RouteItem[];
  allLocations: Location[];
  onRemove: (id: number) => void;
  onMove: (id: number, direction: -1 | 1) => void;
  onClear: () => void;
  onClose: () => void;
  onUpdateTime: (id: number, field: "start" | "end", value: string) => void;
}) {
  const routeLocations = routeItems
    .map((item) => allLocations.find((l) => l.id === item.id))
    .filter(Boolean) as Location[];

  const totalKinderen = routeLocations.reduce((sum, l) => sum + l.entreeKinderen, 0);
  const totalVolwassenen = routeLocations.reduce((sum, l) => sum + l.entreeVolwassenen, 0);

  const mapsUrl =
    routeLocations.length > 0
      ? `https://www.google.com/maps/dir/51.3917,5.9417/${routeLocations.map((l) => `${l.lat},${l.lng}`).join("/")}`
      : null;

  function addMins(time: string, mins: number): string {
    const [h, m] = time.split(":").map(Number);
    const t = h * 60 + m + mins;
    return `${String(Math.floor(t / 60) % 24).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-t-2xl shadow-2xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[var(--border)]">
          <div>
            <h2 className="text-xl font-bold text-[var(--foreground)]">🗺️ Dagplanning</h2>
            {routeLocations.length > 0 && (
              <p className="text-sm text-[var(--muted)] mt-0.5">
                {routeLocations.length} uitstapje{routeLocations.length !== 1 ? "s" : ""} gepland
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            {routeLocations.length > 0 && (
              <button onClick={onClear} className="text-sm text-red-500 hover:text-red-700 font-medium">
                Alles wissen
              </button>
            )}
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-[var(--muted)] transition-colors">
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-5">
          {routeLocations.length === 0 ? (
            <div className="text-center py-10 text-[var(--muted)]">
              <div className="text-5xl mb-3">🗺️</div>
              <p className="font-semibold text-base">Nog geen uitstapjes gepland</p>
              <p className="text-sm mt-1">Klik op + bij een uitstapje om het toe te voegen</p>
            </div>
          ) : (
            <div>
              {/* Vertrekpunt */}
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center shrink-0 text-base">🏠</div>
                <div>
                  <p className="text-sm font-semibold text-[var(--foreground)]">Grashoek</p>
                  <p className="text-xs text-[var(--muted)]">Vertrekpunt</p>
                </div>
              </div>

              {routeItems.map((item, i) => {
                const loc = routeLocations[i];
                if (!loc) return null;
                const prevLoc = i > 0 ? routeLocations[i - 1] : null;
                const prevItem = i > 0 ? routeItems[i - 1] : null;
                const travelMin = prevLoc
                  ? getDriveMinutesBetween(prevLoc, loc)
                  : getDriveMinutes(loc);
                const suggestedStart = prevItem?.end ? addMins(prevItem.end, travelMin) : null;

                return (
                  <div key={item.id}>
                    {/* Travel connector */}
                    <div className="flex items-center gap-3 my-1 pl-3.5">
                      <div className="flex flex-col items-center">
                        <div className="w-px h-2 bg-gray-200" />
                        <div className="flex items-center gap-1.5 bg-gray-50 border border-[var(--border)] rounded-full px-2.5 py-0.5 my-0.5">
                          <span className="text-xs text-[var(--muted)]">🚗 {formatMinutes(travelMin)}</span>
                          {suggestedStart && (
                            <span className="text-xs text-gray-400">· aankomst {suggestedStart}</span>
                          )}
                        </div>
                        <div className="w-px h-2 bg-gray-200" />
                      </div>
                    </div>

                    {/* Location row */}
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-[var(--primary)] text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0 pb-2">
                        {/* Name + controls */}
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div>
                            <p className="font-semibold text-sm text-[var(--foreground)] leading-snug">{loc.name}</p>
                            <p className="text-xs text-[var(--muted)]">
                              {loc.city}
                              {loc.entreeKinderen > 0 && ` · v.a. ${formatPrice(loc.entreeKinderen)}`}
                              {loc.entreeKinderen === 0 && loc.tags.includes("gratis") && " · Gratis"}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button onClick={() => onMove(item.id, -1)} disabled={i === 0} className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-100 text-[var(--muted)] disabled:opacity-30 text-xs">▲</button>
                            <button onClick={() => onMove(item.id, 1)} disabled={i === routeItems.length - 1} className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-100 text-[var(--muted)] disabled:opacity-30 text-xs">▼</button>
                            <button onClick={() => onRemove(item.id)} className="w-7 h-7 flex items-center justify-center rounded hover:bg-red-50 text-gray-400 hover:text-red-500">✕</button>
                          </div>
                        </div>

                        {/* Time inputs */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <div className="flex items-center gap-1.5 bg-gray-50 border border-[var(--border)] rounded-lg px-2 py-1">
                            <span className="text-xs text-[var(--muted)]">van</span>
                            <input
                              type="time"
                              value={item.start}
                              onChange={(e) => onUpdateTime(item.id, "start", e.target.value)}
                              className="text-sm font-medium text-[var(--foreground)] bg-transparent outline-none w-[5rem]"
                            />
                          </div>
                          <span className="text-[var(--muted)] text-sm">→</span>
                          <div className="flex items-center gap-1.5 bg-gray-50 border border-[var(--border)] rounded-lg px-2 py-1">
                            <span className="text-xs text-[var(--muted)]">tot</span>
                            <input
                              type="time"
                              value={item.end}
                              onChange={(e) => onUpdateTime(item.id, "end", e.target.value)}
                              className="text-sm font-medium text-[var(--foreground)] bg-transparent outline-none w-[5rem]"
                            />
                          </div>
                          {suggestedStart && !item.start && (
                            <button
                              onClick={() => onUpdateTime(item.id, "start", suggestedStart)}
                              title="Vul starttijd automatisch in"
                              className="text-xs text-[var(--primary)] border border-[var(--primary)]/40 rounded-full px-2.5 py-1 hover:bg-[var(--primary)]/10 transition-colors"
                            >
                              ← {suggestedStart}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Totalen */}
              <div className="mt-5 pt-4 border-t border-[var(--border)] space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--muted)]">Totaal per kind</span>
                  <span className="font-semibold">{formatPrice(totalKinderen)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--muted)]">Totaal per volwassene</span>
                  <span className="font-semibold">{formatPrice(totalVolwassenen)}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {mapsUrl && (
          <div className="p-5 border-t border-[var(--border)]">
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full bg-[var(--primary)] hover:bg-[var(--primary-dark)] text-white font-semibold py-3 px-4 rounded-xl transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Open route in Google Maps
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

export default function LocationFilters({ locations }: { locations: Location[] }) {
  const [selectedTags, setSelectedTags] = useState<Set<Tag>>(new Set());
  const [travelMode, setTravelMode] = useState<TravelMode>("auto");
  const [maxMinutes, setMaxMinutes] = useState(999);
  const [search, setSearch] = useState("");
  const [showOnlyOpenNow, setShowOnlyOpenNow] = useState(false);
  const [sortBy, setSortBy] = useState<SortBy>("default");
  const [viewMode, setViewMode] = useState<ViewMode>("blok");
  const [routeItems, setRouteItems] = useState<RouteItem[]>([]);
  const [showRoute, setShowRoute] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(true);
  const routeIds = routeItems.map((r) => r.id);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("uitjes-route");
      if (saved) {
        const data = JSON.parse(saved);
        if (Array.isArray(data) && data.length > 0) {
          if (typeof data[0] === "number") {
            setRouteItems(data.map((id: number) => ({ id, start: "", end: "" })));
          } else {
            setRouteItems(data);
          }
        }
      }
    } catch {}
  }, []);

  const saveRoute = (items: RouteItem[]) => {
    try {
      localStorage.setItem("uitjes-route", JSON.stringify(items));
    } catch {}
  };

  const toggleRoute = (e: React.MouseEvent, id: number) => {
    e.preventDefault();
    e.stopPropagation();
    setRouteItems((prev) => {
      const next = prev.find((r) => r.id === id)
        ? prev.filter((r) => r.id !== id)
        : [...prev, { id, start: "", end: "" }];
      saveRoute(next);
      return next;
    });
  };

  const removeFromRoute = (id: number) => {
    setRouteItems((prev) => {
      const next = prev.filter((r) => r.id !== id);
      saveRoute(next);
      return next;
    });
  };

  const moveInRoute = (id: number, direction: -1 | 1) => {
    setRouteItems((prev) => {
      const i = prev.findIndex((r) => r.id === id);
      const newI = i + direction;
      if (newI < 0 || newI >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[newI]] = [next[newI], next[i]];
      saveRoute(next);
      return next;
    });
  };

  const clearRoute = () => {
    setRouteItems([]);
    saveRoute([]);
  };

  const updateTime = (id: number, field: "start" | "end", value: string) => {
    setRouteItems((prev) => {
      const next = prev.map((r) => (r.id === id ? { ...r, [field]: value } : r));
      saveRoute(next);
      return next;
    });
  };

  const toggleTag = (tag: Tag) => {
    setSelectedTags((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
  };

  const filtered = useMemo(() => {
    const result = locations.filter((loc) => {
      if (
        search &&
        !loc.name.toLowerCase().includes(search.toLowerCase()) &&
        !loc.city.toLowerCase().includes(search.toLowerCase()) &&
        !loc.description.toLowerCase().includes(search.toLowerCase())
      )
        return false;

      if (selectedTags.size > 0) {
        const hasAll = [...selectedTags].every((t) => loc.tags.includes(t));
        if (!hasAll) return false;
      }

      const travelMin =
        travelMode === "auto" ? getDriveMinutes(loc) : getBikeMinutes(loc);
      if (travelMin > maxMinutes) return false;

      if (showOnlyOpenNow && isOpenNow(loc) !== true) return false;

      return true;
    });

    if (sortBy === "reistijd") {
      return result.sort((a, b) => {
        const aMin = travelMode === "auto" ? getDriveMinutes(a) : getBikeMinutes(a);
        const bMin = travelMode === "auto" ? getDriveMinutes(b) : getBikeMinutes(b);
        return aMin - bMin;
      });
    }
    return result;
  }, [locations, search, selectedTags, travelMode, maxMinutes, showOnlyOpenNow, sortBy]);

  const maxOptions =
    travelMode === "auto" ? MAX_DRIVE_OPTIONS : MAX_BIKE_OPTIONS;
  const hasActiveFilters =
    selectedTags.size > 0 || maxMinutes < 999 || !!search || showOnlyOpenNow;

  return (
    <div>
      {/* Hero */}
      <div
        className="bg-[var(--primary-dark)] text-white py-12 px-4"
        style={{ backgroundImage: "linear-gradient(to bottom right, #3d5228, #5c7a3e)" }}
      >
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">Wat gaan we doen? 🌳</h1>
          <p className="text-white/80 text-lg max-w-xl">
            Ontdek uitstapjes in de Peel &amp; Maas regio, op maat van jouw dag.
          </p>
          <div className="mt-6 max-w-md">
            <input
              type="search"
              placeholder="Zoek op naam, stad of activiteit…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl px-4 py-3 text-[var(--foreground)] bg-white shadow-md focus:outline-none focus:ring-2 focus:ring-[var(--accent)] placeholder-gray-400"
            />
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Filters */}
        <div className="bg-white rounded-2xl border border-[var(--border)] shadow-sm p-5 mb-6">
          <button
            className="flex items-center justify-between w-full sm:hidden pb-3 mb-3 border-b border-[var(--border)]"
            onClick={() => setFiltersOpen((v) => !v)}
          >
            <span className="font-semibold text-[var(--foreground)]">
              Filters
              {(selectedTags.size > 0 || maxMinutes < 999) && (
                <span className="ml-2 text-xs bg-[var(--primary)] text-white rounded-full px-1.5 py-0.5">
                  {selectedTags.size + (maxMinutes < 999 ? 1 : 0)}
                </span>
              )}
            </span>
            <span className="text-[var(--muted)] text-sm">{filtersOpen ? "▲" : "▼"}</span>
          </button>
          <div className={filtersOpen ? "" : "hidden sm:block"}>
          <div className="flex flex-wrap gap-4 mb-4">
            {/* Vervoer */}
            <div>
              <p className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wide mb-2">
                Vervoer
              </p>
              <div className="flex rounded-lg border border-[var(--border)] overflow-hidden">
                {(["auto", "fiets"] as TravelMode[]).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => {
                      setTravelMode(mode);
                      setMaxMinutes(999);
                    }}
                    className={`px-4 py-2 text-sm font-medium transition-colors ${
                      travelMode === mode
                        ? "bg-[var(--primary)] text-white"
                        : "bg-white text-[var(--muted)] hover:bg-gray-50"
                    }`}
                  >
                    {mode === "auto" ? "🚗 Auto" : "🚲 Fiets"}
                  </button>
                ))}
              </div>
            </div>

            {/* Max reistijd */}
            <div>
              <p className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wide mb-2">
                Maximale reistijd
              </p>
              <div className="flex flex-wrap gap-2">
                {maxOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setMaxMinutes(opt.value)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors border ${
                      maxMinutes === opt.value
                        ? "bg-[var(--primary)] text-white border-[var(--primary)]"
                        : "bg-white text-[var(--muted)] border-[var(--border)] hover:border-[var(--primary)]"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Tag filters */}
          <div className="mb-3">
            <p className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wide mb-2">
              Activiteit / Faciliteiten
            </p>
            <div className="flex gap-2 flex-wrap">
              {FILTER_TAGS.map((tag) => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all border ${
                    selectedTags.has(tag)
                      ? "bg-[var(--primary)] text-white border-[var(--primary)] shadow-sm"
                      : "bg-white text-[var(--muted)] border-[var(--border)] hover:border-[var(--primary)] hover:text-[var(--primary)]"
                  }`}
                >
                  <span>{TAG_ICONS[tag]}</span>
                  {TAG_LABELS[tag]}
                </button>
              ))}
            </div>
          </div>

          {/* Weer filters */}
          <div className="mb-3">
            <p className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wide mb-2">
              Weer
            </p>
            <div className="flex gap-2 flex-wrap">
              {WEER_TAGS.map((tag) => {
                const display = WEER_DISPLAY[tag];
                return (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all border ${
                      selectedTags.has(tag)
                        ? "bg-[var(--primary)] text-white border-[var(--primary)] shadow-sm"
                        : "bg-white text-[var(--muted)] border-[var(--border)] hover:border-[var(--primary)] hover:text-[var(--primary)]"
                    }`}
                  >
                    <span>{display.icon}</span>
                    {display.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Extra toggles + reset */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setShowOnlyOpenNow((v) => !v)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all border ${
                  showOnlyOpenNow
                    ? "bg-green-600 text-white border-green-600 shadow-sm"
                    : "bg-white text-[var(--muted)] border-[var(--border)] hover:border-green-600 hover:text-green-700"
                }`}
              >
                🟢 Nu open
              </button>
            </div>

            {hasActiveFilters && (
              <button
                onClick={() => {
                  setSelectedTags(new Set());
                  setMaxMinutes(999);
                  setSearch("");
                  setShowOnlyOpenNow(false);
                }}
                className="text-sm text-[var(--accent)] underline hover:no-underline"
              >
                Filters wissen
              </button>
            )}
          </div>
          </div>
        </div>

        {/* Results header with view toggle */}
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <p className="text-[var(--muted)] text-sm">
              {filtered.length} uitstapje{filtered.length !== 1 ? "s" : ""} gevonden
            </p>
            <div className="flex rounded-lg border border-[var(--border)] overflow-hidden">
              {(["default", "reistijd"] as SortBy[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setSortBy(mode)}
                  className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                    sortBy === mode
                      ? "bg-[var(--primary)] text-white"
                      : "bg-white text-[var(--muted)] hover:bg-gray-50"
                  }`}
                >
                  {mode === "default" ? "Standaard" : "🚗 Dichtstbij eerst"}
                </button>
              ))}
            </div>
          </div>

          {/* Blok / Lijst / Kaart toggle */}
          <div className="flex rounded-lg border border-[var(--border)] overflow-hidden shadow-sm">
            {(["blok", "lijst", "kaart"] as ViewMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors ${
                  viewMode === mode
                    ? "bg-[var(--primary)] text-white"
                    : "bg-white text-[var(--muted)] hover:bg-gray-50"
                }`}
              >
                {mode === "blok" ? (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                    </svg>
                    Blok
                  </>
                ) : mode === "lijst" ? (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                    </svg>
                    Lijst
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                    Kaart
                  </>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Kaart view */}
        {viewMode === "kaart" && (
          <Suspense
            fallback={
              <div className="flex items-center justify-center h-[580px] rounded-xl bg-white border border-[var(--border)]">
                <p className="text-[var(--muted)]">Kaart laden…</p>
              </div>
            }
          >
            <LocationMap locations={filtered} />
          </Suspense>
        )}

        {/* Blok view */}
        {viewMode === "blok" && (
          <>
            {filtered.length === 0 ? (
              <div className="text-center py-16 text-[var(--muted)]">
                <div className="text-5xl mb-4">🔍</div>
                <p className="text-lg font-medium">Geen uitstapjes gevonden</p>
                <p className="text-sm mt-1">Probeer andere filters</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map((loc) => (
                  <LocationCard
                    key={loc.id}
                    loc={loc}
                    inRoute={routeIds.includes(loc.id)}
                    onToggleRoute={(e) => toggleRoute(e, loc.id)}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* Lijst view */}
        {viewMode === "lijst" && (
          <>
            {filtered.length === 0 ? (
              <div className="text-center py-16 text-[var(--muted)]">
                <div className="text-5xl mb-4">🔍</div>
                <p className="text-lg font-medium">Geen uitstapjes gevonden</p>
                <p className="text-sm mt-1">Probeer andere filters</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {filtered.map((loc) => (
                  <LocationRow
                    key={loc.id}
                    loc={loc}
                    inRoute={routeIds.includes(loc.id)}
                    onToggleRoute={(e) => toggleRoute(e, loc.id)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Floating dagplanning button */}
      <button
        onClick={() => setShowRoute(true)}
        className={`fixed bottom-6 right-6 z-40 flex items-center gap-2 py-3 px-5 rounded-full shadow-lg font-semibold transition-all duration-200 ${
          routeIds.length > 0
            ? "bg-[var(--primary)] text-white hover:bg-[var(--primary-dark)] scale-100"
            : "bg-white text-[var(--muted)] border-2 border-[var(--border)] hover:border-[var(--primary)] hover:text-[var(--primary)]"
        }`}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
        </svg>
        <span>Dagplanning</span>
        {routeIds.length > 0 && (
          <span className="bg-white text-[var(--primary)] rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold leading-none">
            {routeIds.length}
          </span>
        )}
      </button>

      {/* Route plan panel */}
      {showRoute && (
        <RoutePlanPanel
          routeItems={routeItems}
          allLocations={locations}
          onRemove={removeFromRoute}
          onMove={moveInRoute}
          onClear={clearRoute}
          onClose={() => setShowRoute(false)}
          onUpdateTime={updateTime}
        />
      )}
    </div>
  );
}
