// ============================================================================
// Frontend REST API Client -> Backend Server (/api/*)
// ============================================================================

export async function fetchHealth() {
  const res = await fetch('/api/health');
  if (!res.ok) throw new Error(`Health check failed (${res.status})`);
  return res.json();
}

export async function runBackendBenchmark({ preset, n, maxCap, seed = 42, algos = null }) {
  const res = await fetch('/api/benchmark', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ preset, n, maxCap, seed, algos }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Benchmark API error (${res.status})`);
  }
  return res.json();
}

export async function solveCdnOnBackend({ nodes, edges, source = 'S', sink = 'T' }) {
  const res = await fetch('/api/solve-cdn', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nodes, edges, source, sink }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Solve CDN API error (${res.status})`);
  }
  return res.json();
}
