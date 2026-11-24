# Algorithm Simulation — Backend + Frontend (Max-Flow & Min-Cut)

Kiến trúc tách biệt **Backend API** và **Frontend Visualization** cho khóa học & phòng lab mô phỏng thuật toán Max-Flow.

## Cấu trúc thư mục

```text
algorithm-simulation/
├── backend/
│   ├── server.py               # REST API Server + phục vụ Frontend (Port 8080)
│   └── algorithms/
│       ├── graphs.py           # Sinh dữ liệu đồ thị (Diamond Trap, Sparse, Dense, Grid)
│       └── maxflow.py          # Code thuật toán thật + đo perf_counter_ns + Line Profiler + Min-Cut
└── frontend/
    ├── index.html
    ├── styles/main.css         # Warm Paper Editorial + Dark theme + Animations
    └── src/
        ├── api/client.js       # Gọi REST API tới Backend (/api/health, /api/benchmark, /api/solve-cdn)
        ├── engine/stage.js     # Unified SVG Graph + Packet + Camera Engine
        ├── lessons/            # Ch. 1: Bài toán Max-Flow (11 thuật toán + 3 Case Study)
        └── main.js
```

## Chạy dự án (1 lệnh duy nhất cho cả Backend + Frontend)

```powershell
cd "D:\Giải thuật\DEV\algorithm-simulation"
python backend/server.py
```

Mở trình duyệt tại `http://localhost:8080`.

## API Endpoints
- `GET /api/health` — Kiểm tra trạng thái & runtime Backend.
- `POST /api/benchmark` — Sinh đồ thị, chạy code thật các thuật toán Max-Flow trên server bằng `perf_counter_ns()`, trả về thời gian (`ms`), `edgeScans`, `paths` và số lần chạy từng dòng (`lineHits`).
- `POST /api/solve-cdn` — Giải Max-Flow & Min-Cut cho Case Study CDN khi người dùng click nâng cấp cáp.
