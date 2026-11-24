// ============================================================================
// Ch. 2 — Bài 7: R-Tree (Spatial Indexing — MBR Bounding Boxes & Range Pruning)
// ============================================================================

const CODE = [
  'function rtreeSearch(node, queryBox) {',
  '  const hits = [];',
  '  for (const entry of node.entries) {',
  '    if (!intersects(entry.mbr, queryBox)) continue; // CẮT TỈA nhánh không giao!',
  '    if (node.isLeaf) hits.push(entry.object);',
  '    else hits.push(...rtreeSearch(entry.child, queryBox));',
  '  }',
  '  return hits;',
  '}',
];

export const lessonRTree = {
  id: 'r-tree',
  chapterId: 'ch2',
  title: '7. R-Tree (Spatial Index)',
  complexity: 'Avg: O(log_B N)',
  complexityAnalysis: {
    time: 'Trung bình: O(log_B N) | Xấu nhất: O(N) nếu các MBR chồng lấn nặng',
    space: 'O(N)',
    classType: 'Spatial Multi-dimensional Tree (PostGIS, Google Maps, GIS, Game Engine)',
    derivation: [
      { step: '1. Hộp bao cực tiểu (MBR — Minimum Bounding Rectangle)', formula: '[x_min, y_min, x_max, y_max]', note: 'B-Tree chỉ sắp xếp được dữ liệu 1 chiều (số, chuỗi). R-Tree gom các vật thể 2D/3D gần nhau vào các hình chữ nhật bao cực tiểu (MBR) lồng nhau!' },
      { step: '2. Cắt tỉa không gian (Spatial Pruning)', formula: 'MBR ∩ Query == ∅ ⇒ Bỏ cả nhánh!', note: 'Nếu hộp bao MBR của nút cha không giao với vùng tìm kiếm (vd: bán kính 2km quanh bạn), bỏ qua toàn bộ hàng nghìn điểm bên trong nó!' },
      { step: '3. Chiến lược tách nút (Linear / Quadratic / R*-Tree)', formula: 'Giảm tối đa diện tích & chồng lấn MBR', note: 'Chất lượng R-Tree phụ thuộc vào việc giảm diện tích chồng lấn (overlap) giữa các MBR anh em.' },
    ],
    worstCase: 'Nếu các MBR chồng lấn nhau quá nhiều, truy vấn phải rẽ vào nhiều nhánh song song (R*-Tree cải thiện bằng cách tái chèn để tối thiểu hóa overlap).',
    vsOthers: [
      { algo: 'B+ Tree', diff: 'B+ Tree chỉ lập chỉ mục 1D (theo 1 trục); R-Tree lập chỉ mục trực tiếp không gian 2D/3D (bản đồ, GPS, va chạm vật lý).' },
    ],
  },
  pseudocode: CODE,
  legend: [
    { type: 'dot', color: 'var(--green-3)', label: 'MBR giao với vùng tìm kiếm (Đi sâu vào)' },
    { type: 'dot', color: 'var(--muted)', label: 'MBR KHÔNG giao → Bị cắt tỉa (Pruned!)' },
    { type: 'dot', color: 'var(--amber-2)', label: 'Đối tượng địa lý khớp truy vấn' },
  ],
  steps: [
    {
      short: 'Phân cấp hộp MBR',
      tag: 'Minimum Bounding Rectangles (PostGIS / Maps)',
      title: 'Gom các địa điểm 2D thành các hộp bao lồng nhau (R1, R2)',
      activeLines: [1, 2, 3],
      body: [
        'B-Tree không thể tìm nhanh *"tất cả quán cà phê trong khung bản đồ hiện tại"* vì tọa độ <code>(lat, lng)</code> là 2 chiều. <span class="term">R-Tree</span> gom các điểm gần nhau vào các <b>hộp bao cực tiểu (MBR)</b>: <code>R1 (Quận 1)</code> và <code>R2 (Quận 7)</code>.',
        'Nút gốc <code>Root</code> chỉ lưu đúng 2 hộp bao lớn <code>[ R1 | R2 ]</code>.',
      ],
      changes: ['+ R1 bao cụm Quận 1: {Nhà thờ, Bến Thành}', '+ R2 bao cụm Quận 7: {Phú Mỹ Hưng, Crescent}'],
      metrics: [
        { id: 'dim', label: 'Không gian', value: '2D (lat, lng)', level: 'violet' },
        { id: 'mbr', label: 'Số hộp MBR', value: '2 vùng chính', level: 'normal' },
      ],
      scene: {
        nodes: [
          { id: 'ROOT', shape: 'box', label: 'Root [ MBR: R1 | R2 ]', sub: 'Toàn thành phố', x: 360, y: 65, state: 'source' },
          { id: 'R1', shape: 'box', label: 'R1 (Quận 1)', sub: 'MBR [x:1..4, y:1..4]', x: 185, y: 185, state: 'tree-s' },
          { id: 'R2', shape: 'box', label: 'R2 (Quận 7)', sub: 'MBR [x:6..9, y:5..9]', x: 535, y: 185, state: 'visited' },
          { id: 'P1', shape: 'box', label: 'Nhà thờ (2,2)', x: 105, y: 315, state: 'idle' },
          { id: 'P2', shape: 'box', label: 'Bến Thành (3,3)', x: 265, y: 315, state: 'idle' },
          { id: 'P3', shape: 'box', label: 'PMH (7,7)', x: 455, y: 315, state: 'idle' },
          { id: 'P4', shape: 'box', label: 'Crescent (8,8)', x: 615, y: 315, state: 'idle' },
        ],
        edges: [
          { id: 'E1', from: 'ROOT', to: 'R1', flow: 0, cap: 1, label: '' },
          { id: 'E2', from: 'ROOT', to: 'R2', flow: 0, cap: 1, label: '' },
          { id: 'E3', from: 'R1', to: 'P1', flow: 0, cap: 1, label: '' },
          { id: 'E4', from: 'R1', to: 'P2', flow: 0, cap: 1, label: '' },
          { id: 'E5', from: 'R2', to: 'P3', flow: 0, cap: 1, label: '' },
          { id: 'E6', from: 'R2', to: 'P4', flow: 0, cap: 1, label: '' },
        ],
      },
    },
    {
      short: 'Cắt tỉa nhánh R2!',
      tag: 'Query Box [x:2..4, y:2..4] — Spatial Pruning',
      title: 'R2 không giao Query Box → Cắt bỏ toàn bộ nhánh Quận 7 ngay từ Root!',
      activeLines: [4, 5, 6],
      body: [
        'Người dùng kéo bản đồ xem vùng <code>Query = [x:2..4, y:2..4]</code>:',
        '• Kiểm tra <code>R2 [6..9, 5..9]</code>: <b>KHÔNG GIAO</b> → <b>Cắt tỉa (Prune)</b> toàn bộ nhánh <code>R2</code> (không cần đọc P3, P4!).<br/>• Kiểm tra <code>R1 [1..4, 1..4]</code>: <b>CÓ GIAO</b> → đi xuống lấy ngay <b>Nhà thờ (2,2)</b> và <b>Bến Thành (3,3)</b>!',
      ],
      changes: ['- Cắt tỉa nhánh R2 (Quận 7) ngay tại Root — bỏ qua 50% cây!', '+ Trả về kết quả khớp: Nhà thờ (2,2), Bến Thành (3,3)'],
      callout: { kind: 'insight', title: 'Ứng dụng thực tế', text: 'PostgreSQL (PostGIS), MySQL Spatial, SQLite R*Tree và hệ thống tìm tài xế gần nhất đều dùng R-Tree để cắt bỏ 99% điểm ngoài vùng nhìn thấy chỉ sau vài phép so sánh hình chữ nhật!' },
      metrics: [
        { id: 'pruned', label: 'Nhánh cắt tỉa', value: 'R2 (Bỏ qua!)', level: 'good' },
        { id: 'hits', label: 'Điểm tìm thấy', value: '2 địa điểm', level: 'good' },
      ],
      scene: {
        nodes: [
          { id: 'ROOT', shape: 'box', label: 'Root [ R1 ✓ | R2 ✕ ]', x: 360, y: 65, state: 'source' },
          { id: 'R1', shape: 'box', label: 'R1 (GIAO ✓)', badge: 'MATCH', x: 185, y: 185, state: 'active', spot: true },
          { id: 'R2', shape: 'box', label: 'R2 (KHÔNG GIAO)', badge: 'PRUNED', x: 535, y: 185, state: 'dead' },
          { id: 'P1', shape: 'box', label: 'Nhà thờ (2,2)', x: 105, y: 315, state: 'tree-s', spot: true },
          { id: 'P2', shape: 'box', label: 'Bến Thành (3,3)', x: 265, y: 315, state: 'tree-s', spot: true },
          { id: 'P3', shape: 'box', label: 'PMH (7,7)', x: 455, y: 315, state: 'dead' },
          { id: 'P4', shape: 'box', label: 'Crescent (8,8)', x: 615, y: 315, state: 'dead' },
        ],
        zones: [
          { kind: 's', label: 'Vùng khớp Query [2..4, 2..4]', nodes: ['R1', 'P1', 'P2'] },
        ],
        edges: [
          { id: 'E1', from: 'ROOT', to: 'R1', flow: 1, cap: 1, kind: 'augment', label: 'giao ✓' },
          { id: 'E2', from: 'ROOT', to: 'R2', flow: 0, cap: 1, kind: 'off', label: 'cắt tỉa' },
          { id: 'E3', from: 'R1', to: 'P1', flow: 1, cap: 1, kind: 'tree-s', label: '' },
          { id: 'E4', from: 'R1', to: 'P2', flow: 1, cap: 1, kind: 'tree-s', label: '' },
          { id: 'E5', from: 'R2', to: 'P3', flow: 0, cap: 1, kind: 'off', label: '' },
          { id: 'E6', from: 'R2', to: 'P4', flow: 0, cap: 1, kind: 'off', label: '' },
        ],
      },
    },
  ],
};
