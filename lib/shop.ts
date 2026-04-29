/**
 * Cosmetic catalog for the Aether Evo shop.
 * Items are seeded from this definition; records are stored in DB.
 */

export interface CosmeticDef {
  name: string;
  category: "font" | "theme" | "avatar";
  description: string;
  price: number;
  data: string; // JSON-stringified CSS or metadata
}

export const COSMETIC_CATALOG: CosmeticDef[] = [
  { name: "Focus Mode",    category: "font",   description: "Clean monospace font for focus",     price: 50,  data: JSON.stringify({ fontFamily: "monospace", letterSpacing: "0.08em" }) },
  { name: "Cyber Keys",    category: "font",   description: "Futuristic keyboard font style",     price: 80,  data: JSON.stringify({ fontFamily: "Courier New, monospace", letterSpacing: "0.12em" }) },
  { name: "Minimal Light", category: "theme",  description: "Ultra-clean light theme skin",       price: 60,  data: JSON.stringify({ themeOverride: "light" }) },
  { name: "Neon Pulse",    category: "theme",  description: "Vibrant neon color accents",         price: 100, data: JSON.stringify({ accentOverride: "#00ffcc" }) },
  { name: "Ghost Cursor",  category: "avatar", description: "Transparent ghost-style avatar",     price: 40,  data: JSON.stringify({ avatar: "ghost" }) },
  { name: "Star Pilot",    category: "avatar", description: "Space explorer character",           price: 70,  data: JSON.stringify({ avatar: "star" }) },
  { name: "Cyber Runner",  category: "avatar", description: "High-speed cyberpunk avatar",        price: 120, data: JSON.stringify({ avatar: "cyber" }) },
];
