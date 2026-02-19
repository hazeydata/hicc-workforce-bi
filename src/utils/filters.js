import { BRANCHES } from '../data/generateData';

export function getDirectoratesForBranch(branchCode) {
  if (!branchCode) return [];
  const branch = BRANCHES.find(b => b.branchCode === branchCode);
  return branch?.directorates ?? [];
}

export function getDivisionsForDirectorate(branchCode, directorateCode) {
  if (!branchCode || !directorateCode) return [];
  const branch = BRANCHES.find(b => b.branchCode === branchCode);
  const dir = branch?.directorates?.find(d => d.code === directorateCode);
  return dir?.divisions ?? [];
}

export function filterPositions(positions, { branch, directorate, division }) {
  return positions.filter(p => {
    if (branch && p.branchCode !== branch) return false;
    if (directorate && p.directorateCode !== directorate) return false;
    if (division && p.divisionCode !== division) return false;
    return true;
  });
}

export function filterFinance(financeData, { branch, directorate }) {
  if (directorate) {
    return financeData.filter(f => f.directorateCode === directorate);
  }
  if (branch) {
    const directorates = getDirectoratesForBranch(branch).map(d => d.code);
    return financeData.filter(f => directorates.includes(f.directorateCode));
  }
  return financeData;
}
