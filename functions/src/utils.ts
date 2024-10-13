import { createHash } from "crypto";
import fetch from "node-fetch";

export const text2hex = (text: string) =>
  createHash("sha256").update(text).digest("hex");

export const hr2int = (hr: string) => {
  const matches = hr.toLowerCase().match(/([\d+]+)(k|m)?/);
  if (!matches) return 0;
  if (matches[2] === "k") return parseInt(matches[1]) * 1000;
  if (matches[2] === "m") return parseInt(matches[1]) * 1000 * 1000;
  return parseInt(matches[1]);
};

export async function ip() {
  return fetch("https://api.ipify.org/").then((r) => r.text());
}
