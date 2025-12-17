import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig(async ({ mode }) => {
  const plugins = [react()];

  // 🔒 lovable-tagger ONLY in development
  if (mode === "development") {
    const { componentTagger } = await import("lovable-tagger");
    plugins.push(componentTagger());
  }

  return {
    server: {
      host: "::",
      port: 8080,
      allowedHosts: true,
    },
    plugins,
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
        "@shared": path.resolve(__dirname, "./shared"),
      },
    },
  };
});