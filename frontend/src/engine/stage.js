// ============================================================================
// Unified SVG Graph, Camera & Packet Animation Engine
// Designed for Max-Flow (Augmenting Paths, Level Graphs, Preflow, Dual-Tree, Planar)
// ============================================================================

const SVG_NS = 'http://www.w3.org/2000/svg';

function el(tag, attrs = {}, parent = null) {
  const node = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v !== null && v !== undefined) node.setAttribute(k, String(v));
  }
  if (parent) parent.appendChild(node);
  return node;
}

const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;

export class StageEngine {
  constructor(hostEl, { onEdgeClick = null, onNodeClick = null, onCanvasClick = null } = {}) {
    this.host = hostEl;
    this.onEdgeClick = onEdgeClick;
    this.onNodeClick = onNodeClick;
    this.onCanvasClick = onCanvasClick;
    this.showResidual = true;
    this.paused = false;

    this.svg = el('svg', { class: 'stage-svg' }, hostEl);
    this.defs = el('defs', {}, this.svg);
    this._buildMarkers();

    this.gZones = el('g', { class: 'layer-zones' }, this.svg);
    this.gBackLinks = el('g', { class: 'layer-back-links' }, this.svg);
    this.gLinks = el('g', { class: 'layer-links' }, this.svg);
    this.gPackets = el('g', { class: 'layer-packets' }, this.svg);
    this.gNodes = el('g', { class: 'layer-nodes' }, this.svg);

    this.scene = null;
    this.view = { x: 0, y: 0, w: 720, h: 420 };
    this.camAnim = null;
    this.userMoved = false;

    this.packets = [];
    this.pathMap = new Map();
    this.lastTime = performance.now();

    this._bindGestures();
    this._loop = this._loop.bind(this);
    requestAnimationFrame(this._loop);
  }

  _buildMarkers() {
    const specs = [
      { id: 'arrow-normal', color: 'var(--line-strong)' },
      { id: 'arrow-augment', color: 'var(--amber-2)' },
      { id: 'arrow-saturated', color: 'var(--green-3)' },
      { id: 'arrow-cut', color: 'var(--rust-2)' },
      { id: 'arrow-back', color: 'var(--violet-2)' },
      { id: 'arrow-off', color: 'var(--line-strong)' },
    ];
    for (const s of specs) {
      const m = el(
        'marker',
        {
          id: s.id,
          viewBox: '0 0 10 10',
          refX: '8.5',
          refY: '5',
          markerWidth: '6.5',
          markerHeight: '6.5',
          orient: 'auto-start-reverse',
        },
        this.defs
      );
      el('path', { d: 'M 0 1.2 L 9 5 L 0 8.8 z', fill: s.color }, m);
    }
  }

  setShowResidual(flag) {
    this.showResidual = flag;
    if (this.scene) this.render(this.scene, { animateCam: false });
  }

  setPaused(flag) {
    this.paused = flag;
  }

  fit() {
    this.userMoved = false;
    if (this.scene) this._animateCamTo(this._computeBounds(this.scene), 380);
  }

  render(scene, { animateCam = true } = {}) {
    const prevNodes = this.scene ? new Map(this.scene.nodes.map((n) => [n.id, n])) : new Map();
    this.scene = scene;

    // Clear layers
    this.gZones.innerHTML = '';
    this.gBackLinks.innerHTML = '';
    this.gLinks.innerHTML = '';
    this.gNodes.innerHTML = '';
    this.gPackets.innerHTML = '';
    this.pathMap.clear();
    this.packets = [];

    const nodeMap = new Map(scene.nodes.map((n) => [n.id, n]));

    // 1. Zones (Min-Cut S/T hulls or Planar faces)
    if (scene.zones && scene.zones.length) {
      for (const z of scene.zones) {
        const pts = z.nodes.map((id) => nodeMap.get(id)).filter(Boolean);
        if (!pts.length) continue;
        const pad = 48;
        const minX = Math.min(...pts.map((p) => p.x)) - pad;
        const maxX = Math.max(...pts.map((p) => p.x)) + pad;
        const minY = Math.min(...pts.map((p) => p.y)) - pad;
        const maxY = Math.max(...pts.map((p) => p.y)) + pad;
        el(
          'rect',
          {
            x: minX,
            y: minY,
            width: maxX - minX,
            height: maxY - minY,
            rx: 18,
            class: `zone-poly zone-poly--${z.kind || 's'}`,
          },
          this.gZones
        );
        const lbl = el(
          'text',
          {
            x: minX + 12,
            y: minY + 18,
            class: 'zone-label',
            fill: z.kind === 't' ? 'var(--rust-ink)' : 'var(--green-ink)',
          },
          this.gZones
        );
        lbl.textContent = z.label || '';
      }
    }

    // 2. Forward Edges & Residual Back-Edges
    const activeFlows = [];
    for (const edge of scene.edges) {
      const a = nodeMap.get(edge.from);
      const b = nodeMap.get(edge.to);
      if (!a || !b) continue;

      const kind = edge.kind || (edge.flow >= edge.cap && edge.cap > 0 ? 'saturated' : 'normal');
      const curve = edge.curve || 0;
      const { d, midX, midY } = this._edgeGeometry(a, b, curve);

      const g = el(
        'g',
        {
          class: `link-group${scene.interactiveEdges ? ' is-clickable' : ''}`,
          'data-kind': kind,
          'data-id': edge.id,
        },
        this.gLinks
      );

      if (scene.interactiveEdges && this.onEdgeClick) {
        g.addEventListener('click', (ev) => {
          ev.stopPropagation();
          this.onEdgeClick(edge.id, ev);
        });
      }

      // Base capacity path
      const markerId =
        kind === 'augment'
          ? 'arrow-augment'
          : kind === 'saturated' || kind === 'tree-s'
          ? 'arrow-saturated'
          : kind === 'cut' || kind === 'dual'
          ? 'arrow-cut'
          : kind === 'tree-t'
          ? 'arrow-back'
          : kind === 'off'
          ? 'arrow-off'
          : 'arrow-normal';

      const basePath = el(
        'path',
        {
          d,
          class: 'link-path',
          'marker-end': `url(#${markerId})`,
        },
        g
      );
      this.pathMap.set(edge.id, basePath);

      // Proportional Flow Overlay
      if (edge.flow > 0 && kind !== 'off') {
        const ratio = clamp(edge.flow / Math.max(1, edge.cap), 0.15, 1);
        el(
          'path',
          {
            d,
            class: 'link-flow-bar',
            'stroke-width': (2 + ratio * 5.5).toFixed(1),
            stroke: kind === 'cut' ? 'var(--rust-2)' : kind === 'augment' ? 'var(--amber-2)' : 'var(--green-3)',
          },
          g
        );
      }

      // Pill Label: flow/cap (skip when edge.label === '')
      const labelText = edge.label !== undefined ? edge.label : `${edge.flow}/${edge.cap}`;
      if (labelText !== '') {
        const pillW = Math.max(42, labelText.length * 7.2 + 12);
        el(
          'rect',
          {
            x: midX - pillW / 2,
            y: midY - 10,
            width: pillW,
            height: 20,
            class: 'link-pill-bg',
          },
          g
        );
        const tEl = el('text', { x: midX, y: midY, class: 'link-pill-text' }, g);
        tEl.textContent = labelText;
      }

      // Packet streams for active forward edges
      if (kind !== 'off' && (edge.flow > 0 || kind === 'augment')) {
        const pktKind = kind === 'augment' ? 'augment' : kind === 'cut' ? 'cut' : 'req';
        const count = kind === 'augment' ? 3 : clamp(Math.ceil((edge.flow / Math.max(1, edge.cap)) * 3), 1, 3);
        activeFlows.push({
          pathEl: basePath,
          kind: pktKind,
          count,
          speed: kind === 'augment' ? 0.58 : 0.34,
        });
      }

      // Residual Back-Edge (v -> u) whenever flow > 0 and (showResidual or actively back-augmenting)
      const isBackAug = edge.backAugment === true;
      if (edge.flow > 0 && (this.showResidual || isBackAug) && kind !== 'off') {
        const backCurve = curve >= 0 ? -38 : 38;
        const backGeom = this._edgeGeometry(b, a, backCurve);
        const bg = el(
          'g',
          {
            class: 'link-group',
            'data-kind': isBackAug ? 'back-augment' : 'back',
          },
          this.gBackLinks
        );
        const backPath = el(
          'path',
          {
            d: backGeom.d,
            class: 'link-path',
            'marker-end': 'url(#arrow-back)',
          },
          bg
        );
        const bText = `↩ ${edge.flow}`;
        const bw = bText.length * 7 + 12;
        el(
          'rect',
          {
            x: backGeom.midX - bw / 2,
            y: backGeom.midY - 9,
            width: bw,
            height: 18,
            class: 'link-pill-bg',
          },
          bg
        );
        const bt = el('text', { x: backGeom.midX, y: backGeom.midY, class: 'link-pill-text' }, bg);
        bt.textContent = bText;

        if (isBackAug) {
          activeFlows.push({
            pathEl: backPath,
            kind: 'back',
            count: 3,
            speed: 0.56,
          });
        }
      }
    }

    // 3. Nodes
    for (const node of scene.nodes) {
      const prev = prevNodes.get(node.id);
      const liftY = node.lift ? -node.lift * 12 : 0;
      const g = el(
        'g',
        {
          class: 'node-group',
          'data-state': node.state || 'idle',
          'data-id': node.id,
          transform: `translate(${node.x}, ${node.y + liftY})`,
        },
        this.gNodes
      );

      if (this.onNodeClick) {
        g.style.cursor = 'pointer';
        g.addEventListener('click', (ev) => {
          ev.stopPropagation();
          this.onNodeClick(node.id, ev);
        });
      }

      // Spot ring when newly highlighted/discovered
      if (node.spot || (prev && prev.state !== node.state && (node.state === 'active' || node.state === 'visited'))) {
        el('circle', { cx: 0, cy: 0, r: 28, class: 'spot-ring' }, g);
      }

      // Selection ring when picked as source in "+ Cạnh" mode
      if (node.selected) {
        el('circle', {
          cx: 0,
          cy: 0,
          r: 30,
          fill: 'none',
          stroke: 'var(--violet-2)',
          'stroke-width': 2.6,
          'stroke-dasharray': '5 3',
        }, g);
      }

      // Hard offset shadow (tactile paper card look)
      if (node.shape === 'box') {
        const w = node.w || Math.max(76, (node.label || '').length * 8.2 + 24);
        const h = node.h || 38;
        el('rect', { x: -w / 2 + 2.5, y: -h / 2 + 3.5, width: w, height: h, rx: 8, class: 'node-shadow' }, g);
        el('rect', { x: -w / 2, y: -h / 2, width: w, height: h, rx: 8, class: 'node-body' }, g);
      } else {
        el('circle', { cx: 2.5, cy: 3.5, r: 24, class: 'node-shadow' }, g);
        el('circle', { cx: 0, cy: 0, r: 24, class: 'node-body' }, g);
      }

      const lbl = el('text', { x: 0, y: 0, class: 'node-label' }, g);
      lbl.textContent = node.label;

      if (node.sub) {
        const subY = node.shape === 'box' ? (node.h || 38) / 2 + 14 : 38;
        const sub = el('text', { x: 0, y: subY, class: 'node-sub' }, g);
        sub.textContent = node.sub;
      }

      // Optional Badge (BFS dist, height, excess, potential, buffer size, high-key)
      if (node.badge !== undefined && node.badge !== null && node.badge !== '') {
        const bText = String(node.badge);
        const bw = Math.max(24, bText.length * 6.5 + 10);
        const bx = node.shape === 'box' ? (node.w || Math.max(76, (node.label || '').length * 8.2 + 24)) / 2 - bw + 6 : 12;
        const by = node.shape === 'box' ? -(node.h || 38) / 2 - 12 : -30;
        el(
          'rect',
          {
            x: bx,
            y: by,
            width: bw,
            height: 17,
            rx: 5,
            class: 'node-badge-bg',
          },
          g
        );
        const bt = el('text', { x: bx + bw / 2, y: by + 8.5, class: 'node-badge-text' }, g);
        bt.textContent = bText;
      }
    }

    // 4. Spawn continuous packet particles
    for (const f of activeFlows) {
      const len = f.pathEl.getTotalLength();
      if (len < 10) continue;
      for (let i = 0; i < f.count; i++) {
        const circle = el(
          'circle',
          {
            r: f.kind === 'augment' || f.kind === 'back' ? 4.4 : 3.5,
            class: `pkt pkt--${f.kind}`,
          },
          this.gPackets
        );
        this.packets.push({
          el: circle,
          pathEl: f.pathEl,
          len,
          t: i / f.count,
          speed: f.speed,
        });
      }
    }

    // 5. Auto-fit camera unless user manually panned/zoomed
    if (!this.userMoved) {
      const target = this._computeBounds(scene);
      if (animateCam) this._animateCamTo(target, 420);
      else this._setView(target);
    }
  }

  _nodeTrimDist(node, ux, uy, extra = 0) {
    if (node.shape !== 'box') return 27 + extra;
    const hw = (node.w || Math.max(76, (node.label || '').length * 8.2 + 24)) / 2 + 3 + extra;
    const hh = (node.h || 38) / 2 + 3 + extra;
    const tx = Math.abs(ux) > 1e-4 ? hw / Math.abs(ux) : 1e9;
    const ty = Math.abs(uy) > 1e-4 ? hh / Math.abs(uy) : 1e9;
    return Math.min(tx, ty);
  }

  _edgeGeometry(a, b, curve = 0) {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const dist = Math.hypot(dx, dy) || 1;
    const ux = dx / dist;
    const uy = dy / dist;
    const nx = -uy;
    const ny = ux;

    if (Math.abs(curve) < 1) {
      const r1 = this._nodeTrimDist(a, ux, uy, 0);
      const r2 = this._nodeTrimDist(b, -ux, -uy, 4);
      const x1 = a.x + ux * r1;
      const y1 = a.y + uy * r1;
      const x2 = b.x - ux * r2;
      const y2 = b.y - uy * r2;
      return {
        d: `M ${x1.toFixed(1)} ${y1.toFixed(1)} L ${x2.toFixed(1)} ${y2.toFixed(1)}`,
        midX: (x1 + x2) / 2,
        midY: (y1 + y2) / 2,
      };
    }

    const cx = (a.x + b.x) / 2 + nx * curve;
    const cy = (a.y + b.y) / 2 + ny * curve;

    const t1x = cx - a.x;
    const t1y = cy - a.y;
    const t1d = Math.hypot(t1x, t1y) || 1;
    const r1 = this._nodeTrimDist(a, t1x / t1d, t1y / t1d, 0);
    const x1 = a.x + (t1x / t1d) * r1;
    const y1 = a.y + (t1y / t1d) * r1;

    const t2x = cx - b.x;
    const t2y = cy - b.y;
    const t2d = Math.hypot(t2x, t2y) || 1;
    const r2 = this._nodeTrimDist(b, t2x / t2d, t2y / t2d, 4);
    const x2 = b.x + (t2x / t2d) * r2;
    const y2 = b.y + (t2y / t2d) * r2;

    const midX = 0.25 * x1 + 0.5 * cx + 0.25 * x2;
    const midY = 0.25 * y1 + 0.5 * cy + 0.25 * y2;

    return {
      d: `M ${x1.toFixed(1)} ${y1.toFixed(1)} Q ${cx.toFixed(1)} ${cy.toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}`,
      midX,
      midY,
    };
  }

  _computeBounds(scene) {
    const halfW = (n) => (n.shape === 'box' ? (n.w || Math.max(76, (n.label || '').length * 8.2 + 24)) / 2 : 28);
    const minX = Math.min(...scene.nodes.map((n) => n.x - halfW(n))) - 70;
    const maxX = Math.max(...scene.nodes.map((n) => n.x + halfW(n))) + 70;
    const minY = Math.min(...scene.nodes.map((n) => n.y)) - 85;
    const maxY = Math.max(...scene.nodes.map((n) => n.y)) + 85;
    return {
      x: minX,
      y: minY,
      w: Math.max(360, maxX - minX),
      h: Math.max(240, maxY - minY),
    };
  }

  _setView(v) {
    this.view = { ...v };
    this.svg.setAttribute('viewBox', `${v.x.toFixed(1)} ${v.y.toFixed(1)} ${v.w.toFixed(1)} ${v.h.toFixed(1)}`);
  }

  _animateCamTo(target, dur = 400) {
    this.camAnim = {
      from: { ...this.view },
      to: target,
      start: performance.now(),
      dur,
    };
  }

  _clientToSvg(clientX, clientY) {
    const pt = this.svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const ctm = this.svg.getScreenCTM();
    if (!ctm) return { x: 350, y: 200 };
    const out = pt.matrixTransform(ctm.inverse());
    return { x: Math.round(out.x), y: Math.round(out.y) };
  }

  _bindGestures() {
    let dragging = false;
    let moved = false;
    let sx = 0;
    let sy = 0;
    let startView = null;

    this.host.addEventListener('pointerdown', (e) => {
      if (e.target.closest('.link-group.is-clickable') || e.target.closest('.node-group')) return;
      dragging = true;
      moved = false;
      sx = e.clientX;
      sy = e.clientY;
      startView = { ...this.view };
      this.host.classList.add('is-dragging');
      this.host.setPointerCapture(e.pointerId);
    });

    this.host.addEventListener('pointermove', (e) => {
      if (!dragging || !startView) return;
      if (Math.hypot(e.clientX - sx, e.clientY - sy) > 4) moved = true;
      if (!moved) return;
      const rect = this.host.getBoundingClientRect();
      const scaleX = startView.w / Math.max(1, rect.width);
      const scaleY = startView.h / Math.max(1, rect.height);
      const scale = Math.max(scaleX, scaleY);
      this.camAnim = null;
      this.userMoved = true;
      this._setView({
        x: startView.x - (e.clientX - sx) * scale,
        y: startView.y - (e.clientY - sy) * scale,
        w: startView.w,
        h: startView.h,
      });
    });

    const endDrag = (e) => {
      if (dragging && !moved && this.onCanvasClick && e.type === 'pointerup') {
        const pt = this._clientToSvg(e.clientX, e.clientY);
        this.onCanvasClick(pt.x, pt.y, e);
      }
      dragging = false;
      this.host.classList.remove('is-dragging');
    };
    this.host.addEventListener('pointerup', endDrag);
    this.host.addEventListener('pointercancel', endDrag);

    this.host.addEventListener(
      'wheel',
      (e) => {
        e.preventDefault();
        this.camAnim = null;
        this.userMoved = true;
        const factor = e.deltaY > 0 ? 1.1 : 0.9;
        const nw = clamp(this.view.w * factor, 240, 1800);
        const nh = clamp(this.view.h * factor, 180, 1300);
        const dx = (this.view.w - nw) / 2;
        const dy = (this.view.h - nh) / 2;
        this._setView({ x: this.view.x + dx, y: this.view.y + dy, w: nw, h: nh });
      },
      { passive: false }
    );
  }

  _loop(now) {
    const dt = Math.min(0.05, (now - this.lastTime) / 1000);
    this.lastTime = now;

    if (this.camAnim) {
      const p = clamp((now - this.camAnim.start) / this.camAnim.dur, 0, 1);
      const k = easeInOut(p);
      this._setView({
        x: lerp(this.camAnim.from.x, this.camAnim.to.x, k),
        y: lerp(this.camAnim.from.y, this.camAnim.to.y, k),
        w: lerp(this.camAnim.from.w, this.camAnim.to.w, k),
        h: lerp(this.camAnim.from.h, this.camAnim.to.h, k),
      });
      if (p >= 1) this.camAnim = null;
    }

    if (!this.paused && this.packets.length) {
      for (const pkt of this.packets) {
        pkt.t = (pkt.t + dt * pkt.speed) % 1;
        const pt = pkt.pathEl.getPointAtLength(pkt.t * pkt.len);
        pkt.el.setAttribute('cx', pt.x.toFixed(1));
        pkt.el.setAttribute('cy', pt.y.toFixed(1));
      }
    }

    requestAnimationFrame(this._loop);
  }
}
