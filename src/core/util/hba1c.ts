import type { Hba1cUnit } from '../types';

/** NGSP formula (ADAG study): estimated HbA1c (%) from mean glucose in mg/dL. */
export function estimatedHba1cPercent(avgMgdl: number): number {
  return (avgMgdl + 46.7) / 28.7;
}

/** IFCC conversion: NGSP % to mmol/mol. */
export function percentToMmolMol(percent: number): number {
  return 10.929 * (percent - 2.15);
}

export function formatHba1c(avgMgdl: number, unit: Hba1cUnit): string {
  const percent = estimatedHba1cPercent(avgMgdl);
  if (unit === '%') return percent.toFixed(1);
  return String(Math.round(percentToMmolMol(percent)));
}
