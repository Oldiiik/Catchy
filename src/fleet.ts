import type { Reading } from './components/GoogleMap'

/* ── The demo fleet ───────────────────────────────────────────────────────
   No hardware, so the hardware is modelled. Eight boats work a patrol box
   off Aktau on real courses at real speeds; a slick sits on the water and
   drifts with the current. A vessel's reading is not a scripted value — it
   is what its sensor would see given where it is relative to the oil, plus
   the noise a real optical channel carries. Everything downstream (queue,
   states, the day's histogram, the event log) falls out of that.

   Which means the demo behaves like the product: sail a clean boat into the
   slick and it goes to sheen, then to review, on its own. */

export const THRESHOLD = 5
export const CEILING = 15

/** The water the fleet works, west of the Aktau shore. */
const BOX = { north: 43.762, south: 43.492, west: 50.958, east: 51.184 }

const KM_PER_DEG_LAT = 111.32
const KNOT_KM_PER_MIN = 1.852 / 60

export type Vessel = {
  name: string
  lat: number
  lng: number
  /** Course over ground, degrees true. */
  heading: number
  /** Speed over ground, knots. */
  speed: number
}

/** A patch of hydrocarbons on the surface, drifting and spreading. */
export type Slick = {
  lat: number
  lng: number
  /** Radius at which the concentration has fallen to 1/e, in km. */
  radius: number
  /** Concentration at the centre, ppm. */
  strength: number
}

export type LogEntry = {
  /** Minutes since midnight, so it can be formatted in any locale. */
  at: number
  vessel: string
  kind: Reading['kind']
  ppm: number
}

export type Bucket = { hour: number; total: number; over: number }

export type Sim = {
  /** Minutes since midnight. */
  clock: number
  vessels: Vessel[]
  slicks: Slick[]
  readings: Reading[]
  history: Bucket[]
  log: LogEntry[]
  /** Readings taken since the simulation started. */
  taken: number
}

const FLEET: Vessel[] = [
  { name: 'Айсұлу 04', lat: 43.7126, lng: 51.1042, heading: 168, speed: 8.2 },
  { name: 'Бекет-Ата', lat: 43.6802, lng: 51.0284, heading: 212, speed: 6.4 },
  { name: 'Каспий-17', lat: 43.6491, lng: 51.0615, heading: 143, speed: 5.1 },
  { name: 'Жайық 22', lat: 43.6234, lng: 50.9971, heading: 254, speed: 9.7 },
  { name: 'Тұлпар 09', lat: 43.6055, lng: 51.0988, heading: 197, speed: 3.6 },
  { name: 'Нұрлан Б.', lat: 43.5718, lng: 51.0242, heading: 302, speed: 7.8 },
  { name: 'Сарытас', lat: 43.5462, lng: 51.1173, heading: 118, speed: 10.3 },
  { name: 'Ерсай 03', lat: 43.5231, lng: 50.9905, heading: 271, speed: 6.9 },
]

/** The slick the demo opens on: already on the water, already being worked. */
const SEED_SLICK: Slick = { lat: 43.608, lng: 51.092, radius: 2.6, strength: 13.5 }

const lngKm = (lat: number) => KM_PER_DEG_LAT * Math.cos((lat * Math.PI) / 180)

function distanceKm(aLat: number, aLng: number, bLat: number, bLng: number) {
  const dy = (aLat - bLat) * KM_PER_DEG_LAT
  const dx = (aLng - bLng) * lngKm(aLat)
  return Math.hypot(dx, dy)
}

/** Deterministic per-vessel noise, so channels wobble without ever jumping. */
function wobble(seed: number, clock: number, rate: number) {
  return Math.sin(clock * rate + seed * 2.399) * 0.5 + Math.sin(clock * rate * 0.37 + seed) * 0.3
}

function formatClock(minutes: number) {
  const m = ((minutes % 1440) + 1440) % 1440
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(Math.floor(m % 60)).padStart(2, '0')}`
}

export { formatClock }

function kindFor(ppm: number): Reading['kind'] {
  if (ppm >= 8) return 'review'
  if (ppm >= 1.5) return 'sheen'
  return 'clear'
}

/** What a vessel's sensor reports, given where it is and what is in the water. */
function measure(v: Vessel, i: number, sim: { clock: number; slicks: Slick[] }): Reading {
  // Concentration falls off as a Gaussian from each slick's centre.
  const oil = sim.slicks.reduce((sum, s) => {
    const d = distanceKm(v.lat, v.lng, s.lat, s.lng)
    return sum + s.strength * Math.exp(-((d / s.radius) ** 2))
  }, 0)

  const ppm = Math.max(0, oil + 0.22 + wobble(i, sim.clock, 0.11) * 0.18)
  // The optical channels are consequences of the same water, not free numbers.
  const film = ppm * 0.168 + Math.max(0, wobble(i + 3, sim.clock, 0.09)) * 0.01
  const fluor = ppm * 20.6 + 8 + wobble(i + 7, sim.clock, 0.13) * 4
  const turb = 22 + wobble(i + 11, sim.clock, 0.05) * 7 + ppm * 0.4
  // A shallow diurnal curve on water temperature.
  const temp = 21.6 + Math.sin(((sim.clock - 240) / 1440) * Math.PI * 2) * 1.4 + i * 0.05

  return {
    lat: v.lat,
    lng: v.lng,
    kind: kindFor(ppm),
    vessel: v.name,
    time: formatClock(sim.clock),
    ppm: ppm.toFixed(1),
    film: film.toFixed(2),
    fluor: String(Math.round(fluor)),
    turb: String(Math.round(turb)),
    temp: temp.toFixed(1),
    heading: Math.round(v.heading),
    speed: v.speed.toFixed(1),
  }
}

/** A day already partly behind us, so the histogram is not empty at 12:00. */
function seedHistory(untilHour: number, slickHours: number[]): Bucket[] {
  return Array.from({ length: 24 }, (_, hour) => {
    if (hour > untilHour) return { hour, total: 0, over: 0 }
    const total = Math.round(96 + Math.sin(hour / 3.1) * 26 + Math.cos(hour / 1.6) * 15)
    const over = slickHours.includes(hour) ? Math.round(total * (0.06 + (hour % 3) * 0.02)) : 0
    return { hour, total, over }
  })
}

export function createSim(): Sim {
  const clock = 12 * 60
  const vessels = FLEET.map((v) => ({ ...v }))
  const slicks = [{ ...SEED_SLICK }]
  const readings = vessels.map((v, i) => measure(v, i, { clock, slicks }))

  return {
    clock,
    vessels,
    slicks,
    readings,
    history: seedHistory(11, [9, 10, 11]),
    log: readings
      .filter((r) => r.kind !== 'clear')
      .map((r) => ({ at: clock, vessel: r.vessel, kind: r.kind, ppm: Number(r.ppm) })),
    taken: 0,
  }
}

/**
 * Advance the world by `dt` simulated minutes. Boats run their courses, the
 * slick drifts north-north-east with the coastal current while spreading and
 * weathering, and every state change a vessel goes through is logged.
 */
export function step(sim: Sim, dt: number): Sim {
  const clock = sim.clock + dt

  const vessels = sim.vessels.map((v, i) => {
    // A slow wander on the course, so no boat runs a perfectly straight line.
    let heading = v.heading + wobble(i + 17, clock, 0.03) * 1.6 * dt
    const km = v.speed * KNOT_KM_PER_MIN * dt
    const rad = (heading * Math.PI) / 180
    let lat = v.lat + (Math.cos(rad) * km) / KM_PER_DEG_LAT
    let lng = v.lng + (Math.sin(rad) * km) / lngKm(v.lat)

    // At the edge of the patrol box, come about rather than sail off the map.
    if (lat > BOX.north || lat < BOX.south) {
      heading = 180 - heading
      lat = Math.min(BOX.north, Math.max(BOX.south, lat))
    }
    if (lng > BOX.east || lng < BOX.west) {
      heading = 360 - heading
      lng = Math.min(BOX.east, Math.max(BOX.west, lng))
    }

    return { ...v, lat, lng, heading: ((heading % 360) + 360) % 360 }
  })

  // Drift: 0.42 kn toward 022°, the set of the current along this coast.
  const drift = 0.42 * KNOT_KM_PER_MIN * dt
  const slicks = sim.slicks
    .map((s) => ({
      lat: s.lat + (Math.cos((22 * Math.PI) / 180) * drift) / KM_PER_DEG_LAT,
      lng: s.lng + (Math.sin((22 * Math.PI) / 180) * drift) / lngKm(s.lat),
      // Spreading dilutes it: the patch widens as the peak comes down.
      radius: s.radius + 0.0016 * dt,
      strength: s.strength * (1 - 0.00042 * dt),
    }))
    .filter((s) => s.strength > 0.4)

  const readings = vessels.map((v, i) => measure(v, i, { clock, slicks }))

  // One reading per vessel every 40 seconds, which is the sensor's interval.
  const taken = sim.taken + (vessels.length * dt) / (40 / 60)
  const newThisStep = Math.floor(taken) - Math.floor(sim.taken)
  const over = readings.filter((r) => Number(r.ppm) >= THRESHOLD).length
  const overShare = readings.length ? over / readings.length : 0

  const hour = Math.floor((clock % 1440) / 60)
  const history = sim.history.map((b) =>
    b.hour === hour
      ? {
          ...b,
          total: b.total + newThisStep,
          over: b.over + Math.round(newThisStep * overShare),
        }
      : b,
  )

  // Log a vessel only when it changes state — a running list of what happened,
  // not a firehose of every sample.
  const events: LogEntry[] = []
  readings.forEach((r, i) => {
    if (r.kind !== sim.readings[i]?.kind) {
      events.push({ at: clock, vessel: r.vessel, kind: r.kind, ppm: Number(r.ppm) })
    }
  })

  return {
    clock,
    vessels,
    slicks,
    readings,
    history,
    taken,
    log: events.length ? [...events.reverse(), ...sim.log].slice(0, 40) : sim.log,
  }
}

/**
 * Put fresh oil in the water ahead of the fleet. This is the demo's one
 * scripted act: everything after it — who detects it, when, how the queue
 * reorders — is the simulation reacting.
 */
export function spill(sim: Sim): Sim {
  // Drop it upstream of the busiest part of the box so a boat reaches it soon.
  const target = sim.vessels[Math.floor(Math.random() * sim.vessels.length)]
  const bearing = (target.heading * Math.PI) / 180
  const ahead = 2.2

  return {
    ...sim,
    slicks: [
      ...sim.slicks,
      {
        lat: target.lat + (Math.cos(bearing) * ahead) / KM_PER_DEG_LAT,
        lng: target.lng + (Math.sin(bearing) * ahead) / lngKm(target.lat),
        radius: 1.5 + Math.random() * 1.2,
        strength: 11 + Math.random() * 6,
      },
    ],
  }
}
