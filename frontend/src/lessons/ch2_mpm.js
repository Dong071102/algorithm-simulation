// ============================================================================
// Bài 5: MPM (Malhotra–Pramodh-Kumar–Maheshwari) — O(V³) Blocking Flow
// ============================================================================

const CODE = [
  'function mpmBlockingFlow(levelGraph, S, T) {',
  '  // Tính tiềm năng p(v) = min(Σ inCap(v), Σ outCap(v))',
  '  while (S và T còn trong Level Graph) {',
  '    v = argmin { p(u) }       // chọn nút nghẽn nhỏ nhất',
  '    if (p(v) === 0) { removeNode(v); continue; }',
  '    pushForward(v → T, p(v)); // đẩy xuôi lượng p(v)',
  '    pushBackward(v → S, p(v));// kéo ngược lượng p(v)',
  '    removeNode(v);            // nút v chắc chắn bão hòa!',
  '  }',
  '}',
];

const NODES = [
  { id: 'S', label: 'S', sub: 'Nguồn', x: 85, y: 200 },
  { id: 'A', label: 'A', sub: 'Tầng 1', x: 270, y: 85 },
  { id: 'B', label: 'B', sub: 'Tầng 1', x: 270, y: 315 },
  { id: 'C', label: 'C', sub: 'Tầng 2', x: 470, y: 85 },
  { id: 'D', label: 'D', sub: 'Tầng 2', x: 470, y: 315 },
  { id: 'T', label: 'T', sub: 'Đích', x: 650, y: 200 },
];

const n = (ov = {}) => NODES.map((x) => ({ ...x, state: x.id === 'S' ? 'source' : x.id === 'T' ? 'sink' : 'idle', ...(ov[x.id] || {}) }));

export const lessonMPM = {
  id: 'mpm',
  chapterId: 'ch1',
  title: '5. MPM (Blocking Flow)',
  complexity: 'O(V³)',
  complexityAnalysis: {
    time: 'O(V³)',
    space: 'O(V + E)',
    classType: 'Strongly Polynomial — Tối ưu cho đồ thị dày (E ≈ V²)',
    derivation: [
      { step: '1. Số pha Level Graph', formula: '≤ V - 1 pha', note: 'Giống Dinic, mỗi pha tăng khoảng cách L(T) thêm ít nhất +1.' },
      { step: '2. Chi phí mỗi lần chọn đỉnh min-potential v*', formula: 'O(V) tìm + xóa v*', note: 'Mỗi vòng lặp chọn đỉnh p(v*) nhỏ nhất rồi xóa hẳn v* khỏi Level Graph → tối đa V vòng lặp / pha.' },
      { step: '3. Tổng chi phí đẩy luồng trong 1 pha', formula: 'O(V² + E) = O(V²)', note: 'Mỗi cạnh bị bão hòa tối đa 1 lần (tốn O(E)) + mỗi bước đẩy không bão hòa tối đa 1 cạnh / đỉnh (O(V²)).' },
      { step: '4. Tổng thời gian', formula: 'V × O(V²) = O(V³)', note: 'Trên đồ thị dày (E = V²), Dinic tốn O(V⁴) còn MPM chỉ tốn O(V³)!' },
    ],
    worstCase: 'Khi đồ thị rất thưa (E ≈ V), Dinic thường nhanh hơn MPM do hệ số hằng nhỏ hơn.',
    vsOthers: [
      { algo: 'Dinic', diff: 'Dinic tìm từng đường bằng DFS O(V·E)/pha; MPM đẩy 2 chiều từ nút nghẽn nhỏ nhất p(v*) tốn O(V²)/pha.' },
    ],
  },
  pseudocode: CODE,
  legend: [
    { type: 'dot', color: 'var(--amber-2)', label: 'Đỉnh tiềm năng nhỏ nhất p(v*)' },
    { type: 'dot', color: 'var(--green-3)', label: 'Luồng đẩy tiến & kéo lùi' },
    { type: 'dot', color: 'var(--muted)', label: 'Đỉnh đã xóa khỏi Level Graph' },
  ],
  steps: [
    {
      short: 'Tính Potential p(v)',
      tag: 'Tiềm năng nút p(v)',
      title: 'Gán tiềm năng p(v) = min(tổng vào, tổng ra) cho mỗi đỉnh',
      activeLines: [1, 2],
      body: [
        'Thay vì chạy DFS từ <code>S</code>, <span class="term">MPM</span> tính <b>tiềm năng thông lượng</b> <code>p(v) = min(inCap(v), outCap(v))</code> trên Level Graph.',
        'Ví dụ tại đỉnh <code>C</code>: vào = <code>4</code> (từ A), ra = <code>10</code> (tới T) → <code>p(C) = min(4, 10) = 4</code> — đây là đỉnh có <b>p nhỏ nhất toàn mạng</b>!',
      ],
      changes: ['+ p(A)=min(10,12)=10, p(B)=min(10,9)=9', '+ p(C)=min(4,10)=4 (NHỎ NHẤT!), p(D)=min(17,10)=10'],
      callout: { kind: 'insight', title: 'Tại sao chọn p(v*) nhỏ nhất?', text: 'Vì v* là đỉnh có p nhỏ nhất, mọi đỉnh khác đều có sức chứa ≥ p(v*) nên ta CHẮC CHẮN đẩy được toàn bộ p(v*) xuôi tới T và kéo được p(v*) ngược về S mà không bị nghẽn!' },
      metrics: [
        { id: 'minp', label: 'Min p(v*)', value: 'C (p=4)', level: 'warn' },
        { id: 'flow', label: 'Blocking Flow', value: '0', level: 'normal' },
        { id: 'bound', label: 'Độ phức tạp', value: 'O(V³)', level: 'good' },
      ],
      scene: {
        nodes: n({
          S: { badge: 'p=20' }, A: { badge: 'p=10' }, B: { badge: 'p=9' },
          C: { badge: 'p=4 ★', state: 'active', spot: true }, D: { badge: 'p=10' }, T: { badge: 'p=20' },
        }),
        edges: [
          { id: 'SA', from: 'S', to: 'A', flow: 0, cap: 10 },
          { id: 'SB', from: 'S', to: 'B', flow: 0, cap: 10 },
          { id: 'AC', from: 'A', to: 'C', flow: 0, cap: 4 },
          { id: 'AD', from: 'A', to: 'D', flow: 0, cap: 8 },
          { id: 'BD', from: 'B', to: 'D', flow: 0, cap: 9 },
          { id: 'CT', from: 'C', to: 'T', flow: 0, cap: 10 },
          { id: 'DT', from: 'D', to: 'T', flow: 0, cap: 10 },
        ],
      },
    },
    {
      short: 'Đẩy 2 chiều từ C',
      tag: 'Push Forward & Pull Backward',
      title: 'Từ C (p=4): Đẩy +4 tới T, kéo +4 từ S → Xóa đỉnh C!',
      activeLines: [4, 6, 7, 8],
      body: [
        'Từ đỉnh tham chiếu <code>C</code>: đẩy xuôi <code>+4</code> sang <code>T</code> (<code>C→T: 4/10</code>) và kéo ngược <code>+4</code> qua <code>A</code> về <code>S</code> (<code>A→C: 4/4</code>, <code>S→A: 4/10</code>).',
        'Cạnh vào <code>C</code> đã cạn → <b>xóa hẳn đỉnh C</b> khỏi Level Graph và cập nhật lại <code>p(A) = min(6, 8) = 6</code>!',
      ],
      changes: ['+ Đẩy 2 chiều lượng p(C) = 4 qua S→A→C→T', '- Xóa đỉnh C khỏi Level Graph (còn 5 đỉnh)', '~ Cập nhật p(A): 10 → 6 (nhỏ nhất mới!)'],
      metrics: [
        { id: 'minp', label: 'Đỉnh vừa xóa', value: 'C (p=4)', level: 'good' },
        { id: 'flow', label: 'Blocking Flow', value: '4', level: 'good' },
        { id: 'left', label: 'Đỉnh còn lại', value: '5 / 6', level: 'normal' },
      ],
      scene: {
        nodes: n({
          S: { badge: 'p=16' }, A: { badge: 'p=6 ★', state: 'active', spot: true }, B: { badge: 'p=9' },
          C: { badge: 'xóa', state: 'dead' }, D: { badge: 'p=10' }, T: { badge: 'p=16' },
        }),
        edges: [
          { id: 'SA', from: 'S', to: 'A', flow: 4, cap: 10, kind: 'augment' },
          { id: 'SB', from: 'S', to: 'B', flow: 0, cap: 10 },
          { id: 'AC', from: 'A', to: 'C', flow: 4, cap: 4, kind: 'saturated' },
          { id: 'AD', from: 'A', to: 'D', flow: 0, cap: 8 },
          { id: 'BD', from: 'B', to: 'D', flow: 0, cap: 9 },
          { id: 'CT', from: 'C', to: 'T', flow: 4, cap: 10, kind: 'augment' },
          { id: 'DT', from: 'D', to: 'T', flow: 0, cap: 10 },
        ],
      },
    },
    {
      short: 'Đẩy 2 chiều từ A',
      tag: 'Tiếp tục xóa đỉnh nghẽn',
      title: 'Từ A (p=6): Đẩy +6 qua D→T, kéo +6 từ S → Xóa A!',
      activeLines: [4, 6, 7, 8],
      body: [
        'Đỉnh nhỏ nhất tiếp theo là <code>A (p=6)</code>. Đẩy xuôi <code>+6</code> qua <code>A→D→T</code> và kéo <code>+6</code> từ <code>S→A</code> (bão hòa <code>10/10</code>).',
        'Xóa tiếp đỉnh <code>A</code>. Lúc này <code>p(D) = min(9, 4) = 4</code> trở thành nút nghẽn cuối cùng của pha này!',
      ],
      changes: ['+ Đẩy 2 chiều p(A) = 6 qua S→A→D→T → |f| = 10', '- Xóa đỉnh A khỏi Level Graph', '~ Cập nhật p(D): 10 → 4 (nhỏ nhất mới)'],
      metrics: [
        { id: 'minp', label: 'Min p(v*)', value: 'D (p=4)', level: 'warn' },
        { id: 'flow', label: 'Blocking Flow', value: '10', level: 'good' },
        { id: 'left', label: 'Đỉnh còn lại', value: '4 / 6', level: 'normal' },
      ],
      scene: {
        nodes: n({
          S: { badge: 'p=10' }, A: { badge: 'xóa', state: 'dead' }, B: { badge: 'p=9' },
          C: { badge: 'xóa', state: 'dead' }, D: { badge: 'p=4 ★', state: 'active', spot: true }, T: { badge: 'p=10' },
        }),
        edges: [
          { id: 'SA', from: 'S', to: 'A', flow: 10, cap: 10, kind: 'saturated' },
          { id: 'SB', from: 'S', to: 'B', flow: 0, cap: 10 },
          { id: 'AC', from: 'A', to: 'C', flow: 4, cap: 4, kind: 'saturated' },
          { id: 'AD', from: 'A', to: 'D', flow: 6, cap: 8, kind: 'augment' },
          { id: 'BD', from: 'B', to: 'D', flow: 0, cap: 9 },
          { id: 'CT', from: 'C', to: 'T', flow: 4, cap: 10 },
          { id: 'DT', from: 'D', to: 'T', flow: 6, cap: 10, kind: 'augment' },
        ],
      },
    },
    {
      short: 'Hoàn tất Blocking Flow',
      tag: 'Xóa D → Hết pha trong O(V²)',
      title: 'Đẩy nốt +4 qua D → Blocking Flow = 14',
      activeLines: [6, 7, 8],
      body: [
        'Chọn <code>D (p=4)</code>: đẩy <code>+4</code> sang <code>T</code> (bão hòa <code>D→T: 10/10</code>) và kéo <code>+4</code> từ <code>S→B→D</code>. Xóa đỉnh <code>D</code> → không còn đường nối <code>S</code> tới <code>T</code>.',
        'Mỗi bước đều loại vĩnh viễn ít nhất 1 đỉnh nên cả pha Blocking Flow chỉ tốn tối đa <code>O(V²)</code> → toàn thuật toán đạt <b>O(V³)</b>!',
      ],
      changes: ['+ Đẩy 2 chiều p(D) = 4 → Blocking Flow = 14', '- Xóa D → kết thúc pha trong đúng 3 lần chọn đỉnh!'],
      metrics: [
        { id: 'flow', label: 'Blocking Flow', value: '14', level: 'good' },
        { id: 'ops', label: 'Số đỉnh xóa', value: '3 đỉnh', level: 'good' },
        { id: 'bound', label: 'Độ phức tạp', value: 'O(V³)', level: 'good' },
      ],
      scene: {
        nodes: n({
          S: { state: 'source' }, A: { badge: 'xóa', state: 'dead' }, B: { badge: 'p=0', state: 'dead' },
          C: { badge: 'xóa', state: 'dead' }, D: { badge: 'xóa', state: 'dead' }, T: { state: 'sink' },
        }),
        edges: [
          { id: 'SA', from: 'S', to: 'A', flow: 10, cap: 10, kind: 'saturated' },
          { id: 'SB', from: 'S', to: 'B', flow: 4, cap: 10, kind: 'augment' },
          { id: 'AC', from: 'A', to: 'C', flow: 4, cap: 4, kind: 'saturated' },
          { id: 'AD', from: 'A', to: 'D', flow: 6, cap: 8 },
          { id: 'BD', from: 'B', to: 'D', flow: 4, cap: 9, kind: 'augment' },
          { id: 'CT', from: 'C', to: 'T', flow: 4, cap: 10 },
          { id: 'DT', from: 'D', to: 'T', flow: 10, cap: 10, kind: 'saturated' },
        ],
      },
    },
  ],
};
