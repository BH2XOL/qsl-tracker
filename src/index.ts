import { Hono } from "hono";
import type { Bindings } from "./types";
import { initSchema } from "./lib/db";
import { frontendHandler } from "./routes/frontend";
import { adminHandler } from "./routes/admin";
import { apiAddHandler, apiUpdateHandler, apiDeleteHandler, apiListHandler, apiExportHandler, apiImportHandler } from "./routes/api";

const app = new Hono<{ Bindings: Bindings }>();

app.use("*", async (c, next) => {
  await initSchema(c.env.DB);
  await next();
});

app.get("/", (c) => frontendHandler(c.req.raw, c.env));

app.get("/admin", (c) => adminHandler(c.req.raw, c.env));
app.post("/admin/api/add", (c) => apiAddHandler(c.req.raw, c.env));
app.post("/admin/api/update/:id", (c) => {
  const id = parseInt(c.req.param("id"));
  return apiUpdateHandler(c.req.raw, c.env, id);
});
app.post("/admin/api/delete", (c) => apiDeleteHandler(c.req.raw, c.env));
app.get("/admin/api/list", (c) => apiListHandler(c.req.raw, c.env));
app.get("/admin/api/export", (c) => apiExportHandler(c.req.raw, c.env));
app.post("/admin/api/import", (c) => apiImportHandler(c.req.raw, c.env));

export default app;
