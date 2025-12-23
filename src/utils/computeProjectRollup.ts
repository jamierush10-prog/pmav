import { MRC, Project, ProjectOverride, RollupRow, SPMIG } from '../types';

type RollupInput = {
  project: Project;
  mrcs: MRC[];
  spmigs: SPMIG[];
  overrides?: ProjectOverride[];
};

function resolveEffectiveQty(
  baseQty: number,
  override?: ProjectOverride
): number {
  if (!override) return baseQty;
  if (typeof override.actualQtyPerOccur === 'number') return override.actualQtyPerOccur;
  if (typeof override.factor === 'number') return baseQty * override.factor;
  return baseQty;
}

export function computeProjectRollup({
  project,
  mrcs,
  spmigs,
  overrides = []
}: RollupInput): RollupRow[] {
  const spmigIndex = new Map(spmigs.map((spmig) => [spmig.id, spmig]));
  const mrcIndex = new Map(mrcs.map((mrc) => [mrc.id, mrc]));
  const overrideIndex = new Map(
    overrides
      .filter((ovr) => ovr.projectId === project.id)
      .map((ovr) => [`${ovr.mrcId}::${ovr.spmigId}`, ovr])
  );

  const rollup = new Map<string, RollupRow>();

  for (const application of project.mrcApplications) {
    const mrc = mrcIndex.get(application.mrcId);
    if (!mrc) continue;
    for (const item of mrc.items) {
      const spmig = spmigIndex.get(item.spmigId);
      if (!spmig) continue;

      const override = overrideIndex.get(`${mrc.id}::${item.spmigId}`);
      const effectiveQtyPerOccur = resolveEffectiveQty(
        item.qtyPerOccur,
        override
      );
      const totalFromMrc = application.occurrences * effectiveQtyPerOccur;
      const existing = rollup.get(item.spmigId);
      const baseRow: RollupRow =
        existing ?? {
          spmigId: item.spmigId,
          description: spmig.description,
          uom: item.uom || spmig.uom,
          unitCost: spmig.unitCost,
          packSize: spmig.packSize,
          totalNeeded: 0,
          orderQty: 0,
          extCost: undefined,
          contributions: []
        };

      baseRow.totalNeeded += totalFromMrc;
      baseRow.contributions.push({
        mrcId: mrc.id,
        mrcName: mrc.name,
        occurrences: application.occurrences,
        qtyPerOccur: item.qtyPerOccur,
        effectiveQtyPerOccur,
        totalFromMrc
      });

      rollup.set(item.spmigId, baseRow);
    }
  }

  for (const [spmigId, row] of rollup.entries()) {
    const spmig = spmigIndex.get(spmigId);
    const packSize = spmig?.packSize ?? row.packSize;
    if (packSize && packSize > 0) {
      row.orderQty = Math.ceil(row.totalNeeded / packSize) * packSize;
    } else {
      row.orderQty = row.totalNeeded;
    }
    if (typeof row.unitCost === 'number') {
      row.extCost = row.orderQty * row.unitCost;
    }
  }

  return Array.from(rollup.values()).sort((a, b) =>
    a.description.localeCompare(b.description)
  );
}
