export type NodeType = 'start' | 'action' | 'condition' | 'delay' | 'end';
export type Branch = 'true' | 'false';
export type ActionType = 'setVariable' | 'add' | 'multiply' | 'log';
export type Operator = '==' | '!=' | '>' | '<' | '>=' | '<=';

export interface NodeConfig {
  // action
  actionType?: ActionType;
  variable?: string; // setVariable / add / multiply: target variable
  value?: string; // setVariable / add / multiply operand; condition compare value
  message?: string; // log, supports {{variable}} interpolation
  // condition
  field?: string; // variable name to test
  operator?: Operator;
  trueLabel?: string;
  falseLabel?: string;
  // delay
  delayMs?: number; // 100..10000
}

export interface WfNode {
  id: string;
  type: NodeType;
  label: string;
  x: number;
  y: number;
  config: NodeConfig;
}

export interface WfEdge {
  id: string;
  source: string;
  target: string;
  branch?: Branch;
}

export interface Workflow {
  id: string;
  name: string;
  nodes: WfNode[];
  edges: WfEdge[];
  updatedAt: string;
}

// ---- execution ----
export type WorkflowStatus = 'idle' | 'running' | 'success' | 'failed' | 'cancelled';
export type NodeStatus = 'pending' | 'running' | 'success' | 'failed' | 'skipped' | 'cancelled';
export interface LogEntry {
  time: string;
  level: 'info' | 'success' | 'error';
  message: string;
}

export const NODE_W = 140;
export const NODE_H = 48;
export const DELAY_MIN = 100;
export const DELAY_MAX = 10000;