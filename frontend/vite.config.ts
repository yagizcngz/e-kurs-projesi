import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { createLogger } from "vite";

// Vite'ın varsayılan log (çıktı) sistemini alıyoruz
const logger = createLogger();
const originalWarn = logger.warn;

// Sadece bu özel uyarıyı filtrele, geri kalan her şeyi normal şekilde göster
logger.warn = (msg, options) => {
  if (msg.includes("vite-tsconfig-paths")) return;
  originalWarn(msg, options);
};

export default defineConfig({
  vite: {
    customLogger: logger, // Özelleştirdiğimiz loglayıcıyı Vite'a veriyoruz
    resolve: {
      tsconfigPaths: true,
    },
  },
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
});
