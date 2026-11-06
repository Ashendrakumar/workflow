import { Component, HostListener, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  Branch, DELAY_MAX, DELAY_MIN, NODE_H, NODE_W, NodeConfig, NodeType, Operator, WfNode, Workflow,
} from '../../models/workflow.model';
import { WorkflowService, uid } from '../../services/workflow.service';
import { ValidationService } from '../validation.service';
import { HeaderComponent } from '../../../../app/components/header/header.component';

@Component({
  selector: 'app-editor',
  imports: [FormsModule, RouterLink, HeaderComponent],
  templateUrl: `./editor.component.html`,
  styleUrl: `./editor.component.scss`,
  styles: [
   
  ],
})
export class EditorComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private svc = inject(WorkflowService);
  private validator = inject(ValidationService);

  readonly W = NODE_W;
  readonly H = NODE_H;
  readonly DELAY_MIN = DELAY_MIN;
  readonly DELAY_MAX = DELAY_MAX;
  readonly paletteTypes: NodeType[] = ['start', 'action', 'condition', 'delay', 'end'];
  readonly operators: Operator[] = ['==', '!=', '>', '<', '>=', '<='];

  wf = signal<Workflow>({ id: '', name: '', nodes: [], edges: [], updatedAt: '' });
  selectedId = signal<string | null>(null);
  pending = signal<{ nodeId: string; branch?: Branch } | null>(null);
  messages = signal<string[]>([]);
  valid = signal(false);

  selected = computed(() => this.wf().nodes.find((n) => n.id === this.selectedId()) ?? null);

  edgeViews = computed(() => {
    const { nodes, edges } = this.wf();
    const byId = new Map(nodes.map((n) => [n.id, n]));
    return edges.flatMap((e) => {
      const s = byId.get(e.source), t = byId.get(e.target);
      if (!s || !t) return [];
      const sx = s.x + NODE_W * (e.branch === 'true' ? 0.25 : e.branch === 'false' ? 0.75 : 0.5);
      const sy = s.y + NODE_H;
      const tx = t.x + NODE_W / 2, ty = t.y;
      const d = `M ${sx} ${sy} C ${sx} ${sy + 60}, ${tx} ${ty - 60}, ${tx} ${ty}`;
      const label = e.branch
        ? e.branch === 'true' ? s.config.trueLabel || 'True' : s.config.falseLabel || 'False'
        : '';
      return [{ id: e.id, d, label, lx: (sx + tx) / 2 + 6, ly: (sy + ty) / 2 }];
    });
  });

  ngOnInit() {
    const found = this.svc.get(this.route.snapshot.paramMap.get('id') ?? '');
    if (!found) {
      this.router.navigate(['/']);
      return;
    }
    this.wf.set(structuredClone(found));
  }

  handleAllClicks(name:string){
    if(name === 'Validate'){
      this.validate();
    }
    if(name === 'Save'){
      this.save();
    }
    if(name === 'Run ▶'){
      this.run();
    }

  }

  // ---------- workflow-level ----------
  rename(name: string) {
    this.wf.update((w) => ({ ...w, name }));
  }
  save() {
    this.svc.save(this.wf());
    this.messages.set(['Saved ✔']);
    this.valid.set(true);
  }
  validate() {
    // const errs = this.validator.validate(this.wf());
    // this.valid.set(errs.length === 0);
    // this.messages.set(errs.length ? errs : ['Workflow is valid ✔']);
  }
  run() {
    this.validate();
    if (!this.valid()) return; // errors stay visible, no navigation
    this.svc.save(this.wf());
    this.router.navigate(['/monitor', this.wf().id]);
  }

  // ---------- palette / drop ----------
  onPaletteDrag(e: DragEvent, type: NodeType) {
    e.dataTransfer!.setData('node-type', type);
  }

  onDrop(e: DragEvent, canvas: HTMLElement) {
    e.preventDefault();
    const type = e.dataTransfer?.getData('node-type') as NodeType;
    if (!type) return;
    // only one Start node is allowed
    if (type === 'start' && this.wf().nodes.some((n) => n.type === 'start')) {
      this.messages.set(['Only one Start node is allowed.']);
      this.valid.set(false);
      return;
    }
    const r = canvas.getBoundingClientRect();
    const x = e.clientX - r.left + canvas.scrollLeft - NODE_W / 2;
    const y = e.clientY - r.top + canvas.scrollTop - NODE_H / 2;
    const defaults: Record<NodeType, NodeConfig> = {
      start: {},
      end: {},
      action: { actionType: 'setVariable', variable: '', value: '' },
      condition: { operator: '==', trueLabel: 'True', falseLabel: 'False' },
      delay: { delayMs: 1000 },
    };
    const node: WfNode = {
      id: uid(),
      type,
      x: Math.max(0, x),
      y: Math.max(0, y),
      label: type[0].toUpperCase() + type.slice(1),
      config: defaults[type],
    };
    this.wf.update((w) => ({ ...w, nodes: [...w.nodes, node] }));
    this.selectedId.set(node.id);
  }

  // ---------- selection & editing ----------
  select(e: Event, n: WfNode) {
    e.stopPropagation();
    this.selectedId.set(n.id);
  }
  clearSelection() {
    this.selectedId.set(null);
    this.pending.set(null);
  }

  patchNode(patch: Partial<WfNode>) {
    const id = this.selectedId();
    this.wf.update((w) => ({
      ...w,
      nodes: w.nodes.map((n) => (n.id === id ? { ...n, ...patch } : n)),
    }));
  }
  patchConfig(patch: Partial<NodeConfig>) {
    const n = this.selected();
    if (n) this.patchNode({ config: { ...n.config, ...patch } });
  }
  deleteNode(id: string) {
    this.wf.update((w) => ({
      ...w,
      nodes: w.nodes.filter((n) => n.id !== id),
      edges: w.edges.filter((e) => e.source !== id && e.target !== id),
    }));
    this.selectedId.set(null);
  }

  @HostListener('window:keydown', ['$event'])
  onKey(e: KeyboardEvent) {
    if (e.key !== 'Delete') return;
    const tag = (e.target as HTMLElement | null)?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    const n = this.selected();
    if (n && n.type !== 'start') this.deleteNode(n.id);
  }

  // ---------- connecting ----------
  beginConnect(e: Event, n: WfNode, branch?: Branch) {
    e.stopPropagation();
    this.pending.set({ nodeId: n.id, branch });
  }
  completeConnect(e: Event, target: WfNode) {
    e.stopPropagation();
    const p = this.pending();
    if (!p || p.nodeId === target.id) return;
    const src = this.wf().nodes.find((n) => n.id === p.nodeId);
    if (target.type === 'start' || src?.type === 'end') return;
    this.wf.update((w) => {
      // an output port can only have one edge: replace existing
      const edges = w.edges.filter((x) => !(x.source === p.nodeId && x.branch === p.branch));
      return {
        ...w,
        edges: [...edges, { id: uid(), source: p.nodeId, target: target.id, branch: p.branch }],
      };
    });
    this.pending.set(null);
  }
  removeEdge(id: string) {
    this.wf.update((w) => ({ ...w, edges: w.edges.filter((e) => e.id !== id) }));
  }

  // ---------- dragging nodes ----------
  private drag: { id: string; px: number; py: number; ox: number; oy: number } | null = null;

  startDrag(e: PointerEvent, n: WfNode) {
    this.drag = { id: n.id, px: e.clientX, py: e.clientY, ox: n.x, oy: n.y };
  }
  @HostListener('window:pointermove', ['$event'])
  onMove(e: PointerEvent) {
    if (!this.drag) return;
    const { id, px, py, ox, oy } = this.drag;
    const x = Math.max(0, ox + e.clientX - px), y = Math.max(0, oy + e.clientY - py);
    this.wf.update((w) => ({
      ...w,
      nodes: w.nodes.map((n) => (n.id === id ? { ...n, x, y } : n)),
    }));
  }
  @HostListener('window:pointerup') onUp() {
    this.drag = null;
  }
}