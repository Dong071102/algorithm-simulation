// ============================================================================
// Real Max-Flow Algorithmic Core (Residual Graph, Min-Cut, EK, Capacity Scaling)
// ============================================================================

export function computeMinCut(nodes, edges, sourceId) {
  const reachable = new Set([sourceId]);
  const queue = [sourceId];
  while (queue.length) {
    const u = queue.shift();
    for (const e of edges) {
      // Forward residual edge
      if (e.from === u && e.cap - e.flow > 0 && !reachable.has(e.to)) {
        reachable.add(e.to);
        queue.push(e.to);
      }
      // Backward residual edge
      if (e.to === u && e.flow > 0 && !reachable.has(e.from)) {
        reachable.add(e.from);
        queue.push(e.from);
      }
    }
  }
  const sNodes = nodes.filter((n) => reachable.has(n.id)).map((n) => n.id);
  const tNodes = nodes.filter((n) => !reachable.has(n.id)).map((n) => n.id);
  const cutEdges = edges.filter((e) => reachable.has(e.from) && !reachable.has(e.to));
  const cutCap = cutEdges.reduce((acc, e) => acc + e.cap, 0);
  return { reachable, sNodes, tNodes, cutEdges, cutCap };
}

/**
 * Tìm đường tăng luồng bằng BFS trên đồ thị thặng dư (có tùy chọn ngưỡng minCap cho Capacity Scaling)
 */
export function bfsAugmentingPath(nodes, edges, sourceId, sinkId, minCap = 1) {
  const dist = { [sourceId]: 0 };
  const parent = {}; // nodeId -> { edge, dir: 1 | -1, prev }
  const queue = [sourceId];

  while (queue.length) {
    const u = queue.shift();
    for (const e of edges) {
      if (e.from === u && e.cap - e.flow >= minCap && dist[e.to] === undefined) {
        dist[e.to] = dist[u] + 1;
        parent[e.to] = { edge: e, dir: 1, prev: u };
        queue.push(e.to);
      } else if (e.to === u && e.flow >= minCap && dist[e.from] === undefined) {
        dist[e.from] = dist[u] + 1;
        parent[e.from] = { edge: e, dir: -1, prev: u };
        queue.push(e.from);
      }
    }
  }

  if (dist[sinkId] === undefined) return { found: false, dist };

  // Reconstruct path & bottleneck
  const path = [];
  let cur = sinkId;
  let bottleneck = Infinity;
  while (cur !== sourceId) {
    const p = parent[cur];
    const res = p.dir === 1 ? p.edge.cap - p.edge.flow : p.edge.flow;
    bottleneck = Math.min(bottleneck, res);
    path.unshift({ edgeId: p.edge.id, from: p.prev, to: cur, dir: p.dir, edge: p.edge });
    cur = p.prev;
  }

  return { found: true, dist, path, bottleneck };
}

/**
 * Chạy thuật toán Edmonds-Karp hoàn chỉnh trên một đồ thị bất kỳ (dùng cho Case Study tương tác)
 */
export function solveEdmondsKarp(baseNodes, baseEdges, sourceId, sinkId) {
  const edges = baseEdges.map((e) => ({ ...e, flow: 0 }));
  let totalFlow = 0;
  let iterations = 0;
  const history = [];

  while (true) {
    const res = bfsAugmentingPath(baseNodes, edges, sourceId, sinkId, 1);
    if (!res.found) break;
    iterations++;
    for (const seg of res.path) {
      const e = edges.find((x) => x.id === seg.edgeId);
      e.flow += seg.dir * res.bottleneck;
    }
    totalFlow += res.bottleneck;
    history.push({
      iter: iterations,
      path: res.path.map((s) => ({ edgeId: s.edgeId, from: s.from, to: s.to, dir: s.dir })),
      bottleneck: res.bottleneck,
      totalFlow,
      edgesSnapshot: edges.map((e) => ({ ...e })),
      dist: { ...res.dist },
    });
  }

  const minCut = computeMinCut(baseNodes, edges, sourceId);
  return { totalFlow, iterations, edges, minCut, history };
}
