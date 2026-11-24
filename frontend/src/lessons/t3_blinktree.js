// ============================================================================
// Ch. 2 — Bài 3: B-link Tree (Lehman–Yao, PostgreSQL — High Key & Move-Right!)
// ============================================================================

const CODE = [
  'function blinkSearch(root, key) {',
  '  let node = root;',
  '  while (!node.isLeaf) {',
  '    // Nếu có luồng khác vừa SPLIT nút này → key > highKey!',
  '    while (node.highKey !== null && key > node.highKey) {',
  '      node = node.rightLink; // MOVE RIGHT không cần khóa cha!',
  '    }',
  '    node = findChild(node, key);',
  '  }',
  '  while (node.highKey !== null && key > node.highKey) node = node.rightLink;',
  '  return lookup(node, key);',
  '}',
];

export const lessonBLinkTree = {
  id: 'b-link-tree',
  chapterId: 'ch2',
  title: '3. B-link Tree (PostgreSQL)',
  complexity: 'O(log_B N) Lock-free Read',
  complexityAnalysis: {
    time: 'O(log_B N) + tối đa vài bước Move-Right khi gặp Split đồng thời',
    space: 'O(N) (thêm 1 High Key + 1 Right Pointer mỗi nút)',
    classType: 'Concurrent B+ Tree (Lehman & Yao 1981 — Nhân Index của PostgreSQL!)',
    derivation: [
      { step: '1. Vấn đề của B+ Tree đa luồng (Lock-Coupling)', formula: 'Phải khóa cha + con', note: 'B+ Tree cổ điển phải giữ khóa (crabbing) trên nút cha khi tách nút con → nghẽn cổ chai ở Root khi hàng nghìn luồng cùng đọc/ghi.' },
      { step: '2. Giải pháp B-link Tree: High Key + Right Link', formula: 'key > highKey ⇒ đi sang phải', note: 'Khi tách nút P thành P và P_right, ta nối P.rightLink → P_right TRƯỚC khi cập nhật cha. Luồng đọc chỉ giữ khóa tối đa 1 nút tại 1 thời điểm!' },
      { step: '3. Tính bất khả tử (Deadlock-free)', formula: 'Khóa theo thứ tự trái → phải, dưới → lên', note: 'Không bao giờ xảy ra deadlock giữa luồng đọc và luồng tách nút đồng thời.' },
    ],
    worstCase: 'Nếu luồng đọc bị chậm đúng lúc nút bị split nhiều lần liên tiếp, nó chỉ cần đi sang phải thêm vài bước rightLink.',
    vsOthers: [
      { algo: 'B+ Tree', diff: 'B-link Tree thêm đúng 2 trường (highKey, rightLink) trên MỌI tầng (cả nút trong lẫn lá) để loại bỏ lock-coupling.' },
    ],
  },
  pseudocode: CODE,
  legend: [
    { type: 'dot', color: 'var(--violet-2)', label: 'High Key (HK): Khóa lớn nhất của nút' },
    { type: 'dot', color: 'var(--amber-2)', label: 'Luồng đọc (Reader) dùng Move-Right né Split!' },
    { type: 'dot', color: 'var(--green-3)', label: 'Nút mới tách (chưa kịp gắn lên cha)' },
  ],
  steps: [
    {
      short: 'High Key & Right Link',
      tag: 'Cấu trúc Lehman–Yao (PostgreSQL)',
      title: 'Mỗi nút thêm 2 trường: High Key (HK) và con trỏ phải (rightLink →)',
      activeLines: [1, 2],
      body: [
        'Trong <span class="term">B-link Tree</span>, mọi nút (không chỉ lá) đều gắn thêm <b>High Key (<code>HK</code>)</b> = giá trị khóa lớn nhất thuộc về nút đó, và con trỏ ngang <b><code>rightLink →</code></b> sang anh em bên phải.',
        'Hãy xem kịch bản đa luồng: <b>Reader</b> đang tìm khóa <code>35</code> đi từ <code>Root</code> xuống <code>P</code>, nhưng đúng lúc đó <b>Writer</b> tách đôi nút <code>P</code>!',
      ],
      changes: ['+ Reader đọc Root thấy 35 nằm ở nhánh P (chưa khóa Root!)', '~ Writer đồng thời đang tách nút P thành P và P_new'],
      metrics: [
        { id: 'locks', label: 'Số Lock giữ cùng lúc', value: 'Chỉ 1 nút!', level: 'good' },
        { id: 'target', label: 'Reader đang tìm', value: 'key = 35', level: 'violet' },
      ],
      scene: {
        nodes: [
          { id: 'R', shape: 'box', label: '20 | HK:∞', sub: 'Root (chưa cập nhật!)', x: 360, y: 70, state: 'source' },
          { id: 'L1', shape: 'box', label: '5, 10 | HK:20', x: 130, y: 245, state: 'idle' },
          { id: 'P', shape: 'box', label: '22, 25 | HK:30', sub: 'P vừa bị cắt nửa!', badge: 'HK=30', x: 360, y: 245, state: 'active', spot: true },
          { id: 'P2', shape: 'box', label: '30, 35 | HK:∞', sub: 'P_new (chưa gắn Root!)', badge: 'MỚI', x: 600, y: 245, state: 'tree-s', spot: true },
        ],
        edges: [
          { id: 'E1', from: 'R', to: 'L1', flow: 0, cap: 1, label: '' },
          { id: 'E2', from: 'R', to: 'P', flow: 1, cap: 1, kind: 'augment', label: 'Reader tới P' },
          { id: 'LK1', from: 'L1', to: 'P', flow: 0, cap: 1, kind: 'tree-s', label: '→' },
          { id: 'LK2', from: 'P', to: 'P2', flow: 1, cap: 1, kind: 'tree-s', label: 'rightLink →' },
        ],
      },
    },
    {
      short: 'Phép màu Move-Right!',
      tag: 'key (35) > HK (30) ⇒ Đi sang phải!',
      title: 'Reader thấy 35 > HK(30) → Tự trượt theo rightLink sang P_new!',
      activeLines: [5, 6, 10, 11],
      body: [
        'Khi Reader tới <code>P</code>, <code>Root</code> vẫn chưa hề có con trỏ trỏ tới <code>P_new</code>! Ở B+ Tree thường, Reader sẽ báo lỗi "Không tìm thấy 35"!',
        'Nhưng ở B-link Tree, Reader so sánh: <code>key = 35 > highKey(P) = 30</code> → biết ngay nút <code>P</code> vừa bị tách → <b>tự động trượt ngang theo <code>rightLink →</code> sang <code>P_new</code> và tìm thấy <code>35</code> chính xác 100%!</b>',
      ],
      changes: ['~ Kiểm tra 35 > HK(30) ⇒ Kích hoạt Move-Right!', '+ Trượt theo P.rightLink sang P_new → Tìm thấy 35 mà không cần khóa Root!'],
      callout: { kind: 'insight', title: 'Tại sao PostgreSQL chọn B-link Tree?', text: 'Cho phép hàng nghìn luồng đọc/ghi đồng thời tốc độ cực cao mà không bị nghẽn khóa ở nút gốc (Root contention) và không bao giờ Deadlock!' },
      metrics: [
        { id: 'res', label: 'Kết quả Reader', value: 'Tìm thấy 35 ✓', level: 'good' },
        { id: 'deadlock', label: 'Deadlock', value: 'Không bao giờ', level: 'good' },
      ],
      scene: {
        nodes: [
          { id: 'R', shape: 'box', label: '20 | 30 | HK:∞', sub: 'Root cập nhật sau', x: 360, y: 70, state: 'source' },
          { id: 'L1', shape: 'box', label: '5, 10 | HK:20', x: 130, y: 245, state: 'idle' },
          { id: 'P', shape: 'box', label: '22, 25 | HK:30', badge: '35 > 30!', x: 360, y: 245, state: 'visited' },
          { id: 'P2', shape: 'box', label: '30, 35 | HK:∞', badge: 'FOUND 35!', x: 600, y: 245, state: 'tree-s', spot: true },
        ],
        edges: [
          { id: 'E1', from: 'R', to: 'L1', flow: 0, cap: 1, label: '' },
          { id: 'E2', from: 'R', to: 'P', flow: 0, cap: 1, label: '' },
          { id: 'E3', from: 'R', to: 'P2', flow: 0, cap: 1, kind: 'back', label: 'gắn sau' },
          { id: 'LK2', from: 'P', to: 'P2', flow: 1, cap: 1, kind: 'augment', label: 'MOVE RIGHT →' },
        ],
      },
    },
  ],
};
