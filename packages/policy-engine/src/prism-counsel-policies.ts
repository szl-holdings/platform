import type { Policy } from './types.js';

const _now = Date.now();

export const PRISM_COUNSEL_POLICIES: Policy[] = [
  {
    id: 'prism-counsel.matter-wall',
    name: 'PRISM Counsel — Matter Wall Access Control',
    description:
      'Enforces ethical screens between matters to prevent conflict of interest. ' +
      'Aligns with ABA Rules of Professional Conduct 1.7 and 1.10.',
    scope: 'domain',
    domain: 'prism-counsel',
    actionTypes: ['prism-counsel:access', 'prism-counsel:export', 'prism-counsel:view'],
    rules: [
      {
        id: 'prism-counsel.matter-wall.block-restricted-non-partner',
        name: 'Block restricted matter access for non-partner roles',
        conditions: [
          { field: 'privilegeLevel', operator: 'eq', value: 'restricted' },
          { field: 'userRole', operator: 'not_in', value: ['partner', 'gc', 'super_admin'] },
        ],
        effect: 'block',
        reason:
          'Restricted matters may only be accessed by Partner or GC-level users. Matter wall is active.',
        priority: 950,
      },
      {
        id: 'prism-counsel.matter-wall.block-paralegal-privileged-export',
        name: 'Block paralegal from exporting privileged matter content',
        conditions: [
          { field: 'action', operator: 'eq', value: 'prism-counsel:export' },
          { field: 'privilegeLevel', operator: 'in', value: ['privileged', 'restricted'] },
          { field: 'userRole', operator: 'eq', value: 'paralegal' },
        ],
        effect: 'block',
        reason:
          'Paralegals may not export privileged or restricted matter content without Partner supervision.',
        priority: 900,
      },
      {
        id: 'prism-counsel.matter-wall.block-wall-unapproved',
        name: 'Block unapproved users from walled matters',
        conditions: [
          { field: 'wallEnabled', operator: 'eq', value: true },
          { field: 'userApproved', operator: 'eq', value: false },
          { field: 'userRole', operator: 'not_in', value: ['super_admin'] },
        ],
        effect: 'block',
        reason:
          'Matter wall is active. User does not have explicit matter-wall clearance. ' +
          "Request access from the matter's supervising partner.",
        priority: 870,
      },
      {
        id: 'prism-counsel.matter-wall.require-approval-associate-export',
        name: 'Require partner approval for associate-level privileged exports',
        conditions: [
          { field: 'action', operator: 'eq', value: 'prism-counsel:export' },
          { field: 'privilegeLevel', operator: 'in', value: ['privileged', 'restricted'] },
          { field: 'userRole', operator: 'eq', value: 'associate' },
        ],
        effect: 'require_approval',
        requiredApproverRole: 'partner',
        reason:
          'Privileged matter exports by associates require supervising partner approval before release.',
        priority: 820,
      },
      {
        id: 'prism-counsel.matter-wall.audit-all-exports',
        name: 'Audit every proof chain export regardless of privilege level',
        conditions: [{ field: 'action', operator: 'eq', value: 'prism-counsel:export' }],
        effect: 'audit_only',
        reason:
          'All proof chain export requests are immutably logged in the PRISM audit trail for compliance and eDiscovery.',
        priority: 100,
      },
      {
        id: 'prism-counsel.matter-wall.allow-gc-full-access',
        name: 'Allow GC and partner unrestricted matter access',
        conditions: [
          { field: 'userRole', operator: 'in', value: ['gc', 'partner', 'super_admin'] },
        ],
        effect: 'allow',
        reason: 'GC and Partner-level users have full matter access by default.',
        priority: 50,
      },
    ],
    isActive: true,
    priority: 800,
    complianceFramework: 'ABA-Rules-of-Professional-Conduct-1.7-1.10',
    createdAt: _now,
    updatedAt: _now,
  },
];
