// ============================================================================
// Bài 6: ISAP (Improved Shortest Augmenting Path) + Gap Heuristic
// ============================================================================

const CODE = [
  'function isap(adj, S, T) {',
  '  reverseBFS(T, dist, gap); // Gán d(v) = khoảng cách tới T',
  '  let u = S, flow = 0;',
  '  while (dist[S] < V) {',
  '    if (∃ cạnh (u,v) có res>0 và dist[u] === dist[v]+1) u = v;',
  '    else { // Retreat & Relabel tại chỗ!',
  '      if (--gap[dist[u]] === 0) break; // GAP HEURISTIC!',
  '      dist[u] = 1 + min{ dist[v] | res(u,v) > 0 };',
  '      gap[dist[u]]++; u = (u === S) ? S : parent[u];',
  '    }',
  '  } return flow;',
  '}',
];

const NODES = [
  { id: 'S', label: 'S', sub: 'Nguồn', x: 90, y: 200 },
  { id: 'A', label: 'A', sub: 'Nút A', x: 280, y: 85 },
  { id: 'B', label: 'B', sub: 'Nút B', x: 280, y: 315 },
  { id: 'C', label: 'C', sub: 'Nút C', x: 470, y: 200 },
  { id: 'T', label: 'T', sub: 'Đích', x: 645, y: 200 },
];

const n = (ov = {}) => NODES.map((x) => ({ ...x, state: x.id === 'S' ? 'source' : x.id === 'T' ? 'sink' : 'idle', ...(ov[x.id] || {}) }));

export const lessonISAP = {
  id: 'isap',
  chapterId: 'ch1',
  title: '6. ISAP + Gap Heuristic',
  complexity: 'O(V² · E)',
  complexityAnalysis: {
    time: 'O(V² · E)',
    space: 'O(V + E)',
    classType: 'Strongly Polynomial — Chỉ chạy BFS đúng 1 lần duy nhất!',
    derivation: [
      { step: '1. Reverse BFS ban đầu từ T', formula: 'O(V + E)', note: 'Chỉ cần chạy BFS ngược từ T đúng 1 lần đầu tiên thay vì chạy lặp đi lặp lại như Dinic.' },
      { step: '2. Cập nhật nhãn tại chỗ (Relabel)', formula: '≤ V lần / đỉnh', note: 'Khi đỉnh u bị kẹt (không có cạnh tiến d[u]=d[v]+1), ta nâng d[u] lên tại chỗ và lùi 1 bước.' },
      { step: '3. Gap Heuristic (Dừng sớm cực mạnh)', formula: 'gap[k] == 0 ⇒ DỪNG!', note: 'Nếu số đỉnh có khoảng cách k giảm về 0, đồ thị bị đứt đôi thành 2 phần không thể đi qua tầng k → kết thúc NGAY LẬP TỨC!' },
    ],
    worstCase: 'Cận lý thuyết O(V²E) giống Dinic, nhưng trong thực tế ISAP thường nhanh hơn Dinic nhờ bỏ hẳn các pha BFS lại và Gap Heuristic.',
    vsOthers: [
      { algo: 'Dinic', diff: 'Dinic phải BFS lại toàn bộ đồ thị sau mỗi pha; ISAP chỉ BFS ngược 1 lần rồi tự sửa nhãn dist[u] tại chỗ.' },
    ],
  },
  pseudocode: CODE,
  legend: [
    { type: 'dot', color: 'var(--blue-2)', label: 'Nhãn khoảng cách ngược tới T (d=k)' },
    { type: 'dot', color: 'var(--amber-2)', label: 'Đỉnh đang tiến / Relabel tại chỗ' },
    { type: 'line', color: 'var(--rust-2)', dashed: true, label: 'Đứt tầng Gap[k] = 0 → Dừng ngay!' },
  ],
  steps: [
    {
      short: 'Reverse BFS từ T',
      tag: 'Bước 1 • Chỉ BFS ngược đúng 1 lần',
      title: 'Gắn nhãn khoảng cách ngược d(v) tính từ đích T',
      activeLines: [2],
      body: [
        'Khác với Dinic (BFS từ <code>S</code> mỗi pha), <span class="term">ISAP</span> chạy <b>1 lần Reverse BFS duy nhất từ đích <code>T</code></b> để gán nhãn khoảng cách <code>d(v)</code> và đếm mảng <code>gap[k]</code> (số đỉnh ở tầng k).',
        'Ta có: <code>d(T)=0</code>, <code>d(C)=1</code>, <code>d(A)=d(B)=2</code>, <code>d(S)=3</code> → <code>gap = [1, 1, 2, 1]</code>.',
      ],
      changes: ['+ Reverse BFS từ T: T(0), C(1), A/B(2), S(3)', '+ Mảng đếm tầng gap[] = [1, 1, 2, 1]'],
      metrics: [
        { id: 'gap', label: 'gap[0..3]', value: '[1, 1, 2, 1]', level: 'violet' },
        { id: 'flow', label: 'Max Flow', value: '0', level: 'normal' },
        { id: 'bound', label: 'Độ phức tạp', value: 'O(V²·E)', level: 'good' },
      ],
      scene: {
        nodes: n({
          S: { badge: 'd=3' }, A: { badge: 'd=2', state: 'visited' }, B: { badge: 'd=2', state: 'visited' },
          C: { badge: 'd=1', state: 'visited', spot: true }, T: { badge: 'd=0', spot: true },
        }),
        edges: [
          { id: 'SA', from: 'S', to: 'A', flow: 0, cap: 6 },
          { id: 'SB', from: 'S', to: 'B', flow: 0, cap: 5 },
          { id: 'AC', from: 'A', to: 'C', flow: 0, cap: 6 },
          { id: 'BC', from: 'B', to: 'C', flow: 0, cap: 5 },
          { id: 'CT', from: 'C', to: 'T', flow: 0, cap: 8 },
        ],
      },
    },
    {
      short: 'Tiến & Đẩy +6',
      tag: 'Admissible Path (d[u] = d[v] + 1)',
      title: 'Đi theo cạnh giảm nhãn S(3)→A(2)→C(1)→T(0) đẩy +6',
      activeLines: [4, 5],
      body: [
        'Từ <code>S(d=3)</code>, thuật toán chỉ đi sang đỉnh có <code>d</code> nhỏ hơn đúng 1: <code>S(3) → A(2) → C(1) → T(0)</code>.',
        'Đẩy <code>+6</code> làm bão hòa <code>S→A (6/6)</code> và <code>A→C (6/6)</code>.',
      ],
      changes: ['+ Đẩy +6 trên S → A → C → T', '~ Bão hòa S→A (6/6), A→C (6/6) · C→T còn dư 2'],
      metrics: [
        { id: 'gap', label: 'gap[0..3]', value: '[1, 1, 2, 1]', level: 'normal' },
        { id: 'flow', label: 'Max Flow', value: '6', level: 'good' },
      ],
      scene: {
        nodes: n({
          S: { badge: 'd=3' }, A: { badge: 'd=2', state: 'active', spot: true }, B: { badge: 'd=2' },
          C: { badge: 'd=1', state: 'active' }, T: { badge: 'd=0' },
        }),
        edges: [
          { id: 'SA', from: 'S', to: 'A', flow: 6, cap: 6, kind: 'augment' },
          { id: 'SB', from: 'S', to: 'B', flow: 0, cap: 5 },
          { id: 'AC', from: 'A', to: 'C', flow: 6, cap: 6, kind: 'augment' },
          { id: 'BC', from: 'B', to: 'C', flow: 0, cap: 5 },
          { id: 'CT', from: 'C', to: 'T', flow: 6, cap: 8, kind: 'augment' },
        ],
      },
    },
    {
      short: 'Đẩy nốt +2',
      tag: 'Bão hòa cổ chai C→T',
      title: 'Đi nhánh S(3)→B(2)→C(1)→T(0) đẩy +2 → Bão hòa C→T!',
      activeLines: [4, 5],
      body: [
        'Nhánh dưới <code>S(3) → B(2) → C(1) → T(0)</code> vẫn còn cạnh hợp lệ. Đẩy thêm <code>+2</code> làm cạnh <code>C→T</code> bão hòa <code>8/8</code>!',
      ],
      changes: ['+ Đẩy +2 trên S → B → C → T → |f| = 8', '~ Cạnh C→T đạt 8/8 (không còn cạnh đi ra từ C tới T!)'],
      metrics: [
        { id: 'gap', label: 'gap[0..3]', value: '[1, 1, 2, 1]', level: 'normal' },
        { id: 'flow', label: 'Max Flow', value: '8', level: 'good' },
      ],
      scene: {
        nodes: n({
          S: { badge: 'd=3' }, A: { badge: 'd=2' }, B: { badge: 'd=2', state: 'active' },
          C: { badge: 'd=1', state: 'active', spot: true }, T: { badge: 'd=0' },
        }),
        edges: [
          { id: 'SA', from: 'S', to: 'A', flow: 6, cap: 6, kind: 'saturated' },
          { id: 'SB', from: 'S', to: 'B', flow: 2, cap: 5, kind: 'augment' },
          { id: 'AC', from: 'A', to: 'C', flow: 6, cap: 6, kind: 'saturated' },
          { id: 'BC', from: 'B', to: 'C', flow: 2, cap: 5, kind: 'augment' },
          { id: 'CT', from: 'C', to: 'T', flow: 8, cap: 8, kind: 'saturated' },
        ],
      },
    },
    {
      short: 'GAP HEURISTIC!',
      tag: 'Relabel C → gap[1] == 0 ⇒ DỪNG NGAY!',
      title: 'Đỉnh C bị kẹt & Relabel → Tầng d=1 trống rỗng (Gap = 0)!',
      activeLines: [6, 7, 8],
      body: [
        'Khi đi tới <code>C (d=1)</code>, không còn cạnh nào có <code>d=0</code> đi ra (<code>C→T</code> đã đầy). ISAP thực hiện <span class="term">Relabel tại chỗ</span> cho <code>C</code> (nâng <code>d[C]</code> từ 1 lên 3).',
        'Trước khi nâng, ta giảm <code>gap[1]</code> từ <code>1 → 0</code>! Vì không còn bất kỳ đỉnh nào ở khoảng cách 1 tới <code>T</code>, <b>tồn tại 1 vết đứt ngăn cách hoàn toàn S và T</b> → thuật toán <b>DỪNG NGAY LẬP TỨC</b> mà không cần BFS lại!',
      ],
      changes: ['- Giảm gap[1]: 1 → 0 (Xuất hiện khoảng trống GAP!)', '+ Kích hoạt Gap Heuristic: Thoát vòng lặp ngay lập tức', '+ Kết luận: Max Flow = 8, Min-Cut = {C→T} = 8'],
      callout: { kind: 'insight', title: 'Sức mạnh của Gap Heuristic', text: 'Nhờ kiểm tra --gap[dist[u]] === 0 trong O(1), ISAP cắt bỏ hàng loạt bước Relabel vô ích ở giai đoạn cuối và đạt tốc độ thực tế cực nhanh!' },
      metrics: [
        { id: 'gap', label: 'gap[1]', value: '0 (GAP!)', level: 'bad' },
        { id: 'flow', label: 'Max Flow', value: '8', level: 'good' },
        { id: 'mincut', label: 'Min-Cut', value: '8', level: 'good' },
      ],
      scene: {
        nodes: n({
          S: { badge: 'd=3', state: 'mincut-s' }, A: { badge: 'd=2', state: 'mincut-s' },
          B: { badge: 'd=2', state: 'mincut-s' }, C: { badge: 'd:1→3!', state: 'mincut-s', spot: true },
          T: { badge: 'd=0', state: 'mincut-t' },
        }),
        zones: [
          { kind: 's', label: 'Zone S (S,A,B,C)', nodes: ['S', 'A', 'B', 'C'] },
          { kind: 't', label: 'Zone T (T)', nodes: ['T'] },
        ],
        edges: [
          { id: 'SA', from: 'S', to: 'A', flow: 6, cap: 6, kind: 'saturated' },
          { id: 'SB', from: 'S', to: 'B', flow: 2, cap: 5 },
          { id: 'AC', from: 'A', to: 'C', flow: 6, cap: 6, kind: 'saturated' },
          { id: 'BC', from: 'B', to: 'C', flow: 2, cap: 5 },
          { id: 'CT', from: 'C', to: 'T', flow: 8, cap: 8, kind: 'cut' },
        ],
      },
    },
  ],
};
