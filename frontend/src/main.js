// ============================================================================
// Algorithm Simulation — Main Application Controller
// ============================================================================

import { MODULES, getAllReadyLessons, findLessonById } from './lessons/curriculum.js';
import { INITIAL_FF_EDGES, buildFordFulkersonLesson } from './lessons/ch1_fordFulkerson.js';
import { INITIAL_EK_NODES, INITIAL_EK_EDGES, buildEdmondsKarpLesson } from './lessons/ch1_edmondsKarp.js';
import { INITIAL_CS_NODES, INITIAL_CS_EDGES, buildCapacityScalingLesson } from './lessons/ch1_capacityScaling.js';
import { NODES_CDN, INITIAL_CDN_EDGES, buildCdnLesson } from './lessons/ch4_caseCdn.js';
import { StageEngine } from './engine/stage.js';
import { runBackendBenchmark, solveCdnOnBackend } from './api/client.js';
import { createTreeSimState, mutateTreeSim, buildInteractiveTreeStep } from './algorithms/treeSim.js';

const STORAGE_DONE = 'algosim:done';
const STORAGE_THEME = 'algosim:theme';

const BENCH_ALGOS = [
  { id: 'ford-fulkerson', label: 'Ford–Fulkerson', color: 'var(--rust)' },
  { id: 'edmonds-karp', label: 'Edmonds–Karp', color: 'var(--blue-2)' },
  { id: 'capacity-scaling', label: 'Capacity Scaling', color: 'var(--green-3)' },
  { id: 'dinic', label: 'Dinic', color: 'var(--violet-2)' },
  { id: 'isap', label: 'ISAP', color: 'var(--amber-2)' },
  { id: 'push-relabel-fifo', label: 'Push–Relabel FIFO', color: '#2a9d8f' },
];

const state = {
  lessonId: 'ford-fulkerson',
  stepIndex: 0,
  openModules: new Set(['ch1', 'ch2']),
  doneLessons: loadDone(),
  showResidual: true,
  pausedPackets: false,
  autoPlayTimer: null,
  prevMetrics: new Map(),
  // Backend status & Benchmark state
  backendRuntime: 'Đang kết nối...',
  guideTab: 'walkthrough',
  viewMode: 'stage',
  benchPreset: 'diamond',
  benchN: 45,
  benchMaxCap: 1500,
  benchSelectedAlgos: new Set(['ford-fulkerson', 'edmonds-karp', 'capacity-scaling']),
  benchLoading: false,
  benchError: null,
  benchResults: null,
  benchGraph: null,
  benchSources: {},
  benchRuntimeLabel: '',
  benchCodeTab: 'ford-fulkerson',
  // Interactive custom nodes & edges per lesson
  editMode: null, // null | 'add-node' | 'add-edge'
  edgeFromNode: null,
  customNodes: {
    'edmonds-karp': INITIAL_EK_NODES.map((n) => ({ ...n })),
    'capacity-scaling': INITIAL_CS_NODES.map((n) => ({ ...n })),
    'case-cdn': NODES_CDN.map((n) => ({ ...n })),
  },
  customEdges: {
    'ford-fulkerson': INITIAL_FF_EDGES.map((e) => ({ ...e })),
    'edmonds-karp': INITIAL_EK_EDGES.map((e) => ({ ...e })),
    'capacity-scaling': INITIAL_CS_EDGES.map((e) => ({ ...e })),
    'case-cdn': INITIAL_CDN_EDGES.map((e) => ({ ...e })),
  },
  lessonOverrides: {},
  treeSims: {},
  searchOpen: false,
  searchIndex: 0,
};

let stage = null;

function loadDone() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_DONE) || '[]');
    return new Set(Array.isArray(raw) ? raw : []);
  } catch {
    return new Set();
  }
}

function saveDone() {
  try {
    localStorage.setItem(STORAGE_DONE, JSON.stringify([...state.doneLessons]));
  } catch {}
}

function currentPair() {
  const pair = findLessonById(state.lessonId) || findLessonById('ford-fulkerson');
  if (state.lessonOverrides[pair.lesson.id]) {
    return { module: pair.module, lesson: state.lessonOverrides[pair.lesson.id] };
  }
  return pair;
}

function mountShell() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <header class="topbar">
      <div class="topbar__left">
        <div class="brand">
          <span class="brand__logo">Δ</span>
          <span>Algorithm Simulation</span>
        </div>
        <div class="crumb" id="crumb"></div>
      </div>
      <div class="topbar__right">
        <button class="btn-ghost" id="btn-bench" title="Đo thời gian chạy thật trên Backend & So sánh các thuật toán">
          <span>⚡ Benchmark & So sánh</span>
        </button>
        <button class="btn-ghost" id="btn-search" title="Tìm kiếm bài học & bước (Ctrl+K hoặc /)">
          <span>Tìm kiếm</span>
          <span class="kbd">Ctrl K</span>
        </button>
        <button class="btn-pop" id="btn-theme" title="Chuyển chế độ Sáng / Tối">
          <span id="theme-label">Tối</span>
        </button>
      </div>
    </header>

    <div class="shell" id="shell">
      <aside class="sidebar">
        <div class="progress-card">
          <div class="progress-card__head">
            <span>Tiến độ khóa học</span>
            <div style="display:flex;align-items:center;gap:6px">
              <b id="progress-text">0 / 14</b>
              <button class="progress-reset" id="btn-reset-progress" title="Đặt lại toàn bộ tiến độ học về 0">↺ Đặt lại</button>
            </div>
          </div>
          <div class="bar"><span id="progress-bar" style="width: 0%"></span></div>
        </div>
        <nav class="course" id="course-tree"></nav>
      </aside>

      <div class="splitter" id="split-left" title="Kéo để thay đổi độ rộng danh sách bài toán (Double-click để đặt lại)"></div>

      <main class="center">
        <section class="stage" id="stage-panel">
          <div class="stage__hud" id="stage-hud"></div>
          <div class="stage__tools" id="stage-tools">
            <div class="tree-ctrl" id="tree-controls" hidden>
              <input class="tree-input" id="tree-key-input" type="number" min="0" max="99" value="28" title="Nhập khóa (0..99). Với KD-Tree/R-Tree: 45 = điểm (4,5)" />
              <button class="tool" id="tool-tree-add" title="Thêm khóa vào cây">+ Thêm</button>
              <button class="tool" id="tool-tree-find" title="Tìm kiếm & tô sáng đường đi từ gốc tới khóa">🔍 Tìm</button>
              <button class="tool" id="tool-tree-del" title="Xóa khóa khỏi cây">✕ Xóa</button>
            </div>
            <button class="tool" id="tool-add-node" title="Bật chế độ click vùng trống để thêm nút mới">+ Nút</button>
            <button class="tool" id="tool-add-edge" title="Bật chế độ click nút nguồn → nút đích để nối cạnh">+ Cạnh</button>
            <button class="tool" id="tool-delete" title="Bật chế độ click nút (trừ S, T) hoặc cạnh để xóa">✕ Xóa</button>
            <button class="tool is-active" id="tool-residual" title="Bật/tắt cạnh ngược thặng dư (R)">Residual</button>
            <button class="tool" id="tool-pause" title="Tạm dừng/Chạy dòng packet">Pause</button>
            <button class="tool" id="tool-fit" title="Canh giữa khung hình (F)">Fit</button>
            <button class="tool" id="tool-reset-graph" hidden title="Khôi phục đồ thị ban đầu">Reset</button>
          </div>
          <div class="stage__canvas" id="stage-canvas"></div>
          <div class="stage__banner" id="stage-banner" hidden></div>
          <div class="stage__legend" id="stage-legend"></div>
        </section>

        <section class="timeline" id="timeline-panel">
          <div class="timeline__head">
            <div>
              <span class="timeline__label" id="tl-label"></span>
              <span class="timeline__count" id="tl-count"></span>
            </div>
            <div class="timeline__controls">
              <button class="btn-ghost" id="btn-autoplay" title="Tự động chuyển bước (Space)">▶ Tự chạy</button>
            </div>
          </div>
          <div class="timeline__track" id="tl-track"></div>
        </section>

        <section class="bench" id="bench-panel" hidden></section>
      </main>

      <div class="splitter" id="split-right" title="Kéo để thay đổi độ rộng bảng mô phỏng (Double-click để đặt lại)"></div>

      <aside class="guide">
        <div class="guide__tabs">
          <button class="guide__tab is-active" data-guide-tab="walkthrough">Mô phỏng từng bước</button>
          <button class="guide__tab" data-guide-tab="complexity">Cách tính Độ phức tạp</button>
        </div>
        <div class="guide__body">
          <div class="guide__content" id="guide-content"></div>
        </div>
        <div class="guide__nav">
          <button class="btn-pop" id="btn-prev">← Trước</button>
          <span class="timeline__count" id="nav-step-hint"></span>
          <button class="btn-pop btn-pop--primary" id="btn-next">Tiếp theo →</button>
        </div>
      </aside>
    </div>

    <div class="sx" id="search-modal" hidden>
      <div class="sx__backdrop" id="sx-backdrop"></div>
      <div class="sx__dialog" role="dialog" aria-label="Tìm kiếm">
        <div class="sx__bar">
          <input class="sx__input" id="sx-input" type="text" placeholder="Tìm thuật toán, khái niệm, bước (vd: Min-Cut, BFS, Scale)..." autocomplete="off" />
          <span class="kbd">ESC</span>
        </div>
        <div class="sx__list" id="sx-list"></div>
      </div>
    </div>

    <div class="sx" id="bench-help-modal" hidden>
      <div class="sx__backdrop" id="help-backdrop"></div>
      <div class="sx__dialog help-dialog" role="dialog" aria-label="Hướng dẫn đọc Benchmark">
        <div class="help-head">
          <h3>? Hướng dẫn đọc kết quả Benchmark &amp; Profiler</h3>
          <button class="btn-ghost" id="help-close">Đóng (ESC)</button>
        </div>
        <div class="help-body">
          <div class="help-section">
            <h4>1. Chọn bộ dữ liệu thử thách (Đầu vào)</h4>
            <ul>
              <li><b>Diamond Trap:</b> Đồ thị 4 đỉnh kinh điển có cạnh giữa = <code>1</code>, 4 cạnh ngoài = <code>U</code> — dùng để phơi bày trường hợp xấu nhất của <b>Ford–Fulkerson</b>.</li>
              <li><b>Mạng thưa / Mạng dày / Mạng lưới 2D:</b> Các dạng đồ thị thực tế để so sánh hiệu năng khi số đỉnh <code>V</code> và sức chứa <code>U</code> tăng lên.</li>
            </ul>
          </div>

          <div class="help-section">
            <h4>2. Cách đọc 4 khung kết quả</h4>
            <ul>
              <li><b>Thời gian thực thi (ms):</b> Đo trực tiếp trên Backend bằng đồng hồ nano-giây (<code>perf_counter_ns</code>) trên code thuần. Thanh càng ngắn = càng nhanh.</li>
              <li><b>Số lần duyệt cạnh (Edge Scans):</b> Số lượt thuật toán kiểm tra cạnh trong vòng lặp — con số ổn định tuyệt đối, phản ánh đúng độ phức tạp <b>Big-O</b>.</li>
              <li><b>Bảng tổng hợp:</b> Cột <code>Max Flow</code> của cả 3 thuật toán phải bằng nhau (kiểm chứng giải đúng); cột <code>Đường tăng</code> cho biết số lần lặp đẩy luồng.</li>
              <li><b>Profiler trên Code Thật (<code>×</code>):</b> Số lần từng dòng code thực sự được CPU thực thi. Dòng tô <b style="color:var(--amber-ink)">vàng</b> / <b style="color:var(--rust-ink)">đỏ</b> là <b>nút cổ chai</b> gây chậm thuật toán.</li>
            </ul>
          </div>

          <div class="callout callout--insight">
            <div class="callout__title">2 thí nghiệm nên thử ngay</div>
            <div>
              • <b>Thử 1:</b> Chọn <code>Diamond Trap</code>, kéo <code>U = 3000</code> → Ford–Fulkerson tốn <b>6.000 đường tăng</b>, còn Edmonds–Karp và Capacity Scaling chỉ mất <b>2 đường</b>.<br />
              • <b>Thử 2:</b> Chọn <code>Mạng dày</code> hoặc <code>Mạng lưới 2D</code>, kéo <code>V = 120</code> → đối chiếu lượt duyệt cạnh giữa Edmonds–Karp và Capacity Scaling.
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  stage = new StageEngine(document.getElementById('stage-canvas'), {
    onEdgeClick: handleEdgeClick,
    onNodeClick: handleNodeClick,
    onCanvasClick: handleCanvasClick,
  });

  bindEvents();
  bindSplitters();
  syncThemeButton();
  readHash();
  renderAll({ animateCam: true });
}

function bindSplitters() {
  const shell = document.getElementById('shell');
  const leftEl = document.getElementById('split-left');
  const rightEl = document.getElementById('split-right');
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  // Restore saved panel widths
  try {
    const sw = Number(localStorage.getItem('algosim:sidebar-w'));
    const gw = Number(localStorage.getItem('algosim:guide-w'));
    if (sw >= 190 && sw <= 460) shell.style.setProperty('--sidebar-w', `${sw}px`);
    if (gw >= 280 && gw <= 680) shell.style.setProperty('--guide-w', `${gw}px`);
  } catch {}

  const setup = (handle, { cssVar, storageKey, min, max, defaultPx, fromRight = false }) => {
    handle.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      handle.classList.add('is-dragging');
      document.body.classList.add('is-resizing');
      handle.setPointerCapture(e.pointerId);

      const onMove = (ev) => {
        const rect = shell.getBoundingClientRect();
        const raw = fromRight ? rect.right - ev.clientX : ev.clientX - rect.left;
        const px = Math.round(clamp(raw, min, Math.min(max, rect.width - 360)));
        shell.style.setProperty(cssVar, `${px}px`);
        try { localStorage.setItem(storageKey, String(px)); } catch {}
      };
      const onUp = () => {
        handle.classList.remove('is-dragging');
        document.body.classList.remove('is-resizing');
        handle.removeEventListener('pointermove', onMove);
        handle.removeEventListener('pointerup', onUp);
        handle.removeEventListener('pointercancel', onUp);
      };
      handle.addEventListener('pointermove', onMove);
      handle.addEventListener('pointerup', onUp);
      handle.addEventListener('pointercancel', onUp);
    });

    handle.addEventListener('dblclick', () => {
      shell.style.setProperty(cssVar, `${defaultPx}px`);
      try { localStorage.removeItem(storageKey); } catch {}
    });
  };

  setup(leftEl, { cssVar: '--sidebar-w', storageKey: 'algosim:sidebar-w', min: 190, max: 460, defaultPx: 272 });
  setup(rightEl, { cssVar: '--guide-w', storageKey: 'algosim:guide-w', min: 280, max: 680, defaultPx: 390, fromRight: true });
}

async function rebuildCurrentDynamicLesson(note = null) {
  const lid = state.lessonId;
  const nodes = state.customNodes[lid];
  const edges = state.customEdges[lid];
  if (lid === 'edmonds-karp') {
    state.lessonOverrides[lid] = buildEdmondsKarpLesson(nodes, edges);
  } else if (lid === 'capacity-scaling') {
    state.lessonOverrides[lid] = buildCapacityScalingLesson(nodes, edges);
  } else if (lid === 'case-cdn') {
    let solved = null;
    try {
      solved = await solveCdnOnBackend({ nodes, edges, source: 'S', sink: 'T' });
    } catch {
      solved = null;
    }
    state.lessonOverrides[lid] = buildCdnLesson(edges, note, solved, nodes);
  }
  renderStep({ animateCam: false });
}

function getEditBannerText() {
  if (state.editMode === 'add-node') {
    return '➕ Thêm nút: Click vùng trống trên sân khấu để đặt nút mới (sau đó bấm "+ Cạnh" để nối điểm tới điểm)';
  }
  if (state.editMode === 'add-edge') {
    return state.edgeFromNode
      ? `🔗 Đã chọn điểm nguồn [${state.edgeFromNode}] — click điểm đích (v) để nối cạnh ${state.edgeFromNode} → v`
      : '🔗 Nối cạnh: Click điểm nguồn (u), rồi click điểm đích (v) để tạo cạnh u → v';
  }
  if (state.editMode === 'delete') {
    return '✕ Chế độ Xóa: Click vào nút bất kỳ (trừ S, T) hoặc click vào cạnh để xóa khỏi đồ thị';
  }
  return null;
}

function setEditMode(mode) {
  state.editMode = state.editMode === mode ? null : mode;
  state.edgeFromNode = null;
  document.getElementById('tool-add-node').classList.toggle('is-active', state.editMode === 'add-node');
  document.getElementById('tool-add-edge').classList.toggle('is-active', state.editMode === 'add-edge');
  document.getElementById('tool-delete').classList.toggle('is-active', state.editMode === 'delete');
  const canvas = document.getElementById('stage-canvas');
  canvas.style.cursor = state.editMode === 'add-node' ? 'crosshair' : state.editMode === 'delete' ? 'not-allowed' : '';
  renderStep({ animateCam: false });
}

async function handleCanvasClick(x, y) {
  if (state.editMode !== 'add-node') return;
  const lid = state.lessonId;
  const nodes = state.customNodes[lid];
  const edges = state.customEdges[lid];
  if (!nodes || !edges) return;

  // Pick next unused N1, N2, N3...
  let idx = 1;
  while (nodes.some((n) => n.id === `N${idx}`)) idx++;
  const newId = `N${idx}`;
  nodes.push({
    id: newId,
    label: newId,
    sub: lid === 'case-cdn' ? `PoP ${idx}` : `Nút ${idx}`,
    x,
    y,
  });

  await rebuildCurrentDynamicLesson(
    `<b>Đã đặt nút mới ${newId}</b> — bật <b>+ Cạnh</b> để chọn điểm nối tới <code>${newId}</code> hoặc từ <code>${newId}</code> đi!`
  );
}

async function handleNodeClick(nodeId) {
  const lid = state.lessonId;
  const nodes = state.customNodes[lid];
  const edges = state.customEdges[lid];
  if (!nodes || !edges) return;

  // Delete node mode
  if (state.editMode === 'delete') {
    if (nodeId === 'S' || nodeId === 'T') {
      const banner = document.getElementById('stage-banner');
      banner.textContent = '⚠ Không thể xóa nút Nguồn (S) hoặc Đích (T)!';
      banner.hidden = false;
      return;
    }
    state.customNodes[lid] = nodes.filter((n) => n.id !== nodeId);
    state.customEdges[lid] = edges.filter((e) => e.from !== nodeId && e.to !== nodeId);
    await rebuildCurrentDynamicLesson(`<b>Đã xóa nút ${nodeId}</b> cùng toàn bộ cạnh nối với nó và tính lại Max-Flow.`);
    return;
  }

  // Add edge mode (point-to-point)
  if (state.editMode !== 'add-edge') return;

  if (!state.edgeFromNode) {
    state.edgeFromNode = nodeId;
    renderStep({ animateCam: false });
    return;
  }

  const u = state.edgeFromNode;
  const v = nodeId;
  state.edgeFromNode = null;
  if (u === v) {
    renderStep({ animateCam: false });
    return;
  }

  const existing = edges.find((e) => e.from === u && e.to === v);
  const defaultCap = lid === 'capacity-scaling' ? 8 : 6;
  if (existing) {
    existing.cap += 1;
  } else {
    edges.push({ id: `${u}-${v}-${Date.now()}`, from: u, to: v, cap: defaultCap });
  }

  await rebuildCurrentDynamicLesson(`<b>Đã nối cạnh ${u} → ${v}</b> (sức chứa ${existing ? existing.cap : defaultCap}) và tính lại Max-Flow!`);
}

async function handleEdgeClick(edgeId, ev = null) {
  const lid = state.lessonId;
  const list = state.customEdges[lid];
  if (!list) return;

  // Delete edge mode
  if (state.editMode === 'delete') {
    const removed = list.find((e) => e.id === edgeId);
    state.customEdges[lid] = list.filter((e) => e.id !== edgeId);
    await rebuildCurrentDynamicLesson(
      removed ? `<b>Đã xóa cạnh ${removed.from} → ${removed.to}</b> và tính lại Max-Flow.` : null
    );
    return;
  }

  const target = list.find((e) => e.id === edgeId);
  if (!target) return;

  const isDec = ev && ev.shiftKey;
  const stepDelta = isDec ? -1 : 1;

  if (lid === 'ford-fulkerson') {
    target.cap = Math.max(1, target.cap + stepDelta);
    state.lessonOverrides[lid] = buildFordFulkersonLesson(list);
    renderStep({ animateCam: false });
    return;
  }

  if (lid === 'edmonds-karp') {
    target.cap = Math.max(1, target.cap + stepDelta);
    await rebuildCurrentDynamicLesson();
    return;
  }

  if (lid === 'capacity-scaling') {
    target.cap = Math.max(1, target.cap + stepDelta);
    await rebuildCurrentDynamicLesson();
    return;
  }

  if (lid === 'case-cdn') {
    const prevLesson = currentPair().lesson;
    const prevFlow = Number(prevLesson.steps[2].metrics[0].value.replace(/\D/g, ''));

    target.cap = Math.max(1, target.cap + stepDelta);
    const nodes = state.customNodes[lid];
    let solved = null;
    try {
      solved = await solveCdnOnBackend({ nodes, edges: list, source: 'S', sink: 'T' });
    } catch {
      solved = null;
    }

    const nextLesson = buildCdnLesson(list, null, solved, nodes);
    const nextFlow = Number(nextLesson.steps[2].metrics[0].value.replace(/\D/g, ''));
    const gained = nextFlow - prevFlow;

    const sign = isDec ? '-1G' : '+1G';
    const note =
      gained !== 0
        ? `<b>[Backend API] Thay đổi ${target.from}→${target.to} (${sign}):</b> Tổng băng thông đổi <b>${gained > 0 ? '+' : ''}${gained} Gbps</b> (${prevFlow} → ${nextFlow} Gbps) vì tuyến này thuộc <b>Min-Cut</b>!`
        : `<b>[Backend API] Thay đổi ${target.from}→${target.to} (${sign}):</b> Tổng băng thông <b>KHÔNG ĐỔI (${nextFlow} Gbps)</b> vì tuyến này <b>KHÔNG</b> thuộc lát cắt nghẽn Min-Cut!`;

    state.lessonOverrides[lid] = buildCdnLesson(list, note, solved, nodes);
    renderStep({ animateCam: false });
  }
}

function renderSidebar() {
  const ready = getAllReadyLessons();
  const doneCount = ready.filter((l) => state.doneLessons.has(l.id)).length;
  document.getElementById('progress-text').textContent = `${doneCount} / ${ready.length} bài`;
  document.getElementById('progress-bar').style.width = `${Math.round((doneCount / Math.max(1, ready.length)) * 100)}%`;

  const nav = document.getElementById('course-tree');
  nav.innerHTML = MODULES.map((mod) => {
    const isOpen = state.openModules.has(mod.id);
    const items = mod.lessons
      .map((l) => {
        if (l.group) {
          return `<div class="lesson-group">${escapeHtml(l.group)}</div>`;
        }
        const isCurrent = l.id === state.lessonId;
        const isDone = state.doneLessons.has(l.id);
        return `
          <button class="lesson ${isCurrent ? 'is-current' : ''} ${l.soon ? 'is-soon' : ''}"
                  data-lesson="${l.id}" ${l.soon ? 'disabled' : ''}>
            <span class="lesson__mark ${isDone ? 'is-done' : ''}" data-toggle-done="${l.id}" title="Click để đánh dấu / bỏ đánh dấu đã học">${isDone ? '✓' : ''}</span>
            <span>${l.title}</span>
            <span class="lesson__badge">${l.soon ? 'Sắp có' : l.complexity}</span>
          </button>
        `;
      })
      .join('');
    return `
      <div class="mod ${isOpen ? 'is-open' : ''}" data-mod="${mod.id}">
        <button class="mod__head" data-toggle-mod="${mod.id}">
          <span class="mod__title-wrap">
            <span class="mod__dot" style="background:${mod.color}"></span>
            <span class="mod__title">${mod.title}</span>
          </span>
          <span class="mod__chev">▶</span>
        </button>
        <div class="mod__clip">
          <div class="mod__lessons">${items}</div>
        </div>
      </div>
    `;
  }).join('');
}

function renderHud(metrics = []) {
  const hud = document.getElementById('stage-hud');
  hud.innerHTML = '';
  for (const m of metrics) {
    const prevVal = state.prevMetrics.get(m.id);
    const changed = prevVal !== undefined && prevVal !== m.value;
    state.prevMetrics.set(m.id, m.value);

    const chip = document.createElement('div');
    chip.className = `chip${changed ? ' is-changed' : ''}`;
    chip.dataset.level = m.level || 'normal';
    chip.innerHTML = `
      <span class="chip__label">${m.label}</span>
      <span class="chip__value${changed ? ' is-swap' : ''}">${m.value}</span>
    `;
    hud.appendChild(chip);
  }
}

function renderLegend(legend = []) {
  const el = document.getElementById('stage-legend');
  el.innerHTML = legend
    .map((item) => {
      if (item.type === 'line') {
        const style = item.dashed
          ? `border-top: 2px dashed ${item.color}; height: 0`
          : `background: ${item.color}`;
        return `<span class="lg"><span class="lg__line" style="${style}"></span>${item.label}</span>`;
      }
      return `<span class="lg"><span class="lg__dot" style="background:${item.color}"></span>${item.label}</span>`;
    })
    .join('');
}

function renderGuide(lesson, step) {
  const box = document.getElementById('guide-content');

  // Trigger clean guide-in animation on swap
  box.style.animation = 'none';
  void box.offsetWidth;
  box.style.animation = '';

  document.querySelectorAll('[data-guide-tab]').forEach((btn) => {
    btn.classList.toggle('is-active', btn.dataset.guideTab === state.guideTab);
  });

  if (state.guideTab === 'complexity') {
    const ca = lesson.complexityAnalysis;
    if (!ca) {
      box.innerHTML = `<p class="guide__prose">Bài học này chưa có bảng phân tích độ phức tạp.</p>`;
      return;
    }
    box.innerHTML = `
      <span class="chapter-pill chapter-pill--violet">Phân tích Độ phức tạp</span>
      <h1 class="guide__title">${escapeHtml(lesson.title)}</h1>
      <div class="proof-summary">
        <div class="proof-stat">
          <div class="proof-stat__label">Thời gian (Time)</div>
          <div class="proof-stat__val">${escapeHtml(ca.time)}</div>
        </div>
        <div class="proof-stat">
          <div class="proof-stat__label">Bộ nhớ (Space)</div>
          <div class="proof-stat__val">${escapeHtml(ca.space)}</div>
        </div>
      </div>
      <div class="callout callout--insight">
        <div class="callout__title">Phân loại độ phức tạp</div>
        <div>${escapeHtml(ca.classType)}</div>
      </div>
      <div class="eyebrow">Cách tính & Chứng minh từng bước</div>
      ${ca.derivation
        .map(
          (d) => `
          <div class="proof-step">
            <div class="proof-step__head">
              <span>${escapeHtml(d.step)}</span>
              <span class="proof-step__formula">${escapeHtml(d.formula)}</span>
            </div>
            <div class="proof-step__note">${escapeHtml(d.note)}</div>
          </div>`
        )
        .join('')}
      <div class="callout callout--warn">
        <div class="callout__title">Trường hợp xấu nhất (Worst-Case)</div>
        <div>${escapeHtml(ca.worstCase)}</div>
      </div>
      ${
        ca.vsOthers && ca.vsOthers.length
          ? `
            <div class="changes">
              <div class="eyebrow">So sánh với thuật toán khác</div>
              <ul>
                ${ca.vsOthers
                  .map(
                    (o) => `<li class="chg chg--add"><b>⇄</b><span><b>${escapeHtml(o.algo)}:</b> ${escapeHtml(o.diff)}</span></li>`
                  )
                  .join('')}
              </ul>
            </div>`
          : ''
      }
      <button class="btn-pop btn-pop--primary" id="btn-open-bench-from-guide">⚡ Mở Benchmark chạy đo thời gian thật →</button>
    `;
    const jump = document.getElementById('btn-open-bench-from-guide');
    if (jump) jump.addEventListener('click', () => setViewMode('bench'));
    return;
  }

  const activeSet = new Set(step.activeLines || []);

  const codeHtml = lesson.pseudocode
    ? `
      <div class="code-box">
        <div class="code-box__head">
          <span>Code thật (JS)</span>
          <span>${lesson.complexity}</span>
        </div>
        <div class="code-lines">
          ${lesson.pseudocode
            .map(
              (line, i) => `
              <div class="code-line ${activeSet.has(i + 1) ? 'is-active' : ''}">
                <span class="code-line__num">${i + 1}</span>
                <span>${escapeHtml(line)}</span>
              </div>`
            )
            .join('')}
        </div>
      </div>`
    : '';

  const changesHtml =
    step.changes && step.changes.length
      ? `
        <div class="changes">
          <div class="eyebrow">Thay đổi ở bước này</div>
          <ul>
            ${step.changes
              .map((c) => {
                const sym = c[0];
                const cls = sym === '+' ? 'chg--add' : sym === '-' ? 'chg--del' : 'chg--mod';
                return `<li class="chg ${cls}"><b>${sym}</b><span>${escapeHtml(c.slice(2))}</span></li>`;
              })
              .join('')}
          </ul>
        </div>`
      : '';

  const calloutHtml = step.callout
    ? `
      <div class="callout callout--${step.callout.kind || 'insight'}">
        <div class="callout__title">${escapeHtml(step.callout.title)}</div>
        <div>${step.callout.text}</div>
      </div>`
    : '';

  const compareHtml = step.compare
    ? `
      <table class="compare">
        <thead>
          <tr>${step.compare.headers.map((h) => `<th>${escapeHtml(h)}</th>`).join('')}</tr>
        </thead>
        <tbody>
          ${step.compare.rows.map((r) => `<tr>${r.map((c) => `<td>${escapeHtml(c)}</td>`).join('')}</tr>`).join('')}
        </tbody>
      </table>`
    : '';

  const pillClass =
    step.callout && step.callout.kind === 'warn'
      ? 'chapter-pill chapter-pill--warn'
      : lesson.id === 'capacity-scaling'
      ? 'chapter-pill chapter-pill--violet'
      : 'chapter-pill';

  box.innerHTML = `
    <span class="${pillClass}">${escapeHtml(step.tag || lesson.title)}</span>
    <h1 class="guide__title">${escapeHtml(step.title)}</h1>
    <div class="guide__prose">
      ${step.body.map((p) => `<p>${p}</p>`).join('')}
    </div>
    ${codeHtml}
    ${changesHtml}
    ${compareHtml}
    ${calloutHtml}
  `;
}

// ============================================================================
// Live Benchmark & Algorithm Comparison View
// ============================================================================
function setViewMode(mode) {
  state.viewMode = mode;
  const isBench = mode === 'bench';
  document.getElementById('stage-panel').hidden = isBench;
  document.getElementById('timeline-panel').hidden = isBench;
  document.getElementById('bench-panel').hidden = !isBench;
  const btn = document.getElementById('btn-bench');
  btn.classList.toggle('is-active', isBench);
  btn.innerHTML = isBench ? '<span>← Quay lại Sân khấu</span>' : '<span>⚡ Benchmark & So sánh</span>';

  if (isBench) {
    if (!state.benchResults) runBenchmarkNow();
    else renderBenchmarkPanel();
  }
}

async function runBenchmarkNow() {
  state.benchLoading = true;
  state.benchError = null;
  renderBenchmarkPanel();
  try {
    const selected = BENCH_ALGOS.map((a) => a.id).filter((id) => state.benchSelectedAlgos.has(id));
    const data = await runBackendBenchmark({
      preset: state.benchPreset,
      n: state.benchN,
      maxCap: state.benchMaxCap,
      seed: 42,
      algos: selected,
    });
    state.benchGraph = data.graph;
    state.benchResults = data.results;
    state.benchSources = data.sources || {};
    state.benchRuntimeLabel = data.runtime || state.backendRuntime;
    if (state.benchResults.length && !state.benchResults.some((r) => r.id === state.benchCodeTab)) {
      state.benchCodeTab = state.benchResults[0].id;
    }
  } catch (err) {
    state.benchError = err.message || 'Không thể kết nối Backend API /api/benchmark';
  } finally {
    state.benchLoading = false;
    renderBenchmarkPanel();
  }
}

function renderBenchmarkPanel() {
  const panel = document.getElementById('bench-panel');
  const g = state.benchGraph;
  const res = state.benchResults || [];
  const maxTime = Math.max(0.01, ...res.map((r) => r.timeMs));
  const maxScans = Math.max(1, ...res.map((r) => r.edgeScans));

  const barClass = (id) =>
    id === 'ford-fulkerson'
      ? 'bench-fill--ff'
      : id === 'edmonds-karp'
      ? 'bench-fill--ek'
      : id === 'capacity-scaling'
      ? 'bench-fill--cs'
      : id === 'dinic'
      ? 'bench-fill--dinic'
      : id === 'isap'
      ? 'bench-fill--isap'
      : 'bench-fill--pr';

  const statusLine = state.benchLoading
    ? 'Đang gửi POST /api/benchmark và chạy code thật trên Backend...'
    : state.benchError
    ? `<span style="color:var(--rust-2)">Lỗi: ${escapeHtml(state.benchError)}</span>`
    : g
    ? `Thực thi trên <b>${escapeHtml(state.benchRuntimeLabel)}</b> · Đồ thị: <b style="color:var(--ink)">${escapeHtml(g.name)}</b> · V=${g.nodeCount} · E=${g.edgeCount} · U=${g.maxCap}`
    : 'Nhấn Chạy Benchmark để đo trên Backend.';

  panel.innerHTML = `
    <div class="bench-card">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap">
        <div>
          <span class="chapter-pill chapter-pill--violet">Backend Live Benchmark (POST /api/benchmark)</span>
          <h2 style="font-size:16px;margin-top:6px">Đo thời gian chạy thật trên Server &amp; So sánh trực diện</h2>
        </div>
        <div style="display:flex;gap:8px;align-items:center">
          <button class="btn-ghost" id="bench-help-btn" title="Mở hướng dẫn cách đọc các chỉ số Benchmark">? Hướng dẫn đọc</button>
          <button class="btn-pop btn-pop--primary" id="bench-run" ${state.benchLoading ? 'disabled' : ''}>${state.benchLoading ? '⏳ Đang chạy...' : '▶ Chạy Benchmark lại'}</button>
        </div>
      </div>

      <div class="bench-controls">
        <label class="bench-field">
          <span>Bộ dữ liệu đồ thị</span>
          <select class="bench-select" id="bench-preset">
            <option value="diamond" ${state.benchPreset === 'diamond' ? 'selected' : ''}>Diamond Trap (Worst-case FF)</option>
            <option value="sparse" ${state.benchPreset === 'sparse' ? 'selected' : ''}>Mạng thưa (Sparse DAG)</option>
            <option value="dense" ${state.benchPreset === 'dense' ? 'selected' : ''}>Mạng dày (Dense Network)</option>
            <option value="grid" ${state.benchPreset === 'grid' ? 'selected' : ''}>Mạng lưới (Grid 2D)</option>
          </select>
        </label>

        <label class="bench-field" ${state.benchPreset === 'diamond' ? 'style="opacity:0.45"' : ''}>
          <span>Số đỉnh V ≈ <b>${state.benchN}</b></span>
          <input type="range" id="bench-n" min="16" max="160" step="4" value="${state.benchN}" ${state.benchPreset === 'diamond' ? 'disabled' : ''} />
        </label>

        <label class="bench-field">
          <span>Sức chứa tối đa U = <b>${state.benchMaxCap}</b></span>
          <input type="range" id="bench-cap" min="100" max="5000" step="100" value="${state.benchMaxCap}" />
        </label>
      </div>

      <div style="display:flex;flex-direction:column;gap:6px">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:8px">
          <span style="font-size:11px;color:var(--muted)">Chọn thuật toán cần so sánh (<b>${state.benchSelectedAlgos.size}/${BENCH_ALGOS.length}</b>):</span>
          <button class="progress-reset" id="bench-select-all">${state.benchSelectedAlgos.size === BENCH_ALGOS.length ? 'Chỉ giữ 3 bài đầu' : 'Chọn tất cả'}</button>
        </div>
        <div class="prof-tabs">
          ${BENCH_ALGOS.map((a) => {
            const on = state.benchSelectedAlgos.has(a.id);
            return `<button class="btn-ghost ${on ? 'is-active' : ''}" data-bench-algo="${a.id}" style="gap:6px">
              <span class="lg__dot" style="background:${a.color};opacity:${on ? 1 : 0.35}"></span>
              <span>${escapeHtml(a.label)}</span>
            </button>`;
          }).join('')}
        </div>
      </div>

      <div style="font-size:11.5px;color:var(--muted)">${statusLine}</div>
    </div>

    ${
      res.length
        ? `
    <div class="bench-card">
      <div class="eyebrow">1. Thời gian thực thi thật trên Backend (ms — đo bằng perf_counter_ns)</div>
      <div class="bench-bars">
        ${res
          .map((r) => {
            const pct = Math.max(4, Math.round((r.timeMs / maxTime) * 100));
            return `
              <div class="bench-row">
                <div class="bench-row__head">
                  <span class="bench-row__name">${escapeHtml(r.name)} <span class="bench-row__meta">(${escapeHtml(r.complexity)})</span></span>
                  <span><b>${r.timeMs.toFixed(4)} ms</b>${r.capped ? ' · <span style="color:var(--rust-2)">Chạm ngưỡng cắt!</span>' : ''}</span>
                </div>
                <div class="bench-track"><div class="bench-fill ${barClass(r.id)}" style="width:${pct}%"></div></div>
              </div>`;
          })
          .join('')}
      </div>
    </div>

    <div class="bench-card">
      <div class="eyebrow">2. Số lần duyệt cạnh (Edge Scans — phản ánh chính xác Big-O)</div>
      <div class="bench-bars">
        ${res
          .map((r) => {
            const pct = Math.max(4, Math.round((r.edgeScans / maxScans) * 100));
            return `
              <div class="bench-row">
                <div class="bench-row__head">
                  <span class="bench-row__name">${escapeHtml(r.name)}</span>
                  <span><b>${r.edgeScans.toLocaleString('vi-VN')}</b> lượt duyệt · ${r.paths.toLocaleString('vi-VN')} đường tăng</span>
                </div>
                <div class="bench-track"><div class="bench-fill ${barClass(r.id)}" style="width:${pct}%"></div></div>
              </div>`;
          })
          .join('')}
      </div>
    </div>

    <div class="bench-card">
      <div class="eyebrow">3. Bảng tổng hợp & Kiểm chứng kết quả</div>
      <table class="compare">
        <thead>
          <tr>
            <th>Thuật toán</th>
            <th>Độ phức tạp</th>
            <th>Max Flow</th>
            <th>Đường tăng</th>
            <th>Duyệt cạnh</th>
            <th>Thời gian (Server)</th>
          </tr>
        </thead>
        <tbody>
          ${res
            .map(
              (r) => `
              <tr>
                <td><b>${escapeHtml(r.name)}</b></td>
                <td>${escapeHtml(r.complexity)}</td>
                <td>${r.flow.toLocaleString('vi-VN')}${r.capped ? '+' : ''}</td>
                <td>${r.paths.toLocaleString('vi-VN')}</td>
                <td>${r.edgeScans.toLocaleString('vi-VN')}</td>
                <td><b>${r.timeMs.toFixed(4)} ms</b></td>
              </tr>`
            )
            .join('')}
        </tbody>
      </table>
    </div>

    <div class="bench-card">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap">
        <div class="eyebrow" style="margin:0">4. Profiler trên Code Thật Backend (backend/algorithms/maxflow.py)</div>
        <div class="prof-tabs">
          ${res
            .map(
              (r) =>
                `<button class="btn-ghost ${state.benchCodeTab === r.id ? 'is-active' : ''}" data-prof-tab="${r.id}">${escapeHtml(r.name)}</button>`
            )
            .join('')}
        </div>
      </div>
      ${(() => {
        const active = res.find((r) => r.id === state.benchCodeTab) || res[0];
        if (!active) return '';
        const src = state.benchSources[active.id] || [];
        const hits = active.lineHits || [];
        const maxHit = Math.max(1, ...hits);
        return `
          <div class="prof-code">
            ${src
              .map((line, idx) => {
                const h = hits[idx] || 0;
                const ratio = h / maxHit;
                const cls = h === 0 ? '' : ratio > 0.55 ? 'is-hot' : ratio > 0.1 ? 'is-warm' : '';
                return `
                  <div class="prof-line">
                    <span class="prof-hits ${cls}">${h > 0 ? h.toLocaleString('vi-VN') + '×' : ''}</span>
                    <span class="code-line__num">${idx + 1}</span>
                    <span>${escapeHtml(line)}</span>
                  </div>`;
              })
              .join('')}
          </div>`;
      })()}
    </div>`
        : ''
    }
  `;

  document.getElementById('bench-run').addEventListener('click', runBenchmarkNow);
  document.getElementById('bench-help-btn').addEventListener('click', () => {
    document.getElementById('bench-help-modal').hidden = false;
  });
  document.getElementById('bench-select-all').addEventListener('click', () => {
    if (state.benchSelectedAlgos.size === BENCH_ALGOS.length) {
      state.benchSelectedAlgos = new Set(['ford-fulkerson', 'edmonds-karp', 'capacity-scaling']);
    } else {
      state.benchSelectedAlgos = new Set(BENCH_ALGOS.map((a) => a.id));
    }
    runBenchmarkNow();
  });
  document.querySelectorAll('[data-bench-algo]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.benchAlgo;
      if (state.benchSelectedAlgos.has(id)) {
        if (state.benchSelectedAlgos.size <= 1) return; // giữ ít nhất 1 thuật toán
        state.benchSelectedAlgos.delete(id);
      } else {
        state.benchSelectedAlgos.add(id);
      }
      runBenchmarkNow();
    });
  });
  document.querySelectorAll('[data-prof-tab]').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.benchCodeTab = btn.dataset.profTab;
      renderBenchmarkPanel();
    });
  });
  document.getElementById('bench-preset').addEventListener('change', (e) => {
    state.benchPreset = e.target.value;
    runBenchmarkNow();
  });
  document.getElementById('bench-n').addEventListener('change', (e) => {
    state.benchN = Number(e.target.value);
    runBenchmarkNow();
  });
  document.getElementById('bench-cap').addEventListener('change', (e) => {
    state.benchMaxCap = Number(e.target.value);
    runBenchmarkNow();
  });
}

function renderTimeline(lesson) {
  const step = lesson.steps[state.stepIndex];
  document.getElementById('tl-label').textContent = `${step.short}  ·  `;
  document.getElementById('tl-count').textContent = `Bước ${state.stepIndex + 1} / ${lesson.steps.length}`;
  document.getElementById('nav-step-hint').textContent = `${state.stepIndex + 1} / ${lesson.steps.length}`;

  const track = document.getElementById('tl-track');
  track.innerHTML = lesson.steps
    .map(
      (s, idx) => `
      <button class="timeline__step ${idx < state.stepIndex ? 'is-past' : ''} ${idx === state.stepIndex ? 'is-active' : ''}"
              data-step="${idx}" title="Bước ${idx + 1}: ${escapeHtml(s.short)}"></button>`
    )
    .join('');

  const prevBtn = document.getElementById('btn-prev');
  const nextBtn = document.getElementById('btn-next');
  prevBtn.disabled = state.stepIndex === 0;

  const isLast = state.stepIndex === lesson.steps.length - 1;
  const ready = getAllReadyLessons();
  const nextLesson = ready[ready.findIndex((l) => l.id === lesson.id) + 1];
  nextBtn.textContent = isLast ? (nextLesson ? `Bài sau: ${nextLesson.title.split(':')[0]} →` : 'Hoàn thành ✓') : 'Tiếp theo →';
}

function renderStep({ animateCam = true } = {}) {
  const { module, lesson } = currentPair();
  state.stepIndex = Math.max(0, Math.min(state.stepIndex, lesson.steps.length - 1));
  const step = lesson.steps[state.stepIndex];

  // Mark lesson done when reaching last step
  if (state.stepIndex === lesson.steps.length - 1 && !state.doneLessons.has(lesson.id)) {
    state.doneLessons.add(lesson.id);
    saveDone();
    renderSidebar();
  }

  document.getElementById('crumb').innerHTML = `<span>${escapeHtml(module.title)}</span><span>/</span><b>${escapeHtml(lesson.title)}</b>`;

  const banner = document.getElementById('stage-banner');
  const editBanner = getEditBannerText();
  if (editBanner) {
    banner.textContent = editBanner;
    banner.hidden = false;
  } else if (step.banner) {
    banner.textContent = step.banner;
    banner.hidden = false;
  } else {
    banner.hidden = true;
  }

  const canEditGraph = Boolean(state.customNodes[lesson.id]);
  const isMaxFlow = lesson.chapterId === 'ch1';
  const isTree = lesson.chapterId === 'ch2';
  document.getElementById('tree-controls').hidden = !isTree;
  document.getElementById('tool-add-node').hidden = !canEditGraph;
  document.getElementById('tool-add-edge').hidden = !canEditGraph;
  document.getElementById('tool-delete').hidden = !canEditGraph;
  document.getElementById('tool-residual').hidden = !isMaxFlow;
  document.getElementById('tool-reset-graph').hidden = !state.lessonOverrides[lesson.id];

  renderHud(step.metrics);
  renderLegend(lesson.legend);
  renderGuide(lesson, step);
  renderTimeline(lesson);

  const sceneToRender = state.edgeFromNode
    ? {
        ...step.scene,
        nodes: step.scene.nodes.map((n) => ({ ...n, selected: n.id === state.edgeFromNode })),
      }
    : step.scene;
  stage.render(sceneToRender, { animateCam });

  location.hash = `#/${lesson.id}/${state.stepIndex + 1}`;
}

function renderAll({ animateCam = true } = {}) {
  renderSidebar();
  renderStep({ animateCam });
}

function goLesson(lessonId, stepIdx = 0) {
  stopAutoPlay();
  if (state.editMode) setEditMode(null);
  if (state.viewMode !== 'stage') setViewMode('stage');
  const pair = findLessonById(lessonId);
  if (!pair) return;
  state.lessonId = pair.lesson.id;
  state.stepIndex = stepIdx;
  state.openModules.add(pair.module.id);
  state.prevMetrics.clear();
  stage.userMoved = false;
  renderAll({ animateCam: true });
}

function nextStep() {
  const { lesson } = currentPair();
  if (state.stepIndex < lesson.steps.length - 1) {
    state.stepIndex++;
    renderStep({ animateCam: false });
  } else {
    stopAutoPlay();
    const ready = getAllReadyLessons();
    const idx = ready.findIndex((l) => l.id === lesson.id);
    if (idx >= 0 && idx < ready.length - 1) {
      goLesson(ready[idx + 1].id, 0);
    }
  }
}

function prevStep() {
  if (state.stepIndex > 0) {
    state.stepIndex--;
    renderStep({ animateCam: false });
  }
}

function toggleAutoPlay() {
  const btn = document.getElementById('btn-autoplay');
  if (state.autoPlayTimer) {
    stopAutoPlay();
    return;
  }
  btn.classList.add('is-active');
  btn.textContent = '⏸ Dừng';
  state.autoPlayTimer = setInterval(() => {
    const { lesson } = currentPair();
    if (state.stepIndex < lesson.steps.length - 1) {
      state.stepIndex++;
      renderStep({ animateCam: false });
    } else {
      stopAutoPlay();
    }
  }, 2400);
}

function stopAutoPlay() {
  if (state.autoPlayTimer) {
    clearInterval(state.autoPlayTimer);
    state.autoPlayTimer = null;
  }
  const btn = document.getElementById('btn-autoplay');
  if (btn) {
    btn.classList.remove('is-active');
    btn.textContent = '▶ Tự chạy';
  }
}

function syncThemeButton() {
  const isDark = document.documentElement.dataset.theme === 'dark';
  document.getElementById('theme-label').textContent = isDark ? '☀ Sáng' : '☾ Tối';
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = isDark ? '#211e1a' : '#f4ebe0';
}

function toggleTheme() {
  const isDark = document.documentElement.dataset.theme === 'dark';
  if (isDark) {
    delete document.documentElement.dataset.theme;
    localStorage.setItem(STORAGE_THEME, 'light');
  } else {
    document.documentElement.dataset.theme = 'dark';
    localStorage.setItem(STORAGE_THEME, 'dark');
  }
  syncThemeButton();
}

// ============================================================================
// Cmd+K Search
// ============================================================================
function buildSearchItems() {
  const items = [];
  for (const l of getAllReadyLessons()) {
    items.push({ type: 'Bài học', title: l.title, meta: l.complexity, lessonId: l.id, stepIdx: 0 });
    l.steps.forEach((s, idx) => {
      items.push({
        type: `Bước ${idx + 1}`,
        title: `${l.title} — ${s.title}`,
        meta: s.short,
        lessonId: l.id,
        stepIdx: idx,
      });
    });
  }
  return items;
}

function openSearch() {
  state.searchOpen = true;
  state.searchIndex = 0;
  const modal = document.getElementById('search-modal');
  const input = document.getElementById('sx-input');
  modal.hidden = false;
  input.value = '';
  renderSearchList('');
  input.focus();
}

function closeSearch() {
  state.searchOpen = false;
  document.getElementById('search-modal').hidden = true;
}

function renderSearchList(query) {
  const q = query.trim().toLowerCase();
  const all = buildSearchItems();
  const filtered = q
    ? all.filter((x) => x.title.toLowerCase().includes(q) || x.meta.toLowerCase().includes(q))
    : all.filter((x) => x.type === 'Bài học');

  const list = document.getElementById('sx-list');
  if (!filtered.length) {
    list.innerHTML = `<div class="sx__item" style="color:var(--muted)">Không tìm thấy kết quả phù hợp.</div>`;
    return;
  }
  state.searchIndex = Math.min(state.searchIndex, filtered.length - 1);
  list.innerHTML = filtered
    .slice(0, 14)
    .map(
      (item, idx) => `
      <button class="sx__item ${idx === state.searchIndex ? 'is-selected' : ''}"
              data-sx-lesson="${item.lessonId}" data-sx-step="${item.stepIdx}">
        <span>${escapeHtml(item.title)}</span>
        <span class="sx__meta">${escapeHtml(item.meta)}</span>
      </button>`
    )
    .join('');
}

function readHash() {
  const m = /^#\/([\w-]+)\/(\d+)$/.exec(location.hash);
  if (!m) return;
  const pair = findLessonById(m[1]);
  if (!pair) return;
  state.lessonId = pair.lesson.id;
  state.openModules.add(pair.module.id);
  state.stepIndex = Math.max(0, Math.min(Number(m[2]) - 1, pair.lesson.steps.length - 1));
}

function bindEvents() {
  document.getElementById('btn-theme').addEventListener('click', toggleTheme);
  document.getElementById('btn-bench').addEventListener('click', () => {
    setViewMode(state.viewMode === 'bench' ? 'stage' : 'bench');
  });
  document.querySelectorAll('[data-guide-tab]').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.guideTab = btn.dataset.guideTab;
      const { lesson } = currentPair();
      renderGuide(lesson, lesson.steps[state.stepIndex]);
    });
  });
  document.getElementById('btn-prev').addEventListener('click', prevStep);
  document.getElementById('btn-next').addEventListener('click', nextStep);
  document.getElementById('btn-autoplay').addEventListener('click', toggleAutoPlay);
  document.getElementById('btn-search').addEventListener('click', openSearch);
  document.getElementById('sx-backdrop').addEventListener('click', closeSearch);
  document.getElementById('help-backdrop').addEventListener('click', () => {
    document.getElementById('bench-help-modal').hidden = true;
  });
  document.getElementById('help-close').addEventListener('click', () => {
    document.getElementById('bench-help-modal').hidden = true;
  });

  document.getElementById('sx-input').addEventListener('input', (e) => {
    state.searchIndex = 0;
    renderSearchList(e.target.value);
  });

  document.getElementById('sx-list').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-sx-lesson]');
    if (!btn) return;
    closeSearch();
    goLesson(btn.dataset.sxLesson, Number(btn.dataset.sxStep));
  });

  // Progress reset button
  document.getElementById('btn-reset-progress').addEventListener('click', () => {
    state.doneLessons.clear();
    saveDone();
    renderSidebar();
  });

  // Sidebar clicks
  document.getElementById('course-tree').addEventListener('click', (e) => {
    const toggleDone = e.target.closest('[data-toggle-done]');
    if (toggleDone) {
      e.stopPropagation();
      const id = toggleDone.dataset.toggleDone;
      if (state.doneLessons.has(id)) state.doneLessons.delete(id);
      else state.doneLessons.add(id);
      saveDone();
      renderSidebar();
      return;
    }
    const modBtn = e.target.closest('[data-toggle-mod]');
    if (modBtn) {
      const id = modBtn.dataset.toggleMod;
      if (state.openModules.has(id)) state.openModules.delete(id);
      else state.openModules.add(id);
      renderSidebar();
      return;
    }
    const lessonBtn = e.target.closest('[data-lesson]');
    if (lessonBtn && !lessonBtn.disabled) {
      goLesson(lessonBtn.dataset.lesson, 0);
    }
  });

  // Timeline click
  document.getElementById('tl-track').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-step]');
    if (!btn) return;
    stopAutoPlay();
    state.stepIndex = Number(btn.dataset.step);
    renderStep({ animateCam: false });
  });

  // Tree sandbox insert / delete controls (Ch. 2)
  const runTreeOp = (op) => {
    const pair = findLessonById(state.lessonId);
    if (!pair || pair.lesson.chapterId !== 'ch2') return;
    const input = document.getElementById('tree-key-input');
    const val = Number(input.value);
    if (Number.isNaN(val)) return;

    if (!state.treeSims[pair.lesson.id]) {
      state.treeSims[pair.lesson.id] = createTreeSimState(pair.lesson.id);
    }
    const sim = mutateTreeSim(state.treeSims[pair.lesson.id], op, val);
    const updatedLesson = buildInteractiveTreeStep(pair.lesson, sim);
    state.lessonOverrides[pair.lesson.id] = updatedLesson;
    state.stepIndex = updatedLesson.steps.length - 1;
    stage.userMoved = false;
    renderStep({ animateCam: true });

    // Auto-suggest next key on insert for fast consecutive testing
    if (op === 'insert') {
      input.value = String((val + 13) % 97 + 1);
    }
  };

  document.getElementById('tool-tree-add').addEventListener('click', () => runTreeOp('insert'));
  document.getElementById('tool-tree-find').addEventListener('click', () => runTreeOp('search'));
  document.getElementById('tool-tree-del').addEventListener('click', () => runTreeOp('delete'));
  document.getElementById('tree-key-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      runTreeOp('insert');
    }
  });

  // Stage toolbar
  document.getElementById('tool-add-node').addEventListener('click', () => setEditMode('add-node'));
  document.getElementById('tool-add-edge').addEventListener('click', () => setEditMode('add-edge'));
  document.getElementById('tool-delete').addEventListener('click', () => setEditMode('delete'));

  document.getElementById('tool-residual').addEventListener('click', (e) => {
    state.showResidual = !state.showResidual;
    e.currentTarget.classList.toggle('is-active', state.showResidual);
    stage.setShowResidual(state.showResidual);
  });

  document.getElementById('tool-pause').addEventListener('click', (e) => {
    state.pausedPackets = !state.pausedPackets;
    e.currentTarget.classList.toggle('is-active', state.pausedPackets);
    e.currentTarget.textContent = state.pausedPackets ? 'Play' : 'Pause';
    stage.setPaused(state.pausedPackets);
  });

  document.getElementById('tool-fit').addEventListener('click', () => stage.fit());

  document.getElementById('tool-reset-graph').addEventListener('click', () => {
    const lid = state.lessonId;
    const defaultNodes = {
      'edmonds-karp': INITIAL_EK_NODES,
      'capacity-scaling': INITIAL_CS_NODES,
      'case-cdn': NODES_CDN,
    };
    const defaultEdges = {
      'ford-fulkerson': INITIAL_FF_EDGES,
      'edmonds-karp': INITIAL_EK_EDGES,
      'capacity-scaling': INITIAL_CS_EDGES,
      'case-cdn': INITIAL_CDN_EDGES,
    };
    if (defaultNodes[lid]) state.customNodes[lid] = defaultNodes[lid].map((n) => ({ ...n }));
    if (defaultEdges[lid]) {
      state.customEdges[lid] = defaultEdges[lid].map((e) => ({ ...e }));
    }
    delete state.treeSims[lid];
    delete state.lessonOverrides[lid];
    setEditMode(null);
    state.stepIndex = 0;
    renderStep({ animateCam: true });
  });

  // Keyboard shortcuts
  window.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      state.searchOpen ? closeSearch() : openSearch();
      return;
    }
    if (state.searchOpen) {
      if (e.key === 'Escape') closeSearch();
      return;
    }
    const helpModal = document.getElementById('bench-help-modal');
    if (helpModal && !helpModal.hidden) {
      if (e.key === 'Escape') helpModal.hidden = true;
      return;
    }
    if (e.target.tagName === 'INPUT') return;
    if (e.key === '/') {
      e.preventDefault();
      openSearch();
    } else if (e.key === 'ArrowRight') {
      nextStep();
    } else if (e.key === 'ArrowLeft') {
      prevStep();
    } else if (e.key === ' ') {
      e.preventDefault();
      toggleAutoPlay();
    } else if (e.key.toLowerCase() === 'f') {
      stage.fit();
    } else if (e.key.toLowerCase() === 'r') {
      document.getElementById('tool-residual').click();
    }
  });
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

mountShell();
