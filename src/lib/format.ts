// Formatting helpers for money, dates, and field values.

export function formatMoney(n: number, opts: { cents?: boolean } = {}): string {
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: opts.cents ? 2 : 0,
    maximumFractionDigits: opts.cents ? 2 : 0,
  });
}

export function formatNumber(n: number, decimals = 0): string {
  return n.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

// "3 hours ago" style relative time for activity lists.
export function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  if (diffMs < 0) return "just now"; // guard clock skew / future timestamps
  const sec = Math.round(diffMs / 1000);
  if (sec < 45) return "just now";
  const min = Math.round(sec / 60);
  if (min < 60) return `${min} minute${min === 1 ? "" : "s"} ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr} hour${hr === 1 ? "" : "s"} ago`;
  const day = Math.round(hr / 24);
  if (day < 7) return `${day} day${day === 1 ? "" : "s"} ago`;
  if (day < 30) {
    const wk = Math.round(day / 7);
    return `${wk} week${wk === 1 ? "" : "s"} ago`;
  }
  if (day < 365) {
    const mo = Math.round(day / 30);
    return `${mo} month${mo === 1 ? "" : "s"} ago`;
  }
  const yr = Math.round(day / 365);
  return `${yr} year${yr === 1 ? "" : "s"} ago`;
}

// Treat a field value as a number for calculations / display.
export function asNumber(v: string | number): number {
  if (typeof v === "number") return v;
  const cleaned = v.replace(/[^0-9.-]/g, "");
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : 0;
}
