import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getAllLocations, getLocationById } from "@/lib/locationData";
import {
  getDriveMinutes,
  getBikeMinutes,
  formatMinutes,
  formatPrice,
  formatLeeftijd,
  WEEKDAYS,
  WEEKDAY_LABELS,
  TAG_LABELS,
  TAG_ICONS,
  type Tag,
  type WeekDay,
} from "@/lib/locations";

export async function generateStaticParams() {
  return getAllLocations().map((loc) => ({ id: String(loc.id) }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const loc = getLocationById(Number(id));
  if (!loc) return {};

  const driveMin = getDriveMinutes(loc);
  const description = `${loc.description} In ${loc.city}, ca. ${formatMinutes(driveMin)} rijden vanuit Grashoek.`;

  return {
    title: `${loc.name} – Uitjes Grashoek`,
    description,
    openGraph: {
      title: `${loc.name} – Uitjes Grashoek`,
      description,
      images: loc.photo ? [{ url: loc.photo }] : [],
    },
  };
}

export default async function LocationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const loc = getLocationById(Number(id));
  if (!loc) notFound();

  const driveMin = getDriveMinutes(loc);
  const bikeMin = getBikeMinutes(loc);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-[var(--primary)] text-sm font-medium mb-6 hover:underline"
      >
        ← Terug naar overzicht
      </Link>

      <div className="bg-white rounded-2xl border border-[var(--border)] shadow-sm overflow-hidden">
        {/* Foto */}
        {loc.photo && (
          <div className="h-64 overflow-hidden">
            <img src={loc.photo} alt={loc.name} className="w-full h-full object-cover" />
          </div>
        )}
        {/* Header */}
        <div
          className="px-6 py-8 text-white"
          style={{ background: "linear-gradient(135deg, #3d5228, #5c7a3e)" }}
        >
          <div className="flex items-start justify-between gap-4">
            <h1 className="text-3xl font-bold leading-tight">{loc.name}</h1>
            {loc.winterGesloten && (
              <span className="shrink-0 text-xs bg-white/20 rounded-full px-3 py-1 font-medium">
                ❄️ Winter dicht
              </span>
            )}
          </div>
          <p className="text-white/80 mt-1">
            {loc.address}, {loc.city}
          </p>
        </div>

        <div className="p-6 space-y-6">
          {/* Description */}
          <p className="text-[var(--foreground)] leading-relaxed">{loc.description}</p>

          {/* Travel info */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[var(--background)] rounded-xl p-4 text-center border border-[var(--border)]">
              <div className="text-2xl mb-1">🚗</div>
              <div className="text-xl font-bold text-[var(--primary-dark)]">
                {formatMinutes(driveMin)}
              </div>
              <div className="text-xs text-[var(--muted)] mt-0.5">Rijden vanuit Grashoek</div>
            </div>
            <div className="bg-[var(--background)] rounded-xl p-4 text-center border border-[var(--border)]">
              <div className="text-2xl mb-1">🚲</div>
              <div className="text-xl font-bold text-[var(--primary-dark)]">
                {formatMinutes(bikeMin)}
              </div>
              <div className="text-xs text-[var(--muted)] mt-0.5">Fietsen vanuit Grashoek</div>
            </div>
          </div>

          {/* Prices — only show when there's an actual entry fee or explicitly free */}
          {(loc.entreeKinderen > 0 || loc.entreeVolwassenen > 0 || loc.tags.includes("gratis")) && (
          <div>
            <h2 className="font-semibold text-[var(--foreground)] mb-2">Entree</h2>
            <div className="flex gap-4">
              <div className="flex-1 border border-[var(--border)] rounded-xl p-3">
                <div className="text-xs text-[var(--muted)] mb-1">Kinderen</div>
                <div className="font-bold text-[var(--accent)] text-lg">
                  {formatPrice(loc.entreeKinderen)}
                </div>
              </div>
              <div className="flex-1 border border-[var(--border)] rounded-xl p-3">
                <div className="text-xs text-[var(--muted)] mb-1">Volwassenen</div>
                <div className="font-bold text-[var(--accent)] text-lg">
                  {formatPrice(loc.entreeVolwassenen)}
                </div>
              </div>
            </div>
          </div>
          )}

          {/* Tags + leeftijd */}
          <div>
            <h2 className="font-semibold text-[var(--foreground)] mb-2">Kenmerken</h2>
            <div className="flex flex-wrap gap-2">
              {loc.tags.map((tag: Tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--primary)]/10 text-[var(--primary-dark)] text-sm font-medium"
                >
                  {TAG_ICONS[tag]} {TAG_LABELS[tag]}
                </span>
              ))}
              {formatLeeftijd(loc) && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-100 text-amber-800 text-sm font-medium">
                  👶 {formatLeeftijd(loc)}
                </span>
              )}
            </div>
          </div>

          {/* Openingstijden */}
          <div>
            <h2 className="font-semibold text-[var(--foreground)] mb-2">Openingstijden</h2>
            {loc.openingHours ? (
              <div className="grid grid-cols-7 gap-1 text-center text-xs">
                {WEEKDAYS.map((day: WeekDay) => {
                  const hours = loc.openingHours![day];
                  return (
                    <div key={day} className="flex flex-col gap-1">
                      <div className="font-semibold text-[var(--muted)]">{WEEKDAY_LABELS[day]}</div>
                      {hours ? (
                        <div className="bg-[var(--primary)]/10 text-[var(--primary-dark)] rounded-lg p-1.5 leading-tight">
                          {hours.replace("-", "\n–\n")}
                        </div>
                      ) : (
                        <div className="bg-gray-100 text-gray-400 rounded-lg p-1.5">Dicht</div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-[var(--muted)]">Openingstijden niet bekend. Controleer de website.</p>
            )}
          </div>

          {/* Address & website */}
          <div className="border-t border-[var(--border)] pt-4 space-y-2 text-sm">
            <div className="flex gap-2">
              <span className="text-[var(--muted)] w-24 shrink-0">Adres</span>
              <span>
                {loc.address}, {loc.city}
              </span>
            </div>
            {loc.website && (
              <div className="flex gap-2">
                <span className="text-[var(--muted)] w-24 shrink-0">Website</span>
                <a
                  href={loc.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--primary)] hover:underline break-all"
                >
                  {loc.website.replace(/^https?:\/\//, "")}
                </a>
              </div>
            )}
          </div>

          {/* Maps link */}
          <a
            href={`https://www.google.com/maps/dir/Grashoek,+Netherlands/${encodeURIComponent(
              `${loc.address}, ${loc.city}`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-[var(--primary)] text-white font-medium hover:bg-[var(--primary-dark)] transition-colors"
          >
            🗺️ Route naar {loc.name}
          </a>
        </div>
      </div>
    </div>
  );
}
