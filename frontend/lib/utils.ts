import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function statusTone(status: string) {
  if (status === "completed") return "text-accent";
  if (status === "running") return "text-accentCold";
  if (status === "error") return "text-rose-300";
  return "text-slate-400";
}
