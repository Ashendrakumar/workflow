import { Injectable, signal } from '@angular/core';
import { WfNode, Workflow } from '../models/workflow.model';

const KEY = 'workflow';

export const uid = () => {
  return Date.now().toString(36);
};

@Injectable({
  providedIn: 'root',
})
export class WorkflowService {
  workFlow = signal<Workflow[]>(this.loadWorkFlow());

  private loadWorkFlow(): Workflow[] {
    const data = localStorage.getItem(KEY);
    if (data) {
      return JSON.parse(data);
    } else {
      const seeded: Workflow[] = []; //  Seed Data
      localStorage.setItem(KEY, JSON.stringify(seeded));
      return seeded;
    }
  }

  private persist() {
    try {
      localStorage.setItem(KEY, JSON.stringify(this.workFlow()));
    } catch (e) {
      console.log(e);
    }
  }

  get(id: string) {
    return this.workFlow().find((wf: Workflow) => wf.id === id);
  }

  create(name: string): Workflow {
    const id = uid();
    console.log('--------',id);
    const start: WfNode = {
      id: id,
      type: 'start',
      label: 'Start',
      config: {},
      x: 300,
      y: 40,
    };

    const action:WfNode = {
      id:  id,
      type: 'action',
      label: 'Action',
      config: {
        actionType:'log',
        message: 'Hello World',
      },
      x: 300,
      y: 160,
    };

    const end:WfNode = {
      id:  id,
      type: 'end',
      label: 'End',
      config: {},
      x: 300,
      y: 210,
    }

    const wf: Workflow = {
      id,
      name,
      nodes: [start, action, end ],
      edges: [
        {
          id:id,
          source: start.id,
          target: action.id
        },
        {
          id:id,
          source: action.id,
          target: end.id
        }
      ],
      updatedAt: new Date().toISOString(),
    };

    this.workFlow.update((wfs) => [...wfs, wf]);
    this.persist();
    return wf;
  }

  save(wf:Workflow){
    const saved = {...wf, updatedAt: new Date().toISOString()};
    saved.updatedAt = new Date().toISOString();
    this.workFlow.update((wfs) => wfs.map((w) => (w.id === wf.id ? saved : w)));
    this.persist();
  }

  remove(id:string){
    this.workFlow.update((wfs) => wfs.filter((wf) => wf.id !== id));
    this.persist();
  }

  constructor() {}
}
