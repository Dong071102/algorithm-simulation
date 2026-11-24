// ============================================================================
// Ch. 2 — Bài 6: Buffer Tree (Arge 1995 — External Memory I/O-Optimal Tree)
// ============================================================================

const CODE = [
  'function bufferTreeOp(root, op) {',
  '  // Mọi thao tác (Insert / Delete / Query) đều đẩy lười vào Buffer cỡ M của Root!',
  '  root.buffer.push(op);',
  '  if (root.buffer.length >= M) {     // Buffer đầy cỡ RAM M!',
  '    sortInRAM(root.buffer);          // Sắp xếp toàn bộ M phần tử trong RAM (0 I/O)',
  '    distributeToChildren(root);      // Xả hàng loạt xuống tất cả M/B con cùng lúc!',
  '    for (const c of root.children) if (c.buffer.length >= M) flush(c);',
  '  }',
  '}',
];

export const lessonBufferTree = {
  id: 'buffer-tree',
  chapterId: 'ch2',
  title: '6. Buffer Tree (Arge)',
  complexity: 'O((1/B) log_{M/B} N/B)',
  complexityAnalysis: {
    time: 'Amortized: O((1/B) · log_{M/B}(N/B)) I/O mỗi thao tác (Tối ưu lý thuyết!)',
    space: 'O(N / B) khối đĩa',
    classType: 'External Memory Lazy Tree — Nền tảng của Priority Queue & Batch Sorting ngoài đĩa',
    derivation: [
      { step: '1. Bậc phân nhánh lớn M/B + Buffer cỡ M', formula: 'Fanout = Θ(M / B)', note: 'Khác B-Tree (fanout B), Buffer Tree dùng RAM cỡ M làm bộ đệm và phân nhánh tới M/B con → cây siêu thấp!' },
      { step: '2. Chi phí mỗi lần xả (Empty Buffer)', formula: 'O(M / B) I/O cho M thao tác', note: 'Đọc cả buffer cỡ M vào RAM (M/B block), sort trong RAM rồi phân phối xuống các con → chi phí trung bình mỗi thao tác tại 1 tầng chỉ là O(1/B) I/O!' },
      { step: '3. Tổng chi phí qua O(log_{M/B}(N/B)) tầng', formula: 'O((1/B) · log_{M/B}(N/B))', note: 'Đạt cận dưới tối ưu của mô hình bộ nhớ ngoài (External Memory Model) — nhanh hơn B-Tree tới B lần cho tác vụ batch!' },
    ],
    worstCase: 'Không phù hợp cho truy vấn tương tác cần câu trả lời tức thì (online point query) vì lệnh đọc cũng bị xếp hàng trong buffer; cực mạnh cho xử lý lô (offline/batch).',
    vsOthers: [
      { algo: 'Bε-Tree', diff: 'Bε-Tree là phiên bản online của Buffer Tree: trả lời Point Query tức thì bằng cách kiểm tra các buffer nhỏ dọc đường.' },
    ],
  },
  pseudocode: CODE,
  legend: [
    { type: 'dot', color: 'var(--amber-2)', label: 'Buffer cỡ M đang gom thao tác' },
    { type: 'dot', color: 'var(--green-3)', label: 'Sort trong RAM & Xả hàng loạt xuống tầng dưới' },
  ],
  steps: [
    {
      short: 'Gom thao tác vào Buffer M',
      tag: 'External Memory Model (RAM = M, Block = B)',
      title: 'Cả Insert, Delete lẫn Query đều xếp hàng vào Buffer cỡ M của Root!',
      activeLines: [2, 3, 4],
      body: [
        '<span class="term">Buffer Tree (Lars Arge)</span> gắn một <b>bộ đệm khổng lồ cỡ RAM <code>M</code></b> vào mỗi nút trong (fanout <code>M/B</code>).',
        'Khi một lô thao tác <code>[+35, +12, -8, +42, +5, +28]</code> đổ vào, chúng nằm chờ ngay tại <code>Root.buffer</code> cho tới khi đầy cỡ <code>M</code>.',
      ],
      changes: ['+ Gom 6 thao tác vào Root Buffer [6/6 ĐẦY]', '+ Chưa hề thực hiện bất kỳ thao tác tìm kiếm xuống tầng dưới nào!'],
      metrics: [
        { id: 'buf', label: 'Root Buffer', value: '6 / 6 (ĐẦY = M)', level: 'warn' },
        { id: 'io', label: 'Chi phí / lệnh', value: 'O(1/B) / tầng', level: 'good' },
      ],
      scene: {
        nodes: [
          { id: 'R', shape: 'box', label: 'Root | Buf:[+35,+12,-8,+42,+5,+28]', sub: 'Đầy cỡ RAM M → Sort & Flush!', badge: 'SORT RAM', x: 360, y: 75, state: 'active', spot: true },
          { id: 'C1', shape: 'box', label: 'Con 1 (<15) | Buf:[]', x: 130, y: 255, state: 'idle' },
          { id: 'C2', shape: 'box', label: 'Con 2 (15..35) | Buf:[]', x: 360, y: 255, state: 'idle' },
          { id: 'C3', shape: 'box', label: 'Con 3 (>35) | Buf:[]', x: 590, y: 255, state: 'idle' },
        ],
        edges: [
          { id: 'E1', from: 'R', to: 'C1', flow: 0, cap: 1, label: '< 15' },
          { id: 'E2', from: 'R', to: 'C2', flow: 0, cap: 1, label: '15..35' },
          { id: 'E3', from: 'R', to: 'C3', flow: 0, cap: 1, label: '> 35' },
        ],
      },
    },
    {
      short: 'Sort RAM & Xả xuống M/B con',
      tag: 'Bulk Emptying — Tối ưu I/O lý thuyết',
      title: 'Sort trong RAM (0 I/O) → Phân phối cả lô xuống Con 1, Con 2, Con 3!',
      activeLines: [5, 6, 7],
      body: [
        'Đọc toàn bộ <code>Root.buffer</code> vào RAM, sắp xếp thành <code>[+5, -8, +12 | +28, +35 | +42]</code> (tốn <b>0 I/O</b>), rồi phân phối đồng loạt sang buffer của 3 nút con!',
        'Mỗi block đĩa đọc/ghi mang theo trọn vẹn <code>B</code> thao tác cùng lúc → đạt tốc độ tối ưu <code>O((1/B) log_{M/B}(N/B))</code>!',
      ],
      changes: ['+ Con 1 nhận batch [+5, -8, +12]', '+ Con 2 nhận batch [+28, +35] | Con 3 nhận [+42]', '+ Root Buffer trống sạch [0/6]!'],
      metrics: [
        { id: 'amort', label: 'Độ phức tạp', value: 'O((1/B) log_{M/B} N/B)', level: 'good' },
        { id: 'eff', label: 'Hiệu suất Block', value: '100% đầy block B', level: 'good' },
      ],
      scene: {
        nodes: [
          { id: 'R', shape: 'box', label: 'Root | Buf:[ trống ]', sub: 'Đã xả sạch', x: 360, y: 75, state: 'source' },
          { id: 'C1', shape: 'box', label: 'Con 1 | [+5,-8,+12]', badge: '+3', x: 130, y: 255, state: 'tree-s', spot: true },
          { id: 'C2', shape: 'box', label: 'Con 2 | [+28,+35]', badge: '+2', x: 360, y: 255, state: 'tree-s', spot: true },
          { id: 'C3', shape: 'box', label: 'Con 3 | [+42]', badge: '+1', x: 590, y: 255, state: 'tree-s', spot: true },
        ],
        edges: [
          { id: 'E1', from: 'R', to: 'C1', flow: 1, cap: 1, kind: 'augment', label: '3 lệnh' },
          { id: 'E2', from: 'R', to: 'C2', flow: 1, cap: 1, kind: 'augment', label: '2 lệnh' },
          { id: 'E3', from: 'R', to: 'C3', flow: 1, cap: 1, kind: 'augment', label: '1 lệnh' },
        ],
      },
    },
  ],
};
