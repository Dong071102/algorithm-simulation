// ============================================================================
// Bài 8: Hochbaum's Pseudoflow Algorithm (Excess/Deficit, Normalized Tree, Merger)
// ============================================================================

const CODE = [
  'function hochbaumPseudoflow(G, S, T) {',
  '  // 1. Bão hòa MỌI cạnh từ S (tạo Excess +) và MỌI cạnh vào T (tạo Deficit -)',
  '  // 2. Duy trì rừng cây chuẩn hóa: Nhánh Mạnh (excess > 0) & Nhánh Yếu (deficit ≤ 0)',
  '  while (∃ cạnh Merger (u, v): u ∈ Nhánh Mạnh, v ∈ Nhánh Yếu, res > 0) {',
  '    merge(u, v);            // ghép 2 cây qua cạnh Merger',
  '    pushAlongPath(root(u) → root(v)); // đẩy từ nút thừa (+) sang nút thiếu (-)',
  '    splitSaturatedEdges();  // cạnh bão hòa tách thành gốc mạnh mới',
  '  }',
  '  return minCutFromStrongBranches(); // Tìm Min-Cut TRƯỚC, chuẩn hóa Flow SAU!',
  '}',
];

const NODES = [
  { id: 'S', label: 'S', sub: 'Nguồn', x: 90, y: 200 },
  { id: 'A', label: 'A', sub: 'Nhánh Mạnh (+)', x: 280, y: 95 },
  { id: 'B', label: 'B', sub: 'Nhánh Mạnh (+)', x: 280, y: 305 },
  { id: 'C', label: 'C', sub: 'Nhánh Yếu (-)', x: 470, y: 95 },
  { id: 'D', label: 'D', sub: 'Nhánh Yếu (-)', x: 470, y: 305 },
  { id: 'T', label: 'T', sub: 'Đích', x: 650, y: 200 },
];

const n = (ov = {}) => NODES.map((x) => ({ ...x, state: x.id === 'S' ? 'source' : x.id === 'T' ? 'sink' : 'idle', ...(ov[x.id] || {}) }));

export const lessonPseudoflow = {
  id: 'pseudoflow',
  chapterId: 'ch1',
  title: '8. Pseudoflow (Hochbaum)',
  complexity: 'O(V·E log V)',
  complexityAnalysis: {
    time: 'O(V · E log(V²/E))',
    space: 'O(V + E)',
    classType: 'Strongly Polynomial — Tốc độ top đầu thực tế cho Min-Cut quy mô lớn',
    derivation: [
      { step: '1. Khởi tạo Pseudoflow (vi phạm cả thừa lẫn thiếu)', formula: 'O(E)', note: 'Bão hòa toàn bộ cạnh ra từ S (excess > 0) VÀ toàn bộ cạnh vào T (deficit < 0) — mạnh hơn Preflow (chỉ cho thừa).' },
      { step: '2. Mỗi bước Merger giữa Nhánh Mạnh & Nhánh Yếu', formula: 'O(log V) với Dynamic Trees', note: 'Đẩy luồng dọc đường nối 2 gốc cây; mỗi lần bão hòa làm tăng nhãn khoảng cách của nhánh mạnh bị tách.' },
      { step: '3. Pha 1 tìm Min-Cut xong trước!', formula: 'O(V·E) bản đơn giản', note: 'Khi không còn cạnh Merger nào từ Nhánh Mạnh → Nhánh Yếu, tập Nhánh Mạnh CHÍNH LÀ Zone S của Min-Cut!' },
    ],
    worstCase: 'Nếu chỉ cần tìm Min-Cut (như tách nền ảnh, khai thác mỏ mở) chỉ cần chạy Pha 1, không cần Pha 2 chuyển Pseudoflow về Flow.',
    vsOthers: [
      { algo: 'Push–Relabel', diff: 'Push–Relabel chỉ cho phép excess ≥ 0; Pseudoflow cho phép cả deficit < 0 và dùng cây chuẩn hóa để đẩy theo chuỗi dài.' },
    ],
  },
  pseudocode: CODE,
  legend: [
    { type: 'dot', color: 'var(--green-3)', label: 'Nhánh Mạnh (Strong: excess > 0)' },
    { type: 'dot', color: 'var(--violet-2)', label: 'Nhánh Yếu (Weak: deficit ≤ 0)' },
    { type: 'dot', color: 'var(--amber-2)', label: 'Cạnh Merger nối Mạnh → Yếu' },
  ],
  steps: [
    {
      short: 'Bão hòa 2 đầu S & T',
      tag: 'Pha 1 • Tạo Excess (+) và Deficit (-)',
      title: 'Khởi tạo Pseudoflow: Bão hòa cả đầu S lẫn đầu T!',
      activeLines: [1, 2],
      body: [
        'Khác biệt đột phá của <span class="term">Hochbaum Pseudoflow</span>: thay vì chỉ bơm tràn từ <code>S</code> như Push–Relabel, thuật toán <b>bão hòa đồng thời cả cạnh ra từ S (tạo nút thừa <code>+</code>) lẫn cạnh vào T (tạo nút thiếu <code>-</code>)</b>!',
        'Ta thu được 2 nhóm nhánh cây tách biệt: <b>Nhánh Mạnh (xanh)</b> tại <code>A (+8), B (+6)</code> và <b>Nhánh Yếu (tím)</b> tại <code>C (-7), D (-5)</code>.',
      ],
      changes: ['+ Bão hòa S→A (8), S→B (6) ⇒ Excess: A(+8), B(+6)', '+ Bão hòa C→T (7), D→T (5) ⇒ Deficit: C(-7), D(-5)'],
      metrics: [
        { id: 'strong', label: 'Nhánh Mạnh (+)', value: 'A(+8), B(+6)', level: 'good' },
        { id: 'weak', label: 'Nhánh Yếu (-)', value: 'C(-7), D(-5)', level: 'violet' },
        { id: 'bound', label: 'Độ phức tạp', value: 'O(VE log V)', level: 'good' },
      ],
      scene: {
        nodes: n({
          A: { badge: '+8', state: 'tree-s', spot: true }, B: { badge: '+6', state: 'tree-s', spot: true },
          C: { badge: '-7', state: 'tree-t', spot: true }, D: { badge: '-5', state: 'tree-t', spot: true },
        }),
        edges: [
          { id: 'SA', from: 'S', to: 'A', flow: 8, cap: 8, kind: 'saturated' },
          { id: 'SB', from: 'S', to: 'B', flow: 6, cap: 6, kind: 'saturated' },
          { id: 'AC', from: 'A', to: 'C', flow: 0, cap: 5 },
          { id: 'AD', from: 'A', to: 'D', flow: 0, cap: 4 },
          { id: 'BD', from: 'B', to: 'D', flow: 0, cap: 3 },
          { id: 'CT', from: 'C', to: 'T', flow: 7, cap: 7, kind: 'saturated' },
          { id: 'DT', from: 'D', to: 'T', flow: 5, cap: 5, kind: 'saturated' },
        ],
      },
    },
    {
      short: 'Merger A → C',
      tag: 'Phép ghép Merger #1',
      title: 'Tìm cạnh Merger A → C: Triệt tiêu +5 thừa với -5 thiếu!',
      activeLines: [4, 5, 6],
      body: [
        'Cạnh <code>A → C (cap=5)</code> nối một <b>Nhánh Mạnh (A: +8)</b> sang một <b>Nhánh Yếu (C: -7)</b> → đây là <span class="term">Merger Arc</span>.',
        'Đẩy ngay <code>5</code> đơn vị dọc <code>A → C</code>: cạnh bão hòa <code>5/5</code>, <code>A</code> giảm còn <code>+3</code> (vẫn mạnh), <code>C</code> tăng lên <code>-2</code> (vẫn yếu).',
      ],
      changes: ['+ Merger trên A → C: đẩy +5 (bão hòa 5/5)', '~ A: +8 → +3 | C: -7 → -2'],
      metrics: [
        { id: 'strong', label: 'Nhánh Mạnh (+)', value: 'A(+3), B(+6)', level: 'good' },
        { id: 'weak', label: 'Nhánh Yếu (-)', value: 'C(-2), D(-5)', level: 'violet' },
      ],
      scene: {
        nodes: n({
          A: { badge: '+3', state: 'tree-s', spot: true }, B: { badge: '+6', state: 'tree-s' },
          C: { badge: '-2', state: 'tree-t', spot: true }, D: { badge: '-5', state: 'tree-t' },
        }),
        edges: [
          { id: 'SA', from: 'S', to: 'A', flow: 8, cap: 8, kind: 'saturated' },
          { id: 'SB', from: 'S', to: 'B', flow: 6, cap: 6, kind: 'saturated' },
          { id: 'AC', from: 'A', to: 'C', flow: 5, cap: 5, kind: 'augment' },
          { id: 'AD', from: 'A', to: 'D', flow: 0, cap: 4 },
          { id: 'BD', from: 'B', to: 'D', flow: 0, cap: 3 },
          { id: 'CT', from: 'C', to: 'T', flow: 7, cap: 7, kind: 'saturated' },
          { id: 'DT', from: 'D', to: 'T', flow: 5, cap: 5, kind: 'saturated' },
        ],
      },
    },
    {
      short: 'Merger A→D & B→D',
      tag: 'Phép ghép Merger #2 & #3',
      title: 'Đẩy +3 qua A→D và +2 qua B→D → Cân bằng hoàn toàn nút D!',
      activeLines: [5, 6, 7],
      body: [
        'Cạnh Merger <code>A → D</code> đẩy hết <code>+3</code> còn lại của <code>A</code> sang <code>D</code> (<code>A</code> về <code>0</code> — chuyển thành Nhánh Yếu; <code>D</code> còn <code>-2</code>).',
        'Tiếp theo cạnh Merger <code>B → D</code> đẩy <code>+2</code> sang <code>D</code> → <code>D</code> về <code>0</code> (cân bằng!), còn <code>B</code> dư <code>+4</code> nhưng cạnh <code>B → D</code> vẫn còn dư <code>1</code>, tuy nhiên <code>D</code> không thể đẩy sang <code>C</code> nên hết đường!',
      ],
      changes: ['+ Merger A→D (+3): A về 0, D về -2', '+ Merger B→D (+2): B còn +4, D về 0', '~ Tổng luồng qua mặt cắt giữa = 5 + 3 + 2 = 10'],
      metrics: [
        { id: 'strong', label: 'Nhánh Mạnh (+)', value: 'B(+4)', level: 'warn' },
        { id: 'balanced', label: 'Đã cân bằng', value: 'A(0), D(0)', level: 'good' },
      ],
      scene: {
        nodes: n({
          A: { badge: '0', state: 'tree-t' }, B: { badge: '+4', state: 'tree-s', spot: true },
          C: { badge: '-2', state: 'tree-t' }, D: { badge: '0', state: 'tree-t', spot: true },
        }),
        edges: [
          { id: 'SA', from: 'S', to: 'A', flow: 8, cap: 8, kind: 'saturated' },
          { id: 'SB', from: 'S', to: 'B', flow: 6, cap: 6, kind: 'saturated' },
          { id: 'AC', from: 'A', to: 'C', flow: 5, cap: 5, kind: 'saturated' },
          { id: 'AD', from: 'A', to: 'D', flow: 3, cap: 4, kind: 'augment' },
          { id: 'BD', from: 'B', to: 'D', flow: 2, cap: 3, kind: 'augment' },
          { id: 'CT', from: 'C', to: 'T', flow: 7, cap: 7, kind: 'saturated' },
          { id: 'DT', from: 'D', to: 'T', flow: 5, cap: 5, kind: 'saturated' },
        ],
      },
    },
    {
      short: 'Ra ngay Min-Cut!',
      tag: 'Pha 1 hoàn tất → Min-Cut = 10',
      title: 'Hết Merger → Tập Nhánh Mạnh chính là Min-Cut (10)!',
      activeLines: [9],
      body: [
        'Đẩy nốt <code>+1</code> trên <code>B→D</code> (bão hòa <code>3/3</code>) rồi đẩy ngược <code>1</code> từ <code>D</code> về <code>A</code>: không còn bất kỳ cạnh Merger nào từ Nhánh Mạnh sang Nhánh Yếu!',
        '<b>Min-Cut lập tức lộ diện = 10</b> (<code>A→C (5) + D→T (5)</code>) mà <b>chưa cần hoàn trả excess/deficit về S và T</b> — lý do Pseudoflow cực nhanh cho bài toán Min-Cut!',
      ],
      changes: ['+ Hết cạnh Merger Mạnh → Yếu', '+ Min-Cut = 10 (Zone S = {S, A, B, D}, Zone T = {C, T})'],
      metrics: [
        { id: 'flow', label: 'Max Flow / Min-Cut', value: '10', level: 'good' },
        { id: 'bound', label: 'Độ phức tạp', value: 'O(VE log V)', level: 'good' },
      ],
      scene: {
        nodes: n({
          S: { state: 'mincut-s' }, A: { state: 'mincut-s' }, B: { state: 'mincut-s' }, D: { state: 'mincut-s' },
          C: { state: 'mincut-t' }, T: { state: 'mincut-t' },
        }),
        zones: [
          { kind: 's', label: 'Zone S (Strong)', nodes: ['S', 'A', 'B', 'D'] },
          { kind: 't', label: 'Zone T (Weak)', nodes: ['C', 'T'] },
        ],
        edges: [
          { id: 'SA', from: 'S', to: 'A', flow: 8, cap: 8, kind: 'saturated' },
          { id: 'SB', from: 'S', to: 'B', flow: 6, cap: 6, kind: 'saturated' },
          { id: 'AC', from: 'A', to: 'C', flow: 5, cap: 5, kind: 'cut' },
          { id: 'AD', from: 'A', to: 'D', flow: 2, cap: 4 },
          { id: 'BD', from: 'B', to: 'D', flow: 3, cap: 3, kind: 'saturated' },
          { id: 'CT', from: 'C', to: 'T', flow: 5, cap: 7 },
          { id: 'DT', from: 'D', to: 'T', flow: 5, cap: 5, kind: 'cut' },
        ],
      },
    },
  ],
};
