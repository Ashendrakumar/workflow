import { Component, OnInit, inject, signal } from '@angular/core';
import { JsonPipe, NgClass } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Workflow } from '../../models/workflow.model';
import { WorkflowService } from '../../services/workflow.service';
import { ExecutionService } from '../../services/execution.service';
// import { TEST_CASES } from '../../sample/sample-workflow';

@Component({
  selector: 'app-monitor',
  imports: [FormsModule, RouterLink, JsonPipe, NgClass],
  providers: [ExecutionService], // one engine instance per monitor page
  templateUrl: `./monitor.component.html`,
  styleUrl: './monitor.component.scss',
})
export class MonitorComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private svc = inject(WorkflowService);
  ex = inject(ExecutionService);

  presets = TEST_CASES;
  wf = signal<Workflow>({ id: '', name: '', nodes: [], edges: [], updatedAt: '' });
  inputText = JSON.stringify(TEST_CASES[0].input, null, 2);
  inputError = signal('');
  expectation = signal(TEST_CASES[0].expectation);

  ngOnInit() {
    const found = this.svc.get(this.route.snapshot.paramMap.get('id') ?? '');
    if (!found) {
      this.router.navigate(['/']);
      return;
    }
    this.wf.set(structuredClone(found));
    this.ex.nodeStatus.set(Object.fromEntries(found.nodes.map((n) => [n.id, 'pending' as const])));
  }

  status(id: string) {
    return this.ex.nodeStatus()[id] ?? 'pending';
  }
  label(id: string) {
    return this.wf().nodes.find((n) => n.id === id)?.label ?? id;
  }
  clearLogs() {
    this.ex.logs.set([]);
  }

  applyPreset(i: string) {
    if (i === '') {
      this.expectation.set('');
      return;
    }
    this.inputText = JSON.stringify(this.presets[+i].input, null, 2);
    this.expectation.set(this.presets[+i].expectation);
  }

  run() {
    this.inputError.set('');
    let input: Record<string, unknown>;
    try {
      input = JSON.parse(this.inputText || '{}');
      if (input === null || typeof input !== 'object' || Array.isArray(input))
        throw new Error('Input must be a JSON object.');
    } catch (e) {
      this.inputError.set('Invalid JSON: ' + (e instanceof Error ? e.message : String(e)));
      return;
    }
    this.ex.start(this.wf(), input); // not awaited: the UI updates through signals
  }
}