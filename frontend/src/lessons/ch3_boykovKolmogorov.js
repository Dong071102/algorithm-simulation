// ============================================================================
// Bài 9: Boykov–Kolmogorov (BK) — Dual Search Trees (S-tree / T-tree) & Orphans
// ============================================================================

const CODE = [
  'function boykovKolmogorov(G, S, T) {',
  '  // Duy trì 2 cây tìm kiếm tái sử dụng: Tree[S] (xanh) & Tree[T] (tím)',
  '  while (true) {',
  '    const path = grow();   // 1. GROWTH: Mở rộng 2 cây cho tới khi chạm nhau',
  '    if (!path) break;',
  '    augment(path);         // 2. AUGMENT: Đẩy luồng → cạnh bão hòa làm gãy cây!',
  '    adopt();               // 3. ADOPTION: Tìm cha mới cho các nút MỒ CÔI (Orphans)',
  '  }',
  '  return minCut(TreeS, TreeT);',
  '}',
];

const NODES = [
  { id: 'S', label: 'S', sub: 'Gốc S-tree', x: 85, y: 200 },
  { id: 'A', label: 'A', sub: 'Nút A', x: 265, y: 95 },
  { id: 'B', label: 'B', sub: 'Nút B', x: 265, y: 305 },
  { id: 'C', label: 'C', sub: 'Nút C', x: 465, y: 95 },
  { id: 'D', label: 'D', sub: 'Nút D', x: 465, y: 305 },
  { id: 'T', label: 'T', sub: 'Gốc T-tree', x: 645, y: 200 },
];

const n = (ov = {}) => NODES.map((x) => ({ ...x, state: x.id === 'S' ? 'source' : x.id === 'T' ? 'sink' : 'idle', ...(ov[x.id] || {}) }));

export const lessonBoykovKolmogorov = {
  id: 'boykov-kolmogorov',
  chapterId: 'ch1',
  title: '9. Boykov–Kolmogorov',
  complexity: 'Vision Std',
  complexityAnalysis: {
    time: 'O(E · V² · |C|) worst-case, ~O(E) thực tế trên ảnh!',
    space: 'O(V + E)',
    classType: 'Dual Search-Tree Reuse — Tiêu chuẩn vàng trong Computer Vision (Graph Cuts)',
    derivation: [
      { step: '1. Tại sao BK cực nhanh trên đồ thị lưới ảnh?', formula: 'Tái sử dụng S-tree & T-tree', note: 'Edmonds–Karp và Dinic vứt bỏ toàn bộ cây BFS sau mỗi bước. BK giữ nguyên 2 cây và chỉ vá lại đúng vài nút bị đứt (Orphans).' },
      { step: '2. Chi phí pha Growth & Augment', formula: 'Rất nhỏ (cục bộ)', note: 'Hai cây mọc từ cả S lẫn T nên gặp nhau ở giữa nhanh hơn gấp đôi.' },
      { step: '3. Nhược điểm lý thuyết (Worst-case)', formula: 'Không đảm bảo đường ngắn nhất', note: 'Do việc nhận nuôi Orphan có thể làm cây bị kéo dài ngoằn ngoèo → lý do IBFS (bài 10) ra đời để khắc phục!' },
    ],
    worstCase: 'Trên một số đồ thị nhân tạo, cây không còn tính chất BFS nên cận lý thuyết rất lớn; nhưng trên ảnh 2D/3D thực tế nó nhanh vượt trội.',
    vsOthers: [
      { algo: 'Edmonds–Karp', diff: 'Không phải xóa và BFS lại từ đầu sau mỗi đường tăng luồng.' },
      { algo: 'IBFS', diff: 'IBFS nâng cấp trực tiếp BK bằng cách giữ nghiêm ngặt khoảng cách BFS khi nhận nuôi Orphan → đạt O(V²E).' },
    ],
  },
  pseudocode: CODE,
  legend: [
    { type: 'dot', color: 'var(--green-3)', label: 'S-tree (Xanh lá)' },
    { type: 'dot', color: 'var(--violet-2)', label: 'T-tree (Tím)' },
    { type: 'dot', color: 'var(--rust-2)', label: 'Orphan (Mồ côi — mất cha!)' },
  ],
  steps: [
    {
      short: '1. Growth (2 cây)',
      tag: 'Pha 1 • GROWTH — Hai cây mọc gặp nhau',
      title: 'S-tree (xanh) và T-tree (tím) đồng thời loang ra và chạm nhau!',
      activeLines: [4],
      body: [
        'Thay vì tìm kiếm một chiều từ <code>S</code>, <span class="term">Boykov–Kolmogorov</span> nuôi song song 2 cây: <b>S-tree (xanh)</b> mọc từ <code>S</code> (<code>S→A</code>, <code>S→B</code>) và <b>T-tree (tím)</b> mọc ngược từ <code>T</code> (<code>C→T</code>, <code>D→T</code>).',
        'Ngay khi cạnh <code>A → C</code> nối một đỉnh xanh với một đỉnh tím → <b>VA CHẠM!</b> Ta lập tức có đường tăng luồng <code>S → A → C → T</code>!',
      ],
      changes: ['+ S-tree = {S, A, B} | T-tree = {T, C, D}', '+ Cạnh A → C nối S-tree với T-tree → Tìm thấy đường P₁!'],
      metrics: [
        { id: 'phase', label: 'Pha BK', value: 'GROWTH', level: 'good' },
        { id: 'orphans', label: 'Orphans', value: '0', level: 'normal' },
        { id: 'flow', label: 'Max Flow', value: '0', level: 'normal' },
      ],
      scene: {
        nodes: n({
          A: { badge: 'S-tree', state: 'tree-s', spot: true }, B: { badge: 'S-tree', state: 'tree-s' },
          C: { badge: 'T-tree', state: 'tree-t', spot: true }, D: { badge: 'T-tree', state: 'tree-t' },
        }),
        edges: [
          { id: 'SA', from: 'S', to: 'A', flow: 0, cap: 6, kind: 'tree-s' },
          { id: 'SB', from: 'S', to: 'B', flow: 0, cap: 8, kind: 'tree-s' },
          { id: 'BA', from: 'B', to: 'A', flow: 0, cap: 5 },
          { id: 'AC', from: 'A', to: 'C', flow: 0, cap: 9, kind: 'augment' },
          { id: 'BD', from: 'B', to: 'D', flow: 0, cap: 4 },
          { id: 'CT', from: 'C', to: 'T', flow: 0, cap: 10, kind: 'tree-t' },
          { id: 'DT', from: 'D', to: 'T', flow: 0, cap: 7, kind: 'tree-t' },
        ],
      },
    },
    {
      short: '2. Augment → Gãy cây!',
      tag: 'Pha 2 • AUGMENT — Sinh nút Mồ côi (Orphan)',
      title: 'Đẩy +6 làm bão hòa S→A → Nút A bị đứt khỏi S-tree (ORPHAN)!',
      activeLines: [6],
      body: [
        'Đẩy <code>Δ = min(6, 9, 10) = 6</code> dọc đường <code>S → A → C → T</code>. Cạnh <code>S → A (6/6)</code> lập tức bão hòa và bị cắt đứt khỏi S-tree.',
        'Nút <code>A</code> mất cha <code>S</code> → trở thành <span class="term">Orphan (nút mồ côi — viền cam đứt nét)</span>! Thay vì phá bỏ toàn bộ 2 cây, BK giữ nguyên <code>B, C, D</code> và chỉ xử lý riêng <code>A</code>.',
      ],
      changes: ['+ Đẩy +6 qua S → A → C → T → |f| = 6', '- Cạnh S→A bão hòa ⇒ A mất cha → đưa A vào hàng đợi Orphans!'],
      metrics: [
        { id: 'phase', label: 'Pha BK', value: 'AUGMENT', level: 'warn' },
        { id: 'orphans', label: 'Orphans', value: '1 (A)', level: 'bad' },
        { id: 'flow', label: 'Max Flow', value: '6', level: 'good' },
      ],
      scene: {
        nodes: n({
          A: { badge: 'ORPHAN!', state: 'orphan', spot: true }, B: { badge: 'S-tree', state: 'tree-s' },
          C: { badge: 'T-tree', state: 'tree-t' }, D: { badge: 'T-tree', state: 'tree-t' },
        }),
        edges: [
          { id: 'SA', from: 'S', to: 'A', flow: 6, cap: 6, kind: 'saturated' },
          { id: 'SB', from: 'S', to: 'B', flow: 0, cap: 8, kind: 'tree-s' },
          { id: 'BA', from: 'B', to: 'A', flow: 0, cap: 5 },
          { id: 'AC', from: 'A', to: 'C', flow: 6, cap: 9 },
          { id: 'BD', from: 'B', to: 'D', flow: 0, cap: 4 },
          { id: 'CT', from: 'C', to: 'T', flow: 6, cap: 10, kind: 'tree-t' },
          { id: 'DT', from: 'D', to: 'T', flow: 0, cap: 7, kind: 'tree-t' },
        ],
      },
    },
    {
      short: '3. Adoption (Nhận nuôi)',
      tag: 'Pha 3 • ADOPTION — Nút B nhận nuôi A!',
      title: 'B ∈ S-tree nhận nuôi A qua cạnh B → A → Tái sử dụng cây tức thì!',
      activeLines: [7],
      body: [
        'Trong pha <span class="term">Adoption</span>, nút mồ côi <code>A</code> tìm hàng xóm cùng thuộc <b>S-tree</b> còn sức chứa đi vào mình: phát hiện <code>B → A (0/5)</code>!',
        '<code>B</code> lập tức trở thành <b>cha mới của A</b>. Toàn bộ nhánh <code>S → B → A → C → T</code> được nối lại chỉ trong <b>O(1)</b> — đẩy tiếp ngay <code>+3</code> (bão hòa <code>A→C: 9/9</code>)!',
      ],
      changes: ['+ B nhận nuôi A (parent[A] = B) → Orphans = 0', '+ Tái sử dụng cây đẩy ngay +3 qua S→B→A→C→T → |f| = 9'],
      callout: { kind: 'insight', title: 'Bí quyết tốc độ của BK', text: 'Trong bài toán tách nền ảnh triệu pixel, mỗi lần đẩy luồng chỉ đứt 1–2 cạnh → pha Adoption chỉ sửa vài nút thay vì BFS lại cả triệu đỉnh!' },
      metrics: [
        { id: 'phase', label: 'Pha BK', value: 'ADOPTION', level: 'good' },
        { id: 'orphans', label: 'Orphans', value: '0 (Đã vá)', level: 'good' },
        { id: 'flow', label: 'Max Flow', value: '9', level: 'good' },
      ],
      scene: {
        nodes: n({
          A: { badge: 'cha: B', state: 'tree-s', spot: true }, B: { badge: 'S-tree', state: 'tree-s' },
          C: { badge: 'T-tree', state: 'tree-t' }, D: { badge: 'T-tree', state: 'tree-t' },
        }),
        edges: [
          { id: 'SA', from: 'S', to: 'A', flow: 6, cap: 6, kind: 'saturated' },
          { id: 'SB', from: 'S', to: 'B', flow: 3, cap: 8, kind: 'tree-s' },
          { id: 'BA', from: 'B', to: 'A', flow: 3, cap: 5, kind: 'augment' },
          { id: 'AC', from: 'A', to: 'C', flow: 9, cap: 9, kind: 'augment' },
          { id: 'BD', from: 'B', to: 'D', flow: 0, cap: 4 },
          { id: 'CT', from: 'C', to: 'T', flow: 9, cap: 10, kind: 'tree-t' },
          { id: 'DT', from: 'D', to: 'T', flow: 0, cap: 7, kind: 'tree-t' },
        ],
      },
    },
    {
      short: 'Hoàn tất & Min-Cut',
      tag: 'Hai cây không thể chạm nhau nữa',
      title: 'Đẩy nốt +4 qua B→D→T → Max Flow = 13, lộ ngay Min-Cut!',
      activeLines: [9],
      body: [
        'Nhánh <code>S → B → D → T</code> đẩy thêm <code>+4</code> làm bão hòa <code>B→D (4/4)</code>. Hai cây <code>S-tree = {S, B, A}</code> và <code>T-tree = {C, D, T}</code> hoàn toàn tách rời.',
        'Lát cắt giữa 2 cây là <code>A→C (9) + B→D (4) = 13 = Max Flow</code>.',
      ],
      changes: ['+ Đẩy +4 qua S→B→D→T → Max Flow = 13', '+ S-tree = {S,A,B} | T-tree = {C,D,T} ⇒ Min-Cut = 13'],
      metrics: [
        { id: 'flow', label: 'Max Flow', value: '13', level: 'good' },
        { id: 'mincut', label: 'Min-Cut', value: '13', level: 'good' },
      ],
      scene: {
        nodes: n({
          S: { state: 'mincut-s' }, A: { state: 'mincut-s' }, B: { state: 'mincut-s' },
          C: { state: 'mincut-t' }, D: { state: 'mincut-t' }, T: { state: 'mincut-t' },
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
