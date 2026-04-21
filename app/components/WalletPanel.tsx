"use client";

import { useState, useEffect, useCallback } from "react";

interface Transaction {
  id: string;
  amount: number;
  reason: string;
  createdAt: string;
}

interface WalletPanelProps {
  username: string;
  onBack: () => void;
  creditGain?: number; // animated credit gain badge from parent
}

const LS_GUEST_WALLET = "aether-wallet";

interface GuestWallet {
  balance: number;
  transactions: Array<{ amount: number; reason: string; date: string }>;
}

function getGuestWallet(): GuestWallet {
  try {
    const raw = localStorage.getItem(LS_GUEST_WALLET);
    if (raw) return JSON.parse(raw) as GuestWallet;
  } catch { /* ignore */ }
  return { balance: 0, transactions: [] };
}

export default function WalletPanel({ username, onBack, creditGain }: WalletPanelProps) {
  const isGuest = username === "Guest" || username === "";
  const [balance, setBalance]           = useState<number>(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading]           = useState(true);
  const [showGain, setShowGain]         = useState(false);

  const fetchWallet = useCallback(async () => {
    setLoading(true);
    try {
      if (isGuest) {
        const gw = getGuestWallet();
        setBalance(gw.balance);
        setTransactions(
          gw.transactions.map((t, i) => ({
            id: String(i),
            amount: t.amount,
            reason: t.reason,
            createdAt: t.date,
          }))
        );
      } else {
        const res = await fetch(`/api/wallet?username=${encodeURIComponent(username)}`);
        const data = await res.json();
        setBalance(data.balance ?? 0);
        setTransactions(data.transactions ?? []);
      }
    } catch {
      // network error — show stale data
    } finally {
      setLoading(false);
    }
  }, [username, isGuest]);

  useEffect(() => { fetchWallet(); }, [fetchWallet]);

  // Animate credit gain badge when prop changes
  useEffect(() => {
    if (creditGain && creditGain > 0) {
      setShowGain(true);
      const timer = setTimeout(() => setShowGain(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [creditGain]);

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
        <h2 className="text-base font-bold">💰 Wallet</h2>
      </div>

      {/* Balance card */}
      <div
        className="rounded-2xl p-6 text-center relative overflow-hidden"
        style={{ background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "var(--shadow)" }}
      >
        <div className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>
          {isGuest ? "Guest Balance" : `${username}'s Balance`}
        </div>
        <div className="text-4xl font-bold" style={{ color: "var(--accent)" }}>
          {loading ? "…" : balance.toLocaleString()}
        </div>
        <div className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>credits</div>

        {/* Animated gain badge */}
        {showGain && creditGain && (
          <div
            className="absolute top-4 right-4 text-sm font-bold px-3 py-1 rounded-full animate-bounce"
            style={{ background: "var(--accent)", color: "#fff" }}
          >
            +{creditGain}
          </div>
        )}
      </div>

      {/* Transactions */}
      <div>
        <h3 className="text-xs font-semibold mb-2" style={{ color: "var(--text-muted)" }}>
          Recent Transactions
        </h3>
        {loading ? (
          <div className="text-center py-6 text-xs" style={{ color: "var(--text-muted)" }}>Loading…</div>
        ) : transactions.length === 0 ? (
          <div
            className="rounded-xl p-6 text-center"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
          >
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>No transactions yet. Complete a typing test to earn credits!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {transactions.map((t) => (
              <div
                key={t.id}
                className="rounded-xl px-4 py-3 flex items-center justify-between"
                style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
              >
                <div>
                  <div className="text-xs font-medium">{t.reason}</div>
                  <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                    {new Date(t.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div
                  className="text-sm font-bold"
                  style={{ color: t.amount >= 0 ? "var(--correct)" : "var(--error)" }}
                >
                  {t.amount >= 0 ? "+" : ""}{t.amount}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
