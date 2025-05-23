import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  assetsInclude: ["**/*.riv"],
  plugins: [react()],
  envDir: path.resolve(__dirname, "./env"),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
