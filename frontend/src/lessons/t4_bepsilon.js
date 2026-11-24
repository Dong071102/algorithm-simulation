// ============================================================================
// Ch. 2 — Bài 4: Bε-Tree (B-epsilon / Beclip Tree — Message Buffer + Lazy Flush)
// ============================================================================

const CODE = [
  'function bEpsilonInsert(root, key, val) {',
  '  // KHÔNG đi xuống lá ngay! Ghi thông điệp (+key, val) vào Buffer của Root:',
  '  root.buffer.push({ op: "PUT", key, val });',
  '  if (root.buffer.length >= B - Math.pow(B, eps)) {',
  '    // Khi Buffer đầy → Xả hàng loạt (Batch Flush) xuống con chứa nhiều tin nhất!',
  '    const child = pickHeaviestChild(root);',
  '    flushBatchMessages(root.buffer → child.buffer);',
  '  }',
  '}',
];

export const lessonBEpsilon = {
  id: 'bepsilon-tree',
  chapterId: 'ch2',
  title: '4. Bε-Tree (B-epsilon)',
  complexity: 'Write: O(log N / B¹⁻ε)',
  complexityAnalysis: {
    time: 'Write: O((log_B N) / (ε·B^{1-ε})) | Read: O(log_B N)',
    space: 'O(N)',
    classType: 'Write-Optimized B-Tree (Dùng trong BetrFS, TokuDB, PerconaFT)',
    derivation: [
      { step: '1. Cấu trúc nút trong (tham số 0 < ε < 1)', formula: 'B^ε khóa + (B - B^ε) Buffer', note: 'Thay vì dùng 100% trang đĩa để chứa khóa như B+ Tree, Bε-Tree chỉ dành B^ε cho khóa định tuyến, phần lớn trang đĩa (B - B^ε) làm hàng đợi Buffer!' },
      { step: '2. Chi phí Ghi (Amortized Write I/O)', formula: 'Nhanh hơn B+ Tree tới B^{1-ε} lần!', note: 'Khi xả (flush) xuống 1 con, ít nhất (B - B^ε) / B^ε ≈ B^{1-ε} bản ghi đi cùng trong 1 lần ghi đĩa duy nhất!' },
      { step: '3. Chi phí Đọc (Point Query)', formula: 'O(log_B N / ε) = O(log_B N)', note: 'Đi từ gốc xuống lá và kiểm tra thêm các Buffer dọc đường — vẫn nhanh ngang B+ Tree!' },
    ],
    worstCase: 'Khi ε → 1 thành B+ Tree (đọc nhanh, ghi chậm); khi ε → 0 thành Buffer Tree (ghi siêu nhanh, đọc chậm). Thường chọn ε = 0.5 để cân bằng hoàn hảo!',
    vsOthers: [
      { algo: 'B+ Tree', diff: 'B+ Tree ghi ngẫu nhiên mất 1 I/O cho mỗi 1 khóa; Bε-Tree gom hàng trăm khóa xả chung 1 lần I/O!' },
      { algo: 'LSM-Tree', diff: 'Ghi nhanh tiệm cận LSM-Tree nhưng giữ cấu trúc cây nên Range Scan nhanh hơn LSM-Tree.' },
    ],
  },
  pseudocode: CODE,
  legend: [
    { type: 'dot', color: 'var(--amber-2)', label: 'Buffer đang tích trữ lệnh ghi (+key)' },
    { type: 'dot', color: 'var(--green-3)', label: 'Batch Flush xả hàng loạt xuống con!' },
  ],
  steps: [
    {
      short: 'Ghi vào Root Buffer',
      tag: 'Lazy Write — Không xuống lá ngay!',
      title: 'Chèn +12, +18, +15 → Nằm gọn trong Buffer của Root (0 lần đọc lá!)',
      activeLines: [2, 3],
      body: [
        'Mỗi nút trong của <span class="term">Bε-Tree</span> (còn gọi là B-epsilon / Beclip Tree) chia làm 2 phần: <b>Pivots (<code>B^ε</code>)</b> để chỉ đường và <b>Message Buffer (<code>B - B^ε</code>)</b> để gom lệnh ghi.',
        'Khi chèn liên tiếp <code>+12, +18, +15</code>, cả 3 lệnh chỉ việc <b>xếp vào Buffer của Root</b> → hoàn thành tức thì mà chưa cần đụng tới nút lá dưới đĩa!',
      ],
      changes: ['+ Ghi (+12), (+18), (+15) vào Root Buffer [3/3 ĐẦY]', '+ Tiết kiệm 3 lần tìm kiếm & ghi ngẫu nhiên xuống đĩa!'],
      metrics: [
        { id: 'buf', label: 'Root Buffer', value: '3 / 3 (ĐẦY)', level: 'warn' },
        { id: 'io', label: 'Write I/O', value: 'Gom chung 1 lần!', level: 'good' },
      ],
      scene: {
        nodes: [
          { id: 'R', shape: 'box', label: 'Pivot: 20 | Buf:[+12,+18,+15]', sub: 'Root (Buffer ĐẦY 3/3!)', badge: 'FLUSH!', x: 360, y: 80, state: 'active', spot: true },
          { id: 'L1', shape: 'box', label: '5 | 10 | 14', sub: 'Lá Trái (< 20)', x: 185, y: 255, state: 'idle' },
          { id: 'L2', shape: 'box', label: '25 | 30 | 40', sub: 'Lá Phải (≥ 20)', x: 535, y: 255, state: 'idle' },
        ],
        edges: [
          { id: 'RL1', from: 'R', to: 'L1', flow: 0, cap: 1, label: '< 20' },
          { id: 'RL2', from: 'R', to: 'L2', flow: 0, cap: 1, label: '≥ 20' },
        ],
      },
    },
    {
      short: 'Batch Flush xuống con!',
      tag: 'Xả hàng loạt trong 1 lần ghi đĩa duy nhất',
      title: 'Xả cả 3 khóa [+12, +15, +18] xuống Lá Trái trong đúng 1 lần I/O!',
      activeLines: [4, 6, 7],
      body: [
        'Khi <code>Root.buffer</code> chạm ngưỡng đầy, Bε-Tree chọn nhánh con nhận nhiều thông điệp nhất (<code>Lá Trái < 20</code> có cả 3 khóa!) và <b>xả hàng loạt (Batch Flush)</b> toàn bộ sang <code>Lá Trái</code> trong <b>1 lần I/O duy nhất</b>.',
        'Chi phí ghi trung bình cho mỗi khóa giảm tới <b><code>B^{1-ε}</code> lần</b> (trên thực tế nhanh hơn B+ Tree 10×–100× khi ghi ngẫu nhiên)!',
      ],
      changes: ['+ Batch Flush [+12, +15, +18] → Lá Trái trong 1 lần I/O', '+ Root Buffer trống trở lại [0/3], sẵn sàng gom đợt ghi mới!'],
      callout: { kind: 'insight', title: 'Đánh đổi thông minh qua tham số ε', text: 'Bε-Tree là cầu nối toán học giữa B+ Tree (ε=1) và Buffer Tree (ε=0): giữ được tốc độ đọc điểm của B+ Tree mà ghi nhanh gấp chục lần!' },
      metrics: [
        { id: 'buf', label: 'Root Buffer', value: '0 / 3 (Trống)', level: 'good' },
        { id: 'saved', label: 'Tốc độ ghi', value: '×B^(1-ε) nhanh hơn', level: 'good' },
      ],
      scene: {
        nodes: [
          { id: 'R', shape: 'box', label: 'Pivot: 20 | Buf:[ trống ]', sub: 'Root đã xả sạch', x: 360, y: 80, state: 'source' },
          { id: 'L1', shape: 'box', label: '5, 10, 12, 14, 15, 18', sub: 'Nhận cả batch 3 khóa!', badge: '+3 batch', x: 185, y: 255, state: 'tree-s', spot: true },
          { id: 'L2', shape: 'box', label: '25 | 30 | 40', sub: 'Lá Phải (không đụng)', x: 535, y: 255, state: 'idle' },
        ],
        edges: [
          { id: 'RL1', from: 'R', to: 'L1', flow: 1, cap: 1, kind: 'augment', label: 'Flush 3 khóa' },
          { id: 'RL2', from: 'R', to: 'L2', flow: 0, cap: 1, kind: 'off', label: '' },
        ],
      },
    },
  ],
};
