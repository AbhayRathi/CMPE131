"use client";

import { useState, useEffect, useCallback } from "react";

interface ShopItem {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  owned: boolean;
  equipped: boolean;
}

interface ShopPanelProps {
  username: string;
  onBack: () => void;
}

const LS_GUEST_WALLET  = "aether-wallet";
const LS_GUEST_SHOP    = "aether-shop";

interface GuestWallet { balance: number; transactions: Array<{ amount: number; reason: string; date: string }> }
interface GuestShop   { owned: Record<string, boolean>; equipped: Record<string, boolean> }

function getGuestWallet(): GuestWallet {
  try { const r = localStorage.getItem(LS_GUEST_WALLET); if (r) return JSON.parse(r); } catch { /* ignore */ }
  return { balance: 0, transactions: [] };
}
function saveGuestWallet(gw: GuestWallet) {
  try { localStorage.setItem(LS_GUEST_WALLET, JSON.stringify(gw)); } catch { /* ignore */ }
}
function getGuestShop(): GuestShop {
  try { const r = localStorage.getItem(LS_GUEST_SHOP); if (r) return JSON.parse(r); } catch { /* ignore */ }
  return { owned: {}, equipped: {} };
}
function saveGuestShop(gs: GuestShop) {
  try { localStorage.setItem(LS_GUEST_SHOP, JSON.stringify(gs)); } catch { /* ignore */ }
}

const CATEGORY_LABELS: Record<string, string> = {
  font:   "Font Themes",
  theme:  "UI Themes",
  avatar: "Avatars",
};

export default function ShopPanel({ username, onBack }: ShopPanelProps) {
  const isGuest = username === "Guest" || username === "";

  const [items, setItems]     = useState<ShopItem[]>([]);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg]         = useState("");

  const fetchShop = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch(`/api/shop?username=${encodeURIComponent(isGuest ? "" : username)}`);
      const data = await res.json();
      let shopItems: ShopItem[] = data.items ?? [];

      if (isGuest) {
        const gs = getGuestShop();
        shopItems = shopItems.map((item) => ({
          ...item,
          owned:   gs.owned[item.name]   ?? false,
          equipped: gs.equipped[item.name] ?? false,
        }));
        setBalance(getGuestWallet().balance);
      } else {
        const wRes = await fetch(`/api/wallet?username=${encodeURIComponent(username)}`);
        const wData = await wRes.json();
        setBalance(wData.balance ?? 0);
      }
      setItems(shopItems);
    } catch { /* network error */ } finally {
      setLoading(false);
    }
  }, [username, isGuest]);

  useEffect(() => { fetchShop(); }, [fetchShop]);

  const handleBuy = useCallback(async (item: ShopItem) => {
    if (balance < item.price) { setMsg("Insufficient credits."); return; }
    try {
      if (isGuest) {
        const gw = getGuestWallet();
        if (gw.balance < item.price) { setMsg("Insufficient credits."); return; }
        gw.balance -= item.price;
        gw.transactions.unshift({ amount: -item.price, reason: `Purchased: ${item.name}`, date: new Date().toISOString() });
        saveGuestWallet(gw);
        const gs = getGuestShop();
        gs.owned[item.name] = true;
        saveGuestShop(gs);
        setBalance(gw.balance);
        setMsg(`Purchased ${item.name}!`);
      } else {
        const res = await fetch("/api/shop/buy", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, cosmeticName: item.name }),
        });
        const data = await res.json();
        if (!res.ok) { setMsg(data.error ?? "Purchase failed."); return; }
        setBalance(data.newBalance);
        setMsg(`Purchased ${item.name}!`);
      }
      fetchShop();
    } catch { setMsg("Purchase failed. Please try again."); }
  }, [username, isGuest, balance, fetchShop]);

  const handleEquip = useCallback(async (item: ShopItem, equip: boolean) => {
    try {
      if (isGuest) {
        const gs = getGuestShop();
        // Unequip others in same category
        if (equip) {
          Object.keys(gs.equipped).forEach((name) => {
            const other = items.find(i => i.name === name);
            if (other && other.category === item.category) gs.equipped[name] = false;
          });
        }
        gs.equipped[item.name] = equip;
        saveGuestShop(gs);
        setMsg(equip ? `Equipped ${item.name}.` : `Unequipped ${item.name}.`);
      } else {
        const res = await fetch("/api/shop/equip", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, cosmeticName: item.name, equipped: equip }),
        });
        const data = await res.json();
        if (!res.ok) { setMsg(data.error ?? "Failed to equip."); return; }
        setMsg(equip ? `Equipped ${item.name}.` : `Unequipped ${item.name}.`);
      }
      fetchShop();
    } catch { setMsg("Failed to equip. Please try again."); }
  }, [username, isGuest, items, fetchShop]);

  const categories = ["font", "theme", "avatar"];

  return (
    <div className="space-y-4 fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="text-xs px-3 py-1.5 rounded-lg transition-colors hover:opacity-80"
            style={{ background: "var(--surface2)", color: "var(--text-muted)", border: "1px solid var(--border)" }}
          >
            ← Back
          </button>
          <h2 className="text-base font-bold">🛍 Shop</h2>
        </div>
        <div className="text-sm font-bold" style={{ color: "var(--accent)" }}>
          {loading ? "…" : balance.toLocaleString()} credits
        </div>
      </div>

      {msg && (
        <div className="text-xs px-3 py-2 rounded-lg" style={{ background: "var(--surface2)", color: "var(--text-muted)" }}>
          {msg}
        </div>
      )}

      {loading ? (
        <div className="text-center py-10 text-xs" style={{ color: "var(--text-muted)" }}>Loading…</div>
      ) : (
        categories.map((cat) => {
          const catItems = items.filter((i) => i.category === cat);
          if (!catItems.length) return null;
          return (
            <div key={cat}>
              <h3 className="text-xs font-semibold mb-2" style={{ color: "var(--text-muted)" }}>
                {CATEGORY_LABELS[cat] ?? cat}
              </h3>
              <div className="space-y-2">
                {catItems.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl px-4 py-3 flex items-center justify-between"
                    style={{ background: "var(--surface)", border: `1px solid ${item.equipped ? "var(--accent)" : "var(--border)"}` }}
                  >
                    <div className="flex-1 min-w-0 mr-3">
                      <div className="text-sm font-medium flex items-center gap-2">
                        {item.name}
                        {item.equipped && (
                          <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: "var(--accent)", color: "#fff" }}>
                            Equipped
                          </span>
                        )}
                        {item.owned && !item.equipped && (
                          <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: "var(--surface2)", color: "var(--text-muted)", border: "1px solid var(--border)" }}>
                            Owned
                          </span>
                        )}
                      </div>
                      <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{item.description}</div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-bold" style={{ color: "var(--accent)" }}>{item.price} cr</span>
                      {item.owned ? (
                        <button
                          onClick={() => handleEquip(item, !item.equipped)}
                          className="text-xs px-3 py-1.5 rounded-lg font-semibold transition-all hover:opacity-90"
                          style={{
                            background: item.equipped ? "var(--surface2)" : "var(--accent)",
                            color: item.equipped ? "var(--text-muted)" : "#fff",
                            border: "1px solid var(--border)",
                          }}
                        >
                          {item.equipped ? "Unequip" : "Equip"}
                        </button>
                      ) : (
                        <button
                          onClick={() => handleBuy(item)}
                          disabled={balance < item.price}
                          className="text-xs px-3 py-1.5 rounded-lg font-semibold text-white transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                          style={{ background: "var(--accent)" }}
                        >
                          Buy
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
