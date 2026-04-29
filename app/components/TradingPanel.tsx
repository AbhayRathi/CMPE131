"use client";

import { useState, useEffect, useCallback } from "react";
import { MOCK_ASSETS } from "@/lib/trading";

interface Holding {
  symbol: string;
  quantity: number;
  avgBuyPrice: number;
  currentPrice: number;
  currentValue: number;
  unrealizedPnl: number;
}

interface TradingPanelProps {
  username: string;
  onBack: () => void;
}

const LS_GUEST_PORTFOLIO = "aether-portfolio";
const GUEST_USERNAME = "Guest";

interface GuestPortfolio {
  balance: number;
  holdings: Record<string, { quantity: number; avgBuyPrice: number }>;
}

function getGuestPortfolio(): GuestPortfolio {
  try {
    const raw = localStorage.getItem(LS_GUEST_PORTFOLIO);
    if (raw) return JSON.parse(raw) as GuestPortfolio;
  } catch { /* ignore */ }
  return { balance: 0, holdings: {} };
}

function saveGuestPortfolio(gp: GuestPortfolio) {
  try { localStorage.setItem(LS_GUEST_PORTFOLIO, JSON.stringify(gp)); } catch { /* ignore */ }
}

export default function TradingPanel({ username, onBack }: TradingPanelProps) {
  const isGuest = username === GUEST_USERNAME || username === "";

  const [holdings, setHoldings]         = useState<Holding[]>([]);
  const [prices, setPrices]             = useState<Record<string, number>>({});
  const [availableCredits, setCredits]  = useState(0);
  const [totalValue, setTotalValue]     = useState(0);
  const [quantities, setQuantities]     = useState<Record<string, string>>({});
  const [loading, setLoading]           = useState(true);
  const [tradeMsg, setTradeMsg]         = useState<string>("");

  const fetchPortfolio = useCallback(async () => {
    try {
      if (isGuest) {
        // Fetch live prices from portfolio API (guest still uses server prices)
        const res = await fetch(`/api/portfolio?username=${GUEST_USERNAME}`);
        const data = await res.json();
        const livePrices: Record<string, number> = data.prices ?? {};
        setPrices(livePrices);

        const gp = getGuestPortfolio();
        setCredits(gp.balance);

        const guestHoldings: Holding[] = MOCK_ASSETS.map((a) => {
          const h = gp.holdings[a.symbol];
          const qty       = h?.quantity ?? 0;
          const avgBuy    = h?.avgBuyPrice ?? 0;
          const curPrice  = livePrices[a.symbol] ?? a.basePrice;
          const curValue  = curPrice * qty;
          return {
            symbol:       a.symbol,
            quantity:     qty,
            avgBuyPrice:  avgBuy,
            currentPrice: curPrice,
            currentValue: Math.round(curValue * 100) / 100,
            unrealizedPnl: Math.round((curValue - avgBuy * qty) * 100) / 100,
          };
        });
        setHoldings(guestHoldings);
        setTotalValue(guestHoldings.reduce((s, h) => s + h.currentValue, 0));
      } else {
        const res = await fetch(`/api/portfolio?username=${encodeURIComponent(username)}`);
        const data = await res.json();
        setHoldings(data.holdings ?? []);
        setPrices(data.prices ?? {});
        setCredits(data.availableCredits ?? 0);
        setTotalValue(data.totalValue ?? 0);
      }
    } catch { /* network error */ } finally {
      setLoading(false);
    }
  }, [username, isGuest]);

  useEffect(() => {
    fetchPortfolio();
    // Auto-refresh every 60s
    const interval = setInterval(fetchPortfolio, 60000);
    return () => clearInterval(interval);
  }, [fetchPortfolio]);

  const handleTrade = useCallback(async (symbol: string, type: "buy" | "sell") => {
    const qty = parseFloat(quantities[symbol] ?? "0");
    if (!qty || qty <= 0) {
      setTradeMsg("Please enter a valid quantity > 0.");
      return;
    }

    try {
      if (isGuest) {
        const price = prices[symbol] ?? MOCK_ASSETS.find(a => a.symbol === symbol)?.basePrice ?? 100;
        const total = Math.round(price * qty);
        const gp = getGuestPortfolio();

        if (type === "buy") {
          if (gp.balance < total) { setTradeMsg("Insufficient credits."); return; }
          gp.balance -= total;
          const existing = gp.holdings[symbol];
          if (existing) {
            const oldCost = existing.avgBuyPrice * existing.quantity;
            const newQty  = existing.quantity + qty;
            gp.holdings[symbol] = { quantity: newQty, avgBuyPrice: (oldCost + price * qty) / newQty };
          } else {
            gp.holdings[symbol] = { quantity: qty, avgBuyPrice: price };
          }
        } else {
          const existing = gp.holdings[symbol];
          if (!existing || existing.quantity < qty) { setTradeMsg("Insufficient holdings."); return; }
          gp.balance += total;
          gp.holdings[symbol] = { ...existing, quantity: existing.quantity - qty };
        }
        saveGuestPortfolio(gp);
        setTradeMsg(`${type === "buy" ? "Bought" : "Sold"} ${qty} ${symbol} for ${total} credits.`);
      } else {
        const res = await fetch("/api/trade", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, symbol, type, quantity: qty }),
        });
        const data = await res.json();
        if (!res.ok) { setTradeMsg(data.error ?? "Trade failed."); return; }
        setTradeMsg(`${type === "buy" ? "Bought" : "Sold"} ${qty} ${symbol}. Balance: ${data.newBalance} credits.`);
      }
      fetchPortfolio();
    } catch { setTradeMsg("Trade failed. Please try again."); }
  }, [username, isGuest, quantities, prices, fetchPortfolio]);

  const getHolding = (symbol: string) => holdings.find(h => h.symbol === symbol);

  return (
    <div className="space-y-4 fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <button
          onClick={onBack}
          className="text-xs px-3 py-1.5 rounded-lg transition-colors hover:opacity-80"
          style={{ background: "var(--surface2)", color: "var(--text-muted)", border: "1px solid var(--border)" }}
        >
          ← Back
        </button>
        <h2 className="text-base font-bold">📈 Trading</h2>
      </div>

      {/* Portfolio summary */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Available Credits", value: loading ? "…" : availableCredits.toLocaleString(), color: "var(--accent)" },
          { label: "Portfolio Value",   value: loading ? "…" : totalValue.toFixed(2),              color: "var(--accent2)" },
          { label: "Unrealized P&L",
            value: loading ? "…" : holdings.reduce((s, h) => s + h.unrealizedPnl, 0).toFixed(2),
            color: holdings.reduce((s, h) => s + h.unrealizedPnl, 0) >= 0 ? "var(--correct)" : "var(--error)" },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-xl p-3 text-center" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            <div className="text-lg font-bold" style={{ color }}>{value}</div>
            <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{label}</div>
          </div>
        ))}
      </div>

      {tradeMsg && (
        <div className="text-xs px-3 py-2 rounded-lg" style={{ background: "var(--surface2)", color: "var(--text-muted)" }}>
          {tradeMsg}
        </div>
      )}

      {/* Asset cards */}
      <div className="space-y-3">
        {MOCK_ASSETS.map((asset) => {
          const h = getHolding(asset.symbol);
          const curPrice = prices[asset.symbol] ?? asset.basePrice;
          return (
            <div
              key={asset.symbol}
              className="rounded-xl p-4"
              style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="font-bold text-sm">{asset.symbol}</div>
                  <div className="text-xs" style={{ color: "var(--text-muted)" }}>{asset.name}</div>
                  <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{asset.description}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-sm" style={{ color: "var(--accent2)" }}>{curPrice.toFixed(2)} cr</div>
                  {h && h.quantity > 0 && (
                    <div className="text-xs" style={{ color: "var(--text-muted)" }}>Held: {h.quantity.toFixed(4)}</div>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="0"
                  step="0.0001"
                  placeholder="Qty"
                  value={quantities[asset.symbol] ?? ""}
                  onChange={(e) => setQuantities((prev) => ({ ...prev, [asset.symbol]: e.target.value }))}
                  className="flex-1 px-3 py-1.5 rounded-lg text-xs focus:outline-none"
                  style={{ background: "var(--surface2)", border: "1px solid var(--border)", color: "var(--text)" }}
                />
                <button
                  onClick={() => handleTrade(asset.symbol, "buy")}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all hover:opacity-90"
                  style={{ background: "var(--accent)" }}
                >
                  Buy
                </button>
                <button
                  onClick={() => handleTrade(asset.symbol, "sell")}
                  disabled={!h || h.quantity <= 0}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ background: "var(--surface2)", color: "var(--text)", border: "1px solid var(--border)" }}
                >
                  Sell
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
