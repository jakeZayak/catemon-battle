import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "Catémon — Meme Cat Battle",
        short_name: "Catémon",
        description: "Retro meme cat battle adventure",
        theme_color: "#2e3040",
        background_color: "#1a1c22",
        display: "fullscreen",
        orientation: "portrait",
        icons: [
          { src: "icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" },
        ],
      },
      workbox: {
        // cache everything, including images and music, for full offline play
        globPatterns: ["**/*.{js,css,html,jpg,png,gif,webp,mp3,m4a}"],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
      },
    }),
  ],
  base: "/catemon-battle/",
});
