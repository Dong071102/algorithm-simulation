// ============================================================================
// Ch. 2 — Bài 2: B+ Tree (Index-only Internal Nodes + Linked Leaf Chain)
// ============================================================================

const CODE = [
  'function bPlusRangeScan(root, low, high) {',
  '  let leaf = findLeaf(root, low);     // 1. Xuống lá đầu tiên: O(log_B N)',
  '  const result = [];',
  '  while (leaf !== null) {             // 2. Trượt ngang theo danh sách liên kết lá!',
  '    for (const row of leaf.entries) {',
  '      if (row.key > high) return result;',
  '      if (row.key >= low) result.push(row);',
  '    }',
  '    leaf = leaf.nextLeaf;             // O(1) nhảy sang lá kế tiếp!',
  '  } return result;',
  '}',
];

export const lessonBPlusTree = {
  id: 'b-plus-tree',
  chapterId: 'ch2',
  title: '2. B+ Tree',
  complexity: 'O(log_B N + K)',
  complexityAnalysis: {
    time: 'Point: O(log_B N) | Range Scan: O(log_B N + K/B)',
    space: 'O(N)',
    classType: 'Chuẩn Index số 1 của RDBMS (MySQL InnoDB, PostgreSQL, SQLite)',
    derivation: [
      { step: '1. Fanout cao hơn B-Tree nhiều lần', formula: 'Nút trong KHÔNG chứa data', note: 'Vì nút trong chỉ lưu khóa định tuyến (8 bytes) + con trỏ, 1 trang 16KB chứa được >1000 nhánh → cây cực nông (3 tầng cho 1 tỷ dòng!).' },
      { step: '2. Range Scan (WHERE id BETWEEN a AND b)', formula: 'O(log_B N + K/B)', note: 'Chỉ xuống lá 1 lần rồi trượt ngang theo con trỏ nextLeaf — đọc tuần tự (sequential I/O) cực nhanh!' },
      { step: '3. Copy-up khi Split lá', formula: 'Khóa giữa được SAO CHÉP lên cha', note: 'Khác B-Tree (di chuyển khóa lên cha), B+ Tree giữ nguyên bản sao khóa ở nút lá để chuỗi lá chứa 100% dữ liệu.' },
    ],
    worstCase: 'Ghi ngẫu nhiên (Random Insert) vẫn phải đọc-sửa-ghi từng trang 4KB/16KB trên đĩa → chậm hơn LSM-Tree ở tải Write-heavy.',
    vsOthers: [
      { algo: 'B-Tree', diff: 'B+ Tree có fanout lớn hơn, độ sâu nhỏ hơn và Range Scan nhanh gấp nhiều lần nhờ chuỗi lá liên kết.' },
      { algo: 'LSM-Tree', diff: 'B+ Tree đọc ổn định (Read-optimized); LSM-Tree tối ưu ghi tuần tự (Write-optimized).' },
    ],
  },
  pseudocode: CODE,
  legend: [
    { type: 'dot', color: 'var(--blue-2)', label: 'Nút trong: Chỉ chứa khóa định tuyến' },
    { type: 'dot', color: 'var(--green-3)', label: 'Chuỗi lá liên kết (chứa 100% dữ liệu)' },
    { type: 'dot', color: 'var(--amber-2)', label: 'Đường Range Scan trượt ngang' },
  ],
  steps: [
    {
      short: 'Tách Index & Data',
      tag: 'Kiến trúc MySQL InnoDB / SQLite',
      title: 'Nút trong chỉ định tuyến — 100% dữ liệu nằm ở hàng lá nối liền',
      activeLines: [1, 2],
      body: [
        'Điểm khác biệt cốt lõi của <span class="term">B+ Tree</span> so với B-Tree: <b>nút trong chỉ chứa bản sao khóa để chỉ đường</b> (không chứa dữ liệu hàng), nên chứa được nhiều nhánh hơn gấp nhiều lần.',
        'Tất cả dữ liệu thật nằm ở tầng lá dưới cùng và được <b>nối liên tiếp với nhau thành danh sách liên kết</b> (<code>Lá 1 → Lá 2 → Lá 3 → Lá 4</code>).',
      ],
      changes: ['+ Nút trong chỉ lưu khóa dẫn đường [ 20 | 30 | 40 ]', '+ Tầng lá nối ngang: [5,10,15] → [20,25] → [30,35] → [40,50]'],
      metrics: [
        { id: 'fanout', label: 'Fanout', value: 'Cực cao', level: 'good' },
        { id: 'bound', label: 'Range Scan', value: 'O(log_B N + K/B)', level: 'good' },
      ],
      scene: {
        nodes: [
          { id: 'R', shape: 'box', label: '20 | 30 | 40', sub: 'Index Only (không data)', x: 360, y: 70, state: 'visited' },
          { id: 'L1', shape: 'box', label: '5, 10, 15', sub: 'Data Leaf 1', x: 95, y: 245, state: 'tree-s' },
          { id: 'L2', shape: 'box', label: '20, 25', sub: 'Data Leaf 2', x: 270, y: 245, state: 'tree-s' },
          { id: 'L3', shape: 'box', label: '30, 35', sub: 'Data Leaf 3', x: 450, y: 245, state: 'tree-s' },
          { id: 'L4', shape: 'box', label: '40, 50', sub: 'Data Leaf 4', x: 625, y: 245, state: 'tree-s' },
        ],
        edges: [
          { id: 'E1', from: 'R', to: 'L1', flow: 0, cap: 1, label: '' },
          { id: 'E2', from: 'R', to: 'L2', flow: 0, cap: 1, label: '' },
          { id: 'E3', from: 'R', to: 'L3', flow: 0, cap: 1, label: '' },
          { id: 'E4', from: 'R', to: 'L4', flow: 0, cap: 1, label: '' },
          { id: 'N1', from: 'L1', to: 'L2', flow: 1, cap: 1, kind: 'tree-s', label: 'next' },
          { id: 'N2', from: 'L2', to: 'L3', flow: 1, cap: 1, kind: 'tree-s', label: 'next' },
          { id: 'N3', from: 'L3', to: 'L4', flow: 1, cap: 1, kind: 'tree-s', label: 'next' },
        ],
      },
    },
    {
      short: 'Range Scan [20..40]',
      tag: 'Truy vấn dải: SELECT * WHERE k BETWEEN 20 AND 40',
      title: 'Xuống lá [20, 25] một lần → Trượt thẳng ngang qua 3 lá!',
      activeLines: [2, 4, 9],
      body: [
        'Khi chạy truy vấn dải <code>BETWEEN 20 AND 40</code>, B+ Tree đi từ <code>Root</code> xuống đúng <code>Lá 2 [20, 25]</code>.',
        'Sau đó <b>KHÔNG BAO GIỜ quay ngược lên nút cha nữa</b> — chỉ trượt thẳng sang phải theo con trỏ <code>nextLeaf</code>: <code>Lá 2 → Lá 3 → Lá 4</code>! Đây là lý do mọi hệ quản trị SQL dùng B+ Tree.',
      ],
      changes: ['+ Tìm lá bắt đầu: Root → Lá 2 (20)', '+ Quét tuần tự ngang: [20, 25] → [30, 35] → [40] rồi dừng!'],
      callout: { kind: 'insight', title: 'Tại sao Copy-up thay vì Move-up?', text: 'Khi Lá 2 tách ra, khóa 30 vừa được SAO CHÉP lên Root để định tuyến, vừa GIỮ LẠI ở Lá 3 để đường trượt ngang không bị sót mất bản ghi 30!' },
      metrics: [
        { id: 'scan', label: 'Kết quả quét', value: '20, 25, 30, 35, 40', level: 'good' },
        { id: 'back', label: 'Quay lên cha', value: '0 lần!', level: 'good' },
      ],
      scene: {
        nodes: [
          { id: 'R', shape: 'box', label: '20 | 30 | 40', sub: 'Root', x: 360, y: 70, state: 'visited' },
          { id: 'L1', shape: 'box', label: '5, 10, 15', x: 95, y: 245, state: 'dead' },
          { id: 'L2', shape: 'box', label: '20, 25', badge: 'START', x: 270, y: 245, state: 'active', spot: true },
          { id: 'L3', shape: 'box', label: '30, 35', badge: 'SCAN', x: 450, y: 245, state: 'active', spot: true },
          { id: 'L4', shape: 'box', label: '40, 50', badge: 'STOP', x: 625, y: 245, state: 'active', spot: true },
        ],
        edges: [
          { id: 'E1', from: 'R', to: 'L1', flow: 0, cap: 1, kind: 'off', label: '' },
          { id: 'E2', from: 'R', to: 'L2', flow: 1, cap: 1, kind: 'augment', label: 'tìm 20' },
          { id: 'E3', from: 'R', to: 'L3', flow: 0, cap: 1, kind: 'off', label: '' },
          { id: 'E4', from: 'R', to: 'L4', flow: 0, cap: 1, kind: 'off', label: '' },
          { id: 'N1', from: 'L1', to: 'L2', flow: 0, cap: 1, kind: 'off', label: '' },
          { id: 'N2', from: 'L2', to: 'L3', flow: 1, cap: 1, kind: 'augment', label: 'next →' },
          { id: 'N3', from: 'L3', to: 'L4', flow: 1, cap: 1, kind: 'augment', label: 'next →' },
        ],
      },
    },
  ],
};
