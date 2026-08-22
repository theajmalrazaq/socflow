import path from "path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

function apiDevMiddleware() {
  return {
    name: "api-dev-middleware",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url && req.url.startsWith("/api/SendEmail") && req.method === "POST") {
          let body = "";
          req.on("data", (chunk) => {
            body += chunk;
          });
          req.on("end", async () => {
            try {
              const parsedBody = body ? JSON.parse(body) : {};
              const fakeReq = {
                method: req.method,
                body: parsedBody,
                headers: req.headers,
              };
              const fakeRes = {
                statusCode: 200,
                status(code) {
                  this.statusCode = code;
                  return this;
                },
                json(data) {
                  res.statusCode = this.statusCode;
                  res.setHeader("Content-Type", "application/json");
                  res.end(JSON.stringify(data));
                },
              };

              const handlerModule = await import("./api/SendEmail.js");
              const handler = handlerModule.default || handlerModule;
              await handler(fakeReq, fakeRes);
            } catch (err) {
              console.error("Local API Handler error:", err);
              res.statusCode = 500;
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({ message: err.message || "Internal Server Error" }));
            }
          });
          return;
        }
        next();
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), apiDevMiddleware()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
