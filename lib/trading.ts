/**
 * Mock asset definitions and deterministic price simulation for Aether Evo trading.
 */

export interface SimAsset {
  symbol: string;
  name: string;
  basePrice: number;
  description: string;
}

export const MOCK_ASSETS: SimAsset[] = [
  { symbol: "AETH", name: "AetherCoin",  basePrice: 100, description: "The native token of the Aether ecosystem" },
  { symbol: "BYTE", name: "ByteToken",   basePrice: 50,  description: "Digital currency for data transactions" },
  { symbol: "VELO", name: "VeloCredit",  basePrice: 200, description: "High-speed transfer protocol token" },
  { symbol: "NOVA", name: "NovaStar",    basePrice: 75,  description: "Emerging AI-powered asset" },
];

/**
 * Deterministic price based on symbol + timestamp bucket (updates every 60s).
 * Oscillates ±20% around the asset's base price.
 */
export function getMockPrice(symbol: string, timestampMs?: number): number {
  const bucket = Math.floor((timestampMs ?? Date.now()) / 60000);
  const asset = MOCK_ASSETS.find(a => a.symbol === symbol);
  if (!asset) return 100;
  // Simple pseudo-random using symbol char codes + bucket
  const hash = symbol.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const seed = (hash * 9301 + bucket * 49297) % 233280;
  const rand = seed / 233280; // 0-1
  // Oscillate ±20% around base price
  const multiplier = 0.8 + rand * 0.4;
  return Math.round(asset.basePrice * multiplier * 100) / 100;
}

export function getAllPrices(): Record<string, number> {
  const now = Date.now();
  return Object.fromEntries(MOCK_ASSETS.map(a => [a.symbol, getMockPrice(a.symbol, now)]));
}
