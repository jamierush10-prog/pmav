export type SPMIG = {
  id: string;
  description: string;
  partNumber?: string;
  spmigCode?: string;
  suffix?: string;
  niin?: string;
  uom: string;
  unitCost?: number;
  packSize?: number;
};

export type MRCItem = {
  spmigId: string;
  qtyPerOccur: number;
  uom: string;
};

export type MRC = {
  id: string;
  name: string;
  items: MRCItem[];
};

export type ProjectMRCApplication = {
  mrcId: string;
  occurrences: number;
};

export type Project = {
  id: string;
  name: string;
  mrcApplications: ProjectMRCApplication[];
};

export type ProjectOverride = {
  id: string;
  projectId: string;
  mrcId: string;
  spmigId: string;
  actualQtyPerOccur?: number;
  factor?: number;
};

export type RollupContribution = {
  mrcId: string;
  mrcName: string;
  occurrences: number;
  qtyPerOccur: number;
  effectiveQtyPerOccur: number;
  totalFromMrc: number;
};

export type RollupRow = {
  spmigId: string;
  description: string;
  uom: string;
  unitCost?: number;
  packSize?: number;
  totalNeeded: number;
  orderQty: number;
  extCost?: number;
  contributions: RollupContribution[];
};
