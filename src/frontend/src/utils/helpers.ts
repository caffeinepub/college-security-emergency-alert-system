export function formatTimestamp(ts: bigint): string {
  // Motoko Time is nanoseconds since epoch
  const ms = Number(ts / BigInt(1_000_000));
  const d = new Date(ms);
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}
