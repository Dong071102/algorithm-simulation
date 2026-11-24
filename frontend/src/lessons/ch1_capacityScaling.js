// ============================================================================
// Bài 3: Capacity Scaling (Lọc cạnh theo ngưỡng Δ = 2^k giảm dần)
// ============================================================================

import { bfsAugmentingPath, computeMinCut } from '../algorithms/maxflowCore.js';

const PSEUDOCODE = [
  'function capacityScaling(adj, S, T, U) {',
  '  let flow = 0, delta = 1;',
  '  while (delta * 2 <= U) delta *= 2; // Δ = 2^⌊log2 U⌋',
  '  while (delta >= 1) {',
  '    // Chỉ duyệt cạnh có (e.cap - e.flow) >= delta',
  '    while ((pushed = dfsDelta(S, Infinity, delta)) > 0) {',
  '      flow += pushed; // cập nhật e.flow & rev.flow',
  '    } delta >>= 1;    // chia đôi ngưỡng Δ',
  '  } return flow;',
];

export const INITIAL_CS_NODES = [
  { id: 'S', label: 'S', sub: 'Nguồn', x: 90, y: 200 },
  { id: 'A', label: 'A', sub: 'Trạm A', x: 280, y: 80 },
  { id: 'B', label: 'B', sub: 'Trạm B', x: 280, y: 320 },
  { id: 'C', label: 'C', sub: 'Trạm C', x: 470, y: 80 },
  { id: 'D', label: 'D', sub: 'Trạm D', x: 470, y: 320 },
  { id: 'T', label: 'T', sub: 'Đích', x: 650, y: 200 },
];

export const INITIAL_CS_EDGES = [
  { id: 'SA', from: 'S', to: 'A', cap: 16 },
  { id: 'SB', from: 'S', to: 'B', cap: 9 },
  { id: 'AB', from: 'A', to: 'B', cap: 2 },
  { id: 'AC', from: 'A', to: 'C', cap: 12 },
  { id: 'AD', from: 'A', to: 'D', cap: 4 },
  { id: 'BD', from: 'B', to: 'D', cap: 10 },
  { id: 'DC', from: 'D', to: 'C', cap: 3 },
  { id: 'CT', from: 'C', to: 'T', cap: 15 },
  { id: 'DT', from: 'D', to: 'T', cap: 8 },
];

function buildCapacityScalingSteps(customNodes = INITIAL_CS_NODES, customEdges = INITIAL_CS_EDGES) {
  const NODES_BASE = customNodes;
  const edges = customEdges.map((e) => ({ ...e, flow: 0 }));
  const steps = [];
  const maxCap = Math.max(...edges.map((e) => e.cap));
  let delta = 1 << Math.floor(Math.log2(maxCap));
  let totalFlow = 0;
  let totalPaths = 0;

  // Step 0: Overview
  steps.push({
    short: 'Khởi tạo',
    tag: 'Ý tưởng "Đường cao tốc trước"',
    title: `Khởi tạo ngưỡng Scale Δ = ${delta} (từ U = ${maxCap})`,
    activeLines: [1, 2, 3],
    body: [
      'Thay vì chọn đường ngắn nhất theo số cạnh, <span class="term">Capacity Scaling</span> ưu tiên tìm các tuyến <b>băng thông lớn trước</b> bằng ngưỡng <code>Δ = 2^⌊log₂U⌋</code>.',
      `Với sức chứa lớn nhất <code>U = ${maxCap}</code>, ta bắt đầu từ <code>Δ = ${delta}</code>. Mọi cạnh có sức chứa thặng dư <code>c_f < Δ</code> sẽ tạm thời <b>bị ẩn mờ</b> trên sân khấu!`,
    ],
    changes: [
      `+ U = max(cap) = ${maxCap} → Khởi tạo Δ = ${delta}`,
      '+ Chỉ các cạnh có c_f ≥ Δ mới được xét trong mỗi pha',
    ],
    callout: {
      kind: 'insight',
      title: 'Tại sao nhanh?',
      text: 'Chỉ có đúng ⌊log₂U⌋ + 1 pha chia đôi Δ. Mỗi pha chỉ thực hiện tối đa 2E lần tăng luồng → Độ phức tạp O(E² log U).',
    },
    metrics: [
      { id: 'scale', label: 'Scale Δ', value: String(delta), level: 'violet' },
      { id: 'flow', label: 'Max Flow', value: '0', level: 'normal' },
      { id: 'iter', label: 'Đường tăng', value: '0', level: 'good' },
      { id: 'bound', label: 'Độ phức tạp', value: 'O(E² log U)', level: 'good' },
    ],
    scene: {
      nodes: NODES_BASE.map((n) => ({
        ...n,
        state: n.id === 'S' ? 'source' : n.id === 'T' ? 'sink' : 'idle',
      })),
      edges: edges.map((e) => ({ ...e })),
    },
  });

  while (delta >= 1) {
    const activeCount = edges.filter((e) => e.cap - e.flow >= delta).length;

    // Phase entry step
    steps.push({
      short: `Pha Δ=${delta}`,
      tag: `Δ-Phase • Ngưỡng ≥ ${delta}`,
      title: `Lọc đồ thị G_f(Δ = ${delta}): Chỉ giữ ${activeCount}/${edges.length} cạnh`,
      activeLines: [4, 5],
      body: [
        `Ở pha <code>Δ = ${delta}</code>, thuật toán chỉ nhìn thấy <b>${activeCount} cạnh</b> còn sức chứa thặng dư <code>≥ ${delta}</code>. Các cạnh nhỏ hơn tạm mờ đi.`,
        activeCount === 0 || !bfsAugmentingPath(NODES_BASE, edges, 'S', 'T', delta).found
          ? `Không có đường thông suốt từ <code>S → T</code> nào đủ ngưỡng <code>≥ ${delta}</code>. Ta sẽ chia đôi <code>Δ</code> ngay ở bước kế tiếp.`
          : `Có đường cao tốc đủ ngưỡng <code>≥ ${delta}</code> nối <code>S → T</code>! Hãy đẩy luồng qua trước.`,
      ],
      changes: [
        `~ Thiết lập ngưỡng lọc Scale Δ = ${delta}`,
        `+ Số cạnh mở khóa (c_f ≥ ${delta}): ${activeCount}/${edges.length}`,
      ],
      metrics: [
        { id: 'scale', label: 'Scale Δ', value: String(delta), level: 'violet' },
        { id: 'flow', label: 'Max Flow', value: String(totalFlow), level: 'normal' },
        { id: 'iter', label: 'Đường tăng', value: String(totalPaths), level: 'normal' },
        { id: 'bound', label: 'Độ phức tạp', value: 'O(E² log U)', level: 'good' },
      ],
      scene: {
        nodes: NODES_BASE.map((n) => ({
          ...n,
          state: n.id === 'S' ? 'source' : n.id === 'T' ? 'sink' : 'idle',
        })),
        edges: edges.map((e) => ({
          ...e,
          kind: e.cap - e.flow >= delta ? (e.flow >= e.cap ? 'saturated' : 'normal') : 'off',
        })),
      },
    });

    while (true) {
      const res = bfsAugmentingPath(NODES_BASE, edges, 'S', 'T', delta);
      if (!res.found) break;
      totalPaths++;

      const pathNodeIds = new Set(['S', ...res.path.map((p) => p.to)]);
      const pathEdgeMap = new Map(res.path.map((p) => [p.edgeId, p.dir]));
      const pathStr = ['S', ...res.path.map((p) => (p.dir === -1 ? `↩ ${p.to}` : `→ ${p.to}`))].join(' ');

      // Apply flow
      for (const seg of res.path) {
        const e = edges.find((x) => x.id === seg.edgeId);
        e.flow += seg.dir * res.bottleneck;
      }
      totalFlow += res.bottleneck;

      steps.push({
        short: `+${res.bottleneck} (Δ=${delta})`,
        tag: `Đẩy luồng pha Δ = ${delta}`,
        title: `Đẩy +${res.bottleneck} qua ${pathStr}`,
        activeLines: [6, 7],
        body: [
          `Trên đồ thị lọc <code>G_f(${delta})</code>, tìm thấy đường <code>${pathStr}</code> với bottleneck <code>b = ${res.bottleneck} ≥ ${delta}</code>.`,
          `Cộng ngay <code>+${res.bottleneck}</code> vào đường này → Tổng luồng nhảy lên <b>${totalFlow}</b>!`,
        ],
        changes: [
          `+ Đường tăng #${totalPaths}: ${pathStr}`,
          `+ Đẩy b = ${res.bottleneck} (≥ Δ=${delta}) → Tổng |f| = ${totalFlow}`,
        ],
        metrics: [
          { id: 'scale', label: 'Scale Δ', value: String(delta), level: 'violet' },
          { id: 'flow', label: 'Max Flow', value: String(totalFlow), level: 'good' },
          { id: 'delta', label: 'Vừa đẩy', value: `+${res.bottleneck}`, level: 'good' },
          { id: 'iter', label: 'Đường tăng', value: String(totalPaths), level: 'normal' },
        ],
        scene: {
          nodes: NODES_BASE.map((n) => ({
            ...n,
            state:
              n.id === 'S'
                ? 'source'
                : n.id === 'T'
                ? 'sink'
                : pathNodeIds.has(n.id)
                ? 'active'
                : 'idle',
            spot: pathNodeIds.has(n.id),
          })),
          edges: edges.map((e) => {
            const dir = pathEdgeMap.get(e.id);
            if (dir === 1) return { ...e, kind: 'augment' };
            if (dir === -1) return { ...e, backAugment: true };
            return {
              ...e,
              kind: e.cap - e.flow >= delta ? (e.flow >= e.cap ? 'saturated' : 'normal') : 'off',
            };
          }),
        },
      });
    }

    delta = Math.floor(delta / 2);
  }

  // Final Min-Cut
  const minCut = computeMinCut(NODES_BASE, edges, 'S');
  const cutSet = new Set(minCut.cutEdges.map((e) => e.id));

  steps.push({
    short: 'Hoàn tất',
    tag: 'Δ < 1 • Tối ưu toàn cục',
    title: `Kết thúc Capacity Scaling: Max Flow = ${totalFlow}`,
    activeLines: [8, 9],
    body: [
      `Sau khi đi qua hết các pha chia đôi <code>16 → 8 → 4 → 2 → 1</code> và <code>Δ < 1</code>, không còn đường tăng luồng nào nữa.`,
      `Chỉ mất đúng <b>${totalPaths} đường tăng luồng</b> để đạt tối ưu <code>|f*| = ${totalFlow}</code>, trùng khớp với Min-Cut <code>${minCut.cutCap}</code>.`,
    ],
    changes: [
      `+ Max Flow = ${totalFlow} | Min-Cut = ${minCut.cutCap}`,
      `+ Tổng số đường tăng luồng: ${totalPaths}`,
    ],
    compare: {
      headers: ['Thuật toán', 'Ưu tiên chọn đường', 'Độ phức tạp'],
      rows: [
        ['Ford–Fulkerson', 'Tùy ý (DFS)', 'O(E · f*)'],
        ['Edmonds–Karp', 'Ít cạnh nhất (BFS)', 'O(V · E²)'],
        ['Capacity Scaling', 'Ống lớn trước (≥ Δ)', 'O(E² log U)'],
      ],
    },
    metrics: [
      { id: 'scale', label: 'Scale Δ', value: '0 (Xong)', level: 'good' },
      { id: 'flow', label: 'Max Flow', value: String(totalFlow), level: 'good' },
      { id: 'mincut', label: 'Min-Cut', value: String(minCut.cutCap), level: 'good' },
      { id: 'iter', label: 'Đường tăng', value: String(totalPaths), level: 'good' },
    ],
    scene: {
      nodes: NODES_BASE.map((n) => ({
        ...n,
        state: minCut.reachable.has(n.id) ? 'mincut-s' : 'mincut-t',
      })),
      zones: [
        { kind: 's', label: `Zone S (${minCut.sNodes.join(',')})`, nodes: minCut.sNodes },
        { kind: 't', label: `Zone T (${minCut.tNodes.join(',')})`, nodes: minCut.tNodes },
      ],
      edges: edges.map((e) => ({
        ...e,
        kind: cutSet.has(e.id) ? 'cut' : e.flow >= e.cap ? 'saturated' : 'normal',
      })),
    },
  });

  return steps.map((s) => ({
    ...s,
    banner: s.banner || '💡 Click cạnh để tăng +1 sức chứa (Shift+Click giảm -1) và xem ngưỡng Δ thay đổi!',
    scene: { ...s.scene, interactiveEdges: true },
  }));
}

export function buildCapacityScalingLesson(customNodes = INITIAL_CS_NODES, customEdges = INITIAL_CS_EDGES) {
  return {
    id: 'capacity-scaling',
    chapterId: 'ch1',
    title: '3. Capacity Scaling (Δ)',
    complexity: 'O(E² log U)',
    complexityAnalysis: {
      time: 'O(E² log U)',
      space: 'O(V + E)',
      classType: 'Weakly Polynomial (phụ thuộc log₂ U)',
      derivation: [
        { step: '1. Số pha chia đôi ngưỡng Δ', formula: '⌊log₂ U⌋ + 1 = O(log U)', note: 'Bắt đầu từ Δ = 2^⌊log₂U⌋ và chia đôi Δ ← Δ/2 cho tới khi Δ < 1.' },
        { step: '2. Lượng luồng tối đa còn thiếu đầu pha Δ', formula: '≤ 2 · E · Δ', note: 'Cuối pha trước (2Δ), mọi cạnh cắt ngang S→T trong G_f đều có c_f < 2Δ → tổng luồng đẩy thêm ở pha Δ không quá E × 2Δ.' },
        { step: '3. Số đường tăng luồng trong 1 pha Δ', formula: '≤ (2E·Δ) / Δ = 2E lần', note: 'Vì mỗi đường trên G_f(Δ) đẩy thêm ít nhất Δ đơn vị luồng → mỗi pha tối đa 2E đường.' },
        { step: '4. Tổng thời gian', formula: 'O(log U) × 2E × O(E) = O(E² log U)', note: 'Mỗi lần tìm đường DFS tốn O(E). Nếu kết hợp Dinic ở mỗi pha sẽ còn O(V · E · log U).' },
      ],
      worstCase: 'Khi đồ thị có rất nhiều cạnh nhỏ và U cực lớn (ví dụ 64-bit), số pha log₂ U ≈ 60 vẫn rất nhỏ trong thực tế.',
      vsOthers: [
        { algo: 'Ford–Fulkerson', diff: 'Biến thừa số f* (tuyến tính) thành log₂(U) (logarit) — nhanh hơn hàng nghìn lần khi U lớn.' },
        { algo: 'Edmonds–Karp', diff: 'Nhanh hơn Edmonds–Karp khi log₂(U) < V (rất phổ biến trên đồ thị thực tế lớn).' },
      ],
    },
    pseudocode: PSEUDOCODE,
    legend: [
      { type: 'dot', color: 'var(--amber-2)', label: 'Đường cao tốc đang đẩy (≥ Δ)' },
      { type: 'line', color: 'var(--line-strong)', dashed: false, label: 'Cạnh mờ: c_f < Δ (tạm ẩn)' },
      { type: 'dot', color: 'var(--green-3)', label: 'Luồng đang chảy' },
      { type: 'line', color: 'var(--rust-2)', dashed: true, label: 'Min-Cut cuối cùng' },
    ],
    steps: buildCapacityScalingSteps(customNodes, customEdges),
  };
}

export const lessonCapacityScaling = buildCapacityScalingLesson();
