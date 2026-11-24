// ============================================================================
// Interactive Tree Simulator Engine (Ch. 2: B-Tree, B+, B-link, Bε, LSM, Buffer, R, KD)
// Supports real Insert (+key) and Delete (-key) with live SVG auto-layout!
// ============================================================================

const DEFAULT_KEYS = {
  'b-tree': [5, 10, 15, 20, 22, 30, 35, 40, 50, 60],
  'b-plus-tree': [5, 10, 15, 20, 25, 30, 35, 40, 50],
  'b-link-tree': [5, 10, 20, 22, 25, 30, 35],
  'bepsilon-tree': [5, 10, 14, 25, 30, 40],
  'lsm-tree': [10, 20, 42, 65, 88],
  'buffer-tree': [5, 12, 28, 35, 42],
  'r-tree': [22, 33, 77, 88],
  'kd-tree': [54, 26, 72, 13, 38, 61, 85],
};

export function createTreeSimState(lessonId) {
  const keys = [...(DEFAULT_KEYS[lessonId] || [10, 20, 30, 40, 50])];
  return {
    lessonId,
    keys,
    buffer: [], // used by Bε-Tree, Buffer Tree, LSM MemTable
    l0Tables: [], // used by LSM-Tree
    l1Keys: lessonId === 'lsm-tree' ? [5, 15, 40, 70] : [],
    lastAction: null,
    lastDiffs: [],
    highlightVal: null,
    searchVal: null,
    splitHappened: false,
  };
}

function estBoxW(label) {
  return Math.max(76, Math.ceil((label || '').length * 8.2 + 26));
}

function layoutRowCentered(items, gap = 28, centerX = 360) {
  const widths = items.map((it) => estBoxW(it.label));
  const totalW = widths.reduce((a, b) => a + b, 0) + Math.max(0, items.length - 1) * gap;
  let curX = centerX - totalW / 2;
  return items.map((it, i) => {
    const x = Math.round(curX + widths[i] / 2);
    curX += widths[i] + gap;
    return { ...it, w: widths[i], x };
  });
}

// ============================================================================
// Real Multi-way Balanced B-Tree / B+ Tree / B-link Tree Builder (maxKeys = 3)
// ============================================================================
function buildMultiwayScene(keys, mode, highlightVal) {
  const sorted = [...new Set(keys)].sort((a, b) => a - b);
  const nodes = [];
  const edges = [];

  if (!sorted.length) {
    nodes.push({ id: 'EMPTY', shape: 'box', label: '[ Cây rỗng ]', sub: 'Nhập số rồi bấm + Thêm', x: 360, y: 180, state: 'idle' });
    return { nodes, edges, height: 0, leafCount: 0 };
  }

  // Partition into leaf pages (2..3 keys per leaf, realistic B-Tree occupancy)
  const leaves = [];
  const pageSize = 3;
  for (let i = 0; i < sorted.length; i += pageSize) {
    leaves.push(sorted.slice(i, i + pageSize));
  }
  if (leaves.length >= 2 && leaves[leaves.length - 1].length === 1 && leaves[leaves.length - 2].length === 3) {
    const moved = leaves[leaves.length - 2].pop();
    leaves[leaves.length - 1].unshift(moved);
  }

  const leafCount = leaves.length;
  const leafGap = mode === 'b-plus-tree' || mode === 'b-link-tree' ? 62 : 28;

  // Build bottom leaf nodes with guaranteed non-overlapping horizontal layout
  const rawLeaves = leaves.map((grp, idx) => {
    const id = `L${idx}`;
    const hasHit = highlightVal !== null && grp.includes(highlightVal);
    const hk = idx < leaves.length - 1 ? leaves[idx + 1][0] : '∞';
    const label = mode === 'b-link-tree' ? `${grp.join(', ')} | HK:${hk}` : grp.join(' | ');
    return {
      id,
      shape: 'box',
      label,
      sub: mode === 'b-plus-tree' ? `Leaf ${idx + 1}` : `Nút ${idx + 1} (${grp.length}/3)`,
      badge: hasHit ? `★ ${highlightVal}` : mode === 'b-link-tree' ? `HK:${hk}` : null,
      y: leafCount === 1 ? 160 : 285,
      state: hasHit ? 'active' : 'tree-s',
      spot: hasHit,
    };
  });

  const placedLeaves = layoutRowCentered(rawLeaves, leafGap, 360);
  const leafIds = placedLeaves.map((l) => l.id);
  const leafX = placedLeaves.map((l) => l.x);
  nodes.push(...placedLeaves);

  // Right-sibling links for B+ Tree & B-link Tree
  if (mode === 'b-plus-tree' || mode === 'b-link-tree') {
    for (let i = 0; i < leafIds.length - 1; i++) {
      edges.push({
        id: `NEXT-${i}`,
        from: leafIds[i],
        to: leafIds[i + 1],
        flow: 1,
        cap: 1,
        kind: 'tree-s',
        label: mode === 'b-link-tree' ? '→' : 'next',
      });
    }
  }

  if (leafCount === 1) {
    return { nodes, edges, height: 1, leafCount: 1 };
  }

  // Group leaves under internal parents (up to 4 children per parent)
  const internalGroups = [];
  for (let i = 0; i < leafCount; i += 4) {
    internalGroups.push(leaves.slice(i, i + 4).map((g, k) => ({ grp: g, leafIdx: i + k })));
  }

  if (internalGroups.length === 1) {
    const sepKeys = leaves.slice(1).map((g) => g[0]);
    const rLabel = mode === 'b-link-tree' ? `${sepKeys.join(' | ')} | HK:∞` : sepKeys.join(' | ');
    nodes.unshift({
      id: 'ROOT',
      shape: 'box',
      label: rLabel,
      w: estBoxW(rLabel),
      sub: mode === 'b-tree' ? 'Root (Keys + Data)' : 'Root (Index)',
      x: 360,
      y: 85,
      state: 'source',
    });
    leafIds.forEach((lid, i) => {
      const hasHit = highlightVal !== null && leaves[i].includes(highlightVal);
      edges.push({ id: `R-${lid}`, from: 'ROOT', to: lid, flow: hasHit ? 1 : 0, cap: 1, kind: hasHit ? 'augment' : 'normal', label: '' });
    });
    return { nodes, edges, height: 2, leafCount };
  }

  // 3-level tree: Root -> Internal -> Leaves
  const intIds = [];
  internalGroups.forEach((grpList, gIdx) => {
    const id = `I${gIdx}`;
    intIds.push(id);
    const avgX = grpList.reduce((acc, item) => acc + leafX[item.leafIdx], 0) / grpList.length;
    const sepKeys = grpList.slice(1).map((item) => item.grp[0]);
    const nextGroupFirst = gIdx < internalGroups.length - 1 ? internalGroups[gIdx + 1][0].grp[0] : '∞';
    const label =
      mode === 'b-link-tree'
        ? `${sepKeys.join(' | ') || grpList[0].grp[0]} | HK:${nextGroupFirst}`
        : sepKeys.join(' | ') || String(grpList[0].grp[0]);
    nodes.push({
      id,
      shape: 'box',
      label,
      w: estBoxW(label),
      sub: `Internal ${gIdx + 1}`,
      x: Math.round(avgX),
      y: 165,
      state: 'visited',
    });
    grpList.forEach((item) => {
      const lid = leafIds[item.leafIdx];
      const hasHit = highlightVal !== null && item.grp.includes(highlightVal);
      edges.push({ id: `${id}-${lid}`, from: id, to: lid, flow: hasHit ? 1 : 0, cap: 1, kind: hasHit ? 'augment' : 'normal', label: '' });
    });
  });

  if (mode === 'b-link-tree') {
    for (let i = 0; i < intIds.length - 1; i++) {
      edges.push({ id: `ILK-${i}`, from: intIds[i], to: intIds[i + 1], flow: 0, cap: 1, kind: 'tree-s', label: '→' });
    }
  }

  const rootSeps = internalGroups.slice(1).map((gl) => gl[0].grp[0]);
  const rootLabel = mode === 'b-link-tree' ? `${rootSeps.join(' | ')} | HK:∞` : rootSeps.join(' | ');
  nodes.unshift({
    id: 'ROOT',
    shape: 'box',
    label: rootLabel,
    w: estBoxW(rootLabel),
    sub: 'Root (3 tầng!)',
    x: 360,
    y: 45,
    state: 'source',
  });
  intIds.forEach((iid) => {
    edges.push({ id: `R-${iid}`, from: 'ROOT', to: iid, flow: 0, cap: 1, label: '' });
  });

  return { nodes, edges, height: 3, leafCount };
}

// ============================================================================
// Bε-Tree & Buffer Tree Interactive Scene
// ============================================================================
function buildBufferedScene(sim) {
  const isEps = sim.lessonId === 'bepsilon-tree';
  const limit = isEps ? 3 : 4;
  const sorted = [...new Set(sim.keys)].sort((a, b) => a - b);
  const pivot = sorted.length >= 2 ? sorted[Math.floor(sorted.length / 2)] : 20;
  const left = sorted.filter((k) => k < pivot);
  const right = sorted.filter((k) => k >= pivot);
  const bufStr = sim.buffer.length ? sim.buffer.map((b) => `${b.op}${b.val}`).join(', ') : 'trống';

  const leafNodes = layoutRowCentered(
    [
      {
        id: 'L1',
        shape: 'box',
        label: left.length ? left.join(' | ') : '(trống)',
        sub: `Nhánh Trái (< ${pivot})`,
        y: 255,
        state: 'tree-s',
        spot: sim.splitHappened,
      },
      {
        id: 'L2',
        shape: 'box',
        label: right.length ? right.join(' | ') : '(trống)',
        sub: `Nhánh Phải (≥ ${pivot})`,
        y: 255,
        state: 'tree-s',
        spot: sim.splitHappened,
      },
    ],
    60,
    360
  );

  return {
    nodes: [
      {
        id: 'R',
        shape: 'box',
        label: `Pivot: ${pivot} | Buf:[ ${bufStr} ]`,
        sub: isEps ? `Bε Buffer (${sim.buffer.length}/${limit})` : `Buffer cỡ M (${sim.buffer.length}/${limit})`,
        badge: sim.buffer.length ? `${sim.buffer.length}/${limit}` : 'FLUSHED',
        x: 360,
        y: 80,
        state: sim.buffer.length ? 'active' : 'source',
        spot: sim.buffer.length > 0,
      },
      ...leafNodes,
    ],
    edges: [
      { id: 'E1', from: 'R', to: 'L1', flow: sim.splitHappened ? 1 : 0, cap: 1, kind: sim.splitHappened ? 'augment' : 'normal', label: `< ${pivot}` },
      { id: 'E2', from: 'R', to: 'L2', flow: sim.splitHappened ? 1 : 0, cap: 1, kind: sim.splitHappened ? 'augment' : 'normal', label: `≥ ${pivot}` },
    ],
    height: 2,
    leafCount: 2,
  };
}

// ============================================================================
// LSM-Tree Interactive Scene (WAL + MemTable -> SSTable L0 -> Compact L1)
// ============================================================================
function buildLsmScene(sim) {
  const memStr = sim.buffer.length ? sim.buffer.map((b) => `${b.op}${b.val}`).join(', ') : 'trống';
  const nodes = [
    { id: 'WAL', shape: 'box', label: 'WAL (Append Log)', sub: 'Ghi nối đuôi tuần tự', x: 130, y: 75, state: 'tree-s' },
    {
      id: 'MEM',
      shape: 'box',
      label: `MemTable [ ${memStr} ]`,
      sub: `RAM (${sim.buffer.length}/3 → Flush L0)`,
      badge: `${sim.buffer.length}/3`,
      x: 470,
      y: 75,
      state: sim.buffer.length ? 'active' : 'source',
      spot: sim.buffer.length > 0,
    },
  ];
  const edges = [{ id: 'WM', from: 'WAL', to: 'MEM', flow: 1, cap: 1, kind: 'tree-s', label: 'seq' }];

  const l0Count = sim.l0Tables.length;
  sim.l0Tables.forEach((tbl, idx) => {
    const id = `L0_${idx}`;
    const x = l0Count === 1 ? 360 : 190 + idx * 170;
    nodes.push({
      id,
      shape: 'box',
      label: `SST-0${idx + 1} [${tbl.join(',')}]`,
      sub: 'Immutable L0',
      x,
      y: 205,
      state: 'visited',
      spot: sim.splitHappened,
    });
    edges.push({ id: `M-${id}`, from: 'MEM', to: id, flow: 0, cap: 1, label: '' });
    edges.push({ id: `${id}-L1`, from: id, to: 'L1', flow: 0, cap: 1, label: '' });
  });

  const l1Sorted = [...new Set(sim.l1Keys)].sort((a, b) => a - b);
  nodes.push({
    id: 'L1',
    shape: 'box',
    label: `Level 1 [ ${l1Sorted.join(', ') || 'trống'} ]`,
    sub: `Disk L1 (${l1Sorted.length} khóa sạch trùng)`,
    badge: sim.l0Tables.length === 0 && sim.splitHappened ? 'COMPACTED' : null,
    x: 360,
    y: 330,
    state: 'tree-s',
    spot: sim.l0Tables.length === 0 && sim.splitHappened,
  });

  return { nodes, edges, height: 3, leafCount: l0Count + 1 };
}

// ============================================================================
// R-Tree & KD-Tree Interactive Scene (2D points encoded as 2-digit XY, e.g., 45 -> (4,5))
// ============================================================================
function toPoint(val) {
  const v = Math.abs(Math.round(val)) % 100;
  return { x: Math.floor(v / 10), y: v % 10, raw: v };
}

// ============================================================================
// Real Recursive Binary KD-Tree Builder + Exact Search / 1-NN Path Tracer
// ============================================================================
function buildRealKdTree(points, depth = 0) {
  if (!points.length) return null;
  const axis = depth % 2; // 0 = X, 1 = Y
  const sorted = [...points].sort((a, b) => (axis === 0 ? a.x - b.x || a.y - b.y : a.y - b.y || a.x - b.x));
  const mid = Math.floor(sorted.length / 2);
  return {
    pt: sorted[mid],
    axis,
    depth,
    left: buildRealKdTree(sorted.slice(0, mid), depth + 1),
    right: buildRealKdTree(sorted.slice(mid + 1), depth + 1),
  };
}

function buildKdScene(sim) {
  const pts = [...new Set(sim.keys)].map(toPoint);
  if (!pts.length) {
    return {
      nodes: [{ id: 'EMPTY', shape: 'box', label: '[ KD-Tree rỗng ]', sub: 'Nhập số 2 chữ số (vd 45 = (4,5))', x: 360, y: 180, state: 'idle' }],
      edges: [],
      height: 0,
      leafCount: 0,
    };
  }

  const root = buildRealKdTree(pts, 0);

  // Trace path from root to target (either searchVal or newly inserted highlightVal)
  const targetRaw = sim.searchVal !== null ? sim.searchVal : sim.highlightVal;
  const pathIds = new Set();
  const pathEdgeIds = new Set();
  const traceLogs = [];
  let foundNodeId = null;
  let nearestPt = null;
  let nearestDist = Infinity;

  if (targetRaw !== null) {
    const q = toPoint(targetRaw);
    let cur = root;
    while (cur) {
      const id = `KD_${cur.pt.raw}`;
      pathIds.add(id);
      const d = Math.hypot(cur.pt.x - q.x, cur.pt.y - q.y);
      if (d < nearestDist) {
        nearestDist = d;
        nearestPt = cur.pt;
      }
      if (cur.pt.raw === q.raw) {
        foundNodeId = id;
        traceLogs.push(`+ Tầng ${cur.depth}: Khớp chính xác điểm (${q.x}, ${q.y})!`);
        break;
      }
      const axisName = cur.axis === 0 ? 'X' : 'Y';
      const qVal = cur.axis === 0 ? q.x : q.y;
      const nVal = cur.axis === 0 ? cur.pt.x : cur.pt.y;
      const goLeft = qVal < nVal;
      const next = goLeft ? cur.left : cur.right;
      traceLogs.push(
        `~ Tầng ${cur.depth} (trục ${axisName}): ${qVal} ${goLeft ? '<' : '≥'} ${nVal} tại (${cur.pt.x},${cur.pt.y}) → rẽ ${goLeft ? 'TRÁI' : 'PHẢI'}`
      );
      if (next) pathEdgeIds.add(`${id}->KD_${next.pt.raw}`);
      cur = next;
    }
    if (!foundNodeId && nearestPt) {
      traceLogs.push(`~ Không có (${q.x},${q.y}) — Điểm gần nhất (1-NN): (${nearestPt.x},${nearestPt.y}), d = ${nearestDist.toFixed(2)}`);
    }
    if (sim.searchVal !== null) {
      sim.lastDiffs = traceLogs;
    }
  }

  // In-order x-slot assignment guarantees ZERO horizontal overlap at every depth!
  let colIdx = 0;
  let maxDepth = 0;
  const rawNodes = [];
  const edges = [];

  function assignLayout(node) {
    if (!node) return;
    if (node.depth > maxDepth) maxDepth = node.depth;
    assignLayout(node.left);
    node._col = colIdx++;
    assignLayout(node.right);
  }
  assignLayout(root);

  const colGap = 112;
  const totalW = Math.max(1, colIdx - 1) * colGap;
  const startX = 360 - totalW / 2;

  function collect(node) {
    if (!node) return;
    const id = `KD_${node.pt.raw}`;
    const isFound = id === foundNodeId;
    const isNear = !foundNodeId && nearestPt && node.pt.raw === nearestPt.raw && sim.searchVal !== null;
    const onPath = pathIds.has(id);
    const axisName = node.axis === 0 ? 'X' : 'Y';
    const splitVal = node.axis === 0 ? node.pt.x : node.pt.y;

    rawNodes.push({
      id,
      shape: 'box',
      label: `(${node.pt.x}, ${node.pt.y})`,
      w: 92,
      sub: `Cắt ${axisName}=${splitVal}`,
      badge: isFound ? 'FOUND ★' : isNear ? `1-NN` : `${axisName}=${splitVal}`,
      x: Math.round(startX + node._col * colGap),
      y: 65 + node.depth * 105,
      state: isFound || isNear ? 'tree-s' : onPath ? 'active' : node.axis === 0 ? 'visited' : 'tree-t',
      spot: isFound || isNear || onPath,
    });

    if (node.left) {
      const cid = `KD_${node.left.pt.raw}`;
      const eKey = `${id}->${cid}`;
      const hit = pathEdgeIds.has(eKey);
      edges.push({
        id: eKey,
        from: id,
        to: cid,
        flow: hit ? 1 : 0,
        cap: 1,
        kind: hit ? 'augment' : 'normal',
        label: `${axisName}<${splitVal}`,
      });
      collect(node.left);
    }
    if (node.right) {
      const cid = `KD_${node.right.pt.raw}`;
      const eKey = `${id}->${cid}`;
      const hit = pathEdgeIds.has(eKey);
      edges.push({
        id: eKey,
        from: id,
        to: cid,
        flow: hit ? 1 : 0,
        cap: 1,
        kind: hit ? 'augment' : 'normal',
        label: `${axisName}≥${splitVal}`,
      });
      collect(node.right);
    }
  }
  collect(root);

  return { nodes: rawNodes, edges, height: maxDepth + 1, leafCount: pts.length, traceLogs };
}

function buildSpatialScene(sim) {
  if (sim.lessonId === 'kd-tree') return buildKdScene(sim);
  const pts = [...new Set(sim.keys)].map(toPoint);
  const isR = true;
  if (!pts.length) {
    return {
      nodes: [{ id: 'EMPTY', shape: 'box', label: '[ Không có điểm 2D ]', sub: 'Nhập số 2 chữ số (vd 45 = (4,5))', x: 360, y: 180, state: 'idle' }],
      edges: [],
      height: 0,
      leafCount: 0,
    };
  }

  pts.sort((a, b) => a.x - b.x || a.y - b.y);
  const mid = Math.max(1, Math.floor(pts.length / 2));
  const left = pts.slice(0, mid);
  const right = pts.slice(mid);

  const fmtBox = (arr) => {
    if (!arr.length) return 'trống';
    const xs = arr.map((p) => p.x);
    const ys = arr.map((p) => p.y);
    return `x:${Math.min(...xs)}..${Math.max(...xs)}, y:${Math.min(...ys)}..${Math.max(...ys)}`;
  };

  const nodes = [
    {
      id: 'ROOT',
      shape: 'box',
      label: isR ? `Root [ MBR R1 | R2 ]` : `Split X = ${right[0] ? right[0].x : left[0].x}`,
      sub: isR ? `${pts.length} điểm 2D` : 'Tầng 0: Cắt trục X',
      badge: isR ? 'MBR' : 'X',
      x: 360,
      y: 65,
      state: 'source',
    },
    {
      id: 'G1',
      shape: 'box',
      label: isR ? `R1 [${fmtBox(left)}]` : `Nhánh X < ${right[0] ? right[0].x : 9}`,
      sub: `${left.length} điểm`,
      badge: isR ? null : 'Y',
      x: 185,
      y: 185,
      state: 'tree-s',
    },
    {
      id: 'G2',
      shape: 'box',
      label: isR ? `R2 [${fmtBox(right)}]` : `Nhánh X ≥ ${right[0] ? right[0].x : 0}`,
      sub: `${right.length} điểm`,
      badge: isR ? null : 'Y',
      x: 535,
      y: 185,
      state: 'visited',
    },
  ];
  const edges = [
    { id: 'RG1', from: 'ROOT', to: 'G1', flow: 0, cap: 1, label: '' },
    { id: 'RG2', from: 'ROOT', to: 'G2', flow: 0, cap: 1, label: '' },
  ];

  const allPtsRaw = [
    ...left.map((p, idx) => ({ p, parentId: 'G1', id: `G1_P${idx}` })),
    ...right.map((p, idx) => ({ p, parentId: 'G2', id: `G2_P${idx}` })),
  ];
  const placedPts = layoutRowCentered(
    allPtsRaw.map((item) => {
      const hit = sim.highlightVal === item.p.raw;
      return {
        id: item.id,
        parentId: item.parentId,
        shape: 'box',
        label: `(${item.p.x}, ${item.p.y})`,
        badge: hit ? 'MỚI' : null,
        y: 310,
        state: hit ? 'active' : 'idle',
        spot: hit,
      };
    }),
    24,
    360
  );

  // Align G1 and G2 directly above their children
  const g1Children = placedPts.filter((p) => p.parentId === 'G1');
  const g2Children = placedPts.filter((p) => p.parentId === 'G2');
  const g1Node = nodes.find((x) => x.id === 'G1');
  const g2Node = nodes.find((x) => x.id === 'G2');
  if (g1Children.length) g1Node.x = Math.round(g1Children.reduce((a, c) => a + c.x, 0) / g1Children.length);
  if (g2Children.length) g2Node.x = Math.round(g2Children.reduce((a, c) => a + c.x, 0) / g2Children.length);
  // Ensure G1 and G2 themselves never overlap
  const minGroupSep = (estBoxW(g1Node.label) + estBoxW(g2Node.label)) / 2 + 36;
  if (g2Node.x - g1Node.x < minGroupSep) {
    const midG = (g1Node.x + g2Node.x) / 2;
    g1Node.x = Math.round(midG - minGroupSep / 2);
    g2Node.x = Math.round(midG + minGroupSep / 2);
  }

  for (const pt of placedPts) {
    nodes.push(pt);
    edges.push({
      id: `${pt.parentId}-${pt.id}`,
      from: pt.parentId,
      to: pt.id,
      flow: pt.state === 'active' ? 1 : 0,
      cap: 1,
      kind: pt.state === 'active' ? 'augment' : 'normal',
      label: '',
    });
  }
  return { nodes, edges, height: 3, leafCount: pts.length };
}

// ============================================================================
// Apply Insert / Delete & Produce Updated Lesson View
// ============================================================================
export function mutateTreeSim(sim, op, rawVal) {
  const val = Math.max(0, Math.min(99, Math.round(Number(rawVal))));
  if (Number.isNaN(val)) return sim;
  sim.splitHappened = false;

  if (op === 'search') {
    sim.searchVal = val;
    sim.highlightVal = val;
    const isSpatial = sim.lessonId === 'kd-tree' || sim.lessonId === 'r-tree';
    const exists =
      sim.lessonId === 'lsm-tree'
        ? sim.l1Keys.includes(val) || sim.buffer.some((b) => b.val === val && b.op === '+') || sim.l0Tables.some((t) => t.includes(val))
        : sim.keys.includes(val);
    const label = isSpatial ? `điểm (${Math.floor(val / 10)}, ${val % 10})` : `khóa ${val}`;
    sim.lastAction = exists ? `Tìm thấy ${label}!` : `Tìm ${label} (không khớp chính xác)`;
    sim.lastDiffs = exists
      ? [`+ Đã tìm thấy ${label} — đường đi tìm kiếm được tô sáng từ Gốc xuống!`]
      : [`~ Không có ${label} trong cây hiện tại (đường dò tìm dừng tại nhánh gần nhất)`];
    return sim;
  }

  sim.searchVal = null;
  sim.highlightVal = val;

  const lid = sim.lessonId;
  if (lid === 'bepsilon-tree' || lid === 'buffer-tree') {
    const limit = lid === 'bepsilon-tree' ? 3 : 4;
    sim.buffer.push({ op: op === 'insert' ? '+' : '-', val });
    sim.lastAction = `${op === 'insert' ? 'Chèn' : 'Xóa'} ${val} vào Buffer`;
    sim.lastDiffs = [`+ Đưa thao tác (${op === 'insert' ? '+' : '-'}${val}) vào Buffer [${sim.buffer.length}/${limit}]`];

    if (sim.buffer.length >= limit) {
      // Batch Flush!
      for (const item of sim.buffer) {
        if (item.op === '+') {
          if (!sim.keys.includes(item.val)) sim.keys.push(item.val);
        } else {
          sim.keys = sim.keys.filter((k) => k !== item.val);
        }
      }
      const flushedStr = sim.buffer.map((b) => `${b.op}${b.val}`).join(', ');
      sim.buffer = [];
      sim.splitHappened = true;
      sim.lastAction = `Buffer đầy (${limit}/${limit}) → Batch Flush xuống lá!`;
      sim.lastDiffs.push(`~ Xả hàng loạt [${flushedStr}] xuống tầng lá trong 1 lần I/O!`);
    }
    return sim;
  }

  if (lid === 'lsm-tree') {
    sim.buffer.push({ op: op === 'insert' ? '+' : '✕', val });
    sim.lastAction = `Ghi WAL + MemTable (${op === 'insert' ? '+' : 'tombstone '}${val})`;
    sim.lastDiffs = [`+ Ghi tuần tự vào WAL & MemTable [${sim.buffer.length}/3]`];

    if (sim.buffer.length >= 3) {
      const vals = sim.buffer.map((b) => (b.op === '+' ? b.val : -b.val));
      sim.l0Tables.push(vals);
      sim.buffer = [];
      sim.splitHappened = true;
      sim.lastDiffs.push(`~ MemTable đầy → Flush thành SSTable L0 #${sim.l0Tables.length}!`);

      if (sim.l0Tables.length >= 3) {
        for (const tbl of sim.l0Tables) {
          for (const v of tbl) {
            if (v >= 0) {
              if (!sim.l1Keys.includes(v)) sim.l1Keys.push(v);
            } else {
              sim.l1Keys = sim.l1Keys.filter((k) => k !== -v);
            }
          }
        }
        sim.l0Tables = [];
        sim.lastAction = 'Compaction L0 → L1 hoàn tất (khử trùng & tombstone)!';
        sim.lastDiffs.push('+ Đủ 3 file L0 → Chạy Compaction gộp sạch xuống Level 1!');
      }
    }
    return sim;
  }

  // B-Tree, B+ Tree, B-link Tree, R-Tree, KD-Tree
  if (op === 'insert') {
    const beforePages = Math.ceil(sim.keys.length / 3);
    if (!sim.keys.includes(val)) sim.keys.push(val);
    const afterPages = Math.ceil(sim.keys.length / 3);
    sim.splitHappened = afterPages > beforePages;
    sim.lastAction = `Thêm ${lid === 'r-tree' || lid === 'kd-tree' ? `điểm (${Math.floor(val / 10)},${val % 10})` : `khóa ${val}`}`;
    sim.lastDiffs = [
      `+ Chèn ${val} vào cây (tổng ${sim.keys.length} phần tử)`,
      sim.splitHappened ? '~ Nút tràn > 3 khóa → Tự động Tách nút (Split) & cân bằng lại!' : '~ Cây vẫn cân bằng chuẩn, không cần Split',
    ];
  } else {
    const existed = sim.keys.includes(val);
    sim.keys = sim.keys.filter((k) => k !== val);
    sim.lastAction = existed ? `Xóa khóa ${val}` : `Không tìm thấy khóa ${val} để xóa`;
    sim.lastDiffs = existed
      ? [`- Đã xóa ${val} khỏi cây (còn ${sim.keys.length} phần tử)`, '~ Tự động cân bằng / gộp trang nếu thiếu khóa']
      : [`~ Khóa ${val} không tồn tại trong cây hiện tại`];
  }
  return sim;
}

export function buildInteractiveTreeStep(baseLesson, sim) {
  const lid = sim.lessonId;
  let built;
  if (lid === 'b-tree' || lid === 'b-plus-tree' || lid === 'b-link-tree') {
    built = buildMultiwayScene(sim.keys, lid, sim.highlightVal);
  } else if (lid === 'bepsilon-tree' || lid === 'buffer-tree') {
    built = buildBufferedScene(sim);
  } else if (lid === 'lsm-tree') {
    built = buildLsmScene(sim);
  } else {
    built = buildSpatialScene(sim);
  }

  const interactiveStep = {
    short: 'Mô phỏng trực tiếp',
    tag: `Sandbox • ${baseLesson.title}`,
    title: sim.lastAction || `Thử nghiệm Thêm / Xóa trên ${baseLesson.title}`,
    activeLines: [1, 2, 3],
    body: [
      `Bạn đang mô phỏng trực tiếp trên <b>${baseLesson.title}</b>. Nhập một số (<code>0..99</code>) ở góc trên phải sân khấu rồi bấm <b>+ Thêm</b> hoặc <b>✕ Xóa</b> để xem cấu trúc cây tự động biến đổi (Split, Flush, Compaction, MBR/Axis)!`,
      lid === 'r-tree' || lid === 'kd-tree'
        ? '<i>Mẹo 2D:</i> Số 2 chữ số <code>ab</code> tương ứng tọa độ <code>(a, b)</code> (ví dụ <code>45</code> = điểm <code>(4, 5)</code>).'
        : `Tập khóa hiện tại trong cây: <code>[${[...new Set(sim.keys)].sort((a, b) => a - b).join(', ')}]</code>.`,
    ],
    changes: sim.lastDiffs.length ? sim.lastDiffs : ['+ Sẵn sàng thêm/xóa khóa trực tiếp trên cây!'],
    metrics: [
      { id: 'count', label: 'Số phần tử', value: String(sim.keys.length), level: 'good' },
      { id: 'h', label: 'Chiều cao', value: `${built.height} tầng`, level: 'violet' },
      { id: 'act', label: 'Vừa thực hiện', value: sim.lastAction ? sim.lastAction.slice(0, 24) : 'Khởi tạo', level: sim.splitHappened ? 'warn' : 'normal' },
    ],
    scene: {
      nodes: built.nodes,
      edges: built.edges,
    },
  };

  return {
    ...baseLesson,
    steps: [...baseLesson.steps, interactiveStep],
  };
}
