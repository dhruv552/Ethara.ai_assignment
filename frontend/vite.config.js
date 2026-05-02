import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
    server: {
        host: "0.0.0.0",
        port: 3000,
        strictPort: true,
        allowedHosts: true,
        hmr: { clientPort: 443 },
        watch: {
            ignored: ["**/node_modules/**", "**/.git/**", "**/dist/**"],
        },
    },
    preview: {
        host: "0.0.0.0",
        port: 3000,
        allowedHosts: true,
    },
    envPrefix: ["VITE_", "REACT_APP_"],
});
