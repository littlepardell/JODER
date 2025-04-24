import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Habit Tracker",
    short_name: "Hábitos",
    description: "Aplicación para seguimiento de hábitos diarios",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#000000",
    icons: [
      { src: "/icon.png", sizes: "192x192", type: "image/png" },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/apple-icon.png",
        sizes: "180x180", 
        type: "image/png",
        purpose: "apple touch icon",
      },
    ],
    orientation: "portrait",
    prefer_related_applications: false,
    related_applications: [],
    scope: "/",
    shortcuts: [
      {
        name: "Hábitos",
        short_name: "Hábitos",
        description: "Ver tus hábitos",
        url: "/dashboard?tab=habits",
        icons: [{ src: "/icon.png", sizes: "192x192" }],
      },
      {
        name: "Perfil",
        short_name: "Perfil",
        description: "Ver tu perfil",
        url: "/dashboard?tab=profile",
        icons: [{ src: "/icon.png", sizes: "192x192" }],
      },
    ],
  }
}
