// ============================================================================
// Bài 11: Max-Flow trên Đồ thị phẳng (Planar Dual Graph + Dijkstra O(V log V))
// ============================================================================

const CODE = [
  'function planarMaxFlow(planarG, S, T) {',
  '  // 1. Vẽ đường nối S-T chia mặt ngoài thành 2 mặt: f_top (trên) & f_bot (dưới)',
  '  // 2. Dựng Đồ thị đối ngẫu G*: mỗi Mặt (Face) là 1 đỉnh của G*',
  '  //    Mỗi cạnh e của G tương ứng 1 cạnh e* của G* cắt ngang e (trọng số = cap(e))',
  '  const dist = dijkstra(dualG, f_top, f_bot); // O(V log V)!',
  '  // 3. Đường đi ngắn nhất từ f_top → f_bot trong G* CHÍNH LÀ Min-Cut của G!',
  '  return dist[f_bot]; // = Max Flow của đồ thị phẳng!',
  '}',
];

export const lessonPlanar = {
  id: 'planar-maxflow',
  chapterId: 'ch1',
  title: '11. Max-Flow Đồ thị phẳng',
  complexity: 'O(V log V)',
  complexityAnalysis: {
    time: 'O(V log V)',
    space: 'O(V)',
    classType: 'Cấu trúc đặc biệt — Biến Max-Flow thành Dijkstra trên Đồ thị Đối ngẫu!',
    derivation: [
      { step: '1. Tính chất đồ thị phẳng (Công thức Euler)', formula: 'E ≤ 3V - 6, F = O(V)', note: 'Đồ thị phẳng luôn thưa (số cạnh và số mặt đều tuyến tính theo V).' },
      { step: '2. Dựng đồ thị đối ngẫu G* (Dual Graph)', formula: 'O(V)', note: 'Mỗi mặt (face) trở thành 1 đỉnh trong G*; mỗi cạnh gốc e thành 1 cạnh đối ngẫu e* có trọng số bằng cap(e).' },
      { step: '3. Chạy Dijkstra trên G* từ f_top → f_bot', formula: 'O(V log V)', note: 'Mọi lát cắt S-T trên đồ thị phẳng G tương ứng 1-1 với một đường đi từ mặt trên f_top xuống mặt dưới f_bot trên G*!' },
    ],
    worstCase: 'Nhanh vượt trội mọi thuật toán Max-Flow tổng quát (O(V log V) thay vì O(V²E)) khi đồ thị vẽ được trên mặt phẳng không cắt nhau (như bản đồ giao thông, mạch PCB, lưới ảnh 2D).',
    vsOthers: [
      { algo: 'Dinic / Push–Relabel', diff: 'Không cần tìm đường tăng luồng hay đẩy preflow — chỉ cần 1 lần Dijkstra O(V log V) trên đồ thị đối ngẫu!' },
    ],
  },
  pseudocode: CODE,
  legend: [
    { type: 'dot', color: 'var(--green-3)', label: 'Đỉnh đồ thị gốc G (Primal)' },
    { type: 'dot', color: 'var(--amber-2)', label: 'Đỉnh mặt đối ngẫu G* (Dual Face)' },
    { type: 'line', color: 'var(--rust)', dashed: true, label: 'Đường ngắn nhất Dijkstra trên G* = Min-Cut!' },
  ],
  steps: [
    {
      short: 'Đồ thị phẳng G',
      tag: 'Đồ thị s-t Phẳng (Không cạnh cắt nhau)',
      title: 'Đồ thị phẳng G với S và T nằm trên biên ngoài',
      activeLines: [1, 2],
      body: [
        'Một đồ thị <span class="term">s-t phẳng (s-t planar)</span> có thể vẽ trên mặt giấy sao cho không có 2 cạnh nào cắt nhau, đồng thời <code>S</code> và <code>T</code> nằm trên biên ngoài.',
        'Đồ thị này chia mặt phẳng thành <b>4 miền (Faces)</b>: mặt trên cùng <code>f_top</code>, 2 mặt kín ở giữa <code>f₁, f₂</code>, và mặt dưới cùng <code>f_bot</code>.',
      ],
      changes: ['+ Đồ thị gốc G có 5 đỉnh, 6 cạnh không cắt nhau', '+ Xác định 4 mặt (faces): f_top, f₁, f₂, f_bot'],
      metrics: [
        { id: 'faces', label: 'Số mặt (Faces)', value: '4 mặt', level: 'violet' },
        { id: 'bound', label: 'Độ phức tạp', value: 'O(V log V)', level: 'good' },
      ],
      scene: {
        nodes: [
          { id: 'S', label: 'S', sub: 'Nguồn', x: 90, y: 200, state: 'source' },
          { id: 'A', label: 'A', sub: 'Trạm trên', x: 350, y: 85, state: 'idle' },
          { id: 'M', label: 'M', sub: 'Giữa', x: 350, y: 200, state: 'idle' },
          { id: 'B', label: 'B', sub: 'Trạm dưới', x: 350, y: 315, state: 'idle' },
          { id: 'T', label: 'T', sub: 'Đích', x: 610, y: 200, state: 'sink' },
        ],
        edges: [
          { id: 'SA', from: 'S', to: 'A', flow: 0, cap: 7, label: 'cap=7' },
          { id: 'SM', from: 'S', to: 'M', flow: 0, cap: 4, label: 'cap=4' },
          { id: 'SB', from: 'S', to: 'B', flow: 0, cap: 6, label: 'cap=6' },
          { id: 'AT', from: 'A', to: 'T', flow: 0, cap: 3, label: 'cap=3' },
          { id: 'MT', from: 'M', to: 'T', flow: 0, cap: 5, label: 'cap=5' },
          { id: 'BT', from: 'B', to: 'T', flow: 0, cap: 8, label: 'cap=8' },
        ],
      },
    },
    {
      short: 'Dựng Dual Graph G*',
      tag: 'Biến đổi Mặt (Faces) → Đỉnh Đối ngẫu G*',
      title: 'Đặt đỉnh đối ngẫu f_top, f₁, f₂, f_bot vào tâm mỗi mặt',
      activeLines: [3, 4],
      body: [
        'Mỗi miền mặt trở thành một <b>đỉnh màu cam</b> của đồ thị đối ngẫu <code>G*</code>: <code>f_top</code> (trên), <code>f₁</code> (khe trên), <code>f₂</code> (khe dưới), <code>f_bot</code> (dưới).',
        'Mỗi khi đi từ mặt này sang mặt kế bên, ta <b>cắt ngang đúng 1 cạnh gốc</b> → trọng số cạnh đối ngẫu chính bằng <code>cap</code> của cạnh bị cắt!',
      ],
      changes: ['+ Sinh 4 đỉnh đối ngẫu: f_top, f₁, f₂, f_bot', '+ Nối các cạnh đối ngẫu nét đứt cắt ngang cạnh gốc'],
      callout: { kind: 'insight', title: 'Phép đối ngẫu kỳ diệu (Planar Duality)', text: 'Một lát cắt chia đôi S và T trên G tương ứng 1-1 với một con đường đi xuyên từ mặt trên f_top xuống mặt dưới f_bot trên G*!' },
      metrics: [
        { id: 'dual', label: 'Đồ thị G*', value: '4 đỉnh đối ngẫu', level: 'warn' },
        { id: 'algo', label: 'Thuật toán giải', value: 'Dijkstra', level: 'good' },
      ],
      scene: {
        nodes: [
          { id: 'S', label: 'S', x: 80, y: 200, state: 'source' },
          { id: 'A', label: 'A', x: 350, y: 95, state: 'dead' },
          { id: 'M', label: 'M', x: 350, y: 200, state: 'dead' },
          { id: 'B', label: 'B', x: 350, y: 305, state: 'dead' },
          { id: 'T', label: 'T', x: 620, y: 200, state: 'sink' },
          { id: 'FT', label: 'f_top', sub: 'Mặt trên', x: 480, y: 25, state: 'dual', spot: true },
          { id: 'F1', label: 'f₁', sub: 'Mặt giữa 1', x: 480, y: 145, state: 'dual', spot: true },
          { id: 'F2', label: 'f₂', sub: 'Mặt giữa 2', x: 220, y: 255, state: 'dual', spot: true },
          { id: 'FB', label: 'f_bot', sub: 'Mặt dưới', x: 220, y: 375, state: 'dual', spot: true },
        ],
        edges: [
          { id: 'SA', from: 'S', to: 'A', flow: 0, cap: 7, kind: 'off', label: '7' },
          { id: 'SM', from: 'S', to: 'M', flow: 0, cap: 4, kind: 'off', label: '4' },
          { id: 'SB', from: 'S', to: 'B', flow: 0, cap: 6, kind: 'off', label: '6' },
          { id: 'AT', from: 'A', to: 'T', flow: 0, cap: 3, kind: 'off', label: '3' },
          { id: 'MT', from: 'M', to: 'T', flow: 0, cap: 5, kind: 'off', label: '5' },
          { id: 'BT', from: 'B', to: 'T', flow: 0, cap: 8, kind: 'off', label: '8' },
          { id: 'D1', from: 'FT', to: 'F1', flow: 1, cap: 3, kind: 'dual', label: 'cắt A→T (3)' },
          { id: 'D2', from: 'F1', to: 'F2', flow: 1, cap: 4, kind: 'dual', label: 'cắt S→M (4)' },
          { id: 'D3', from: 'F2', to: 'FB', flow: 1, cap: 6, kind: 'dual', label: 'cắt S→B (6)' },
        ],
      },
    },
    {
      short: 'Dijkstra → Max-Flow!',
      tag: 'O(V log V) • Đường ngắn nhất trên G* = Min-Cut',
      title: 'Dijkstra: f_top → f₁ (+3) → f₂ (+4) → f_bot (+6) = 13!',
      activeLines: [5, 6, 7],
      body: [
        'Chạy <span class="term">Dijkstra</span> trên <code>G*</code> tìm đường ngắn nhất từ <code>f_top</code> xuống <code>f_bot</code>: tổng chi phí <code>3 + 4 + 6 = 13</code> (cắt qua 3 cạnh <code>A→T (3)</code>, <code>S→M (4)</code>, <code>S→B (6)</code>).',
        'Theo định lý Max-Flow = Min-Cut, <b>Max Flow của đồ thị phẳng = 13</b> — giải xong trong chỉ <b>O(V log V)</b>!',
      ],
      changes: ['+ Đường ngắn nhất G*: f_top → f₁ → f₂ → f_bot = 3 + 4 + 6 = 13', '+ Suy ra ngay Min-Cut = Max-Flow = 13 trong O(V log V)!'],
      metrics: [
        { id: 'dist', label: 'Dijkstra(G*)', value: '13', level: 'good' },
        { id: 'flow', label: 'Max Flow', value: '13', level: 'good' },
        { id: 'bound', label: 'Độ phức tạp', value: 'O(V log V)', level: 'good' },
      ],
      scene: {
        nodes: [
          { id: 'S', label: 'S', x: 90, y: 200, state: 'mincut-s' },
          { id: 'A', label: 'A', x: 350, y: 85, state: 'mincut-s' },
          { id: 'M', label: 'M', x: 350, y: 200, state: 'mincut-t' },
          { id: 'B', label: 'B', x: 350, y: 315, state: 'mincut-t' },
          { id: 'T', label: 'T', x: 610, y: 200, state: 'mincut-t' },
        ],
        zones: [
          { kind: 's', label: 'Zone S (S, A)', nodes: ['S', 'A'] },
          { kind: 't', label: 'Zone T (M, B, T)', nodes: ['M', 'B', 'T'] },
        ],
        edges: [
          { id: 'SA', from: 'S', to: 'A', flow: 3, cap: 7 },
          { id: 'SM', from: 'S', to: 'M', flow: 4, cap: 4, kind: 'cut' },
          { id: 'SB', from: 'S', to: 'B', flow: 6, cap: 6, kind: 'cut' },
          { id: 'AT', from: 'A', to: 'T', flow: 3, cap: 3, kind: 'cut' },
          { id: 'MT', from: 'M', to: 'T', flow: 4, cap: 5 },
          { id: 'BT', from: 'B', to: 'T', flow: 6, cap: 8 },
        ],
      },
    },
  ],
};
