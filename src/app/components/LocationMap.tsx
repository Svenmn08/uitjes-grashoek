"use client";

import { useEffect, useRef } from "react";
import type { Map as LeafletMap } from "leaflet";
import type { Location, Tag } from "@/lib/locations";
import { getDriveMinutes, getBikeMinutes, formatMinutes, formatPrice, TAG_ICONS, TAG_LABELS } from "@/lib/locations";

const GRASHOEK = { lat: 51.3917, lng: 5.9417 };

function markerColor(loc: Location): string {
  const tags = loc.tags;
  if (tags.includes("zwembadbinnen") || tags.includes("zwembadbuiten")) return "#2563eb";
  if (tags.includes("kinderboerderij")) return "#854d0e";
  if (tags.includes("restaurant")) return "#c17f3a";
  if (tags.includes("spelen") || tags.includes("binnenspeeltuin") || tags.includes("buitenspeeltuin")) return "#5c7a3e";
  if (tags.includes("kijken")) return "#7c3aed";
  return "#64748b";
}

function buildPopupHtml(loc: Location): string {
  const driveMin = getDriveMinutes(loc);
  const bikeMin = getBikeMinutes(loc);
  const tagHtml = loc.tags
    .slice(0, 4)
    .map(
      (t: Tag) =>
        `<span style="display:inline-block;background:#5c7a3e22;color:#3d5228;border-radius:999px;padding:2px 8px;font-size:11px;margin:1px;">${TAG_ICONS[t]} ${TAG_LABELS[t]}</span>`
    )
    .join("");

  return `
    <div style="min-width:200px;max-width:260px;font-family:system-ui,sans-serif;">
      <div style="font-weight:700;font-size:14px;margin-bottom:4px;color:#2d2a25;">${loc.name}</div>
      <div style="font-size:12px;color:#8b7355;margin-bottom:6px;">${loc.address}, ${loc.city}</div>
      <div style="margin-bottom:6px;">${tagHtml}</div>
      <div style="display:flex;gap:12px;font-size:12px;color:#5c5c5c;margin-bottom:8px;">
        <span>🚗 ${formatMinutes(driveMin)}</span>
        <span>🚲 ${formatMinutes(bikeMin)}</span>
        <span>${loc.entreeKinderen === 0 ? "✅ Gratis" : "💶 v.a. " + formatPrice(loc.entreeKinderen)}</span>
      </div>
      <a href="/locatie/${loc.id}" style="display:block;text-align:center;background:#3d5228;color:white;border-radius:8px;padding:6px 12px;font-size:12px;font-weight:600;text-decoration:none;">
        Meer info →
      </a>
    </div>
  `;
}

// SVG teardrop pin: path traced from bottom tip, around a circle, back to tip
// M cx,bottom  Q left,mid left,top  A r r 0 1 1 right,top  Q right,mid cx,bottom Z
function pinSvg(color: string): string {
  return `<svg width="24" height="36" viewBox="0 0 24 36" xmlns="http://www.w3.org/2000/svg" overflow="visible">
    <path d="M12 35 Q1 22 1 12 A11 11 0 1 1 23 12 Q23 22 12 35Z" fill="${color}" stroke="white" stroke-width="1.5"/>
    <circle cx="12" cy="12" r="4" fill="white" opacity="0.9"/>
  </svg>`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function addLocationMarkers(L: any, group: any, locs: Location[]) {
  locs.forEach((loc) => {
    const icon = L.divIcon({
      html: pinSvg(markerColor(loc)),
      className: "",
      iconSize: [24, 36],
      iconAnchor: [12, 36],
      popupAnchor: [0, -36],
    });
    L.marker([loc.lat, loc.lng], { icon })
      .addTo(group)
      .bindPopup(buildPopupHtml(loc), { maxWidth: 280 });
  });
}

export default function LocationMap({ locations }: { locations: Location[] }) {
  const mapRef = useRef<LeafletMap | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markersGroupRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const leafletRef = useRef<any>(null);

  // Initialize map once on mount
  useEffect(() => {
    if (mapRef.current || !containerRef.current) return;

    let isMounted = true;

    import("leaflet").then((L) => {
      if (!isMounted || !containerRef.current) return;
      leafletRef.current = L;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const map = L.map(containerRef.current!).setView([GRASHOEK.lat, GRASHOEK.lng], 11);
      mapRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 18,
      }).addTo(map);

      // Home marker — larger pin with outer ring for emphasis
      const homeIcon = L.divIcon({
        html: `<svg width="46" height="60" viewBox="0 0 46 60" xmlns="http://www.w3.org/2000/svg" overflow="visible">
          <circle cx="23" cy="22" r="20" fill="none" stroke="#c17f3a" stroke-width="2.5" opacity="0.35"/>
          <path d="M23 58 Q4 41 4 22 A19 19 0 1 1 42 22 Q42 41 23 58Z" fill="#c17f3a" stroke="white" stroke-width="2.5"/>
          <circle cx="23" cy="22" r="11" fill="white" opacity="0.95"/>
          <text x="23" y="26" text-anchor="middle" font-size="14" font-family="system-ui,sans-serif">🏠</text>
        </svg>`,
        className: "",
        iconSize: [46, 60],
        iconAnchor: [23, 60],
        popupAnchor: [0, -60],
      });

      L.marker([GRASHOEK.lat, GRASHOEK.lng], { icon: homeIcon })
        .addTo(map)
        .bindPopup(
          `<div style="font-family:system-ui,sans-serif;">
            <div style="font-weight:700;font-size:14px;margin-bottom:2px;">🏠 Grashoek</div>
            <div style="font-size:12px;color:#8b7355;">Jouw vertrekpunt</div>
          </div>`
        );

      const markersGroup = L.layerGroup().addTo(map);
      markersGroupRef.current = markersGroup;
      addLocationMarkers(L, markersGroup, locations);
    });

    return () => {
      isMounted = false;
      mapRef.current?.remove();
      mapRef.current = null;
      markersGroupRef.current = null;
      leafletRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update markers whenever filtered locations change
  useEffect(() => {
    if (!markersGroupRef.current || !leafletRef.current) return;
    markersGroupRef.current.clearLayers();
    addLocationMarkers(leafletRef.current, markersGroupRef.current, locations);
  }, [locations]);

  return (
    <div className="relative">
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />

      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-[1000] bg-white rounded-xl shadow-md border border-[var(--border)] p-3 text-xs space-y-1.5">
        <div className="font-semibold text-[var(--foreground)] mb-1">Legenda</div>
        {[
          { color: "#5c7a3e", label: "Spelen / Speeltuin" },
          { color: "#2563eb", label: "Zwembad" },
          { color: "#854d0e", label: "Kinderboerderij" },
          { color: "#c17f3a", label: "Restaurant" },
          { color: "#7c3aed", label: "Kijken / Museum" },
          { color: "#64748b", label: "Overig" },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-2">
            <svg width="10" height="15" viewBox="0 0 24 36" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
              <path d="M12 35 Q1 22 1 12 A11 11 0 1 1 23 12 Q23 22 12 35Z" fill={color} stroke="white" strokeWidth="1.5" />
            </svg>
            {label}
          </div>
        ))}
        <div className="flex items-center gap-2 border-t border-[var(--border)] pt-1.5 mt-1">
          <svg width="12" height="16" viewBox="0 0 46 60" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
            <path d="M23 58 Q4 41 4 22 A19 19 0 1 1 42 22 Q42 41 23 58Z" fill="#c17f3a" stroke="white" strokeWidth="2.5" />
          </svg>
          Grashoek (vertrekpunt)
        </div>
      </div>

      <div ref={containerRef} style={{ height: "580px", width: "100%" }} className="rounded-xl" />
    </div>
  );
}
