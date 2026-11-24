// ============================================================================
// Bài 1: Ford–Fulkerson (DFS & Cái bẫy Kim cương / Residual Back-Edge)
// ============================================================================

const PSEUDOCODE = [
  'function fordFulkerson(adj, S, T) {',
  '  let flow = 0; const vis = new Int32Array(adj.length);',
  '  while ((pushed = dfs(S, Infinity)) > 0) {',
  '    const rem = Math.min(pushed, e.cap - e.flow);',
  '    for (const e of path) {',
  '      e.flow += pushed;              // đẩy luồng xuôi',
  '      adj[e.to][e.rev].flow -= pushed; // mở cạnh ngược',
  '  }} return flow;',
];

const NODES_BASE = [
  { id: 'S', label: 'S', sub: 'Nguồn', x: 110, y: 200, state: 'source' },
  { id: 'A', label: 'A', sub: 'Nút trung gian', x: 350, y: 80, state: 'idle' },
  { id: 'B', label: 'B', sub: 'Nút trung gian', x: 350, y: 320, state: 'idle' },
  { id: 'T', label: 'T', sub: 'Đích', x: 590, y: 200, state: 'sink' },
];

function makeNodes(overrides = {}) {
  return NODES_BASE.map((n) => ({ ...n, ...(overrides[n.id] || {}) }));
}

export const INITIAL_FF_EDGES = [
  { id: 'SA', from: 'S', to: 'A', cap: 1000 },
  { id: 'SB', from: 'S', to: 'B', cap: 1000 },
  { id: 'AB', from: 'A', to: 'B', cap: 1 },
  { id: 'AT', from: 'A', to: 'T', cap: 1000 },
  { id: 'BT', from: 'B', to: 'T', cap: 1000 },
];

export function buildFordFulkersonLesson(customEdges = INITIAL_FF_EDGES) {
  const capOf = (id) => (customEdges.find((e) => e.id === id) || { cap: 1 }).cap;
  const cSA = capOf('SA'), cSB = capOf('SB'), cAB = capOf('AB'), cAT = capOf('AT'), cBT = capOf('BT');
  const maxOuter = Math.min(cSA, cAT) + Math.min(cSB, cBT);
  const b1 = Math.min(cSA, cAB, cBT);
  const b2 = Math.min(cSB, b1, cAT);
  const estIters = Math.max(2, Math.ceil(maxOuter / Math.max(1, cAB)));
  const banner = '💡 Click cạnh để tăng +1 sức chứa (Shift+Click giảm -1)';

  const makeEdges = (flows, extra = {}) =>
    [
      { id: 'SA', from: 'S', to: 'A', flow: flows.SA || 0, cap: cSA, ...(extra.SA || {}) },
      { id: 'SB', from: 'S', to: 'B', flow: flows.SB || 0, cap: cSB, ...(extra.SB || {}) },
      { id: 'AB', from: 'A', to: 'B', flow: flows.AB || 0, cap: cAB, ...(extra.AB || {}) },
      { id: 'AT', from: 'A', to: 'T', flow: flows.AT || 0, cap: cAT, ...(extra.AT || {}) },
      { id: 'BT', from: 'B', to: 'T', flow: flows.BT || 0, cap: cBT, ...(extra.BT || {}) },
    ];

  return {
    id: 'ford-fulkerson',
    chapterId: 'ch1',
    title: '1. Ford–Fulkerson (DFS)',
    complexity: 'O(E · f*)',
    complexityAnalysis: {
      time: 'O(E · f*)',
      space: 'O(V + E)',
      classType: 'Pseudo-polynomial (phụ thuộc giá trị f*)',
      derivation: [
        { step: '1. Chi phí 1 lần tìm đường (DFS)', formula: 'O(V + E) = O(E)', note: 'Mỗi lần gọi DFS thăm mỗi đỉnh và cạnh tối đa 1 lần trên đồ thị thặng dư G_f.' },
        { step: '2. Số lần tăng luồng tối đa', formula: '≤ f* lần', note: 'Với sức chứa nguyên dương, mỗi đường tăng luồng đẩy thêm ít nhất Δ ≥ 1 đơn vị → tối đa f* vòng lặp.' },
        { step: '3. Tổng thời gian', formula: 'O(E) × f* = O(E · f*)', note: 'Nếu chọn đường tệ nhất (Diamond Trap), mỗi vòng chỉ tăng +1 → đạt đúng cận trên 2·U vòng.' },
        { step: '4. Bộ nhớ (Space)', formula: 'O(V + E)', note: 'Lưu danh sách kề G_f (2E cạnh xuôi/ngược) + mảng visited[] và stack đệ quy DFS độ sâu tối đa V.' },
      ],
      worstCase: 'Đồ thị Diamond Trap với 4 cạnh ngoài = U và cạnh chéo = 1: DFS zig-zag mất đúng 2U vòng lặp.',
      vsOthers: [
        { algo: 'Edmonds–Karp', diff: 'Thay DFS bằng BFS → bỏ phụ thuộc f*, ổn định ở O(V · E²).' },
        { algo: 'Capacity Scaling', diff: 'Lọc cạnh ≥ Δ trước → giảm f* xuống còn log₂(U) pha: O(E² log U).' },
      ],
    },
    pseudocode: PSEUDOCODE,
    legend: [
      { type: 'dot', color: 'var(--green-3)', label: 'Luồng đang chảy' },
      { type: 'dot', color: 'var(--amber-2)', label: 'Đường tăng luồng (Augment)' },
      { type: 'line', color: 'var(--violet-2)', dashed: true, label: 'Cạnh ngược thặng dư (Back-edge)' },
      { type: 'line', color: 'var(--rust-2)', dashed: true, label: 'Lát cắt cực tiểu (Min-Cut)' },
    ],
    steps: [
      {
        short: 'Khởi tạo',
        tag: 'Bài toán & Bẫy Kim cương',
        title: 'Đồ thị "Cái bẫy Kim cương" (Diamond Trap)',
        activeLines: [1, 2],
        banner,
        body: [
          `Ta cần đẩy lưu lượng lớn nhất từ nguồn <code>S</code> tới đích <code>T</code>. Các cạnh ngoài có sức chứa lớn (<code>${cSA}/${cSB}</code>), còn cạnh chéo ở giữa <code>A → B</code> có sức chứa <code>${cAB}</code>.`,
          'Ford–Fulkerson dùng <span class="term">DFS</span> chọn <b>bất kỳ</b> đường tăng luồng nào từ <code>S → T</code>. Hãy click thử thay đổi sức chứa các cạnh để thấy số vòng lặp dự kiến thay đổi ngay lập tức!',
        ],
        changes: ['+ Khởi tạo toàn bộ luồng f(u,v) = 0', `+ Tổng luồng cực đại có thể đạt: ${maxOuter}`],
        callout: {
          kind: 'insight',
          title: 'Bản chất Ford–Fulkerson',
          text: 'Thuật toán chỉ cần tìm 1 đường còn sức chứa dương trên đồ thị thặng dư G_f rồi đẩy thêm Δ = bottleneck. Nó không quy định phải chọn đường nào trước.',
        },
        metrics: [
          { id: 'flow', label: 'Max Flow', value: '0', level: 'normal' },
          { id: 'delta', label: 'Bottleneck Δ', value: '—', level: 'normal' },
          { id: 'iter', label: 'Dự kiến lặp', value: `${estIters.toLocaleString('vi-VN')}`, level: estIters > 50 ? 'bad' : 'warn' },
          { id: 'bound', label: 'Độ phức tạp', value: 'O(E · f*)', level: 'normal' },
        ],
        scene: { interactiveEdges: true, nodes: makeNodes(), edges: makeEdges({}) },
      },
      {
        short: 'DFS Lần 1',
        tag: 'Augmenting Path #1',
        title: `DFS chọn nhầm đường qua cạnh giữa A → B (Δ = ${b1})`,
        activeLines: [3, 4],
        banner,
        body: [
          `DFS đi theo đường <code>S → A → B → T</code>. Cạnh <code>A → B</code> có sức chứa <code>${cAB}</code> trở thành <span class="term">nút cổ chai (bottleneck)</span>.`,
          `Ta chỉ đẩy được <code>Δ = min(${cSA}, ${cAB}, ${cBT}) = ${b1}</code> đơn vị luồng trên cả con đường này.`,
        ],
        changes: [`~ Tìm thấy đường P₁: S → A → B → T`, `+ Bottleneck Δ = ${b1} (bị nghẽn tại A → B)`],
        metrics: [
          { id: 'flow', label: 'Max Flow', value: '0', level: 'normal' },
          { id: 'delta', label: 'Bottleneck Δ', value: String(b1), level: 'warn' },
          { id: 'iter', label: 'Vòng lặp', value: '1', level: 'normal' },
          { id: 'bound', label: 'Độ phức tạp', value: 'O(E · f*)', level: 'normal' },
        ],
        scene: {
          interactiveEdges: true,
          nodes: makeNodes({ A: { state: 'active', spot: true }, B: { state: 'active', spot: true } }),
          edges: makeEdges({}, { SA: { kind: 'augment' }, AB: { kind: 'augment' }, BT: { kind: 'augment' } }),
        },
      },
      {
        short: 'Mở cạnh ngược',
        tag: 'Residual Graph',
        title: `Đẩy Δ = ${b1} và sinh cạnh ngược B → A`,
        activeLines: [5, 6, 7],
        banner,
        body: [
          `Sau khi cộng <code>+${b1}</code> vào <code>S→A</code>, <code>A→B</code>, <code>B→T</code>, cạnh <code>A→B</code> đã bão hòa (<code>${b1}/${cAB}</code>).`,
          `Trên đồ thị thặng dư, <span class="term">cạnh ngược nét đứt tím B → A</span> với sức chứa <code>${b1}</code> xuất hiện — cho phép hủy bỏ / đổi hướng luồng đã lỡ đẩy qua <code>A → B</code>.`,
        ],
        changes: [`+ f(S,A)=${b1}, f(A,B)=${b1}, f(B,T)=${b1}`, `+ Mở cạnh ngược thặng dư B → A (c_f = ${b1})`, `+ Tổng luồng |f| tăng 0 → ${b1}`],
        callout: {
          kind: 'tip',
          title: 'Tại sao cần cạnh ngược?',
          text: 'Không có cạnh ngược, một lựa chọn sai ở bước đầu sẽ khóa vĩnh viễn đường tới đáp án tối ưu.',
        },
        metrics: [
          { id: 'flow', label: 'Max Flow', value: String(b1), level: 'good' },
          { id: 'delta', label: 'Bottleneck Δ', value: `+${b1}`, level: 'good' },
          { id: 'iter', label: 'Vòng lặp', value: '1', level: 'normal' },
          { id: 'bound', label: 'Độ phức tạp', value: 'O(E · f*)', level: 'normal' },
        ],
        scene: {
          interactiveEdges: true,
          nodes: makeNodes(),
          edges: makeEdges({ SA: b1, AB: b1, BT: b1 }, { AB: { kind: 'saturated' } }),
        },
      },
      {
        short: 'Đẩy ngược B → A',
        tag: 'Augmenting Path #2 (Undo)',
        title: `DFS đi ngược qua cạnh tím B → A (Δ = ${b2})`,
        activeLines: [3, 4, 7],
        banner,
        body: [
          'Ở vòng lặp 2, DFS phát hiện đường <code>S → B → A → T</code> đi ngược qua cạnh thặng dư <code>B → A</code> (màu tím).',
          `Đẩy <code>Δ = ${b2}</code> dọc đường này sẽ triệt tiêu luồng trên <code>A → B</code> về <code>${b1 - b2}/${cAB}</code>.`,
        ],
        changes: [`~ P₂ đi ngược: S → B ↩ A → T (Δ = ${b2})`, `- Hủy luồng trên A → B: ${b1} → ${b1 - b2}`, `+ Tổng luồng |f| tăng ${b1} → ${b1 + b2}`],
        metrics: [
          { id: 'flow', label: 'Max Flow', value: String(b1 + b2), level: 'warn' },
          { id: 'delta', label: 'Bottleneck Δ', value: `${b2} (ngược)`, level: 'violet' },
          { id: 'iter', label: 'Vòng lặp', value: '2', level: 'warn' },
          { id: 'bound', label: 'Độ phức tạp', value: 'O(E · f*)', level: 'normal' },
        ],
        scene: {
          interactiveEdges: true,
          nodes: makeNodes({ B: { state: 'active', spot: true }, A: { state: 'active', spot: true } }),
          edges: makeEdges({ SA: b1, AB: b1, BT: b1 }, { SB: { kind: 'augment' }, AB: { backAugment: true }, AT: { kind: 'augment' } }),
        },
      },
      {
        short: 'Lặp Zig-Zag',
        tag: 'Cảnh báo Hiệu năng',
        title: `Bẫy Zig-Zag: Mất ~${estIters.toLocaleString('vi-VN')} vòng lặp để đạt ${maxOuter}!`,
        activeLines: [3, 4],
        banner,
        body: [
          `Mỗi vòng lặp tổng luồng chỉ nhích đúng <b>+${cAB}</b>. Với sức chứa hiện tại, Ford–Fulkerson phải chạy khoảng <b>${estIters.toLocaleString('vi-VN')} vòng lặp</b> chỉ trên 4 đỉnh!`,
          'Thử click tăng cạnh giữa <code>A → B</code> để thấy số vòng lặp giảm mạnh, hoặc tăng cạnh ngoài để thấy nó bùng nổ!',
        ],
        changes: [`~ Sau vòng 2: |f| = ${b1 + b2} / ${maxOuter}`, `- Còn phải lặp thêm ~${Math.max(0, estIters - 2).toLocaleString('vi-VN')} lần!`],
        callout: {
          kind: 'warn',
          title: 'Điểm yếu chí mạng của Ford–Fulkerson',
          text: 'Độ phức tạp O(E · f*) phụ thuộc tuyến tính vào GIÁ TRỊ sức chứa f*, không phụ thuộc vào số đỉnh V.',
        },
        metrics: [
          { id: 'flow', label: 'Max Flow', value: `${b1 + b2} / ${maxOuter}`, level: 'bad' },
          { id: 'delta', label: 'Bottleneck Δ', value: String(cAB), level: 'bad' },
          { id: 'iter', label: 'Dự kiến lặp', value: `${estIters.toLocaleString('vi-VN')} lần!`, level: 'bad' },
          { id: 'bound', label: 'Độ phức tạp', value: 'O(E · f*)', level: 'bad' },
        ],
        scene: {
          interactiveEdges: true,
          nodes: makeNodes(),
          edges: makeEdges({ SA: b1, SB: b2, AB: b1 - b2, AT: b2, BT: b1 }, { AB: { kind: 'augment' } }),
        },
      },
      {
        short: 'Kết quả & Min-Cut',
        tag: 'Max-Flow = Min-Cut',
        title: `Hội tụ tại |f*| = ${maxOuter} và Lát cắt cực tiểu`,
        activeLines: [8],
        banner,
        body: [
          `Khi các nhánh ngoài bão hòa, tổng luồng đạt tối ưu <code>|f*| = ${maxOuter}</code>.`,
          `Tập đỉnh <code>Zone S = {S}</code> tách biệt khỏi <code>Zone T = {A, B, T}</code>, chứng minh Max-Flow = Min-Cut.`,
        ],
        changes: [`+ Max Flow đạt tối ưu: |f*| = ${maxOuter}`, `+ Min-Cut = ${maxOuter}`],
        metrics: [
          { id: 'flow', label: 'Max Flow', value: String(maxOuter), level: 'good' },
          { id: 'mincut', label: 'Min-Cut', value: String(maxOuter), level: 'good' },
          { id: 'iter', label: 'Tổng vòng lặp', value: estIters.toLocaleString('vi-VN'), level: 'bad' },
          { id: 'bound', label: 'Độ phức tạp', value: 'O(E · f*)', level: 'normal' },
        ],
        scene: {
          interactiveEdges: true,
          nodes: makeNodes({ S: { state: 'mincut-s' }, A: { state: 'mincut-t' }, B: { state: 'mincut-t' }, T: { state: 'mincut-t' } }),
          zones: [
            { kind: 's', label: 'Zone S', nodes: ['S'] },
            { kind: 't', label: 'Zone T', nodes: ['A', 'B', 'T'] },
          ],
          edges: makeEdges(
            { SA: Math.min(cSA, cAT), SB: Math.min(cSB, cBT), AB: 0, AT: Math.min(cSA, cAT), BT: Math.min(cSB, cBT) },
            { SA: { kind: 'cut' }, SB: { kind: 'cut' }, AT: { kind: 'saturated' }, BT: { kind: 'saturated' } }
          ),
        },
      },
    ],
  };
}

export const lessonFordFulkerson = buildFordFulkersonLesson();
