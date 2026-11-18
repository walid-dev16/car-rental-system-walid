const { BookingError } = require('./booking-availability');

const BRANCHES = ['Erfurt', 'Berlin', 'Frankfurt', 'Munich', 'Hamburg'];

function canonicalBranch(value) {
  if (typeof value !== 'string') return null;
  const key = value.trim().toLowerCase();
  return BRANCHES.find(name => name.toLowerCase() === key) || null;
}

function carBranches(value) {
  const entries = Array.isArray(value) ? value : String(value ?? '').split(',');
  return [...new Set(entries.map(canonicalBranch).filter(Boolean))];
}

function requestedBranch(value) {
  if (value == null || value === '') return null;
  const branch = canonicalBranch(value);
  if (!branch) throw new BookingError(400, 'Unknown branch');
  return branch;
}

function bookingBranches(body, availableBranches) {
  const pickup = requestedBranch(body.pickup_branch);
  const dropoff = requestedBranch(body.dropoff_branch);
  if (!pickup && !dropoff) return { pickup: null, dropoff: null };
  if (!pickup || !dropoff) throw new BookingError(400, 'Select both pickup and drop-off branches');
  const offered = carBranches(availableBranches);
  if (!offered.includes(pickup) || !offered.includes(dropoff)) {
    throw new BookingError(400, 'This car does not list both selected branches');
  }
  return { pickup, dropoff };
}

module.exports = { BRANCHES, canonicalBranch, carBranches, requestedBranch, bookingBranches };
