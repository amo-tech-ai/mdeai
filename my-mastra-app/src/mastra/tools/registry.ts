import type { RiskLevel } from './risk-levels';

export interface ToolMeta {
  name: string;
  description: string;
  risk: RiskLevel;
  openclaw_allowed: false;
  domains: string[];
}

export const TOOL_REGISTRY: Record<string, ToolMeta> = {};

export function registerTool(meta: ToolMeta): void {
  TOOL_REGISTRY[meta.name] = meta;
}
