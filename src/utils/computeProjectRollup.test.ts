import { describe, expect, it } from 'vitest';
import { computeProjectRollup } from './computeProjectRollup';
import { MRC, Project, ProjectOverride, SPMIG } from '../types';

const spmigs: SPMIG[] = [
  { id: 'A', description: 'Item A', uom: 'ea', unitCost: 2, packSize: 10 },
  { id: 'B', description: 'Item B', uom: 'ea' }
];

const mrcs: MRC[] = [
  {
    id: 'mrc1',
    name: 'MRC 1',
    items: [
      { spmigId: 'A', qtyPerOccur: 3, uom: 'ea' },
      { spmigId: 'B', qtyPerOccur: 5, uom: 'ea' }
    ]
  },
  {
    id: 'mrc2',
    name: 'MRC 2',
    items: [{ spmigId: 'A', qtyPerOccur: 1, uom: 'ea' }]
  }
];

const project: Project = {
  id: 'project1',
  name: 'Test Project',
  mrcApplications: [
    { mrcId: 'mrc1', occurrences: 2 },
    { mrcId: 'mrc2', occurrences: 3 }
  ]
};

describe('computeProjectRollup', () => {
  it('aggregates totals, rounding by pack size and computing ext cost', () => {
    const overrides: ProjectOverride[] = [
      {
        id: 'ov1',
        projectId: 'project1',
        mrcId: 'mrc2',
        spmigId: 'A',
        actualQtyPerOccur: 2
      }
    ];

    const result = computeProjectRollup({
      project,
      mrcs,
      spmigs,
      overrides
    });

    const rowA = result.find((row) => row.spmigId === 'A');
    const rowB = result.find((row) => row.spmigId === 'B');

    expect(rowA?.totalNeeded).toBe(12); // 2*3 + 3*2
    expect(rowA?.orderQty).toBe(20); // pack of 10
    expect(rowA?.extCost).toBe(40);
    expect(rowA?.contributions.length).toBe(2);

    expect(rowB?.totalNeeded).toBe(10); // 2*5
    expect(rowB?.orderQty).toBe(10);
    expect(rowB?.extCost).toBeUndefined();
  });

  it('applies factor overrides when actual not present', () => {
    const overrides: ProjectOverride[] = [
      {
        id: 'ov2',
        projectId: 'project1',
        mrcId: 'mrc1',
        spmigId: 'B',
        factor: 0.5
      }
    ];

    const result = computeProjectRollup({
      project,
      mrcs,
      spmigs,
      overrides
    });

    const rowB = result.find((row) => row.spmigId === 'B');
    expect(rowB?.totalNeeded).toBe(5); // 2 * (5 * 0.5)
  });
});
