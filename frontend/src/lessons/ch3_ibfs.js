// ============================================================================
// Bài 10: IBFS (Incremental Breadth-First Search) — Bidirectional Shortest Trees
// ============================================================================

const CODE = [
  'function ibfs(G, S, T) {',
  '  // Duy trì 2 cây BFS ĐÚNG ĐỘ SÂU: dS[u] (từ S) & dT[v] (từ T)',
  '  while (S-tree và T-tree còn mở rộng được) {',
  '    const path = bidirectionalGrow(); // mở rộng cây có ít nút biên hơn',
  '    augment(path);                    // đẩy luồng trên đường ngắn nhất',
  '    // Khác BK: Khi nhận nuôi Orphan u, CHỈ chọn cha p có d[p] === d[u]-1!',
  '    // Nếu không có → tăng d[u]++ (giữ bất biến BFS nghiêm ngặt)',
  '    incrementalAdopt();',
  '  } return flow;',
  '}',
];

const NODES = [
  { id: 'S', label: 'S', sub: 'dS=0', x: 85, y: 200 },
  { id: 'A', label: 'A', sub: 'Nút A', x: 265, y: 95 },
  { id: 'B', label: 'B', sub: 'Nút B', x: 265, y: 305 },
  { id: 'C', label: 'C', sub: 'Nút C', x: 465, y: 95 },
  { id: 'D', label: 'D', sub: 'Nút D', x: 465, y: 305 },
  { id: 'T', label: 'T', sub: 'dT=0', x: 645, y: 200 },
];

const n = (ov = {}) => NODES.map((x) => ({ ...x, state: x.id === 'S' ? 'source' : x.id === 'T' ? 'sink' : 'idle', ...(ov[x.id] || {}) }));

export const lessonIBFS = {
  id: 'ibfs',
  chapterId: 'ch1',
  title: '10. IBFS (Incremental BFS)',
  complexity: 'O(V² · E)',
  complexityAnalysis: {
    time: 'O(V² · E)',
    space: 'O(V + E)',
    classType: 'Strongly Polynomial — Kế thừa tốc độ BK nhưng triệt tiêu Worst-case!',
    derivation: [
      { step: '1. Bất biến cây BFS hai chiều (dS và dT)', formula: 'dS[v] = dS[parent]+1', note: 'Khác BK (nhận bất kỳ cha nào), IBFS bắt buộc cha mới phải có khoảng cách đúng bằng d[u]-1 (hoặc tăng d[u] lên từng nấc +1).' },
      { step: '2. Số lần tăng nhãn dS[u] / dT[u]', formula: '≤ V lần / đỉnh', note: 'Vì cây luôn là cây BFS chuẩn, độ dài đường tăng luồng chỉ tăng, không bao giờ bị kéo dài hỗn loạn như BK.' },
      { step: '3. Tổng thời gian (Goldberg et al., 2011)', formula: 'O(V² · E)', note: 'Đạt cận đa thức mạnh O(V²E) như Dinic nhưng giữ được tốc độ cực nhanh của cây 2 chiều BK!' },
    ],
    worstCase: 'Nhanh ổn định trên CẢ ảnh 2D/3D (Vision) lẫn đồ thị tổng quát có đường đi dài.',
    vsOthers: [
      { algo: 'Boykov–Kolmogorov', diff: 'BK nhận nuôi Orphan tùy tiện có thể bị chậm cấp mũ; IBFS giữ chuẩn nhãn dS/dT nên luôn đảm bảo O(V²E).' },
      { algo: 'Dinic', diff: 'Dinic xây lại Level Graph từ con số 0 mỗi pha; IBFS chỉ cập nhật gia tăng (incremental) các nút bị ảnh hưởng.' },
    ],
  },
  pseudocode: CODE,
  legend: [
    { type: 'dot', color: 'var(--green-3)', label: 'S-tree chuẩn BFS (dS=k)' },
    { type: 'dot', color: 'var(--violet-2)', label: 'T-tree chuẩn BFS (dT=k)' },
    { type: 'dot', color: 'var(--amber-2)', label: 'Orphan nâng bậc dS: 1 → 2' },
  ],
  steps: [
    {
      short: '2 cây BFS chuẩn',
      tag: 'Bidirectional BFS Invariant',
      title: 'Cả S-tree (dS) và T-tree (dT) đều giữ chuẩn khoảng cách BFS',
      activeLines: [2, 4],
      body: [
        '<span class="term">IBFS (Goldberg et al.)</span> kết hợp ưu điểm của <b>Edmonds–Karp/Dinic</b> (đường ngắn nhất) và <b>Boykov–Kolmogorov</b> (tái sử dụng 2 cây).',
        'Mọi nút trên S-tree đều mang nhãn <code>dS</code> chuẩn (<code>S:0, A:1, B:1</code>) và T-tree mang nhãn <code>dT</code> chuẩn (<code>T:0, C:1, D:1</code>). Khi <code>A→C</code> chạm nhau, ta đẩy <code>+6</code> qua đường ngắn nhất <code>S→A→C→T</code> (3 cạnh).',
      ],
      changes: ['+ S-tree: S(dS=0), A(dS=1), B(dS=1)', '+ T-tree: T(dT=0), C(dT=1), D(dT=1)', '+ Đẩy +6 trên đường ngắn nhất 3 cạnh (bão hòa S→A)'],
      metrics: [
        { id: 'inv', label: 'Bất biến BFS', value: 'Chuẩn ✓', level: 'good' },
        { id: 'flow', label: 'Max Flow', value: '6', level: 'good' },
        { id: 'bound', label: 'Độ phức tạp', value: 'O(V²·E)', level: 'good' },
      ],
      scene: {
        nodes: n({
          S: { badge: 'dS=0' }, A: { badge: 'dS=1', state: 'tree-s', spot: true }, B: { badge: 'dS=1', state: 'tree-s' },
          C: { badge: 'dT=1', state: 'tree-t', spot: true }, D: { badge: 'dT=1', state: 'tree-t' }, T: { badge: 'dT=0' },
        }),
        edges: [
          { id: 'SA', from: 'S', to: 'A', flow: 6, cap: 6, kind: 'augment' },
          { id: 'SB', from: 'S', to: 'B', flow: 0, cap: 8, kind: 'tree-s' },
          { id: 'BA', from: 'B', to: 'A', flow: 0, cap: 5 },
          { id: 'AC', from: 'A', to: 'C', flow: 6, cap: 9, kind: 'augment' },
          { id: 'BD', from: 'B', to: 'D', flow: 0, cap: 4 },
          { id: 'CT', from: 'C', to: 'T', flow: 6, cap: 10, kind: 'augment' },
          { id: 'DT', from: 'D', to: 'T', flow: 0, cap: 7, kind: 'tree-t' },
        ],
      },
    },
    {
      short: 'Incremental Adopt',
      tag: 'Khác biệt cốt lõi so với BK!',
      title: 'A bị mồ côi: Không có cha dS=0 → Nâng dS[A]: 1 → 2 rồi nhận B(dS=1)!',
      activeLines: [6, 7, 8],
      body: [
        'Khi <code>S→A</code> bão hòa, <code>A (dS=1)</code> thành Orphan. IBFS tìm cha có <code>dS = 0</code> (không có!).',
        'Thay vì nhận đại như BK, IBFS <b>tăng nhãn <code>dS[A] = 1 → 2</code></b> rồi tìm cha có <code>dS = 1</code> → tìm thấy <code>B (dS=1)</code>! Cây S-tree giữ <b>100% tính chất BFS chuẩn</b> mà không phải BFS lại toàn mạng!',
      ],
      changes: ['~ Không có cha dS=0 cho A ⇒ Tăng dS[A]: 1 → 2', '+ Nhận nuôi chuẩn BFS: parent[A] = B (vì dS[B] = 1 = dS[A] - 1)', '+ Đảm bảo đường tiếp theo luôn ngắn nhất (4 cạnh)!'],
      callout: { kind: 'tip', title: 'Tại sao giữ chuẩn dS[A]=2 quan trọng?', text: 'Nó giúp chứng minh toán học rằng mỗi đỉnh tăng nhãn tối đa V lần → khóa chặt độ phức tạp O(V²E), không bao giờ bị dính worst-case cấp mũ như BK!' },
      metrics: [
        { id: 'inv', label: 'dS[A] mới', value: '1 → 2 (Chuẩn)', level: 'violet' },
        { id: 'flow', label: 'Max Flow', value: '6', level: 'normal' },
      ],
      scene: {
        nodes: n({
          S: { badge: 'dS=0' }, A: { badge: 'dS=2 ★', state: 'orphan', spot: true }, B: { badge: 'dS=1', state: 'tree-s' },
          C: { badge: 'dT=1', state: 'tree-t' }, D: { badge: 'dT=1', state: 'tree-t' }, T: { badge: 'dT=0' },
        }),
        edges: [
          { id: 'SA', from: 'S', to: 'A', flow: 6, cap: 6, kind: 'saturated' },
          { id: 'SB', from: 'S', to: 'B', flow: 0, cap: 8, kind: 'tree-s' },
          { id: 'BA', from: 'B', to: 'A', flow: 0, cap: 5, kind: 'tree-s' },
          { id: 'AC', from: 'A', to: 'C', flow: 6, cap: 9 },
          { id: 'BD', from: 'B', to: 'D', flow: 0, cap: 4 },
          { id: 'CT', from: 'C', to: 'T', flow: 6, cap: 10, kind: 'tree-t' },
          { id: 'DT', from: 'D', to: 'T', flow: 0, cap: 7, kind: 'tree-t' },
        ],
      },
    },
    {
      short: 'Ưu tiên đường 3 cạnh',
      tag: 'Đẩy theo thứ tự độ dài tăng dần',
      title: 'Chọn đường 3 cạnh S→B→D→T (+4) TRƯỚC đường 4 cạnh S→B→A→C→T (+3)!',
      activeLines: [4, 5],
      body: [
        'Nhờ nhãn <code>dS[B]=1, dT[D]=1</code> (tổng 3 cạnh) nhỏ hơn <code>dS[A]=2, dT[C]=1</code> (tổng 4 cạnh), IBFS đẩy <code>+4</code> trên <code>S→B→D→T</code> trước, rồi mới đẩy <code>+3</code> trên <code>S→B→A→C→T</code>!',
        'Tổng luồng hội tụ tại <b>13 = Min-Cut</b> với số thao tác ít nhất và bảo chứng <code>O(V²E)</code>.',
      ],
      changes: ['+ Đẩy +4 (3 cạnh): S → B → D → T', '+ Đẩy +3 (4 cạnh): S → B → A → C → T', '+ Max Flow = 13 | Min-Cut = {A→C, B→D} = 13'],
      metrics: [
        { id: 'flow', label: 'Max Flow', value: '13', level: 'good' },
        { id: 'mincut', label: 'Min-Cut', value: '13', level: 'good' },
        { id: 'bound', label: 'Độ phức tạp', value: 'O(V²·E)', level: 'good' },
      ],
      scene: {
        nodes: n({
          S: { state: 'mincut-s' }, A: { badge: 'dS=2', state: 'mincut-s' }, B: { badge: 'dS=1', state: 'mincut-s' },
          C: { badge: 'dT=1', state: 'mincut-t' }, D: { badge: 'dT=1', state: 'mincut-t' }, T: { state: 'mincut-t' },
        }),
        zones: [
          { kind: 's', label: 'S-tree (Zone S)', nodes: ['S', 'A', 'B'] },
          { kind: 't', label: 'T-tree (Zone T)', nodes: ['C', 'D', 'T'] },
        ],
        edges: [
          { id: 'SA', from: 'S', to: 'A', flow: 6, cap: 6, kind: 'saturated' },
          { id: 'SB', from: 'S', to: 'B', flow: 7, cap: 8 },
          { id: 'BA', from: 'B', to: 'A', flow: 3, cap: 5 },
          { id: 'AC', from: 'A', to: 'C', flow: 9, cap: 9, kind: 'cut' },
          { id: 'BD', from: 'B', to: 'D', flow: 4, cap: 4, kind: 'cut' },
          { id: 'CT', from: 'C', to: 'T', flow: 9, cap: 10 },
          { id: 'DT', from: 'D', to: 'T', flow: 4, cap: 7 },
        ],
      },
    },
  ],
};
