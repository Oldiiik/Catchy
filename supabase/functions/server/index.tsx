import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";
const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/make-server-fb90d35e/health", (c) => {
  return c.json({ status: "ok" });
});

/* ── Oil-spill detections ──────────────────────────────────────────────────
   The Raspberry Pi field unit POSTs a detection here when it sees oil; the
   dashboard map GETs the list back. Records are stored in the kv table under
   the "detection:" prefix, keyed by timestamp so they read back in order. */

const KEY_PREFIX = "detection:";

/** Severity of a confirmed detection. A reported moment is never "clear";
    coverage/confidence (both estimates) only choose sheen vs. review. */
function classify(coverage: number, confidence: number): "sheen" | "review" {
  if (coverage >= 0.10 || (coverage >= 0.03 && confidence >= 0.6)) return "review";
  return "sheen";
}

// POST a new detection (called by the Pi).
app.post("/make-server-fb90d35e/detections", async (c) => {
  try {
    const body = await c.req.json();

    const lat = Number(body.lat);
    const lng = Number(body.lng ?? body.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return c.json({ error: "lat and lng are required numbers" }, 400);
    }

    const iso = typeof body.iso === "string" ? body.iso : new Date().toISOString();
    const id = typeof body.id === "string" && body.id ? body.id : crypto.randomUUID();
    const coverage = Number(body.oil_coverage ?? 0);
    const confidence = Number(body.confidence ?? 0);

    // Shape the record so the map's existing Reading renderer just works,
    // with the detection-specific extras (image, coverage, confidence) added.
    const record = {
      id,
      lat,
      lng,
      kind: body.kind ?? classify(coverage, confidence),
      vessel: body.device ?? body.vessel ?? "Pi unit",
      time: body.time ?? iso.slice(11, 16),
      iso,
      ppm: String(body.ppm ?? (coverage * 100).toFixed(1)),
      // Fields the site's Reading type expects; unknown for a camera unit.
      film: body.film ?? "—",
      fluor: body.fluor ?? "—",
      turb: body.turb ?? "—",
      temp: body.temp ?? "—",
      heading: Number(body.heading ?? 0),
      speed: String(body.speed ?? "—"),
      // Detection extras.
      oil_coverage: coverage,
      coverage_by_type: body.coverage_by_type ?? {},
      confidence,
      image: typeof body.image === "string" ? body.image : null,
      source: "pi",
    };

    // Timestamp-prefixed key keeps natural chronological ordering.
    await kv.set(`${KEY_PREFIX}${iso}:${id}`, record);
    return c.json({ ok: true, id });
  } catch (err) {
    console.log("POST /detections failed:", err);
    return c.json({ error: String(err) }, 500);
  }
});

// GET all detections (called by the dashboard map).
app.get("/make-server-fb90d35e/detections", async (c) => {
  try {
    const rows = await kv.getByPrefix(KEY_PREFIX);
    // Newest first; the map/queue can slice as needed.
    rows.sort((a: any, b: any) => String(b.iso).localeCompare(String(a.iso)));
    return c.json({ detections: rows });
  } catch (err) {
    console.log("GET /detections failed:", err);
    return c.json({ error: String(err) }, 500);
  }
});

Deno.serve(app.fetch);
