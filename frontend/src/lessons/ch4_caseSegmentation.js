// ============================================================================
// Case Study 3: Tách nền ảnh bằng Min-Cut (Image Segmentation / Graph Cuts)
// ============================================================================

const CODE = [
  '// Tách vật thể (Foreground S) khỏi Nền (Background T):',
  '1. Mỗi pixel p là 1 đỉnh của đồ thị lưới 2D',
  '2. Cạnh S → p: điểm thưởng nếu p là Vật thể (Foreground likelihood)',
  '3. Cạnh p → T: điểm thưởng nếu p là Nền (Background likelihood)',
  '4. Cạnh p ↔ q (2 pixel kề nhau): chi phí PHẠT nếu tách p và q khác nhóm',
  '5. Chạy Boykov–Kolmogorov / IBFS tìm Min-Cut → Vẽ ra đường viền tách nền!',
];

const NODES_IMG = [
  { id: 'S', label: 'FG', sub: 'Vật thể (S)', x: 85, y: 200 },
  { id: 'P1', label: 'P1', sub: 'Pixel sáng', x: 280, y: 110 },
  { id: 'P2', label: 'P2', sub: 'Pixel sáng', x: 280, y: 290 },
  { id: 'P3', label: 'P3', sub: 'Pixel tối', x: 470, y: 110 },
  { id: 'P4', label: 'P4', sub: 'Pixel tối', x: 470, y: 290 },
  { id: 'T', label: 'BG', sub: 'Nền (T)', x: 655, y: 200 },
];

const n = (ov = {}) => NODES_IMG.map((x) => ({ ...x, state: x.id === 'S' ? 'source' : x.id === 'T' ? 'sink' : 'idle', ...(ov[x.id] || {}) }));

export const lessonCaseSegmentation = {
  id: 'case-segmentation',
  chapterId: 'ch1',
  title: 'Case 3: Tách nền ảnh Min-Cut',
  complexity: 'Graph Cuts',
  complexityAnalysis: {
    time: 'Gần tuyến tính ~O(V) với Boykov–Kolmogorov / IBFS trên ảnh',
    space: 'O(V)',
    classType: 'Tối ưu năng lượng rời rạc (Energy Minimization via s-t Min-Cut)',
    derivation: [
      { step: '1. Hàm năng lượng cần tối thiểu hóa', formula: 'E(L) = Σ D_p(L_p) + Σ V_{p,q}', note: 'D_p là chi phí gán nhãn pixel (nối S/T), V_{p,q} là chi phí phạt cắt giữa 2 pixel giống màu.' },
      { step: '2. Biến đổi sang bài toán Min-Cut', formula: 'min E(L) ≡ Min-Cut(S, T)', note: 'Một lát cắt tách pixel thuộc Zone S (Vật thể) và Zone T (Nền) có tổng trọng số ĐÚNG BẰNG năng lượng E(L)!' },
      { step: '3. Thuật toán thực tế được dùng', formula: 'Boykov–Kolmogorov / IBFS', note: 'Photoshop Magic Wand / GrabCut và phân đoạn ảnh y tế MRI dùng chính kỹ thuật Graph Cuts này.' },
    ],
    worstCase: 'Với ảnh 4K (8 triệu pixel), thuật toán BK hoặc IBFS chạy chỉ mất vài chục mili-giây.',
    vsOthers: [
      { algo: 'Ngưỡng màu đơn giản (Threshold)', diff: 'Threshold dễ bị nhiễu đốm; Min-Cut xét thêm cạnh liên kết giữa pixel kề nhau nên đường viền tách vật thể cực mịn!' },
    ],
  },
  pseudocode: CODE,
  legend: [
    { type: 'dot', color: 'var(--green-3)', label: 'Zone S = Pixel Vật thể (Foreground)' },
    { type: 'dot', color: 'var(--rust-2)', label: 'Zone T = Pixel Nền (Background)' },
    { type: 'line', color: 'var(--rust-2)', dashed: true, label: 'Đường cắt Min-Cut = Biên tách nền!' },
  ],
  steps: [
    {
      short: 'Lưới Pixel & Trọng số',
      tag: 'Mô hình hóa Ảnh 2×2 thành Flow Network',
      title: 'Gán trọng số Vật thể (FG), Nền (BG) và Độ tương đồng kề nhau',
      activeLines: [1, 2, 3, 4],
      body: [
        'Xét một vùng ảnh 4 pixel <code>P1, P2</code> (màu sáng, giống vật thể → nối <code>FG</code> mạnh <code>9, 8</code>) và <code>P3, P4</code> (màu tối, giống nền → nối <code>BG</code> mạnh <code>9, 8</code>).',
        'Các cạnh ngang <code>P1→P3 (2)</code>, <code>P2→P4 (2)</code> có chi phí phạt <b>thấp</b> vì 2 pixel khác màu nhau; còn <code>P1→P2 (7)</code> có chi phí phạt <b>cao</b> vì cùng màu!',
      ],
      changes: ['+ FG→P1(9), FG→P2(8) | P3→BG(9), P4→BG(8)', '+ Cạnh ranh giới khác màu P1→P3(2), P2→P4(2) có chi phí cắt rẻ'],
      metrics: [
        { id: 'pixels', label: 'Số Pixel', value: '4 (lưới 2×2)', level: 'violet' },
        { id: 'energy', label: 'Năng lượng cắt', value: 'Chưa tối ưu', level: 'normal' },
      ],
      scene: {
        nodes: n(),
        edges: [
          { id: 'SP1', from: 'S', to: 'P1', flow: 0, cap: 9, label: 'FG=9' },
          { id: 'SP2', from: 'S', to: 'P2', flow: 0, cap: 8, label: 'FG=8' },
          { id: 'P1P2', from: 'P1', to: 'P2', flow: 0, cap: 7, label: 'sim=7' },
          { id: 'P1P3', from: 'P1', to: 'P3', flow: 0, cap: 2, label: 'biên=2' },
          { id: 'P2P4', from: 'P2', to: 'P4', flow: 0, cap: 2, label: 'biên=2' },
          { id: 'P3T', from: 'P3', to: 'T', flow: 0, cap: 9, label: 'BG=9' },
          { id: 'P4T', from: 'P4', to: 'T', flow: 0, cap: 8, label: 'BG=8' },
        ],
      },
    },
    {
      short: 'Min-Cut tách nền!',
      tag: 'Graph Cuts • Chi phí tối thiểu = 4',
      title: 'Min-Cut tự động cắt đúng đường biên P1→P3 (2) + P2→P4 (2) = 4!',
      activeLines: [5, 6],
      body: [
        'Khi chạy Max-Flow (Boykov–Kolmogorov / IBFS), luồng bão hòa tại đúng 2 cạnh ranh giới <code>P1→P3 (2/2)</code> và <code>P2→P4 (2/2)</code> với tổng năng lượng nhỏ nhất = <b>4</b>!',
        'Kết quả tách nền tự động: <b>Vật thể = {P1, P2} (Zone S xanh)</b> và <b>Nền = {P3, P4} (Zone T đỏ)</b> — không hề cắt nhầm vào giữa vật thể!',
      ],
      changes: ['+ Max Flow = Min-Cut = 2 + 2 = 4 (chi phí năng lượng thấp nhất)', '+ Vật thể (Foreground) = {P1, P2} | Nền (Background) = {P3, P4}'],
      callout: { kind: 'insight', title: 'Ứng dụng thực tế', text: 'Đây chính là nguyên lý đứng sau công cụ tách nền GrabCut trong OpenCV, Photoshop và phân đoạn khối u trên ảnh CT/MRI!' },
      metrics: [
        { id: 'energy', label: 'Min-Cut Energy', value: '4 (Tối ưu)', level: 'good' },
        { id: 'fg', label: 'Vật thể (FG)', value: 'P1, P2', level: 'good' },
        { id: 'bg', label: 'Nền (BG)', value: 'P3, P4', level: 'bad' },
      ],
      scene: {
        nodes: n({
          S: { state: 'mincut-s' }, P1: { state: 'mincut-s', spot: true }, P2: { state: 'mincut-s', spot: true },
          P3: { state: 'mincut-t', spot: true }, P4: { state: 'mincut-t', spot: true }, T: { state: 'mincut-t' },
        }),
        zones: [
          { kind: 's', label: 'Foreground (Vật thể)', nodes: ['S', 'P1', 'P2'] },
          { kind: 't', label: 'Background (Nền)', nodes: ['P3', 'P4', 'T'] },
        ],
        edges: [
          { id: 'SP1', from: 'S', to: 'P1', flow: 2, cap: 9, label: '2/9' },
          { id: 'SP2', from: 'S', to: 'P2', flow: 2, cap: 8, label: '2/8' },
          { id: 'P1P2', from: 'P1', to: 'P2', flow: 0, cap: 7, label: '0/7' },
          { id: 'P1P3', from: 'P1', to: 'P3', flow: 2, cap: 2, kind: 'cut', label: 'Cắt: 2' },
          { id: 'P2P4', from: 'P2', to: 'P4', flow: 2, cap: 2, kind: 'cut', label: 'Cắt: 2' },
          { id: 'P3T', from: 'P3', to: 'T', flow: 2, cap: 9, label: '2/9' },
          { id: 'P4T', from: 'P4', to: 'T', flow: 2, cap: 8, label: '2/8' },
        ],
      },
    },
  ],
};
