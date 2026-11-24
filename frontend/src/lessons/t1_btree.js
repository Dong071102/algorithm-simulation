// ============================================================================
// Ch. 2 — Bài 1: B-Tree (Cây cân bằng đa nhánh, Tách nút tràn & Đẩy khóa giữa)
// ============================================================================

const CODE = [
  'function btreeInsert(root, key, order = 3) {',
  '  const leaf = findLeaf(root, key);       // đi xuống lá theo khóa phân hoạch',
  '  insertSorted(leaf.keys, key);',
  '  while (node.keys.length > maxKeys) {    // TRÀN NÚT (Overflow)!',
  '    const mid = Math.floor(node.keys.length / 2);',
  '    const promoteKey = node.keys[mid];    // đẩy khóa giữa lên cha',
  '    splitIntoLeftRight(node, mid);        // tách làm 2 nút trái / phải',
  '    node = node.parent;',
  '  }',
  '}',
];

export const lessonBTree = {
  id: 'b-tree',
  chapterId: 'ch2',
  title: '1. B-Tree',
  complexity: 'O(log_B N)',
  complexityAnalysis: {
    time: 'Search / Insert / Delete: O(log_B N) Disk I/O',
    space: 'O(N)',
    classType: 'Self-balancing Multi-way Tree (Tối ưu cho ổ đĩa / Page 4KB–16KB)',
    derivation: [
      { step: '1. Chiều cao cây với bậc phân nhánh B', formula: 'h ≤ log_{⌈B/2⌉}(N)', note: 'Mỗi nút chứa hàng trăm khóa (khớp 1 trang đĩa 4KB/16KB) → 1 tỷ bản ghi chỉ cao 3–4 tầng!' },
      { step: '2. Chi phí Tìm kiếm (Point Query)', formula: 'O(log_B N) lần đọc trang đĩa', note: 'Mỗi tầng đọc đúng 1 trang đĩa; tìm nhị phân trong RAM tốn O(log B) không đáng kể.' },
      { step: '3. Chi phí Chèn & Tách nút (Split)', formula: 'O(log_B N) I/O', note: 'Trường hợp xấu nhất lan truyền tách nút từ lá lên tận gốc (≤ h lần split).' },
    ],
    worstCase: 'Khi quét dải (Range Scan), B-Tree phải nhảy lên xuống nút trong vì dữ liệu nằm rải rác ở cả nút trong lẫn lá → B+ Tree giải quyết nhược điểm này.',
    vsOthers: [
      { algo: 'BST / Red-Black Tree', diff: 'Cây nhị phân cao ~30 tầng cho 1 tỷ phần tử (30 lần đọc đĩa); B-Tree chỉ cao 3–4 tầng!' },
      { algo: 'B+ Tree', diff: 'B-Tree lưu cả dữ liệu tại nút trong (tìm khóa ở gốc xong ngay), nhưng fanout nhỏ hơn và quét dải chậm hơn B+ Tree.' },
    ],
  },
  pseudocode: CODE,
  legend: [
    { type: 'dot', color: 'var(--green-3)', label: 'Nút đang duyệt / mới chèn' },
    { type: 'dot', color: 'var(--amber-2)', label: 'Nút bị tràn (Overflow) chuẩn bị Split' },
    { type: 'dot', color: 'var(--violet-2)', label: 'Khóa giữa được đẩy lên cha (Promote)' },
  ],
  steps: [
    {
      short: 'Cấu trúc B-Tree',
      tag: 'Cây cân bằng đa nhánh (Max 3 khóa/nút)',
      title: 'Mỗi nút B-Tree chứa nhiều khóa sắp xếp + dữ liệu đi kèm',
      activeLines: [1, 2],
      body: [
        '<span class="term">B-Tree</span> thiết kế để khớp với <b>trang đĩa (Disk Page)</b>: mỗi nút chứa tối đa <code>M-1</code> khóa (ở đây max = <code>3</code> khóa).',
        'Trong B-Tree thuần, <b>cả nút trong lẫn nút lá đều chứa bản ghi dữ liệu</b>. Ta chuẩn bị chèn khóa mới <code>25</code> vào cây.',
      ],
      changes: ['+ Gốc chứa [ 20 | 40 ] phân chia thành 3 nhánh con (<20, 20..40, >40)', '+ Chuẩn bị chèn khóa mới: key = 25'],
      metrics: [
        { id: 'h', label: 'Chiều cao h', value: '2 tầng', level: 'good' },
        { id: 'io', label: 'Disk I/O', value: '2 pages', level: 'normal' },
        { id: 'bound', label: 'Độ phức tạp', value: 'O(log_B N)', level: 'good' },
      ],
      scene: {
        nodes: [
          { id: 'R', shape: 'box', label: '20 | 40', sub: 'Root (2/3)', x: 360, y: 75, state: 'source' },
          { id: 'L1', shape: 'box', label: '5 | 10 | 15', sub: 'Lá 1 (3/3)', x: 130, y: 240, state: 'idle' },
          { id: 'L2', shape: 'box', label: '22 | 30 | 35', sub: 'Lá 2 (3/3 ĐẦY)', x: 360, y: 240, state: 'active' },
          { id: 'L3', shape: 'box', label: '50 | 60', sub: 'Lá 3 (2/3)', x: 590, y: 240, state: 'idle' },
        ],
        edges: [
          { id: 'RL1', from: 'R', to: 'L1', flow: 0, cap: 1, label: '< 20' },
          { id: 'RL2', from: 'R', to: 'L2', flow: 1, cap: 1, kind: 'augment', label: '20..40' },
          { id: 'RL3', from: 'R', to: 'L3', flow: 0, cap: 1, label: '> 40' },
        ],
      },
    },
    {
      short: 'Tràn nút (Overflow)',
      tag: 'Chèn 25 vào Lá 2 → 4/3 khóa!',
      title: 'Lá 2 tràn thành [ 22 | 25 | 30 | 35 ] → Cần Tách nút (Split)!',
      activeLines: [3, 4, 5],
      body: [
        'Khóa <code>25</code> đi theo nhánh <code>20..40</code> rơi vào <code>Lá 2</code>. Sau khi chèn có thứ tự, <code>Lá 2</code> có <b>4 khóa</b> (vượt mức tối đa <code>3</code>).',
        'B-Tree chọn khóa ở giữa <b><code>30</code></b> để <b>đẩy lên nút cha (Promote)</b>, tách phần còn lại thành 2 nửa <code>[22 | 25]</code> và <code>[35]</code>.',
      ],
      changes: ['+ Chèn 25 vào Lá 2 → [22 | 25 | 30 | 35] (OVERFLOW!)', '~ Chọn khóa giữa 30 để Promote lên Root'],
      metrics: [
        { id: 'state', label: 'Trạng thái', value: 'OVERFLOW (4/3)', level: 'bad' },
        { id: 'promote', label: 'Khóa đẩy lên', value: '30', level: 'violet' },
      ],
      scene: {
        nodes: [
          { id: 'R', shape: 'box', label: '20 | 40', sub: 'Root (còn chỗ)', x: 360, y: 75, state: 'source' },
          { id: 'L1', shape: 'box', label: '5 | 10 | 15', sub: 'Lá 1', x: 120, y: 245, state: 'idle' },
          { id: 'L2', shape: 'box', label: '22 | 25 | 30 | 35', sub: 'TRÀN 4/3!', badge: 'SPLIT!', x: 360, y: 245, state: 'orphan', spot: true },
          { id: 'L3', shape: 'box', label: '50 | 60', sub: 'Lá 3', x: 600, y: 245, state: 'idle' },
        ],
        edges: [
          { id: 'RL1', from: 'R', to: 'L1', flow: 0, cap: 1, label: '' },
          { id: 'RL2', from: 'R', to: 'L2', flow: 1, cap: 1, kind: 'cut', label: '↑ đẩy 30' },
          { id: 'RL3', from: 'R', to: 'L3', flow: 0, cap: 1, label: '' },
        ],
      },
    },
    {
      short: 'Split & Cân bằng',
      tag: 'Đẩy 30 lên Root → Mọi lá vẫn cùng độ sâu!',
      title: 'Root nhận 30 thành [ 20 | 30 | 40 ] — Cây cân bằng hoàn hảo!',
      activeLines: [6, 7, 8],
      body: [
        'Khóa <code>30</code> được đưa lên <code>Root</code> (lưu luôn dữ liệu của 30 tại Root), tách Lá 2 thành <code>[22 | 25]</code> và <code>[35]</code>.',
        'Điểm hay của B-Tree: <b>mọi nút lá luôn nằm trên cùng một độ sâu</b> (cây chỉ tăng chiều cao khi chính Root bị tách!).',
      ],
      changes: ['+ Root cập nhật: [ 20 | 30 | 40 ] (3/3)', '+ Tách thành 4 lá cân bằng cùng chiều cao h = 2'],
      metrics: [
        { id: 'h', label: 'Chiều cao h', value: '2 tầng', level: 'good' },
        { id: 'leaves', label: 'Số nút lá', value: '4 lá', level: 'good' },
      ],
      scene: {
        nodes: [
          { id: 'R', shape: 'box', label: '20 | 30 | 40', sub: 'Root (3/3)', badge: '+30', x: 360, y: 75, state: 'tree-s', spot: true },
          { id: 'L1', shape: 'box', label: '5 | 10 | 15', x: 95, y: 250, state: 'idle' },
          { id: 'L2A', shape: 'box', label: '22 | 25', sub: 'Trái mới', x: 270, y: 250, state: 'tree-s', spot: true },
          { id: 'L2B', shape: 'box', label: '35', sub: 'Phải mới', x: 450, y: 250, state: 'tree-s', spot: true },
          { id: 'L3', shape: 'box', label: '50 | 60', x: 625, y: 250, state: 'idle' },
        ],
        edges: [
          { id: 'E1', from: 'R', to: 'L1', flow: 0, cap: 1, label: '' },
          { id: 'E2', from: 'R', to: 'L2A', flow: 1, cap: 1, kind: 'tree-s', label: '' },
          { id: 'E3', from: 'R', to: 'L2B', flow: 1, cap: 1, kind: 'tree-s', label: '' },
          { id: 'E4', from: 'R', to: 'L3', flow: 0, cap: 1, label: '' },
        ],
      },
    },
  ],
};
