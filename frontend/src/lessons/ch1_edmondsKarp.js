// ============================================================================
// Bài 2: Edmonds–Karp (BFS — Đường tăng luồng ngắn nhất theo số cạnh)
// ============================================================================

import { bfsAugmentingPath, computeMinCut } from '../algorithms/maxflowCore.js';

const PSEUDOCODE = [
  'function edmondsKarp(adj, S, T) {',
  '  let flow = 0, pNode = new Int32Array(V), q = [];',
  '  while (true) {',
  '    const path = bfsShortest(adj, S, T); // ít cạnh nhất',
  '    if (!path) break;',
  '    const d = Math.min(...path.map(e => e.cap - e.flow));',
  '    for (const e of path) { e.flow += d; rev(e).flow -= d; }',
  '  } return flow;',
];

export const INITIAL_EK_NODES = [
  { id: 'S', label: 'S', sub: 'Nguồn', x: 90, y: 200 },
  { id: 'A', label: 'A', sub: 'Tầng 1', x: 270, y: 85 },
  { id: 'B', label: 'B', sub: 'Tầng 1', x: 270, y: 315 },
  { id: 'C', label: 'C', sub: 'Tầng 2', x: 460, y: 85 },
  { id: 'D', label: 'D', sub: 'Tầng 2', x: 460, y: 315 },
  { id: 'T', label: 'T', sub: 'Đích', x: 640, y: 200 },
];

export const INITIAL_EK_EDGES = [
  { id: 'SA', from: 'S', to: 'A', cap: 10 },
  { id: 'SB', from: 'S', to: 'B', cap: 10 },
  { id: 'AB', from: 'A', to: 'B', cap: 2 },
  { id: 'AC', from: 'A', to: 'C', cap: 4 },
  { id: 'AD', from: 'A', to: 'D', cap: 8 },
  { id: 'BD', from: 'B', to: 'D', cap: 9 },
  { id: 'DC', from: 'D', to: 'C', cap: 6 },
  { id: 'CT', from: 'C', to: 'T', cap: 10 },
  { id: 'DT', from: 'D', to: 'T', cap: 10 },
];

function buildEdmondsKarpSteps(customNodes = INITIAL_EK_NODES, customEdges = INITIAL_EK_EDGES) {
  const NODES_BASE = customNodes;
  const edges = customEdges.map((e) => ({ ...e, flow: 0 }));
  const steps = [];
  let totalFlow = 0;
  let iter = 0;

  // Step 0: Intro
  steps.push({
    short: 'Khởi tạo',
    tag: 'BFS Shortest Path',
    title: 'Luôn chọn đường tăng luồng ít cạnh nhất (BFS)',
    activeLines: [1, 2],
    body: [
      'Edmonds–Karp thay DFS bằng <span class="term">BFS</span> để luôn chọn đường đi từ <code>S → T</code> có <b>số cạnh (hops) nhỏ nhất</b> trên đồ thị thặng dư.',
      'Nhờ tính chất khoảng cách BFS <code>d(S, v)</code> không bao giờ giảm, thuật toán đảm bảo dừng sau tối đa <code>O(V · E)</code> lần tăng luồng → tổng độ phức tạp <code>O(V · E²)</code>.',
    ],
    changes: [
      '+ Khởi tạo mạng 6 đỉnh, 9 cạnh với flow = 0',
      '+ Với Diamond Trap ở bài 1, BFS né cạnh chéo và xong trong đúng 2 bước!',
    ],
    callout: {
      kind: 'insight',
      title: 'Bất biến quan trọng',
      text: 'Độ dài đường tăng luồng (Path Hops) sẽ tăng đơn điệu: 3 → 3 → 3 → 4... Không bao giờ có chuyện quay lại đường ngắn hơn.',
    },
    metrics: [
      { id: 'flow', label: 'Max Flow', value: '0', level: 'normal' },
      { id: 'hops', label: 'Path Hops', value: '—', level: 'normal' },
      { id: 'iter', label: 'Vòng BFS', value: '0', level: 'good' },
      { id: 'bound', label: 'Độ phức tạp', value: 'O(V · E²)', level: 'good' },
    ],
    scene: {
      nodes: NODES_BASE.map((n) => ({
        ...n,
        state: n.id === 'S' ? 'source' : n.id === 'T' ? 'sink' : 'idle',
      })),
      edges: edges.map((e) => ({ ...e })),
    },
  });

  // Real BFS iterations
  while (true) {
    const res = bfsAugmentingPath(NODES_BASE, edges, 'S', 'T', 1);
    if (!res.found) break;
    iter++;

    const pathNodeIds = new Set(['S', ...res.path.map((p) => p.to)]);
    const pathEdgeMap = new Map(res.path.map((p) => [p.edgeId, p.dir]));
    const pathStr = ['S', ...res.path.map((p) => (p.dir === -1 ? `↩ ${p.to}` : `→ ${p.to}`))].join(' ');
    const hops = res.path.length;

    // Step A: BFS discovery + highlight shortest path
    steps.push({
      short: `BFS #${iter}`,
      tag: `Vòng BFS #${iter} (${hops} cạnh)`,
      title: `Tìm thấy đường ngắn nhất: ${pathStr}`,
      activeLines: [4, 6],
      body: [
        `BFS loang theo từng lớp từ <code>S</code> (xem badge <code>d=k</code> trên mỗi đỉnh) và tìm thấy đường <b>${hops} cạnh</b> tới <code>T</code>: <code>${pathStr}</code>.`,
        `Nút cổ chai trên đường này là <code>Δ = ${res.bottleneck}</code>. Nhấn <b>Tiếp theo</b> để đẩy <code>+${res.bottleneck}</code> đơn vị luồng.`,
      ],
      changes: [
        `~ Đường ngắn nhất P${iter}: ${pathStr} (${hops} hops)`,
        `+ Bottleneck Δ = ${res.bottleneck}`,
      ],
      metrics: [
        { id: 'flow', label: 'Max Flow', value: String(totalFlow), level: 'normal' },
        { id: 'hops', label: 'Path Hops', value: `${hops} cạnh`, level: 'violet' },
        { id: 'delta', label: 'Bottleneck Δ', value: String(res.bottleneck), level: 'warn' },
        { id: 'iter', label: 'Vòng BFS', value: String(iter), level: 'normal' },
      ],
      scene: {
        nodes: NODES_BASE.map((n) => ({
          ...n,
          badge: res.dist[n.id] !== undefined ? `d=${res.dist[n.id]}` : '∞',
          state:
            n.id === 'S'
              ? 'source'
              : n.id === 'T'
                ? 'sink'
                : pathNodeIds.has(n.id)
                  ? 'active'
                  : res.dist[n.id] !== undefined
                    ? 'visited'
                    : 'idle',
          spot: pathNodeIds.has(n.id),
        })),
        edges: edges.map((e) => {
          const dir = pathEdgeMap.get(e.id);
          return {
            ...e,
            kind: dir === 1 ? 'augment' : e.flow >= e.cap ? 'saturated' : 'normal',
            backAugment: dir === -1,
          };
        }),
      },
    });

    // Mutate flow
    const saturatedNow = [];
    for (const seg of res.path) {
      const e = edges.find((x) => x.id === seg.edgeId);
      e.flow += seg.dir * res.bottleneck;
      if (e.flow === e.cap) saturatedNow.push(`${e.from}→${e.to}`);
    }
    totalFlow += res.bottleneck;

    // Step B: After augmentation
    steps.push({
      short: `Đẩy +${res.bottleneck}`,
      tag: `Cập nhật luồng #${iter}`,
      title: `Cập nhật luồng: Tổng |f| = ${totalFlow}`,
      activeLines: [7],
      body: [
        `Đã đẩy <code>+${res.bottleneck}</code> đơn vị luồng dọc theo <code>${pathStr}</code>.`,
        saturatedNow.length
          ? `Cạnh bão hòa mới (critical edge): <code>${saturatedNow.join(', ')}</code> — cạnh này bị loại khỏi đồ thị thặng dư ở các bước sau.`
          : 'Đồ thị thặng dư đã được cập nhật cùng các cạnh ngược tương ứng.',
      ],
      changes: [
        `+ Tổng luồng |f|: ${totalFlow - res.bottleneck} → ${totalFlow}`,
        ...saturatedNow.map((s) => `~ Cạnh bão hòa: ${s}`),
      ],
      metrics: [
        { id: 'flow', label: 'Max Flow', value: String(totalFlow), level: 'good' },
        { id: 'hops', label: 'Path Hops', value: `${hops} cạnh`, level: 'normal' },
        { id: 'delta', label: 'Vừa đẩy', value: `+${res.bottleneck}`, level: 'good' },
        { id: 'iter', label: 'Vòng BFS', value: String(iter), level: 'normal' },
      ],
      scene: {
        nodes: NODES_BASE.map((n) => ({
          ...n,
          state: n.id === 'S' ? 'source' : n.id === 'T' ? 'sink' : 'idle',
        })),
        edges: edges.map((e) => ({
          ...e,
          kind: e.flow >= e.cap ? 'saturated' : 'normal',
        })),
      },
    });
  }

  // Final Min-Cut step
  const minCut = computeMinCut(NODES_BASE, edges, 'S');
  const cutSet = new Set(minCut.cutEdges.map((e) => e.id));

  steps.push({
    short: 'Min-Cut',
    tag: 'Hoàn tất • Max-Flow = Min-Cut',
    title: `Hết đường BFS! Max Flow = ${totalFlow}`,
    activeLines: [5, 8],
    body: [
      `BFS từ <code>S</code> chỉ chạm tới tập <code>Zone S = {${minCut.sNodes.join(', ')}}</code> và không thể đến <code>T</code>.`,
      `Các cạnh đi từ <code>Zone S → Zone T</code> (${minCut.cutEdges.map((e) => `<code>${e.from}→${e.to}</code>`).join(', ')}) đều đã bão hòa và có tổng sức chứa <b>${minCut.cutCap} = Max Flow</b>.`,
    ],
    changes: [
      `+ Kết luận: Max Flow = ${totalFlow} sau đúng ${iter} vòng BFS`,
      `+ Lát cắt cực tiểu (Min-Cut) = ${minCut.cutCap}`,
    ],
    compare: {
      headers: ['Thuật toán', 'Diamond Trap (C=1000)', 'Độ phức tạp'],
      rows: [
        ['Ford–Fulkerson', '2.000 bước', 'O(E · f*)'],
        ['Edmonds–Karp', '2 bước', 'O(V · E²)'],
      ],
    },
    metrics: [
      { id: 'flow', label: 'Max Flow', value: String(totalFlow), level: 'good' },
      { id: 'mincut', label: 'Min-Cut', value: String(minCut.cutCap), level: 'good' },
      { id: 'iter', label: 'Tổng vòng BFS', value: String(iter), level: 'good' },
      { id: 'bound', label: 'Độ phức tạp', value: 'O(V · E²)', level: 'good' },
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
    banner: s.banner || '💡 Click cạnh để tăng +1 sức chứa (Shift+Click giảm -1) và chạy lại BFS',
    scene: { ...s.scene, interactiveEdges: true },
  }));
}

export function buildEdmondsKarpLesson(customNodes = INITIAL_EK_NODES, customEdges = INITIAL_EK_EDGES) {
  return {
    id: 'edmonds-karp',
    chapterId: 'ch1',
    title: '2. Edmonds–Karp (BFS)',
    complexity: 'O(V · E²)',
    complexityAnalysis: {
      time: 'O(V · E²)',
      space: 'O(V + E)',
      classType: 'Strongly Polynomial (độc lập với giá trị sức chứa)',
      derivation: [
        { step: '1. Chi phí 1 lần tìm đường ngắn nhất (BFS)', formula: 'O(V + E) = O(E)', note: 'BFS duyệt theo tầng tìm đường ít cạnh nhất từ S → T trên G_f.' },
        { step: '2. Bổ đề khoảng cách không giảm', formula: 'd_f(S, v) tăng đơn điệu', note: 'Sau mỗi lần tăng luồng, khoảng cách ngắn nhất từ S đến mọi đỉnh v không bao giờ giảm.' },
        { step: '3. Số lần 1 cạnh làm nút cổ chai (critical)', formula: '≤ V / 2 lần / cạnh', note: 'Mỗi khi cạnh (u,v) bão hòa rồi xuất hiện lại, khoảng cách d(S,u) phải tăng thêm ít nhất +2. Vì d < V nên tối đa V/2 lần.' },
        { step: '4. Tổng số lần tăng luồng', formula: 'E × (V / 2) = O(V · E)', note: 'Mỗi đường tăng luồng có ít nhất 1 cạnh bão hòa → tổng số vòng BFS là O(V · E).' },
        { step: '5. Tổng thời gian', formula: 'O(E) × O(V · E) = O(V · E²)', note: 'Hoàn toàn không phụ thuộc sức chứa U hay f*!' },
      ],
      worstCase: 'Đồ thị dày nhiều tầng có E ≈ V² → độ phức tạp lên tới O(V⁵), chậm hơn Dinic O(V²E).',
      vsOthers: [
        { algo: 'Ford–Fulkerson', diff: 'An toàn tuyệt đối trên Diamond Trap (2 bước thay vì 2000 bước).' },
        { algo: 'Capacity Scaling', diff: 'Trên đồ thị thưa (E nhỏ) và U vừa phải, Capacity Scaling thường nhanh hơn thực tế.' },
      ],
    },
    pseudocode: PSEUDOCODE,
    legend: [
      { type: 'dot', color: 'var(--blue-2)', label: 'Đỉnh đã thăm (BFS Layer d=k)' },
      { type: 'dot', color: 'var(--amber-2)', label: 'Đường ngắn nhất (Shortest Path)' },
      { type: 'dot', color: 'var(--green-3)', label: 'Luồng đang chảy / Bão hòa' },
      { type: 'line', color: 'var(--rust-2)', dashed: true, label: 'Cạnh thuộc Min-Cut' },
    ],
    steps: buildEdmondsKarpSteps(customNodes, customEdges),
  };
}

export const lessonEdmondsKarp = buildEdmondsKarpLesson();
