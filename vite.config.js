import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { imagetools } from "vite-imagetools";

export default defineConfig({
  plugins: [react(), imagetools()],
  server: {
    host: true,    // expose on LAN (0.0.0.0) — visit from phone/iPad on same Wi-Fi
    open: true,    // auto-open the dev URL in the default browser
    port: 5176,
    strictPort: true
  }
});
