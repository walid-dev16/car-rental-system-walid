export const BRANCHES = ["Erfurt", "Berlin", "Frankfurt", "Munich", "Hamburg"];

export function getCarBranches(value) {
  const listed = Array.isArray(value) ? value : String(value || "").split(",");
  const names = new Set(listed.map((branch) => String(branch).trim().toLowerCase()));
  return BRANCHES.filter((branch) => names.has(branch.toLowerCase()));
}

export function describeCarBranches(value) {
  return getCarBranches(value).join(", ") || "Branch not confirmed";
}
