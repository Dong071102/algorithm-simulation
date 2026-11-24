// ============================================================================
// Bài 4: Dinic (Dinitz) — Level Graph + Blocking Flow + Dead-End Pruning
// ============================================================================

const CODE = [
  'function dinic(adj, S, T) {',
  '  let flow = 0;',
  '  while (bfsLevelGraph(adj, S, T, level)) {',
  '    ptr.fill(0); // Current-arc optimization',
  '    while ((pushed = dfsBlocking(S, Infinity)) > 0) {',
  '      flow += pushed; // đẩy nhiều đường trong cùng 1 pha',
  '    } // Nếu đỉnh không đẩy được nữa → cắt nhánh cụt',
  '  } return flow;',
  '}',
];

const NODES = [
  { id: 'S', label: 'S', sub: 'Nguồn', x: 85, y: 200 },
  { id: 'A', label: 'A', sub: 'Nút A', x: 265, y: 85 },
  { id: 'B', label: 'B', sub: 'Nút B', x: 265, y: 315 },
  { id: 'C', label: 'C', sub: 'Nút C', x: 465, y: 85 },
  { id: 'D', label: 'D', sub: 'Nút D', x: 465, y: 315 },
  { id: 'T', label: 'T', sub: 'Đích', x: 645, y: 200 },
];

const n = (ov = {}) => NODES.map((x) => ({ ...x, state: x.id === 'S' ? 'source' : x.id === 'T' ? 'sink' : 'idle', ...(ov[x.id] || {}) }));

export const lessonDinic = {
  id: 'dinic',
  chapterId: 'ch1',
  title: '4. Dinic (Dinitz)',
  complexity: 'O(V² · E)',
  complexityAnalysis: {
    time: 'O(V² · E)',
    space: 'O(V + E)',
    classType: 'Strongly Polynomial (O(E√V) trên đồ thị đơn vị / Bipartite)',
    derivation: [
      { step: '1. Số pha dựng Level Graph (BFS)', formula: '≤ V - 1 pha', note: 'Sau mỗi Blocking Flow, khoảng cách d(S, T) tăng nghiêm ngặt ít nhất +1 → tối đa V - 1 pha.' },
      { step: '2. Chi phí 1 Blocking Flow (DFS + Current Arc)', formula: 'O(V · E)', note: 'Con trỏ ptr[u] không bao giờ quay lui trên cạnh cụt → mỗi cạnh duyệt O(1) lần; mỗi lần bão hòa tốn tối đa O(V) bước đi.' },
      { step: '3. Tổng thời gian', formula: '(V - 1) × O(V · E) = O(V² · E)', note: 'Nhanh hơn Edmonds–Karp O(V · E²) tới V lần trên đồ thị dày!' },
    ],
    worstCase: 'Đồ thị dày có nhiều tầng nhưng rất nhanh trong thực tế — chuẩn vàng trong lập trình thi đấu.',
    vsOthers: [
      { algo: 'Edmonds–Karp', diff: 'Thay vì chạy lại BFS sau mỗi 1 đường, Dinic đẩy TOÀN BỘ Blocking Flow trong 1 lần BFS.' },
      { algo: 'MPM', diff: 'MPM thay DFS Blocking Flow bằng đẩy 2 chiều từ đỉnh potential nhỏ nhất → O(V³).' },
    ],
  },
  pseudocode: CODE,
  legend: [
    { type: 'dot', color: 'var(--blue-2)', label: 'Đỉnh thuộc Level Graph (L=k)' },
    { type: 'dot', color: 'var(--amber-2)', label: 'Đường Blocking Flow đang đẩy' },
    { type: 'line', color: 'var(--line-strong)', label: 'Cạnh mờ: không đi tới tầng L+1' },
    { type: 'dot', color: 'var(--green-3)', label: 'Luồng bão hòa' },
  ],
  steps: [
    {
      short: 'Pha 1: Level Graph',
      tag: 'Pha 1 • Dựng Đồ thị phân tầng',
      title: 'BFS gắn nhãn tầng L(v) và lọc cạnh tiến tầng',
      activeLines: [3],
      body: [
        'Dinic dùng <span class="term">BFS</span> gắn nhãn tầng <code>L(v)</code> cho mỗi đỉnh (<code>L=0, 1, 2, 3</code>).',
        'Chỉ giữ lại các cạnh đi tiến đúng 1 tầng (<code>L(v) = L(u) + 1</code>). Hai cạnh ngang tầng <code>A → B</code> và <code>D → C</code> lập tức <b>bị ẩn mờ</b> — biến đồ thị thành một DAG sạch!',
      ],
      changes: ['+ Gắn nhãn tầng: S(0), A/B(1), C/D(2), T(3)', '~ Lọc bỏ cạnh ngang tầng A→B, D→C khỏi Level Graph'],
      callout: { kind: 'insight', title: 'Tại sao nhanh hơn Edmonds–Karp?', text: 'Edmonds–Karp chạy lại BFS sau MỖI 1 đường tăng luồng. Dinic chỉ BFS 1 lần rồi dùng DFS vét sạch mọi đường trên cùng Level Graph!' },
      metrics: [
        { id: 'phase', label: 'Pha BFS', value: 'Pha 1', level: 'violet' },
        { id: 'dist', label: 'L(T)', value: '3 tầng', level: 'normal' },
        { id: 'flow', label: 'Max Flow', value: '0', level: 'normal' },
        { id: 'bound', label: 'Độ phức tạp', value: 'O(V²·E)', level: 'good' },
      ],
      scene: {
        nodes: n({
          S: { badge: 'L=0' }, A: { badge: 'L=1', state: 'visited', spot: true }, B: { badge: 'L=1', state: 'visited', spot: true },
          C: { badge: 'L=2', state: 'visited', spot: true }, D: { badge: 'L=2', state: 'visited', spot: true }, T: { badge: 'L=3' },
        }),
        edges: [
          { id: 'SA', from: 'S', to: 'A', flow: 0, cap: 10 },
          { id: 'SB', from: 'S', to: 'B', flow: 0, cap: 10 },
          { id: 'AB', from: 'A', to: 'B', flow: 0, cap: 2, kind: 'off' },
          { id: 'AC', from: 'A', to: 'C', flow: 0, cap: 4 },
          { id: 'AD', from: 'A', to: 'D', flow: 0, cap: 8 },
          { id: 'BD', from: 'B', to: 'D', flow: 0, cap: 9 },
          { id: 'DC', from: 'D', to: 'C', flow: 0, cap: 6, kind: 'off' },
          { id: 'CT', from: 'C', to: 'T', flow: 0, cap: 10 },
          { id: 'DT', from: 'D', to: 'T', flow: 0, cap: 10 },
        ],
      },
    },
    {
      short: 'Blocking Flow #1',
      tag: 'Pha 1 • DFS vét đa đường',
      title: 'Đẩy đồng loạt 2 đường S→A→C→T (+4) và S→A→D→T (+6)',
      activeLines: [4, 5, 6],
      body: [
        'Trên cùng Level Graph Pha 1, DFS đẩy <code>+4</code> qua <code>S→A→C→T</code> (bão hòa <code>A→C</code>), rồi quay lui tại <code>A</code> dùng con trỏ <code>ptr[A]</code> đẩy tiếp <code>+6</code> qua <code>S→A→D→T</code> (bão hòa <code>S→A</code>)!',
        'Không cần chạy lại BFS giữa 2 đường này!',
      ],
      changes: ['+ Đẩy +4 qua S → A → C → T (bão hòa A→C)', '+ Đẩy +6 qua S → A → D → T (bão hòa S→A)', '+ Tổng luồng nhảy 0 → 10 ngay trong Pha 1'],
      metrics: [
        { id: 'phase', label: 'Pha BFS', value: 'Pha 1', level: 'violet' },
        { id: 'dist', label: 'L(T)', value: '3 tầng', level: 'normal' },
        { id: 'flow', label: 'Max Flow', value: '10', level: 'good' },
        { id: 'bound', label: 'Độ phức tạp', value: 'O(V²·E)', level: 'good' },
      ],
      scene: {
        nodes: n({
          S: { badge: 'L=0' }, A: { badge: 'L=1', state: 'active', spot: true }, B: { badge: 'L=1' },
          C: { badge: 'L=2', state: 'active' }, D: { badge: 'L=2', state: 'active' }, T: { badge: 'L=3' },
        }),
        edges: [
          { id: 'SA', from: 'S', to: 'A', flow: 10, cap: 10, kind: 'augment' },
          { id: 'SB', from: 'S', to: 'B', flow: 0, cap: 10 },
          { id: 'AB', from: 'A', to: 'B', flow: 0, cap: 2, kind: 'off' },
          { id: 'AC', from: 'A', to: 'C', flow: 4, cap: 4, kind: 'augment' },
          { id: 'AD', from: 'A', to: 'D', flow: 6, cap: 8, kind: 'augment' },
          { id: 'BD', from: 'B', to: 'D', flow: 0, cap: 9 },
          { id: 'DC', from: 'D', to: 'C', flow: 0, cap: 6, kind: 'off' },
          { id: 'CT', from: 'C', to: 'T', flow: 4, cap: 10, kind: 'augment' },
          { id: 'DT', from: 'D', to: 'T', flow: 6, cap: 10, kind: 'augment' },
        ],
      },
    },
    {
      short: 'Khóa Pha 1',
      tag: 'Pha 1 • Blocking Flow hoàn tất',
      title: 'Đẩy nốt +4 qua S→B→D→T → Đạt Blocking Flow (14)',
      activeLines: [5, 6, 7],
      body: [
        'DFS tiếp tục đi nhánh <code>S→B→D→T</code> đẩy thêm <code>+4</code> làm bão hòa <code>D→T (10/10)</code>.',
        'Lúc này mọi đường từ <code>S → T</code> trên Level Graph Pha 1 đều đã bị chặn — gọi là <span class="term">Blocking Flow</span>. Đỉnh <code>D</code> bị đánh dấu cụt (dead-end).',
      ],
      changes: ['+ Đẩy +4 qua S → B → D → T (bão hòa D→T)', '+ Kết thúc Pha 1 với |f| = 14 (chỉ 1 lần BFS!)'],
      metrics: [
        { id: 'phase', label: 'Pha BFS', value: 'Pha 1 xong', level: 'good' },
        { id: 'dist', label: 'L(T)', value: '3 tầng', level: 'normal' },
        { id: 'flow', label: 'Max Flow', value: '14', level: 'good' },
      ],
      scene: {
        nodes: n({
          S: { badge: 'L=0' }, A: { badge: 'L=1', state: 'dead' }, B: { badge: 'L=1', state: 'active' },
          C: { badge: 'L=2' }, D: { badge: 'L=2', state: 'dead' }, T: { badge: 'L=3' },
        }),
        edges: [
          { id: 'SA', from: 'S', to: 'A', flow: 10, cap: 10, kind: 'saturated' },
          { id: 'SB', from: 'S', to: 'B', flow: 4, cap: 10, kind: 'augment' },
          { id: 'AB', from: 'A', to: 'B', flow: 0, cap: 2, kind: 'off' },
          { id: 'AC', from: 'A', to: 'C', flow: 4, cap: 4, kind: 'saturated' },
          { id: 'AD', from: 'A', to: 'D', flow: 6, cap: 8 },
          { id: 'BD', from: 'B', to: 'D', flow: 4, cap: 9, kind: 'augment' },
          { id: 'DC', from: 'D', to: 'C', flow: 0, cap: 6, kind: 'off' },
          { id: 'CT', from: 'C', to: 'T', flow: 4, cap: 10 },
          { id: 'DT', from: 'D', to: 'T', flow: 10, cap: 10, kind: 'saturated' },
        ],
      },
    },
    {
      short: 'Pha 2: L(T)=4',
      tag: 'Pha 2 • Tầng sâu hơn (L=4)',
      title: 'BFS Pha 2: Cạnh D→C mở khóa, L(T) tăng 3 → 4!',
      activeLines: [3, 5, 6],
      body: [
        'BFS mới chạy trên đồ thị thặng dư tìm thấy đường 4 cạnh <code>S(0) → B(1) → D(2) → C(3) → T(4)</code>! Cạnh <code>D→C</code> trước đây bị ẩn nay trở thành cạnh tiến tầng.',
        'DFS đẩy thêm <code>+5</code> qua <code>S→B→D→C→T</code> → bão hòa <code>B→D (9/9)</code>, nâng tổng luồng lên <b>19</b>!',
      ],
      changes: ['~ L(T) tăng nghiêm ngặt: 3 → 4 tầng', '+ Đẩy +5 qua S → B → D → C → T', '+ Tổng luồng |f| = 19'],
      metrics: [
        { id: 'phase', label: 'Pha BFS', value: 'Pha 2', level: 'violet' },
        { id: 'dist', label: 'L(T)', value: '4 tầng (+1)', level: 'warn' },
        { id: 'flow', label: 'Max Flow', value: '19', level: 'good' },
      ],
      scene: {
        nodes: n({
          S: { badge: 'L=0' }, A: { badge: '∞', state: 'dead' }, B: { badge: 'L=1', state: 'active', spot: true },
          D: { badge: 'L=2', state: 'active', spot: true }, C: { badge: 'L=3', state: 'active', spot: true }, T: { badge: 'L=4' },
        }),
        edges: [
          { id: 'SA', from: 'S', to: 'A', flow: 10, cap: 10, kind: 'saturated' },
          { id: 'SB', from: 'S', to: 'B', flow: 9, cap: 10, kind: 'augment' },
          { id: 'AB', from: 'A', to: 'B', flow: 0, cap: 2, kind: 'off' },
          { id: 'AC', from: 'A', to: 'C', flow: 4, cap: 4, kind: 'saturated' },
          { id: 'AD', from: 'A', to: 'D', flow: 6, cap: 8, kind: 'off' },
          { id: 'BD', from: 'B', to: 'D', flow: 9, cap: 9, kind: 'augment' },
          { id: 'DC', from: 'D', to: 'C', flow: 5, cap: 6, kind: 'augment' },
          { id: 'CT', from: 'C', to: 'T', flow: 9, cap: 10, kind: 'augment' },
          { id: 'DT', from: 'D', to: 'T', flow: 10, cap: 10, kind: 'saturated' },
        ],
      },
    },
    {
      short: 'Hoàn tất (2 pha)',
      tag: 'Min-Cut • Chỉ mất 2 pha BFS',
      title: 'BFS Pha 3 không chạm tới T → Max Flow = 19',
      activeLines: [8],
      body: [
        'BFS Pha 3 chỉ đến được <code>Zone S = {S, B}</code> vì cả <code>S→A (10/10)</code> và <code>B→D (9/9)</code> đã bão hòa hoàn toàn.',
        'Tổng sức chứa lát cắt <code>10 + 9 = 19 = Max Flow</code>. Dinic chỉ cần đúng <b>2 pha BFS</b> thay vì 4–5 lần BFS như Edmonds–Karp!',
      ],
      changes: ['+ Max Flow = 19 | Min-Cut = {S→A, B→D} = 19', '+ Tổng số pha BFS: 2 (tối đa ≤ V - 1)'],
      metrics: [
        { id: 'phase', label: 'Tổng pha', value: '2 pha', level: 'good' },
        { id: 'flow', label: 'Max Flow', value: '19', level: 'good' },
        { id: 'mincut', label: 'Min-Cut', value: '19', level: 'good' },
      ],
      scene: {
        nodes: n({
          S: { state: 'mincut-s' }, B: { state: 'mincut-s' },
          A: { state: 'mincut-t' }, C: { state: 'mincut-t' }, D: { state: 'mincut-t' }, T: { state: 'mincut-t' },
        }),
        zones: [
          { kind: 's', label: 'Zone S (S,B)', nodes: ['S', 'B'] },
          { kind: 't', label: 'Zone T (A,C,D,T)', nodes: ['A', 'C', 'D', 'T'] },
        ],
        edges: [
          { id: 'SA', from: 'S', to: 'A', flow: 10, cap: 10, kind: 'cut' },
          { id: 'SB', from: 'S', to: 'B', flow: 9, cap: 10 },
          { id: 'AB', from: 'A', to: 'B', flow: 0, cap: 2 },
          { id: 'AC', from: 'A', to: 'C', flow: 4, cap: 4, kind: 'saturated' },
          { id: 'AD', from: 'A', to: 'D', flow: 6, cap: 8 },
          { id: 'BD', from: 'B', to: 'D', flow: 9, cap: 9, kind: 'cut' },
          { id: 'DC', from: 'D', to: 'C', flow: 5, cap: 6 },
          { id: 'CT', from: 'C', to: 'T', flow: 9, cap: 10 },
          { id: 'DT', from: 'D', to: 'T', flow: 10, cap: 10, kind: 'saturated' },
        ],
      },
    },
  ],
};
