// ============================================================================
// Bài 7: Push–Relabel FIFO (Preflow, Height Lift, Excess & Active FIFO Queue)
// ============================================================================

const CODE = [
  'function pushRelabelFIFO(adj, S, T) {',
  '  height[S] = V; // Nâng nguồn S lên cao nhất, bơm tràn mọi cạnh từ S',
  '  for (const e of adj[S]) push(S, e, e.cap); // tạo Preflow (excess > 0)',
  '  while (fifoQueue.length > 0) {',
  '    const u = fifoQueue.shift();',
  '    while (excess[u] > 0) {',
  '      if (∃ cạnh (u,v) có res>0 && height[u] === height[v]+1) push(u, v);',
  '      else relabel(u); // nâng height[u] = 1 + min(height[v])',
  '    }',
  '  } return excess[T];',
  '}',
];

const NODES = [
  { id: 'S', label: 'S', sub: 'Nguồn', x: 100, y: 215 },
  { id: 'A', label: 'A', sub: 'Nút A', x: 320, y: 115 },
  { id: 'B', label: 'B', sub: 'Nút B', x: 320, y: 315 },
  { id: 'T', label: 'T', sub: 'Đích', x: 560, y: 215 },
];

const n = (ov = {}) => NODES.map((x) => ({ ...x, state: x.id === 'S' ? 'source' : x.id === 'T' ? 'sink' : 'idle', ...(ov[x.id] || {}) }));

export const lessonPushRelabel = {
  id: 'push-relabel-fifo',
  chapterId: 'ch1',
  title: '7. Push–Relabel FIFO',
  complexity: 'O(V³)',
  complexityAnalysis: {
    time: 'O(V³)',
    space: 'O(V + E)',
    classType: 'Strongly Polynomial — Tư duy cục bộ (Preflow, không tìm đường S→T)',
    derivation: [
      { step: '1. Tổng số lần Relabel', formula: '≤ 2V² lần', note: 'Mỗi đỉnh có height < 2V và chỉ tăng, không bao giờ giảm → tổng tất cả các lần nâng chiều cao là O(V²).' },
      { step: '2. Số lần đẩy bão hòa (Saturating Push)', formula: '≤ 2V · E lần', note: 'Giữa 2 lần bão hòa cùng 1 cạnh (u,v), height[u] hoặc height[v] phải tăng ít nhất +2 → tối đa O(V·E).' },
      { step: '3. Số lần đẩy không bão hòa (với FIFO Queue)', formula: '≤ 4V³ lần', note: 'Phân tích thế năng theo từng "pass" qua hàng đợi FIFO cho chặn trên O(V³) non-saturating pushes.' },
      { step: '4. Tổng thời gian', formula: 'O(V² + V·E + V³) = O(V³)', note: 'Không cần bất kỳ lần tìm đường S→T toàn cục nào!' },
    ],
    worstCase: 'Đồ thị có nhiều cạnh ngược khiến excess phải đẩy ngược về S — có thể tăng tốc mạnh bằng Highest-Label (HLPP) + Gap Heuristic.',
    vsOthers: [
      { algo: 'Dinic / Edmonds–Karp', diff: 'Không tìm đường tăng luồng toàn cục; hoạt động như nước chảy từ đỉnh có chiều cao h cao xuống đỉnh h thấp hơn.' },
    ],
  },
  pseudocode: CODE,
  legend: [
    { type: 'dot', color: 'var(--amber-2)', label: 'Đỉnh đang tràn (excess > 0) trong FIFO' },
    { type: 'dot', color: 'var(--green-3)', label: 'Đẩy nước xuống dốc (h[u] = h[v] + 1)' },
    { type: 'line', color: 'var(--violet-2)', dashed: true, label: 'Đẩy nước dư ngược về S' },
  ],
  steps: [
    {
      short: 'Nâng S & Bơm tràn',
      tag: 'Khởi tạo Preflow (h[S] = V = 4)',
      title: 'Nâng nguồn S lên độ cao h=4 và bơm đầy mọi ống ra từ S',
      activeLines: [2, 3],
      body: [
        'Tư duy <span class="term">Push–Relabel</span> giống hệt trọng lực: nước chỉ chảy từ nơi có <b>độ cao <code>h[u]</code></b> xuống nơi thấp hơn đúng 1 bậc (<code>h[v] = h[u] - 1</code>).',
        'Ban đầu nâng <code>S</code> lên độ cao <code>h[S] = V = 4</code> và bơm ngập toàn bộ các cạnh ra: <code>S→A (10/10)</code>, <code>S→B (5/5)</code>. Hai đỉnh <code>A (+10)</code> và <code>B (+5)</code> bị <b>tràn (excess > 0)</b> và được đưa vào hàng đợi <code>FIFO = [A, B]</code>!',
      ],
      changes: ['+ Nâng h[S] = 4, các đỉnh còn lại h = 0', '+ Bơm tràn: excess[A] = +10, excess[B] = +5', '+ FIFO Queue = [A, B]'],
      metrics: [
        { id: 'fifo', label: 'FIFO Queue', value: '[A, B]', level: 'violet' },
        { id: 'flow', label: 'excess[T]', value: '0', level: 'normal' },
        { id: 'relabel', label: 'Relabels', value: '0', level: 'good' },
      ],
      scene: {
        nodes: n({
          S: { badge: 'h=4', lift: 3.2 }, A: { badge: 'h=0 | +10', state: 'active', spot: true },
          B: { badge: 'h=0 | +5', state: 'active', spot: true }, T: { badge: 'h=0' },
        }),
        edges: [
          { id: 'SA', from: 'S', to: 'A', flow: 10, cap: 10, kind: 'augment' },
          { id: 'SB', from: 'S', to: 'B', flow: 5, cap: 5, kind: 'augment' },
          { id: 'AB', from: 'A', to: 'B', flow: 0, cap: 4 },
          { id: 'AT', from: 'A', to: 'T', flow: 0, cap: 4 },
          { id: 'BT', from: 'B', to: 'T', flow: 0, cap: 8 },
        ],
      },
    },
    {
      short: 'Relabel A & Push',
      tag: 'Lấy A từ FIFO → Nâng h[A] = 1',
      title: 'A bị tắc ở h=0 → Relabel h[A] = 1 rồi xả +4 xuống T, +4 xuống B!',
      activeLines: [5, 6, 7, 8],
      body: [
        'Lấy <code>A</code> đầu hàng đợi FIFO. Vì <code>h[A]=0</code> bằng <code>h[B]=h[T]=0</code> nên nước không chảy xuống được → <b>Relabel nâng <code>A</code> lên <code>h=1</code></b> (nhìn nút A nhấc cao lên!).',
        'Từ độ cao <code>h=1</code>, <code>A</code> xả <code>+4</code> xuống <code>T</code> (bão hòa <code>4/4</code>) và <code>+4</code> xuống <code>B</code> (bão hòa <code>4/4</code>). <code>A</code> vẫn còn dư <code>+2</code> nước!',
      ],
      changes: ['~ Relabel(A): h[A] = 0 → 1', '+ Push A→T (+4), Push A→B (+4)', '~ A còn excess = +2, B tăng excess = +9'],
      metrics: [
        { id: 'fifo', label: 'FIFO Queue', value: '[B, A]', level: 'violet' },
        { id: 'flow', label: 'excess[T]', value: '4', level: 'good' },
        { id: 'relabel', label: 'Relabels', value: '1', level: 'warn' },
      ],
      scene: {
        nodes: n({
          S: { badge: 'h=4', lift: 3.2 }, A: { badge: 'h=1 | +2', lift: 1, state: 'active', spot: true },
          B: { badge: 'h=0 | +9', state: 'active' }, T: { badge: 'h=0 | +4' },
        }),
        edges: [
          { id: 'SA', from: 'S', to: 'A', flow: 10, cap: 10, kind: 'saturated' },
          { id: 'SB', from: 'S', to: 'B', flow: 5, cap: 5, kind: 'saturated' },
          { id: 'AB', from: 'A', to: 'B', flow: 4, cap: 4, kind: 'augment' },
          { id: 'AT', from: 'A', to: 'T', flow: 4, cap: 4, kind: 'augment' },
          { id: 'BT', from: 'B', to: 'T', flow: 0, cap: 8 },
        ],
      },
    },
    {
      short: 'Relabel B & Xả T',
      tag: 'Lấy B từ FIFO → Nâng h[B] = 1',
      title: 'Relabel h[B] = 1 → Xả +8 xuống T (bão hòa B→T 8/8)',
      activeLines: [5, 7, 8],
      body: [
        'Lấy <code>B (+9)</code> từ FIFO, nâng <code>h[B] = 0 → 1</code> rồi xả <code>+8</code> xuống <code>T</code> (đầy ống <code>B→T: 8/8</code>).',
        'Tổng lưu lượng tới đích <code>T</code> đã đạt <b>12</b>! Lúc này <code>A (+2)</code> và <code>B (+1)</code> vẫn còn nước dư không còn đường xuôi tới <code>T</code>.',
      ],
      changes: ['~ Relabel(B): h[B] = 0 → 1', '+ Push B→T (+8) → excess[T] = 12', '~ A (+2) và B (+1) sẽ phải nâng h lên 5 để đẩy ngược về S!'],
      metrics: [
        { id: 'fifo', label: 'FIFO Queue', value: '[A, B]', level: 'violet' },
        { id: 'flow', label: 'excess[T]', value: '12', level: 'good' },
        { id: 'relabel', label: 'Relabels', value: '2', level: 'warn' },
      ],
      scene: {
        nodes: n({
          S: { badge: 'h=4', lift: 3.2 }, A: { badge: 'h=1 | +2', lift: 1, state: 'active' },
          B: { badge: 'h=1 | +1', lift: 1, state: 'active', spot: true }, T: { badge: 'h=0 | +12' },
        }),
        edges: [
          { id: 'SA', from: 'S', to: 'A', flow: 10, cap: 10, kind: 'saturated' },
          { id: 'SB', from: 'S', to: 'B', flow: 5, cap: 5, kind: 'saturated' },
          { id: 'AB', from: 'A', to: 'B', flow: 4, cap: 4, kind: 'saturated' },
          { id: 'AT', from: 'A', to: 'T', flow: 4, cap: 4, kind: 'saturated' },
          { id: 'BT', from: 'B', to: 'T', flow: 8, cap: 8, kind: 'augment' },
        ],
      },
    },
    {
      short: 'Trả nước dư về S',
      tag: 'Hoàn tất • Max Flow = 12',
      title: 'Nâng h[A], h[B] lên 5 (> h[S]=4) → Trả nước dư về S!',
      activeLines: [8, 10],
      body: [
        'Vì cả <code>A→T</code> và <code>B→T</code> đều đầy, <code>A</code> và <code>B</code> được Relabel lên <code>h = 5</code> (cao hơn cả nguồn <code>S</code> đang ở <code>h = 4</code>!) để đẩy ngược <code>2</code> và <code>1</code> đơn vị nước thừa trả về <code>S</code> qua cạnh ngược.',
        'Hàng đợi FIFO rỗng → Preflow biến thành <b>Flow hợp lệ tối ưu: Max Flow = 12</b>!',
      ],
      changes: ['~ Nâng h[A]=5, h[B]=5 > h[S]=4 → Trả ngược +2 và +1 về S', '+ FIFO rỗng → Kết thúc với Max Flow = 12 = Min-Cut {A→T, B→T}'],
      metrics: [
        { id: 'fifo', label: 'FIFO Queue', value: '[] (Rỗng)', level: 'good' },
        { id: 'flow', label: 'Max Flow', value: '12', level: 'good' },
        { id: 'mincut', label: 'Min-Cut', value: '12', level: 'good' },
      ],
      scene: {
        nodes: n({
          S: { badge: 'h=4', lift: 2.2, state: 'mincut-s' }, A: { badge: 'h=5 | 0', lift: 3, state: 'mincut-s' },
          B: { badge: 'h=5 | 0', lift: 3, state: 'mincut-s' }, T: { badge: 'h=0', state: 'mincut-t' },
        }),
        zones: [
          { kind: 's', label: 'Zone S (S,A,B)', nodes: ['S', 'A', 'B'] },
          { kind: 't', label: 'Zone T (T)', nodes: ['T'] },
        ],
        edges: [
          { id: 'SA', from: 'S', to: 'A', flow: 8, cap: 10 },
          { id: 'SB', from: 'S', to: 'B', flow: 4, cap: 5 },
          { id: 'AB', from: 'A', to: 'B', flow: 4, cap: 4, kind: 'saturated' },
          { id: 'AT', from: 'A', to: 'T', flow: 4, cap: 4, kind: 'cut' },
          { id: 'BT', from: 'B', to: 'T', flow: 8, cap: 8, kind: 'cut' },
        ],
      },
    },
  ],
};
