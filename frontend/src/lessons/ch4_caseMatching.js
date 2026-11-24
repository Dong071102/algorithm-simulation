// ============================================================================
// Case Study 2: Ghép cặp Tài xế – Đơn hàng (Bipartite Matching via Max-Flow)
// ============================================================================

const CODE = [
  '// Biến bài toán Ghép cặp 2 phía thành Max-Flow:',
  '1. Thêm Siêu nguồn S nối tới mọi Tài xế (cap = 1)',
  '2. Thêm Siêu đích T nối từ mọi Đơn hàng (cap = 1)',
  '3. Nếu Tài xế i nhận được Đơn j → thêm cạnh i → j (cap = 1)',
  '4. Chạy Max-Flow (Dinic chạy chỉ O(E√V) trên đồ thị cap=1!)',
  '   → Cạnh ngược (back-edge) chính là phép ĐỔI CA để nhường đơn!',
];

const NODES_BIP = [
  { id: 'S', label: 'S', sub: 'Siêu nguồn', x: 75, y: 200 },
  { id: 'D1', label: 'TX1', sub: 'Tài xế 1', x: 250, y: 110 },
  { id: 'D2', label: 'TX2', sub: 'Tài xế 2', x: 250, y: 200 },
  { id: 'D3', label: 'TX3', sub: 'Tài xế 3', x: 250, y: 290 },
  { id: 'O1', label: 'Đ1', sub: 'Đơn #1', x: 460, y: 110 },
  { id: 'O2', label: 'Đ2', sub: 'Đơn #2', x: 460, y: 200 },
  { id: 'O3', label: 'Đ3', sub: 'Đơn #3', x: 460, y: 290 },
  { id: 'T', label: 'T', sub: 'Siêu đích', x: 635, y: 200 },
];

const n = (ov = {}) => NODES_BIP.map((x) => ({ ...x, state: x.id === 'S' ? 'source' : x.id === 'T' ? 'sink' : 'idle', ...(ov[x.id] || {}) }));

export const lessonCaseMatching = {
  id: 'case-matching',
  chapterId: 'ch1',
  title: 'Case 2: Ghép cặp Tài xế – Đơn',
  complexity: 'O(E √V)',
  complexityAnalysis: {
    time: 'O(E · √V) với Dinic / Hopcroft–Karp',
    space: 'O(V + E)',
    classType: 'Ứng dụng Max-Flow cho Đồ thị hai phía (Bipartite Matching)',
    derivation: [
      { step: '1. Kỹ thuật Siêu nguồn S & Siêu đích T', formula: 'cap = 1 ∀ cạnh', note: 'Sức chứa 1 đảm bảo mỗi tài xế nhận tối đa 1 đơn và mỗi đơn chỉ giao cho 1 tài xế.' },
      { step: '2. Ý nghĩa của Cạnh ngược (Back-edge)', formula: 'Hoán đổi ghép cặp!', note: 'Khi TX2 chỉ nhận được Đ1 (đã giao cho TX1), đường tăng luồng đi ngược Đ1 ↩ TX1 → Đ2 tự động điều chuyển TX1 sang Đ2 để nhường Đ1 cho TX2!' },
      { step: '3. Độ phức tạp khi dùng Dinic', formula: 'O(E · √V)', note: 'Trên mạng đơn vị (unit-capacity network), Dinic chỉ cần tối đa O(√V) pha!' },
    ],
    worstCase: 'Nhanh vượt trội trên hàng chục nghìn tài xế/đơn hàng (Grab, Uber, phân ca bệnh viện, xếp lịch phỏng vấn).',
    vsOthers: [
      { algo: 'Thuật toán Tham lam (Greedy)', diff: 'Greedy chọn bừa dễ bị kẹt chỉ ghép được 2/3 cặp; Max-Flow dùng cạnh ngược đảm bảo luôn ghép tối đa 3/3 cặp!' },
    ],
  },
  pseudocode: CODE,
  legend: [
    { type: 'dot', color: 'var(--green-3)', label: 'Cặp đã ghép thành công' },
    { type: 'line', color: 'var(--violet-2)', dashed: true, label: 'Đổi ca qua cạnh ngược (Back-edge)' },
    { type: 'dot', color: 'var(--amber-2)', label: 'Đường tăng luồng ghép thêm cặp' },
  ],
  steps: [
    {
      short: 'Mô hình hóa S & T',
      tag: 'Biến Ghép cặp → Flow Network (cap=1)',
      title: '3 Tài xế, 3 Đơn hàng — Thêm Siêu nguồn S và Siêu đích T',
      activeLines: [1, 2, 3, 4],
      body: [
        '<code>TX1</code> nhận được <code>Đ1, Đ2</code>; <code>TX2</code> chỉ nhận được <code>Đ1</code>; <code>TX3</code> nhận được <code>Đ2, Đ3</code>.',
        'Ta thêm <b>Siêu nguồn S</b> nối tới 3 tài xế và <b>Siêu đích T</b> nối từ 3 đơn hàng, tất cả cạnh có <code>cap = 1</code>.',
      ],
      changes: ['+ Thêm S → TX1, TX2, TX3 (cap=1) và Đ1, Đ2, Đ3 → T (cap=1)', '+ Mỗi đơn vị luồng từ S → T tương ứng 1 cặp ghép hợp lệ!'],
      metrics: [
        { id: 'match', label: 'Số cặp ghép', value: '0 / 3', level: 'normal' },
        { id: 'bound', label: 'Dinic trên cap=1', value: 'O(E √V)', level: 'good' },
      ],
      scene: {
        nodes: n(),
        edges: [
          { id: 'SD1', from: 'S', to: 'D1', flow: 0, cap: 1 },
          { id: 'SD2', from: 'S', to: 'D2', flow: 0, cap: 1 },
          { id: 'SD3', from: 'S', to: 'D3', flow: 0, cap: 1 },
          { id: 'D1O1', from: 'D1', to: 'O1', flow: 0, cap: 1 },
          { id: 'D1O2', from: 'D1', to: 'O2', flow: 0, cap: 1 },
          { id: 'D2O1', from: 'D2', to: 'O1', flow: 0, cap: 1 },
          { id: 'D3O2', from: 'D3', to: 'O2', flow: 0, cap: 1 },
          { id: 'D3O3', from: 'D3', to: 'O3', flow: 0, cap: 1 },
          { id: 'O1T', from: 'O1', to: 'T', flow: 0, cap: 1 },
          { id: 'O2T', from: 'O2', to: 'T', flow: 0, cap: 1 },
          { id: 'O3T', from: 'O3', to: 'T', flow: 0, cap: 1 },
        ],
      },
    },
    {
      short: 'Tham lam bị kẹt (2/3)',
      tag: 'Vấn đề nếu không có Back-edge',
      title: 'Ghép TX1→Đ1 và TX3→Đ3: Tài xế TX2 bị bơ vơ!',
      activeLines: [5],
      body: [
        'Giả sử hai bước đầu ta ghép <code>TX1 → Đ1</code> và <code>TX3 → Đ3</code> (đạt 2 cặp).',
        'Bây giờ tới <code>TX2</code>: <code>TX2</code> chỉ nhận được duy nhất <code>Đ1</code>, nhưng <code>Đ1</code> đã bị <code>TX1</code> giữ mất rồi! Thuật toán tham lam sẽ bó tay dừng ở <b>2/3 cặp</b>.',
      ],
      changes: ['+ Đã ghép: TX1 → Đ1, TX3 → Đ3 (2/3 cặp)', '- TX2 bị tắc vì Đ1 đã có người nhận!'],
      metrics: [
        { id: 'match', label: 'Số cặp ghép', value: '2 / 3 (Bị kẹt)', level: 'warn' },
      ],
      scene: {
        nodes: n({ D2: { state: 'active', spot: true }, O1: { state: 'visited' } }),
        edges: [
          { id: 'SD1', from: 'S', to: 'D1', flow: 1, cap: 1, kind: 'saturated' },
          { id: 'SD2', from: 'S', to: 'D2', flow: 0, cap: 1 },
          { id: 'SD3', from: 'S', to: 'D3', flow: 1, cap: 1, kind: 'saturated' },
          { id: 'D1O1', from: 'D1', to: 'O1', flow: 1, cap: 1, kind: 'saturated' },
          { id: 'D1O2', from: 'D1', to: 'O2', flow: 0, cap: 1 },
          { id: 'D2O1', from: 'D2', to: 'O1', flow: 0, cap: 1 },
          { id: 'D3O2', from: 'D3', to: 'O2', flow: 0, cap: 1 },
          { id: 'D3O3', from: 'D3', to: 'O3', flow: 1, cap: 1, kind: 'saturated' },
          { id: 'O1T', from: 'O1', to: 'T', flow: 1, cap: 1, kind: 'saturated' },
          { id: 'O2T', from: 'O2', to: 'T', flow: 0, cap: 1 },
          { id: 'O3T', from: 'O3', to: 'T', flow: 1, cap: 1, kind: 'saturated' },
        ],
      },
    },
    {
      short: 'Đổi ca qua Back-edge!',
      tag: 'Phép màu của Cạnh ngược',
      title: 'Đường tăng luồng S → TX2 → Đ1 ↩ TX1 → Đ2 → T giải cứu TX2!',
      activeLines: [6],
      body: [
        'Max-Flow đi theo đường <code>S → TX2 → Đ1</code>, sau đó <b>lội ngược cạnh tím <code>Đ1 ↩ TX1</code></b> để hủy cặp cũ <code>TX1–Đ1</code>, rồi nối sang <code>TX1 → Đ2 → T</code>!',
        'Kết quả: <b>TX2 nhận Đ1, TX1 chuyển sang Đ2, TX3 giữ Đ3 → Ghép trọn vẹn 3/3 cặp (100%)!</b>',
      ],
      changes: ['~ Đi ngược cạnh tím Đ1 ↩ TX1: điều chuyển TX1 sang Đ2', '+ Giao Đ1 cho TX2 → Đạt tối ưu 3/3 cặp ghép!'],
      callout: { kind: 'insight', title: 'Aha! Moment', text: 'Cạnh ngược (back-edge) trong Max-Flow chính là cơ chế "hoán đổi lịch phân công" tự động để đạt hiệu suất ghép cặp 100%.' },
      metrics: [
        { id: 'match', label: 'Số cặp ghép', value: '3 / 3 (Tối ưu!)', level: 'good' },
      ],
      scene: {
        nodes: n({
          D1: { state: 'tree-s' }, D2: { state: 'tree-s', spot: true }, D3: { state: 'tree-s' },
          O1: { state: 'tree-s' }, O2: { state: 'tree-s', spot: true }, O3: { state: 'tree-s' },
        }),
        edges: [
          { id: 'SD1', from: 'S', to: 'D1', flow: 1, cap: 1, kind: 'saturated' },
          { id: 'SD2', from: 'S', to: 'D2', flow: 1, cap: 1, kind: 'augment' },
          { id: 'SD3', from: 'S', to: 'D3', flow: 1, cap: 1, kind: 'saturated' },
          { id: 'D1O1', from: 'D1', to: 'O1', flow: 0, cap: 1, kind: 'off' },
          { id: 'D1O2', from: 'D1', to: 'O2', flow: 1, cap: 1, kind: 'augment' },
          { id: 'D2O1', from: 'D2', to: 'O1', flow: 1, cap: 1, kind: 'augment' },
          { id: 'D3O2', from: 'D3', to: 'O2', flow: 0, cap: 1, kind: 'off' },
          { id: 'D3O3', from: 'D3', to: 'O3', flow: 1, cap: 1, kind: 'saturated' },
          { id: 'O1T', from: 'O1', to: 'T', flow: 1, cap: 1, kind: 'saturated' },
          { id: 'O2T', from: 'O2', to: 'T', flow: 1, cap: 1, kind: 'augment' },
          { id: 'O3T', from: 'O3', to: 'T', flow: 1, cap: 1, kind: 'saturated' },
        ],
      },
    },
  ],
};
