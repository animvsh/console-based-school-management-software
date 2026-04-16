import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function fmtRelative(ts: number): string {
  const delta = (Date.now() - ts) / 1000;
  if (delta < 60) return "just now";
  if (delta < 3600) return `${Math.floor(delta / 60)}m ago`;
  if (delta < 86400) return `${Math.floor(delta / 3600)}h ago`;
  if (delta < 86400 * 7) return `${Math.floor(delta / 86400)}d ago`;
  return new Date(ts).toLocaleDateString();
}

export function titleFromQuery(q: string): string {
  const clean = q.replace(/\s+/g, " ").trim();
  return clean.length > 56 ? `${clean.slice(0, 56)}…` : clean;
}
