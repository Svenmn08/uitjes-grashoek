import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Uitjes Grashoek",
    short_name: "Uitjes",
    description: "Ontdek uitstapjes in de Peel & Maas regio",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#3d5228",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any maskable",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any maskable",
      },
    ],
  };
}
