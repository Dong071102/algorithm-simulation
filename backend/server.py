"""Algorithm Simulation — Backend Server (REST API + Static Frontend Hosting)."""

from __future__ import annotations
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import json
import os
from pathlib import Path
import platform
import sys

ROOT_DIR = Path(__file__).resolve().parent.parent
FRONTEND_DIR = ROOT_DIR / "frontend"

# Allow importing backend.algorithms regardless of CWD
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from backend.algorithms.graphs import generate_graph
from backend.algorithms.maxflow import REAL_SOURCE, run_all_benchmarks, solve_named_network


class AppHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(FRONTEND_DIR), **kwargs)

    def _send_json(self, payload: dict, status: int = 200):
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(body)

    def _read_json(self) -> dict:
        length = int(self.headers.get("Content-Length", "0"))
        raw = self.rfile.read(length) if length > 0 else b"{}"
        return json.loads(raw.decode("utf-8"))

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_GET(self):
        if self.path == "/api/health":
            return self._send_json(
                {
                    "status": "ok",
                    "runtime": f"Python {platform.python_version()}",
                    "engine": "backend/algorithms/maxflow.py",
                }
            )
        return super().do_GET()

    def do_POST(self):
        try:
            if self.path == "/api/benchmark":
                req = self._read_json()
                preset = str(req.get("preset", "diamond"))
                n = max(4, min(250, int(req.get("n", 45))))
                max_cap = max(10, min(50000, int(req.get("maxCap", 1500))))
                seed = int(req.get("seed", 42))
                algos = req.get("algos", None)
                if not isinstance(algos, list):
                    algos = None

                graph = generate_graph(preset, n=n, max_cap=max_cap, seed=seed)
                results = run_all_benchmarks(graph, algos)
                return self._send_json(
                    {
                        "graph": {
                            "name": graph["name"],
                            "nodeCount": graph["nodeCount"],
                            "edgeCount": len(graph["edges"]),
                            "maxCap": graph["maxCap"],
                        },
                        "results": results,
                        "sources": REAL_SOURCE,
                        "runtime": f"Python {platform.python_version()} (Backend Server)",
                    }
                )

            if self.path == "/api/solve-cdn":
                req = self._read_json()
                nodes = req.get("nodes", [])
                edges = req.get("edges", [])
                source = req.get("source", "S")
                sink = req.get("sink", "T")
                solved = solve_named_network(nodes, edges, source, sink)
                return self._send_json(solved)

            return self._send_json({"error": "Endpoint not found"}, status=404)
        except Exception as exc:
            return self._send_json({"error": str(exc)}, status=500)


def main():
    host = os.environ.get("HOST", "0.0.0.0")
    port = int(os.environ.get("PORT", "8080"))
    server = ThreadingHTTPServer((host, port), AppHandler)
    print(f"[Algorithm Simulation] Backend + Frontend running at http://localhost:{port}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
