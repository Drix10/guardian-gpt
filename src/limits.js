// Sliding-window limits on paid checks. Local (the on-stage demo) and remote (the public MCP link)
// have separate buckets, so traffic through the tunnel can never starve the live demo.
export function createLimiter({ max = 60, windowMs = 60_000 } = {}) {
  const hits = [];
  return function allow(now = Date.now()) {
    while (hits.length && now - hits[0] > windowMs) hits.shift();
    if (hits.length >= max) return false;
    hits.push(now);
    return true;
  };
}

const env = (k, d) => Number(process.env[k] ?? d);
const local = createLimiter({ max: env("GUARDIAN_LOCAL_PER_MIN", 120) });
const remoteMinute = createLimiter({ max: env("GUARDIAN_REMOTE_PER_MIN", 30) });
const remoteDay = createLimiter({ max: env("GUARDIAN_REMOTE_PER_DAY", 600), windowMs: 86_400_000 });

export function checkLimiter(origin = "local") {
  return origin === "remote" ? remoteMinute() && remoteDay() : local();
}
