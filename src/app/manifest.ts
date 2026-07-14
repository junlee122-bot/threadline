import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/command",
    name: "Threadline - Evidence-native software intelligence",
    short_name: "Threadline",
    description:
      "Trace code, deployments, runtime signals, and customer impact through one evidence-backed operational thread.",
    start_url: "/command",
    scope: "/",
    display: "standalone",
    background_color: "#080b0d",
    theme_color: "#080b0d",
    orientation: "any",
    categories: ["business", "developer", "productivity"],
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
    ],
    shortcuts: [
      {
        name: "Command center",
        short_name: "Command",
        description: "Open the live operational overview.",
        url: "/command",
        icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
      },
      {
        name: "Incident room",
        short_name: "Incident",
        description: "Replay the active checkout incident.",
        url: "/incidents/inc-2471",
        icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
      },
    ],
  };
}
