// ============================================================================
// Ch. 2 — Bài 8: KD-Tree (K-Dimensional Tree — Alternating Axis & NN Pruning)
// ============================================================================

const CODE = [
  'function kdNearest(node, query, depth = 0, best = { dist: Infinity }) {',
  '  if (!node) return best;',
  '  const axis = depth % K;               // Luân phiên trục: X (0) → Y (1) → X...',
  '  const d = euclidean(node.pt, query);',
  '  if (d < best.dist) best = { pt: node.pt, dist: d };',
  '  const diff = query[axis] - node.pt[axis];',
  '  const [near, far] = diff < 0 ? [node.left, node.right] : [node.right, node.left];',
  '  best = kdNearest(near, query, depth + 1, best); // 1. Đi nhánh gần trước',
  '  if (Math.abs(diff) < best.dist) {               // 2. Chỉ qua nhánh kia nếu vòng tròn cắt mặt phẳng!',
  '    best = kdNearest(far, query, depth + 1, best);',
  '  } return best;',
  '}',
];

export const lessonKDTree = {
  id: 'kd-tree',
  chapterId: 'ch2',
  title: '8. KD-Tree (k-NN)',
  complexity: 'Avg: O(log N)',
  complexityAnalysis: {
    time: 'Build: O(N log N) | k-NN Avg: O(log N) | Range: O(N^{1-1/k} + m)',
    space: 'O(N)',
    classType: 'Space-Partitioning Binary Tree (Scikit-learn, OpenCV, Point Cloud LiDAR)',
    derivation: [
      { step: '1. Chia đôi không gian luân phiên theo trục (axis = depth % k)', formula: 'Build: O(N log N)', note: 'Mỗi tầng chọn trung vị (median) theo trục X, rồi Y, rồi Z... giúp cây nhị phân cân bằng tuyệt đối với chiều cao log₂ N.' },
      { step: '2. Tìm Láng giềng gần nhất (Nearest Neighbor)', formula: 'Avg: O(log N)', note: 'Đi thẳng xuống nhánh chứa điểm truy vấn để lấy bán kính best.dist nhỏ nhất, sau đó khi quay lui CHỈ rẽ sang nhánh kia nếu |query[axis] - split| < best.dist!' },
      { step: '3. Lời nguyền số chiều (Curse of Dimensionality)', formula: 'k > 20 ⇒ tiến về O(N)', note: 'Khi số chiều k lớn (vd embedding 768D của AI), hầu như mọi siêu phẳng đều bị cắt → phải chuyển sang ANN (HNSW, IVF).' },
    ],
    worstCase: 'Số chiều k quá cao (k > 20) hoặc chèn xóa động nhiều lần không cân bằng lại làm cây lệch thành O(N).',
    vsOthers: [
      { algo: 'R-Tree', diff: 'KD-Tree chia không gian thành các nửa KHÔNG chồng lấn (mạnh cho điểm tĩnh & k-NN trong RAM); R-Tree gom hộp MBR (mạnh cho đa giác/hình chữ nhật & lưu đĩa động).' },
    ],
  },
  pseudocode: CODE,
  legend: [
    { type: 'dot', color: 'var(--blue-2)', label: 'Tầng cắt theo trục X (Trái < x | Phải ≥ x)' },
    { type: 'dot', color: 'var(--violet-2)', label: 'Tầng cắt theo trục Y (Dưới < y | Trên ≥ y)' },
    { type: 'dot', color: 'var(--green-3)', label: 'Ứng viên gần nhất (best.dist)' },
    { type: 'dot', color: 'var(--muted)', label: 'Nhánh bị cắt tỉa (|diff| ≥ best.dist)' },
  ],
  steps: [
    {
      short: 'Luân phiên trục X / Y',
      tag: 'Phân hoạch không gian k chiều (k = 2)',
      title: 'Cắt trục X tại gốc (5,4) → Tầng 1 cắt trục Y tại (2,6) và (7,2)',
      activeLines: [1, 3],
      body: [
        '<span class="term">KD-Tree</span> là cây nhị phân phân hoạch không gian <code>k</code> chiều bằng cách <b>luân phiên trục chia</b> ở mỗi tầng: <code>Tầng 0</code> cắt theo <b>trục X</b>, <code>Tầng 1</code> cắt theo <b>trục Y</b>, <code>Tầng 2</code> quay lại <b>trục X</b>...',
        'Khác với R-Tree (các hộp MBR có thể chồng lấn), các miền chia của KD-Tree <b>hoàn toàn rời nhau</b>!',
      ],
      changes: ['+ Gốc (5,4) cắt theo X: trái có x < 5, phải có x ≥ 5', '+ Tầng 1: (2,6) và (7,2) cắt theo Y'],
      metrics: [
        { id: 'dim', label: 'Số chiều k', value: '2D (X, Y)', level: 'violet' },
        { id: 'h', label: 'Chiều cao', value: 'log₂ N', level: 'good' },
      ],
      scene: {
        nodes: [
          { id: 'R', shape: 'box', label: '(5, 4)', sub: 'Chia trục X = 5', badge: 'X', x: 360, y: 65, state: 'visited' },
          { id: 'L', shape: 'box', label: '(2, 6)', sub: 'Chia trục Y = 6', badge: 'Y', x: 185, y: 185, state: 'tree-t' },
          { id: 'RI', shape: 'box', label: '(7, 2)', sub: 'Chia trục Y = 2', badge: 'Y', x: 535, y: 185, state: 'tree-t' },
          { id: 'LL', shape: 'box', label: '(1, 3)', sub: 'y < 6', x: 105, y: 315, state: 'idle' },
          { id: 'LR', shape: 'box', label: '(3, 8)', sub: 'y ≥ 6', x: 265, y: 315, state: 'idle' },
          { id: 'RL', shape: 'box', label: '(6, 1)', sub: 'y < 2', x: 455, y: 315, state: 'idle' },
          { id: 'RR', shape: 'box', label: '(8, 5)', sub: 'y ≥ 2', x: 615, y: 315, state: 'idle' },
        ],
        edges: [
          { id: 'E1', from: 'R', to: 'L', flow: 0, cap: 1, label: 'x < 5' },
          { id: 'E2', from: 'R', to: 'RI', flow: 0, cap: 1, label: 'x ≥ 5' },
          { id: 'E3', from: 'L', to: 'LL', flow: 0, cap: 1, label: 'y < 6' },
          { id: 'E4', from: 'L', to: 'LR', flow: 0, cap: 1, label: 'y ≥ 6' },
          { id: 'E5', from: 'RI', to: 'RL', flow: 0, cap: 1, label: 'y < 2' },
          { id: 'E6', from: 'RI', to: 'RR', flow: 0, cap: 1, label: 'y ≥ 2' },
        ],
      },
    },
    {
      short: 'Đi xuống nhánh gần nhất',
      tag: 'Tìm 1-NN cho điểm truy vấn Q = (6, 3)',
      title: 'Từ Root đi thẳng xuống nhánh phải → Tìm thấy ứng viên (7, 2) (d = 1.41)',
      activeLines: [4, 5, 6, 7, 8],
      body: [
        'Cần tìm điểm gần <code>Q = (6, 3)</code> nhất:',
        '• Tại Root <code>(5,4)</code>: <code>x=6 ≥ 5</code> → rẽ phải (<code>d(Q, (5,4)) = 1.41</code>).<br/>• Tại <code>(7,2)</code>: <code>y=3 ≥ 2</code> → rẽ sang <code>(8,5)</code> (<code>d = 2.83</code>). Ứng viên tốt nhất hiện tại có bán kính <b><code>best.dist = 1.41</code></b>!',
      ],
      changes: ['+ Đi nhánh gần: (5,4) → (7,2) → (8,5)', '+ Bán kính tốt nhất hiện tại: best.dist = √2 ≈ 1.41'],
      metrics: [
        { id: 'q', label: 'Truy vấn Q', value: '(6, 3)', level: 'violet' },
        { id: 'best', label: 'best.dist', value: '1.41', level: 'good' },
      ],
      scene: {
        nodes: [
          { id: 'R', shape: 'box', label: '(5, 4)', badge: 'd=1.41', x: 360, y: 65, state: 'active', spot: true },
          { id: 'L', shape: 'box', label: '(2, 6)', x: 185, y: 185, state: 'idle' },
          { id: 'RI', shape: 'box', label: '(7, 2)', badge: 'd=1.41 ★', x: 535, y: 185, state: 'tree-s', spot: true },
          { id: 'LL', shape: 'box', label: '(1, 3)', x: 105, y: 315, state: 'idle' },
          { id: 'LR', shape: 'box', label: '(3, 8)', x: 265, y: 315, state: 'idle' },
          { id: 'RL', shape: 'box', label: '(6, 1)', x: 455, y: 315, state: 'idle' },
          { id: 'RR', shape: 'box', label: '(8, 5)', badge: 'd=2.83', x: 615, y: 315, state: 'active' },
        ],
        edges: [
          { id: 'E1', from: 'R', to: 'L', flow: 0, cap: 1, label: 'x < 5' },
          { id: 'E2', from: 'R', to: 'RI', flow: 1, cap: 1, kind: 'augment', label: 'x ≥ 5' },
          { id: 'E3', from: 'L', to: 'LL', flow: 0, cap: 1, label: '' },
          { id: 'E4', from: 'L', to: 'LR', flow: 0, cap: 1, label: '' },
          { id: 'E5', from: 'RI', to: 'RL', flow: 0, cap: 1, label: '' },
          { id: 'E6', from: 'RI', to: 'RR', flow: 1, cap: 1, kind: 'augment', label: 'y ≥ 2' },
        ],
      },
    },
    {
      short: 'Quay lui & Cắt tỉa!',
      tag: 'Kiểm tra điều kiện |diff| < best.dist',
      title: 'Cắt tỉa nhánh (3,8) & (1,3) — Khóa kết quả gần nhất với O(log N)!',
      activeLines: [9, 10, 11],
      body: [
        'Khi quay lui về <code>(7,2)</code>: khoảng cách tới đường cắt <code>y = 2</code> là <code>|3 - 2| = 1 < 1.41</code> → kiểm tra nhanh <code>(6,1)</code> (<code>d = 2.0 > 1.41</code>).',
        'Khi quay lui sang nhánh trái <code>(2,6)</code>: khoảng cách từ <code>Q(6,3)</code> tới <code>y=6</code> là <code>|3 - 6| = 3 ≥ 1.41</code> → <b>CẮT TỈA ngay toàn bộ nhánh <code>(3,8)</code></b> mà không cần tính khoảng cách!',
      ],
      changes: ['- Cắt tỉa (Prune) nhánh (3,8) vì |3 - 6| = 3 ≥ 1.41', '+ Kết luận 1-NN của Q(6,3) là (5,4) & (7,2) với khoảng cách 1.41'],
      callout: { kind: 'insight', title: 'Khi nào dùng KD-Tree vs R-Tree?', text: 'Dùng KD-Tree cho tập điểm tĩnh trong RAM cần tìm k-NN siêu nhanh (LiDAR, đồ họa 3D, ML số chiều thấp k ≤ 15). Dùng R-Tree cho dữ liệu bản đồ động & hình đa giác trên đĩa!' },
      metrics: [
        { id: 'best', label: '1-NN tốt nhất', value: '(7,2) d=1.41', level: 'good' },
        { id: 'pruned', label: 'Đã cắt tỉa', value: 'Nhánh (3,8)', level: 'good' },
      ],
      scene: {
        nodes: [
          { id: 'R', shape: 'box', label: '(5, 4)', badge: 'BEST 1.41', x: 360, y: 65, state: 'tree-s', spot: true },
          { id: 'L', shape: 'box', label: '(2, 6)', badge: '|y-6|=3≥1.4', x: 185, y: 185, state: 'visited' },
          { id: 'RI', shape: 'box', label: '(7, 2)', badge: 'BEST 1.41', x: 535, y: 185, state: 'tree-s', spot: true },
          { id: 'LL', shape: 'box', label: '(1, 3)', badge: 'PRUNED', x: 105, y: 315, state: 'dead' },
          { id: 'LR', shape: 'box', label: '(3, 8)', badge: 'PRUNED', x: 265, y: 315, state: 'dead' },
          { id: 'RL', shape: 'box', label: '(6, 1)', badge: 'd=2.0', x: 455, y: 315, state: 'idle' },
          { id: 'RR', shape: 'box', label: '(8, 5)', badge: 'd=2.83', x: 615, y: 315, state: 'idle' },
        ],
        edges: [
          { id: 'E1', from: 'R', to: 'L', flow: 0, cap: 1, kind: 'back', label: 'check |x-5|=1' },
          { id: 'E2', from: 'R', to: 'RI', flow: 1, cap: 1, kind: 'tree-s', label: '' },
          { id: 'E3', from: 'L', to: 'LL', flow: 0, cap: 1, kind: 'off', label: 'cắt tỉa' },
          { id: 'E4', from: 'L', to: 'LR', flow: 0, cap: 1, kind: 'off', label: 'cắt tỉa' },
          { id: 'E5', from: 'RI', to: 'RL', flow: 0, cap: 1, label: '' },
          { id: 'E6', from: 'RI', to: 'RR', flow: 0, cap: 1, label: '' },
        ],
      },
    },
  ],
};
