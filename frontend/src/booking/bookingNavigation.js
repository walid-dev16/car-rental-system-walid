export function getBookingReturnTo(params) {
  const target = params.get("returnTo") || "";
  if (!/^\/booking\/[1-9]\d*(?:\?[^#\\\s]*)?$/.test(target)) return "";
  return target;
}

export function bookingAuthLink(path, returnTo) {
  return `${path}?${new URLSearchParams({ returnTo })}`;
}

export function withSearch(path, params) {
  const query = params.toString();
  return query ? `${path}?${query}` : path;
}
