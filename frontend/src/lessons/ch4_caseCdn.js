// ============================================================================
// Case Study 1: Điều phối Băng thông CDN & Min-Cut (Tương tác nâng cấp cáp!)
// ============================================================================

import { solveEdmondsKarp } from '../algorithms/maxflowCore.js';

const PSEUDOCODE = [
  '// Bài toán thực tế: Tối ưu băng thông Livestream CDN',
  '1. Mô hình hóa: Origin = S, Edge VN = T, Cáp quang = E',
  '2. Chạy Max-Flow (Edmonds-Karp / Capacity Scaling)',
  '3. Tìm tập đỉnh Zone S đi tới được từ Origin trên G_f',
  '4. Min-Cut = các tuyến cáp từ Zone S → Zone T',
  '// Quy tắc đầu tư hạ tầng:',
  '   Chỉ nâng cấp cáp thuộc Min-Cut mới tăng tổng Gbps!',
];

export const NODES_CDN = [
  { id: 'S', label: 'ORG', sub: 'Origin US', x: 85, y: 200 },
  { id: 'SG', label: 'SG', sub: 'Singapore PoP', x: 280, y: 80 },
  { id: 'TYO', label: 'TYO', sub: 'Tokyo PoP', x: 280, y: 320 },
  { id: 'HK', label: 'HK', sub: 'HongKong Hub', x: 470, y: 120 },
  { id: 'BKK', label: 'BKK', sub: 'Bangkok Hub', x: 470, y: 290 },
  { id: 'T', label: 'VN', sub: 'Edge Việt Nam', x: 655, y: 200 },
];

export const INITIAL_CDN_EDGES = [
  { id: 'ORG-SG', from: 'S', to: 'SG', cap: 12 },
  { id: 'ORG-TYO', from: 'S', to: 'TYO', cap: 10 },
  { id: 'SG-HK', from: 'SG', to: 'HK', cap: 6 },
  { id: 'SG-BKK', from: 'SG', to: 'BKK', cap: 4 },
  { id: 'TYO-HK', from: 'TYO', to: 'HK', cap: 5 },
  { id: 'TYO-BKK', from: 'TYO', to: 'BKK', cap: 8 },
  { id: 'HK-VN', from: 'HK', to: 'T', cap: 14 },
  { id: 'BKK-VN', from: 'BKK', to: 'T', cap: 7 },
];

export function buildCdnLesson(customEdges = INITIAL_CDN_EDGES, lastUpgradeNote = null, preSolved = null, customNodes = NODES_CDN) {
  const nodes = customNodes;
  const result = preSolved || solveEdmondsKarp(nodes, customEdges, 'S', 'T');
  const reachableSet = result.minCut.reachable instanceof Set ? result.minCut.reachable : new Set(result.minCut.sNodes);
  const cutSet = new Set(result.minCut.cutEdges.map((e) => e.id));
  const cutNames = result.minCut.cutEdges.map((e) => `${e.from}→${e.to} (${e.cap}G)`).join(', ');

  const steps = [
    {
      short: 'Bài toán CDN',
      tag: 'Case Study Thực tế #1',
      title: 'Phát Livestream từ Origin US về Edge Việt Nam',
      activeLines: [1, 2],
      body: [
        'Hệ thống phát video từ máy chủ gốc <code>ORG</code> về người xem tại <code>VN</code> đi qua các trạm trung chuyển <code>SG, TYO, HK, BKK</code>. Nhãn trên mỗi tuyến là <code>lưu lượng / băng thông tối đa (Gbps)</code>.',
        'Bài toán đặt ra cho kỹ sư hạ tầng: <b>(1)</b> Tổng băng thông cực đại là bao nhiêu? <b>(2)</b> Nếu chỉ đủ ngân sách nâng cấp 1 tuyến cáp, nên nâng cấp tuyến nào?',
      ],
      changes: [
        '+ Mô hình hóa hạ tầng CDN thành Flow Network 6 nút, 8 tuyến cáp',
        '+ Nhấn Tiếp theo để chạy Max-Flow tìm điểm nghẽn toàn cục',
      ],
      metrics: [
        { id: 'flow', label: 'Băng thông', value: '0 Gbps', level: 'normal' },
        { id: 'mincut', label: 'Min-Cut', value: 'Chưa tìm', level: 'normal' },
        { id: 'mode', label: 'Chế độ', value: 'Mô phỏng', level: 'violet' },
      ],
      scene: {
        nodes: nodes.map((n) => ({
          ...n,
          state: n.id === 'S' ? 'source' : n.id === 'T' ? 'sink' : 'idle',
        })),
        edges: customEdges.map((e) => ({ ...e, flow: 0, label: `0/${e.cap}G` })),
      },
    },
    {
      short: 'Đẩy luồng',
      tag: 'Phân bổ lưu lượng',
      title: `Cân bằng tải đạt ${result.totalFlow} Gbps sau ${result.iterations} tuyến`,
      activeLines: [3],
      body: [
        `Thuật toán Max-Flow tự động chia lưu lượng qua <b>${result.iterations} tuyến tăng luồng</b> độc lập để tận dụng tối đa mọi nhánh cáp song song.`,
        `Quan sát các tuyến màu xanh đậm đã đạt bão hòa 100%, trong khi một số tuyến như <code>HK→VN</code> vẫn còn dư băng thông nhưng không nhận thêm được dữ liệu từ phía trước.`,
      ],
      changes: [
        `+ Tổng lưu lượng thực tế đạt ${result.totalFlow} Gbps`,
        `~ Số tuyến tăng luồng sử dụng: ${result.iterations}`,
      ],
      metrics: [
        { id: 'flow', label: 'Max Flow', value: `${result.totalFlow} Gbps`, level: 'good' },
        { id: 'iter', label: 'Số tuyến', value: String(result.iterations), level: 'normal' },
      ],
      scene: {
        nodes: nodes.map((n) => ({
          ...n,
          state: n.id === 'S' ? 'source' : n.id === 'T' ? 'sink' : 'idle',
        })),
        edges: result.edges.map((e) => ({
          ...e,
          label: `${e.flow}/${e.cap}G`,
          kind: e.flow >= e.cap ? 'saturated' : 'normal',
        })),
      },
    },
    {
      short: 'Min-Cut & Thử nâng cáp!',
      tag: 'Tương tác Trực tiếp • Min-Cut',
      title: `Lát cắt nghẽn (Min-Cut) = ${result.minCut.cutCap} Gbps`,
      activeLines: [4, 5, 7],
      body: [
        `Tuyến cắt ngang biên đỏ giữa <code>Zone S</code> và <code>Zone T</code> là: <b>${cutNames}</b>.`,
        lastUpgradeNote
          ? lastUpgradeNote
          : '<b>Hãy click trực tiếp vào bất kỳ đường cáp nào trên sơ đồ</b> để nâng cấp thêm <code>+2 Gbps</code> và xem điều gì xảy ra với tổng băng thông!',
      ],
      changes: [
        `+ Max Flow hiện tại: ${result.totalFlow} Gbps`,
        `- Điểm nghẽn (Min-Cut): ${cutNames}`,
        '+ Mẹo: Click vào 1 cạnh bất kỳ trên sân khấu để nâng +2 Gbps!',
      ],
      callout: {
        kind: 'tip',
        title: 'Thí nghiệm Aha! Moment',
        text: 'Thử click nâng cấp tuyến HK→VN (không thuộc Min-Cut): tổng băng thông KHÔNG ĐỔI! Sau đó thử click một tuyến nét đứt màu đỏ (thuộc Min-Cut): tổng băng thông lập tức tăng!',
      },
      banner: '💡 Click trực tiếp lên bất kỳ tuyến cáp nào để tăng +1 Gbps (Shift+Click giảm -1)',
      metrics: [
        { id: 'flow', label: 'Max Flow', value: `${result.totalFlow} Gbps`, level: 'good' },
        { id: 'mincut', label: 'Min-Cut', value: `${result.minCut.cutCap} Gbps`, level: 'bad' },
        { id: 'cuts', label: 'Số cáp nghẽn', value: `${result.minCut.cutEdges.length} tuyến`, level: 'warn' },
      ],
      scene: {
        interactiveEdges: true,
        nodes: nodes.map((n) => ({
          ...n,
          state: reachableSet.has(n.id) ? 'mincut-s' : 'mincut-t',
        })),
        zones: [
          { kind: 's', label: `Zone S (${result.minCut.sNodes.join(',')})`, nodes: result.minCut.sNodes },
          { kind: 't', label: `Zone T (${result.minCut.tNodes.join(',')})`, nodes: result.minCut.tNodes },
        ],
        edges: result.edges.map((e) => ({
          ...e,
          label: `${e.flow}/${e.cap}G`,
          kind: cutSet.has(e.id) ? 'cut' : e.flow >= e.cap ? 'saturated' : 'normal',
        })),
      },
    },
  ];

  return {
    id: 'case-cdn',
    chapterId: 'ch1',
    title: 'Case 1: Băng thông CDN & Min-Cut',
    complexity: 'Interactive Lab',
    complexityAnalysis: {
      time: 'O(V · E²) + O(V + E)',
      space: 'O(V + E)',
      classType: 'Ứng dụng trực tiếp Định lý Max-Flow = Min-Cut',
      derivation: [
        { step: '1. Tính luồng cực đại (Edmonds–Karp)', formula: 'O(V · E²)', note: 'Tìm phân bổ lưu lượng tối ưu trên toàn mạng CDN.' },
        { step: '2. Trích xuất Min-Cut bằng BFS trên G_f', formula: 'O(V + E)', note: 'Chỉ cần 1 lần BFS từ Origin trên đồ thị thặng dư cuối để tách Zone S và Zone T.' },
        { step: '3. Phân tích độ nhạy nâng cấp cáp', formula: 'O(1) kiểm tra', note: 'Một tuyến cáp (u,v) có thể tăng tổng băng thông hệ thống khi và chỉ khi u ∈ Zone S và v ∈ Zone T.' },
      ],
      worstCase: 'Với mạng CDN hàng trăm PoP, nên dùng Dinic hoặc Capacity Scaling để giải dưới 1ms mỗi khi thay đổi băng thông.',
      vsOthers: [
        { algo: 'Thử sai thủ công', diff: 'Thay vì nâng cấp thử từng tuyến (tốn O(E) lần chạy lại), Min-Cut chỉ ra chính xác nhóm tuyến nghẽn trong 1 lần chạy.' },
      ],
    },
    pseudocode: PSEUDOCODE,
    isInteractiveCdn: true,
    legend: [
      { type: 'dot', color: 'var(--green-3)', label: 'Zone S (Còn dư đường từ Origin)' },
      { type: 'line', color: 'var(--rust-2)', dashed: true, label: 'Min-Cut (Cáp cần nâng cấp!)' },
      { type: 'dot', color: 'var(--amber-2)', label: 'Click cạnh để nâng +2 Gbps' },
    ],
    steps,
  };
}

export const lessonCaseCdn = buildCdnLesson();
