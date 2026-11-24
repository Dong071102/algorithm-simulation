"""Graph dataset generators for Max-Flow benchmarking."""

from __future__ import annotations
import math
from typing import Dict, List, Tuple


def _seeded_rand(seed: int):
    s = seed % 2147483647
    if s <= 0:
        s += 2147483646

    def nxt() -> float:
        nonlocal s
        s = (s * 16807) % 2147483647
        return (s - 1) / 2147483646.0

    return nxt


def generate_graph(preset: str, n: int = 45, max_cap: int = 1500, seed: int = 42) -> Dict:
    rand = _seeded_rand(seed)
    edges: List[Tuple[int, int, int]] = []

    if preset == "diamond":
        cap = max(10, int(max_cap))
        return {
            "name": f"Diamond Trap (U = {cap})",
            "nodeCount": 4,
            "source": 0,
            "sink": 3,
            "maxCap": cap,
            "edges": [
                (0, 1, cap),
                (0, 2, cap),
                (1, 2, 1),
                (1, 3, cap),
                (2, 3, cap),
            ],
        }

    if preset == "grid":
        side = max(4, min(16, round(math.sqrt(n))))
        total = side * side
        for r in range(side):
            for c in range(side):
                u = r * side + c
                if c + 1 < side:
                    edges.append((u, u + 1, 1 + int(rand() * max_cap)))
                if r + 1 < side:
                    edges.append((u, u + side, 1 + int(rand() * max_cap)))
                if r + 1 < side and c + 1 < side and rand() < 0.35:
                    edges.append((u, u + side + 1, 1 + int(rand() * max(4, max_cap // 4))))
        return {
            "name": f"Mạng lưới {side}×{side} (V={total}, E={len(edges)})",
            "nodeCount": total,
            "source": 0,
            "sink": total - 1,
            "maxCap": max_cap,
            "edges": edges,
        }

    dense = preset == "dense"
    layers = max(4, min(10, round(math.sqrt(n))))
    per_layer = max(2, (n - 2) // layers)
    node_count = 2 + layers * per_layer
    source = 0
    sink = node_count - 1

    layer_nodes: List[List[int]] = []
    idx = 1
    for _ in range(layers):
        arr = list(range(idx, idx + per_layer))
        idx += per_layer
        layer_nodes.append(arr)

    for v in layer_nodes[0]:
        edges.append((source, v, 1 + int(rand() * max_cap)))
    for u in layer_nodes[-1]:
        edges.append((u, sink, 1 + int(rand() * max_cap)))

    prob = 0.65 if dense else 0.28
    for l in range(layers - 1):
        for u in layer_nodes[l]:
            guaranteed = layer_nodes[l + 1][int(rand() * per_layer)]
            edges.append((u, guaranteed, 1 + int(rand() * max_cap)))
            for v in layer_nodes[l + 1]:
                if v != guaranteed and rand() < prob:
                    edges.append((u, v, 1 + int(rand() * max_cap)))
            for v in layer_nodes[l]:
                if v != u and rand() < (0.25 if dense else 0.10):
                    edges.append((u, v, 1 + int(rand() * max(2, max_cap // 10))))

    label = "Mạng dày (Dense)" if dense else "Mạng thưa (Sparse)"
    return {
        "name": f"{label} (V={node_count}, E={len(edges)})",
        "nodeCount": node_count,
        "source": source,
        "sink": sink,
        "maxCap": max_cap,
        "edges": edges,
    }
