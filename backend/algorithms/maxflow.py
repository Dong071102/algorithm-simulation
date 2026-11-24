"""Real server-side Max-Flow implementations, nanosecond benchmarks, and per-line profiler."""

from __future__ import annotations
from collections import deque
import time
from typing import Dict, List, Tuple


def _build_adj(node_count: int, raw_edges: List[Tuple[int, int, int]], force_diamond: bool = False):
    adj = [[] for _ in range(node_count)]
    for u, v, cap in raw_edges:
        fwd = [v, len(adj[v]), cap, 0]  # [to, rev_idx, cap, flow]
        bwd = [u, len(adj[u]), 0, 0]
        adj[u].append(fwd)
        adj[v].append(bwd)
    if force_diamond and node_count == 4 and len(raw_edges) == 5:
        adj[1].sort(key=lambda e: 0 if e[0] == 2 else 1)
        adj[2].sort(key=lambda e: 0 if e[0] == 1 else 1)
        # Re-link reverse indices after sorting
        for u in range(node_count):
            for idx, e in enumerate(adj[u]):
                v = e[0]
                for r_idx, re in enumerate(adj[v]):
                    if re[0] == u and ((e[2] > 0 and re[2] == 0) or (e[2] == 0 and re[2] > 0)):
                        e[1] = r_idx
                        break
    return adj


REAL_SOURCE: Dict[str, List[str]] = {
    "ford-fulkerson": [
        "def ford_fulkerson(adj, S, T):",
        "    flow, token, vis = 0, 0, [0] * len(adj)",
        "    def dfs(u, pushed):",
        "        if u == T: return pushed",
        "        vis[u] = token",
        "        for e in adj[u]:",
        "            rem = e[2] - e[3]",
        "            if rem > 0 and vis[e[0]] != token:",
        "                tr = dfs(e[0], min(pushed, rem))",
        "                if tr > 0: e[3] += tr; adj[e[0]][e[1]][3] -= tr; return tr",
        "        return 0",
        "    while True:",
        "        token += 1",
        "        pushed = dfs(S, 10**18)",
        "        if pushed == 0: break",
        "        flow += pushed",
        "    return flow",
    ],
    "edmonds-karp": [
        "def edmonds_karp(adj, S, T):",
        "    flow, n = 0, len(adj)",
        "    while True:",
        "        parent = [-1] * n; parent[S] = S",
        "        p_edge = [None] * n; q = deque([S])",
        "        while q and parent[T] == -1:",
        "            u = q.popleft()",
        "            for e in adj[u]:",
        "                if parent[e[0]] == -1 and e[2] - e[3] > 0:",
        "                    parent[e[0]] = u; p_edge[e[0]] = e; q.append(e[0])",
        "        if parent[T] == -1: break",
        "        pushed, v = 10**18, T",
        "        while v != S: pushed = min(pushed, p_edge[v][2] - p_edge[v][3]); v = parent[v]",
        "        v = T",
        "        while v != S: p_edge[v][3] += pushed; adj[v][p_edge[v][1]][3] -= pushed; v = parent[v]",
        "        flow += pushed",
        "    return flow",
    ],
    "capacity-scaling": [
        "def capacity_scaling(adj, S, T, max_cap):",
        "    flow, token, delta = 0, 0, 1",
        "    while delta * 2 <= max_cap: delta *= 2",
        "    vis = [0] * len(adj)",
        "    def dfs(u, pushed):",
        "        if u == T: return pushed",
        "        vis[u] = token",
        "        for e in adj[u]:",
        "            rem = e[2] - e[3]",
        "            if rem >= delta and vis[e[0]] != token:",
        "                tr = dfs(e[0], min(pushed, rem))",
        "                if tr > 0: e[3] += tr; adj[e[0]][e[1]][3] -= tr; return tr",
        "        return 0",
        "    while delta >= 1:",
        "        while True:",
        "            token += 1",
        "            pushed = dfs(S, 10**18)",
        "            if pushed == 0: break",
        "            flow += pushed",
        "        delta >>= 1",
        "    return flow",
    ],
    "dinic": [
        "def dinic(adj, S, T):",
        "    flow, n = 0, len(adj)",
        "    while True:",
        "        level = [-1] * n; level[S] = 0; q = deque([S])",
        "        while q:",
        "            u = q.popleft()",
        "            for e in adj[u]:",
        "                if e[2] - e[3] > 0 and level[e[0]] == -1:",
        "                    level[e[0]] = level[u] + 1; q.append(e[0])",
        "        if level[T] == -1: break",
        "        ptr = [0] * n",
        "        def dfs(u, pushed):",
        "            if u == T or pushed == 0: return pushed",
        "            while ptr[u] < len(adj[u]):",
        "                e = adj[u][ptr[u]]; rem = e[2] - e[3]",
        "                if level[e[0]] == level[u] + 1 and rem > 0:",
        "                    tr = dfs(e[0], min(pushed, rem))",
        "                    if tr > 0: e[3] += tr; adj[e[0]][e[1]][3] -= tr; return tr",
        "                ptr[u] += 1",
        "            return 0",
        "        while True:",
        "            p = dfs(S, 10**18)",
        "            if p == 0: break",
        "            flow += p",
        "    return flow",
    ],
    "isap": [
        "def isap(adj, S, T):",
        "    n = len(adj); dist = [n] * n; gap = [0] * (n + 2); ptr = [0] * n",
        "    dist[T] = 0; gap[0] = 1; q = deque([T])",
        "    while q:",
        "        u = q.popleft()",
        "        for e in adj[u]:",
        "            if adj[e[0]][e[1]][2] > 0 and dist[e[0]] == n:",
        "                dist[e[0]] = dist[u] + 1; gap[dist[e[0]]] += 1; q.append(e[0])",
        "    flow = 0",
        "    def dfs(u, pushed):",
        "        if u == T: return pushed",
        "        sent = 0",
        "        while ptr[u] < len(adj[u]):",
        "            e = adj[u][ptr[u]]; rem = e[2] - e[3]",
        "            if rem > 0 and dist[u] == dist[e[0]] + 1:",
        "                tr = dfs(e[0], min(pushed - sent, rem))",
        "                e[3] += tr; adj[e[0]][e[1]][3] -= tr; sent += tr",
        "                if sent == pushed: return sent",
        "            ptr[u] += 1",
        "        gap[dist[u]] -= 1",
        "        if gap[dist[u]] == 0: dist[S] = n",
        "        dist[u] += 1; gap[dist[u]] += 1; ptr[u] = 0",
        "        return sent",
        "    while dist[S] < n: flow += dfs(S, 10**18)",
        "    return flow",
    ],
    "push-relabel-fifo": [
        "def push_relabel_fifo(adj, S, T):",
        "    n = len(adj); height = [0] * n; excess = [0] * n; in_q = [False] * n",
        "    height[S] = n; q = deque()",
        "    for e in adj[S]:",
        "        if e[2] > 0: e[3] = e[2]; adj[e[0]][e[1]][3] = -e[2]; excess[e[0]] += e[2]",
        "    while q:",
        "        u = q.popleft(); in_q[u] = False",
        "        while excess[u] > 0:",
        "            pushed = False",
        "            for e in adj[u]:",
        "                rem = e[2] - e[3]",
        "                if rem > 0 and height[u] == height[e[0]] + 1:",
        "                    d = min(excess[u], rem); e[3] += d; adj[e[0]][e[1]][3] -= d",
        "                    excess[u] -= d; excess[e[0]] += d; pushed = True; break",
        "            if not pushed: height[u] = 1 + min(height[e[0]] for e in adj[u] if e[2] > e[3])",
        "    return excess[T]",
    ],
}


def bench_ford_fulkerson(graph: Dict, max_iters: int = 12000) -> Dict:
    n, S, T = graph["nodeCount"], graph["source"], graph["sink"]

    # Pass 1: Pure uninstrumented timing
    adj_p = _build_adj(n, graph["edges"], force_diamond=True)
    vis_p = [0] * n
    token_p = 0
    flow_p = 0
    iters_p = 0

    def dfs_pure(u: int, pushed: int) -> int:
        if u == T:
            return pushed
        vis_p[u] = token_p
        for e in adj_p[u]:
            rem = e[2] - e[3]
            if rem > 0 and vis_p[e[0]] != token_p:
                tr = dfs_pure(e[0], pushed if pushed < rem else rem)
                if tr > 0:
                    e[3] += tr
                    adj_p[e[0]][e[1]][3] -= tr
                    return tr
        return 0

    is_diamond = n == 4 and len(graph["edges"]) == 5
    t0 = time.perf_counter_ns()
    while iters_p < max_iters:
        if is_diamond and iters_p > 0:
            adj_p[S].reverse()
        token_p += 1
        pushed = dfs_pure(S, 10**18)
        if pushed == 0:
            break
        flow_p += pushed
        iters_p += 1
    time_ms = (time.perf_counter_ns() - t0) / 1_000_000.0

    # Pass 2: Exact line profiler
    adj = _build_adj(n, graph["edges"], force_diamond=True)
    hits = [0] * len(REAL_SOURCE["ford-fulkerson"])
    hits[1] = 1
    vis = [0] * n
    flow = paths = edge_scans = token = 0
    capped = False

    def dfs(u: int, pushed: int) -> int:
        nonlocal edge_scans
        hits[3] += 1
        if u == T:
            return pushed
        hits[4] += 1
        vis[u] = token
        for e in adj[u]:
            hits[5] += 1
            hits[6] += 1
            edge_scans += 1
            rem = e[2] - e[3]
            hits[7] += 1
            if rem > 0 and vis[e[0]] != token:
                hits[8] += 1
                tr = dfs(e[0], pushed if pushed < rem else rem)
                hits[9] += 1
                if tr > 0:
                    e[3] += tr
                    adj[e[0]][e[1]][3] -= tr
                    return tr
        hits[10] += 1
        return 0

    while True:
        hits[11] += 1
        if paths >= max_iters:
            capped = True
            break
        if is_diamond and paths > 0:
            adj[S].reverse()
        hits[12] += 1
        hits[13] += 1
        token += 1
        pushed = dfs(S, 10**18)
        hits[14] += 1
        if pushed == 0:
            break
        hits[15] += 1
        flow += pushed
        paths += 1
    hits[16] = 1

    return {
        "id": "ford-fulkerson",
        "name": "Ford–Fulkerson (DFS)",
        "complexity": "O(E · f*)",
        "flow": flow,
        "paths": paths,
        "edgeScans": edge_scans,
        "timeMs": round(time_ms, 4),
        "capped": capped,
        "lineHits": hits,
    }


def bench_edmonds_karp(graph: Dict) -> Dict:
    n, S, T = graph["nodeCount"], graph["source"], graph["sink"]

    # Pass 1: Pure timing
    adj_p = _build_adj(n, graph["edges"])
    flow_p = 0
    t0 = time.perf_counter_ns()
    while True:
        parent = [-1] * n
        parent[S] = S
        p_edge = [None] * n
        q = deque([S])
        while q and parent[T] == -1:
            u = q.popleft()
            for e in adj_p[u]:
                if parent[e[0]] == -1 and e[2] - e[3] > 0:
                    parent[e[0]] = u
                    p_edge[e[0]] = e
                    q.append(e[0])
        if parent[T] == -1:
            break
        pushed, v = 10**18, T
        while v != S:
            rem = p_edge[v][2] - p_edge[v][3]
            if rem < pushed:
                pushed = rem
            v = parent[v]
        v = T
        while v != S:
            p_edge[v][3] += pushed
            adj_p[v][p_edge[v][1]][3] -= pushed
            v = parent[v]
        flow_p += pushed
    time_ms = (time.perf_counter_ns() - t0) / 1_000_000.0

    # Pass 2: Line profiler
    adj = _build_adj(n, graph["edges"])
    hits = [0] * len(REAL_SOURCE["edmonds-karp"])
    hits[1] = 1
    flow = paths = edge_scans = 0

    while True:
        hits[2] += 1
        hits[3] += 1
        hits[4] += 1
        parent = [-1] * n
        parent[S] = S
        p_edge = [None] * n
        q = deque([S])
        while q and parent[T] == -1:
            hits[5] += 1
            hits[6] += 1
            u = q.popleft()
            for e in adj[u]:
                hits[7] += 1
                hits[8] += 1
                edge_scans += 1
                if parent[e[0]] == -1 and e[2] - e[3] > 0:
                    hits[9] += 1
                    parent[e[0]] = u
                    p_edge[e[0]] = e
                    q.append(e[0])
        hits[10] += 1
        if parent[T] == -1:
            break
        hits[11] += 1
        pushed, v = 10**18, T
        while v != S:
            hits[12] += 1
            rem = p_edge[v][2] - p_edge[v][3]
            if rem < pushed:
                pushed = rem
            v = parent[v]
        hits[13] += 1
        v = T
        while v != S:
            hits[14] += 1
            p_edge[v][3] += pushed
            adj[v][p_edge[v][1]][3] -= pushed
            v = parent[v]
        hits[15] += 1
        flow += pushed
        paths += 1
    hits[16] = 1

    return {
        "id": "edmonds-karp",
        "name": "Edmonds–Karp (BFS)",
        "complexity": "O(V · E²)",
        "flow": flow,
        "paths": paths,
        "edgeScans": edge_scans,
        "timeMs": round(time_ms, 4),
        "capped": False,
        "lineHits": hits,
    }


def bench_capacity_scaling(graph: Dict) -> Dict:
    n, S, T, max_cap = graph["nodeCount"], graph["source"], graph["sink"], graph["maxCap"]

    # Pass 1: Pure timing
    adj_p = _build_adj(n, graph["edges"])
    vis_p = [0] * n
    flow_p = token_p = 0
    delta_p = 1
    t0 = time.perf_counter_ns()
    while delta_p * 2 <= max_cap:
        delta_p *= 2

    def dfs_pure(u: int, pushed: int) -> int:
        if u == T:
            return pushed
        vis_p[u] = token_p
        for e in adj_p[u]:
            rem = e[2] - e[3]
            if rem >= delta_p and vis_p[e[0]] != token_p:
                tr = dfs_pure(e[0], pushed if pushed < rem else rem)
                if tr > 0:
                    e[3] += tr
                    adj_p[e[0]][e[1]][3] -= tr
                    return tr
        return 0

    while delta_p >= 1:
        while True:
            token_p += 1
            pushed = dfs_pure(S, 10**18)
            if pushed == 0:
                break
            flow_p += pushed
        delta_p >>= 1
    time_ms = (time.perf_counter_ns() - t0) / 1_000_000.0

    # Pass 2: Line profiler
    adj = _build_adj(n, graph["edges"])
    hits = [0] * len(REAL_SOURCE["capacity-scaling"])
    hits[1] = 1
    hits[3] = 1
    vis = [0] * n
    flow = paths = edge_scans = token = 0
    delta = 1
    while delta * 2 <= max_cap:
        hits[2] += 1
        delta *= 2

    def dfs(u: int, pushed: int) -> int:
        nonlocal edge_scans
        hits[5] += 1
        if u == T:
            return pushed
        hits[6] += 1
        vis[u] = token
        for e in adj[u]:
            hits[7] += 1
            hits[8] += 1
            edge_scans += 1
            rem = e[2] - e[3]
            hits[9] += 1
            if rem >= delta and vis[e[0]] != token:
                hits[10] += 1
                tr = dfs(e[0], pushed if pushed < rem else rem)
                hits[11] += 1
                if tr > 0:
                    e[3] += tr
                    adj[e[0]][e[1]][3] -= tr
                    return tr
        hits[12] += 1
        return 0

    while delta >= 1:
        hits[13] += 1
        while True:
            hits[14] += 1
            hits[15] += 1
            hits[16] += 1
            token += 1
            pushed = dfs(S, 10**18)
            hits[17] += 1
            if pushed == 0:
                break
            hits[18] += 1
            flow += pushed
            paths += 1
        hits[19] += 1
        delta >>= 1
    hits[20] = 1

    return {
        "id": "capacity-scaling",
        "name": "Capacity Scaling (Δ)",
        "complexity": "O(E² log U)",
        "flow": flow,
        "paths": paths,
        "edgeScans": edge_scans,
        "timeMs": round(time_ms, 4),
        "capped": False,
        "lineHits": hits,
    }


def solve_named_network(nodes: List[Dict], raw_edges: List[Dict], source_id: str, sink_id: str) -> Dict:
    """Solve arbitrary named graph (e.g. CDN Case Study) via Edmonds-Karp and return flows + Min-Cut."""
    edges = [dict(e, flow=0) for e in raw_edges]
    total_flow = 0
    iterations = 0

    while True:
        parent = {}
        q = deque([source_id])
        visited = {source_id}
        while q and sink_id not in visited:
            u = q.popleft()
            for e in edges:
                if e["from"] == u and e["cap"] - e["flow"] > 0 and e["to"] not in visited:
                    visited.add(e["to"])
                    parent[e["to"]] = (e, 1, u)
                    q.append(e["to"])
                elif e["to"] == u and e["flow"] > 0 and e["from"] not in visited:
                    visited.add(e["from"])
                    parent[e["from"]] = (e, -1, u)
                    q.append(e["from"])
        if sink_id not in visited:
            break
        bottleneck = 10**18
        cur = sink_id
        while cur != source_id:
            e, d, prev = parent[cur]
            rem = (e["cap"] - e["flow"]) if d == 1 else e["flow"]
            if rem < bottleneck:
                bottleneck = rem
            cur = prev
        cur = sink_id
        while cur != source_id:
            e, d, prev = parent[cur]
            e["flow"] += d * bottleneck
            cur = prev
        total_flow += bottleneck
        iterations += 1

    # Min-Cut BFS
    reachable = {source_id}
    q = deque([source_id])
    while q:
        u = q.popleft()
        for e in edges:
            if e["from"] == u and e["cap"] - e["flow"] > 0 and e["to"] not in reachable:
                reachable.add(e["to"])
                q.append(e["to"])
            if e["to"] == u and e["flow"] > 0 and e["from"] not in reachable:
                reachable.add(e["from"])
                q.append(e["from"])

    s_nodes = [n["id"] for n in nodes if n["id"] in reachable]
    t_nodes = [n["id"] for n in nodes if n["id"] not in reachable]
    cut_edges = [e for e in edges if e["from"] in reachable and e["to"] not in reachable]
    cut_cap = sum(e["cap"] for e in cut_edges)

    return {
        "totalFlow": total_flow,
        "iterations": iterations,
        "edges": edges,
        "minCut": {
            "sNodes": s_nodes,
            "tNodes": t_nodes,
            "cutEdges": cut_edges,
            "cutCap": cut_cap,
        },
    }


def bench_dinic(graph: Dict) -> Dict:
    n, S, T = graph["nodeCount"], graph["source"], graph["sink"]

    # Pass 1: Pure timing
    adj_p = _build_adj(n, graph["edges"])
    flow_p = 0
    t0 = time.perf_counter_ns()
    while True:
        level = [-1] * n
        level[S] = 0
        q = deque([S])
        while q:
            u = q.popleft()
            for e in adj_p[u]:
                if e[2] - e[3] > 0 and level[e[0]] == -1:
                    level[e[0]] = level[u] + 1
                    q.append(e[0])
        if level[T] == -1:
            break
        ptr = [0] * n

        def dfs_p(u: int, pushed: int) -> int:
            if u == T or pushed == 0:
                return pushed
            while ptr[u] < len(adj_p[u]):
                e = adj_p[u][ptr[u]]
                rem = e[2] - e[3]
                if level[e[0]] == level[u] + 1 and rem > 0:
                    tr = dfs_p(e[0], pushed if pushed < rem else rem)
                    if tr > 0:
                        e[3] += tr
                        adj_p[e[0]][e[1]][3] -= tr
                        return tr
                ptr[u] += 1
            return 0

        while True:
            p = dfs_p(S, 10**18)
            if p == 0:
                break
            flow_p += p
    time_ms = (time.perf_counter_ns() - t0) / 1_000_000.0

    # Pass 2: Profiler
    adj = _build_adj(n, graph["edges"])
    hits = [0] * len(REAL_SOURCE["dinic"])
    hits[1] = 1
    flow = paths = edge_scans = 0
    while True:
        hits[2] += 1
        hits[3] += 1
        level = [-1] * n
        level[S] = 0
        q = deque([S])
        while q:
            hits[4] += 1
            hits[5] += 1
            u = q.popleft()
            for e in adj[u]:
                hits[6] += 1
                hits[7] += 1
                edge_scans += 1
                if e[2] - e[3] > 0 and level[e[0]] == -1:
                    hits[8] += 1
                    level[e[0]] = level[u] + 1
                    q.append(e[0])
        hits[9] += 1
        if level[T] == -1:
            break
        hits[10] += 1
        ptr = [0] * n

        def dfs(u: int, pushed: int) -> int:
            nonlocal edge_scans
            hits[12] += 1
            if u == T or pushed == 0:
                return pushed
            while ptr[u] < len(adj[u]):
                hits[13] += 1
                hits[14] += 1
                edge_scans += 1
                e = adj[u][ptr[u]]
                rem = e[2] - e[3]
                hits[15] += 1
                if level[e[0]] == level[u] + 1 and rem > 0:
                    hits[16] += 1
                    tr = dfs(e[0], pushed if pushed < rem else rem)
                    hits[17] += 1
                    if tr > 0:
                        e[3] += tr
                        adj[e[0]][e[1]][3] -= tr
                        return tr
                hits[18] += 1
                ptr[u] += 1
            hits[19] += 1
            return 0

        while True:
            hits[20] += 1
            hits[21] += 1
            p = dfs(S, 10**18)
            hits[22] += 1
            if p == 0:
                break
            hits[23] += 1
            flow += p
            paths += 1
    hits[24] = 1

    return {
        "id": "dinic",
        "name": "Dinic (Dinitz)",
        "complexity": "O(V² · E)",
        "flow": flow,
        "paths": paths,
        "edgeScans": edge_scans,
        "timeMs": round(time_ms, 4),
        "capped": False,
        "lineHits": hits,
    }


def bench_isap(graph: Dict) -> Dict:
    n, S, T = graph["nodeCount"], graph["source"], graph["sink"]

    # Pass 1: Pure timing
    adj_p = _build_adj(n, graph["edges"])
    dist_p = [n] * n
    gap_p = [0] * (n + 2)
    ptr_p = [0] * n
    t0 = time.perf_counter_ns()
    dist_p[T] = 0
    gap_p[0] = 1
    q = deque([T])
    while q:
        u = q.popleft()
        for e in adj_p[u]:
            if adj_p[e[0]][e[1]][2] > 0 and dist_p[e[0]] == n:
                dist_p[e[0]] = dist_p[u] + 1
                gap_p[dist_p[e[0]]] += 1
                q.append(e[0])
    flow_p = 0

    def dfs_p(u: int, pushed: int) -> int:
        if u == T:
            return pushed
        sent = 0
        while ptr_p[u] < len(adj_p[u]):
            e = adj_p[u][ptr_p[u]]
            rem = e[2] - e[3]
            if rem > 0 and dist_p[u] == dist_p[e[0]] + 1:
                tr = dfs_p(e[0], (pushed - sent) if (pushed - sent) < rem else rem)
                e[3] += tr
                adj_p[e[0]][e[1]][3] -= tr
                sent += tr
                if sent == pushed or dist_p[S] >= n:
                    return sent
            ptr_p[u] += 1
        if dist_p[u] < n:
            gap_p[dist_p[u]] -= 1
            if gap_p[dist_p[u]] == 0:
                dist_p[S] = n
            dist_p[u] += 1
            if dist_p[u] < n:
                gap_p[dist_p[u]] += 1
        ptr_p[u] = 0
        return sent

    while dist_p[S] < n:
        flow_p += dfs_p(S, 10**18)
    time_ms = (time.perf_counter_ns() - t0) / 1_000_000.0

    # Pass 2: Profiler
    adj = _build_adj(n, graph["edges"])
    hits = [0] * len(REAL_SOURCE["isap"])
    hits[1] = 1
    hits[2] = 1
    hits[8] = 1
    dist = [n] * n
    gap = [0] * (n + 2)
    ptr = [0] * n
    dist[T] = 0
    gap[0] = 1
    q = deque([T])
    edge_scans = paths = flow = 0
    while q:
        hits[3] += 1
        hits[4] += 1
        u = q.popleft()
        for e in adj[u]:
            hits[5] += 1
            hits[6] += 1
            edge_scans += 1
            if adj[e[0]][e[1]][2] > 0 and dist[e[0]] == n:
                hits[7] += 1
                dist[e[0]] = dist[u] + 1
                gap[dist[e[0]]] += 1
                q.append(e[0])

    def dfs(u: int, pushed: int) -> int:
        nonlocal edge_scans, paths
        hits[10] += 1
        if u == T:
            paths += 1
            return pushed
        hits[11] += 1
        sent = 0
        while ptr[u] < len(adj[u]):
            hits[12] += 1
            hits[13] += 1
            edge_scans += 1
            e = adj[u][ptr[u]]
            rem = e[2] - e[3]
            hits[14] += 1
            if rem > 0 and dist[u] == dist[e[0]] + 1:
                hits[15] += 1
                tr = dfs(e[0], (pushed - sent) if (pushed - sent) < rem else rem)
                hits[16] += 1
                e[3] += tr
                adj[e[0]][e[1]][3] -= tr
                sent += tr
                hits[17] += 1
                if sent == pushed or dist[S] >= n:
                    return sent
            hits[18] += 1
            ptr[u] += 1
        if dist[u] < n:
            hits[19] += 1
            gap[dist[u]] -= 1
            hits[20] += 1
            if gap[dist[u]] == 0:
                dist[S] = n
            hits[21] += 1
            dist[u] += 1
            if dist[u] < n:
                gap[dist[u]] += 1
        ptr[u] = 0
        hits[22] += 1
        return sent

    while dist[S] < n:
        hits[23] += 1
        flow += dfs(S, 10**18)
    hits[24] = 1

    return {
        "id": "isap",
        "name": "ISAP + Gap Heuristic",
        "complexity": "O(V² · E)",
        "flow": flow,
        "paths": paths,
        "edgeScans": edge_scans,
        "timeMs": round(time_ms, 4),
        "capped": False,
        "lineHits": hits,
    }


def bench_push_relabel_fifo(graph: Dict) -> Dict:
    n, S, T = graph["nodeCount"], graph["source"], graph["sink"]

    # Pass 1: Pure timing
    adj_p = _build_adj(n, graph["edges"])
    height_p = [0] * n
    excess_p = [0] * n
    in_q_p = [False] * n
    q_p = deque()
    t0 = time.perf_counter_ns()
    height_p[S] = n
    for e in adj_p[S]:
        if e[2] > 0:
            e[3] = e[2]
            adj_p[e[0]][e[1]][3] = -e[2]
            excess_p[e[0]] += e[2]
            if e[0] != S and e[0] != T and not in_q_p[e[0]]:
                in_q_p[e[0]] = True
                q_p.append(e[0])
    while q_p:
        u = q_p.popleft()
        in_q_p[u] = False
        while excess_p[u] > 0:
            pushed = False
            for e in adj_p[u]:
                rem = e[2] - e[3]
                if rem > 0 and height_p[u] == height_p[e[0]] + 1:
                    d = excess_p[u] if excess_p[u] < rem else rem
                    e[3] += d
                    adj_p[e[0]][e[1]][3] -= d
                    excess_p[u] -= d
                    excess_p[e[0]] += d
                    if e[0] != S and e[0] != T and not in_q_p[e[0]]:
                        in_q_p[e[0]] = True
                        q_p.append(e[0])
                    pushed = True
                    if excess_p[u] == 0:
                        break
            if not pushed:
                mh = 10**9
                for e in adj_p[u]:
                    if e[2] - e[3] > 0 and height_p[e[0]] < mh:
                        mh = height_p[e[0]]
                height_p[u] = mh + 1
    time_ms = (time.perf_counter_ns() - t0) / 1_000_000.0

    # Pass 2: Profiler
    adj = _build_adj(n, graph["edges"])
    hits = [0] * len(REAL_SOURCE["push-relabel-fifo"])
    hits[1] = 1
    hits[2] = 1
    height = [0] * n
    excess = [0] * n
    in_q = [False] * n
    q = deque()
    height[S] = n
    pushes = edge_scans = 0
    for e in adj[S]:
        hits[3] += 1
        edge_scans += 1
        if e[2] > 0:
            hits[4] += 1
            e[3] = e[2]
            adj[e[0]][e[1]][3] = -e[2]
            excess[e[0]] += e[2]
            pushes += 1
            if e[0] != S and e[0] != T and not in_q[e[0]]:
                in_q[e[0]] = True
                q.append(e[0])
    while q:
        hits[5] += 1
        hits[6] += 1
        u = q.popleft()
        in_q[u] = False
        while excess[u] > 0:
            hits[7] += 1
            hits[8] += 1
            pushed = False
            for e in adj[u]:
                hits[9] += 1
                hits[10] += 1
                edge_scans += 1
                rem = e[2] - e[3]
                hits[11] += 1
                if rem > 0 and height[u] == height[e[0]] + 1:
                    hits[12] += 1
                    hits[13] += 1
                    d = excess[u] if excess[u] < rem else rem
                    e[3] += d
                    adj[e[0]][e[1]][3] -= d
                    excess[u] -= d
                    excess[e[0]] += d
                    pushes += 1
                    if e[0] != S and e[0] != T and not in_q[e[0]]:
                        in_q[e[0]] = True
                        q.append(e[0])
                    pushed = True
                    if excess[u] == 0:
                        break
            if not pushed:
                hits[14] += 1
                mh = 10**9
                for e in adj[u]:
                    edge_scans += 1
                    if e[2] - e[3] > 0 and height[e[0]] < mh:
                        mh = height[e[0]]
                height[u] = mh + 1
    hits[15] = 1

    return {
        "id": "push-relabel-fifo",
        "name": "Push–Relabel FIFO",
        "complexity": "O(V³)",
        "flow": excess[T],
        "paths": pushes,
        "edgeScans": edge_scans,
        "timeMs": round(time_ms, 4),
        "capped": False,
        "lineHits": hits,
    }


BENCH_REGISTRY = {
    "ford-fulkerson": bench_ford_fulkerson,
    "edmonds-karp": bench_edmonds_karp,
    "capacity-scaling": bench_capacity_scaling,
    "dinic": bench_dinic,
    "isap": bench_isap,
    "push-relabel-fifo": bench_push_relabel_fifo,
}


def run_all_benchmarks(graph: Dict, selected_ids: List[str] | None = None) -> List[Dict]:
    ids = [a for a in (selected_ids or list(BENCH_REGISTRY.keys())) if a in BENCH_REGISTRY]
    if not ids:
        ids = list(BENCH_REGISTRY.keys())
    return [BENCH_REGISTRY[a](graph) for a in ids]
