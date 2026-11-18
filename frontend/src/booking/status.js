const statusStyles = {
  booked: "border-green-500/30 bg-green-500/10 text-green-400",
  cancelled: "border-red-500/30 bg-red-500/10 text-red-400",
  pending: "border-yellow-500/30 bg-yellow-500/10 text-yellow-400",
  completed: "border-blue-500/30 bg-blue-500/10 text-blue-400",
};

export function bookingStatusStyle(status) {
  return statusStyles[status] || "border-white/10 bg-white/5 text-gray-300";
}

export function bookingCounts(bookings) {
  const counts = { total: bookings.length, pending: 0, booked: 0, cancelled: 0 };
  for (const { status } of bookings) {
    if (["pending", "booked", "cancelled"].includes(status)) counts[status]++;
  }
  return counts;
}
