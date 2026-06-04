"use client";

import { useState, useMemo, lazy, Suspense } from "react";
import Link from "next/link";
import {
  type Location,
  type Tag,
  TAG_LABELS,
  TAG_ICONS,
  getDriveMinutes,
  getBikeMinutes,
  formatMinutes,
  formatPrice,
  formatLeeftijd,
  getTodayHours,
} from "@/lib/locations";


const LocationMap = lazy(() => import("./LocationMap"));

const FILTER_TAGS: Tag[] = [
  "spelen",
  "kijken",
  "restaurant",
  "terras",
  "zwembadbinnen",
  "zwembadbuiten",
  "kinderboerderij",
  "buitenspeeltuin",
  "binnenspeeltuin",
  "gratis",
];

const WEER_TAGS: Tag[] = [
  "buiten",
  "slechtweer",
];

const WEER_DISPLAY: Record<string, { icon: string; label: string }> = {
  buiten:     { icon: "☀️", label: "Zonnig" },
  slechtweer: { icon: "🌧️", label: "Regen" },
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
type ViewMode = "lijst" | "kaart";
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

function LocationCard({ loc }: { loc: Location }) {
  const driveMin = getDriveMinutes(loc);
  const bikeMin = getBikeMinutes(loc);
  const leeftijd = formatLeeftijd(loc);
  const todayHours = getTodayHours(loc); // string = open, null = gesloten, undefined = onbekend

  return (
    <Link
      href={`/locatie/${loc.id}`}
      className="block group bg-white rounded-xl shadow-sm border border-[var(--border)] hover:shadow-md hover:border-[var(--primary)] transition-all duration-200 overflow-hidden"
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
              <span className={`text-xs rounded-full px-2 py-0.5 font-medium ${todayHours ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                {todayHours ? `🟢 ${todayHours}` : "🔴 Vandaag dicht"}
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
  );
}

export default function LocationFilters({ locations }: { locations: Location[] }) {
  const [selectedTags, setSelectedTags] = useState<Set<Tag>>(new Set());
  const [travelMode, setTravelMode] = useState<TravelMode>("auto");
  const [maxMinutes, setMaxMinutes] = useState(999);
  const [search, setSearch] = useState("");
  const [hideWinterClosed, setHideWinterClosed] = useState(false);
  const [sortBy, setSortBy] = useState<SortBy>("default");
  const [viewMode, setViewMode] = useState<ViewMode>("lijst");

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

      if (hideWinterClosed && loc.winterGesloten) return false;

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
  }, [locations, search, selectedTags, travelMode, maxMinutes, hideWinterClosed, sortBy]);

  const maxOptions =
    travelMode === "auto" ? MAX_DRIVE_OPTIONS : MAX_BIKE_OPTIONS;
  const hasActiveFilters =
    selectedTags.size > 0 || maxMinutes < 999 || !!search || hideWinterClosed;

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
            <div className="flex flex-wrap gap-2">
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
            <div className="flex flex-wrap gap-2">
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
            <div className="flex flex-wrap gap-4">
              <label className="inline-flex items-center gap-2 text-sm text-[var(--muted)] cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={hideWinterClosed}
                  onChange={(e) => setHideWinterClosed(e.target.checked)}
                  className="rounded accent-[var(--primary)]"
                />
                Verberg winterse sluitingen
              </label>
            </div>

            {hasActiveFilters && (
              <button
                onClick={() => {
                  setSelectedTags(new Set());
                  setMaxMinutes(999);
                  setSearch("");
                  setHideWinterClosed(false);
                }}
                className="text-sm text-[var(--accent)] underline hover:no-underline"
              >
                Filters wissen
              </button>
            )}
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

          {/* Lijst / Kaart toggle */}
          <div className="flex rounded-lg border border-[var(--border)] overflow-hidden shadow-sm">
            {(["lijst", "kaart"] as ViewMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors ${
                  viewMode === mode
                    ? "bg-[var(--primary)] text-white"
                    : "bg-white text-[var(--muted)] hover:bg-gray-50"
                }`}
              >
                {mode === "lijst" ? (
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map((loc) => (
                  <LocationCard key={loc.id} loc={loc} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
