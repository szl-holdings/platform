import type { WorkcellAssignment, ProofPacketRecord } from './types.js';
import type { GovernedAgentWrapper } from './governed-wrapper.js';
import type { MCPDiscoveryRegistry } from './mcp-discovery.js';

export class WorkcellBridge {
  private assignments = new Map<string, WorkcellAssignment[]>();
  private mcpRegistry: MCPDiscoveryRegistry;

  constructor(mcpRegistry: MCPDiscoveryRegistry) {
    this.mcpRegistry = mcpRegistry;
  }

  async assignAgent(
    workcellId: string,
    agent: GovernedAgentWrapper,
    role: WorkcellAssignment['role'] = 'primary',
  ): Promise<{ assignment: WorkcellAssignment; initResult: { ready: boolean; reason?: string } }> {
    if (!agent.isInitialized) {
      const initResult = await agent.initialize();
      if (!initResult.ready) {
        return {
          assignment: {
            workcellId,
            agentId: agent.agentId,
            role,
            assignedAt: new Date().toISOString(),
            status: 'failed',
          },
          initResult,
        };
      }
    }

    const assignment: WorkcellAssignment = {
      workcellId,
      agentId: agent.agentId,
      role,
      assignedAt: new Date().toISOString(),
      status: 'active',
    };

    const existing = this.assignments.get(workcellId) ?? [];
    existing.push(assignment);
    this.assignments.set(workcellId, existing);

    return { assignment, initResult: { ready: true } };
  }

  getAssignments(workcellId: string): WorkcellAssignment[] {
    return this.assignments.get(workcellId) ?? [];
  }

  getAgentWorkcells(agentId: string): WorkcellAssignment[] {
    const results: WorkcellAssignment[] = [];
    for (const assignments of this.assignments.values()) {
      for (const a of assignments) {
        if (a.agentId === agentId && a.status === 'active') {
          results.push(a);
        }
      }
    }
    return results;
  }

  async executeWorkcellStep(
    workcellId: string,
    agent: GovernedAgentWrapper,
    step: { action: string; toolCalls: string[]; payload: Record<string, unknown>; approvalGranted?: boolean },
  ): Promise<{
    success: boolean;
    blocked: boolean;
    blockReason?: string;
    proofPacket: ProofPacketRecord;
    mcpServersUsed: string[];
    blockedTools: string[];
  }> {
    const discoveredServers = this.mcpRegistry.discoverToolsForAgent(step.toolCalls);
    const mcpServersUsed = discoveredServers.map(s => s.serverId);

    const result = await agent.executeGoverned({
      ...step,
      requiredCovenants: agent.template === 'compliance' ? ['policy.ai-output-validation'] : undefined,
    });

    const enrichedProof: ProofPacketRecord = {
      ...result.proofPacket,
      workcellId,
    };

    return {
      success: result.success,
      blocked: result.blocked,
      blockReason: result.blockReason,
      proofPacket: enrichedProof,
      mcpServersUsed,
      blockedTools: result.blockedTools,
    };
  }

  completeAssignment(workcellId: string, agentId: string): boolean {
    const assignments = this.assignments.get(workcellId);
    if (!assignments) return false;

    const assignment = assignments.find(a => a.agentId === agentId && a.status === 'active');
    if (!assignment) return false;

    assignment.status = 'completed';
    return true;
  }

  failAssignment(workcellId: string, agentId: string): boolean {
    const assignments = this.assignments.get(workcellId);
    if (!assignments) return false;

    const assignment = assignments.find(a => a.agentId === agentId && a.status === 'active');
    if (!assignment) return false;

    assignment.status = 'failed';
    return true;
  }

  getActiveWorkcellCount(): number {
    let count = 0;
    for (const assignments of this.assignments.values()) {
      if (assignments.some(a => a.status === 'active')) count++;
    }
    return count;
  }

  getSummary() {
    let totalAssignments = 0;
    let activeAssignments = 0;
    let completedAssignments = 0;
    let failedAssignments = 0;

    for (const assignments of this.assignments.values()) {
      for (const a of assignments) {
        totalAssignments++;
        if (a.status === 'active') activeAssignments++;
        else if (a.status === 'completed') completedAssignments++;
        else failedAssignments++;
      }
    }

    return {
      totalWorkcells: this.assignments.size,
      totalAssignments,
      activeAssignments,
      completedAssignments,
      failedAssignments,
      mcpHealth: this.mcpRegistry.healthCheck(),
    };
  }
}
