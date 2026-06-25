import { Hono } from "hono";
import type { Bindings } from "./types";
import { frontendHandler } from "./routes/frontend";
import { adminHandler } from "./routes/admin";
import { apiAddHandler, apiUpdateHandler, apiDeleteHandler, apiListHandler } from "./routes/api";

const app = new Hono<{ Bindings: Bindings }>();

app.get("/", (c) => frontendHandler(c.req.raw, c.env));

app.get("/admin", (c) => adminHandler(c.req.raw, c.env));
app.post("/admin/api/add", (c) => apiAddHandler(c.req.raw, c.env));
app.post("/admin/api/update/:id", (c) => {
  const id = parseInt(c.req.param("id"));
  return apiUpdateHandler(c.req.raw, c.env, id);
});
app.post("/admin/api/delete", (c) => apiDeleteHandler(c.req.raw, c.env));
app.get("/admin/api/list", (c) => apiListHandler(c.req.raw, c.env));

export default app;
