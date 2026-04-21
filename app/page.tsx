"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { ErrorBoundary } from "./components/ErrorBoundary";
import WalletPanel  from "./components/WalletPanel";
import TradingPanel from "./components/TradingPanel";
import ShopPanel    from "./components/ShopPanel";

/**
 * Aether Evo — Gamified Typing Test
 * Single-page UI: theme toggle, username input, mode selection,
 * typing test with early completion, results, leaderboard, prompt history.
 * Also includes Wallet, Trading, and Shop panels.
 */

// ─── Types ───────────────────────────────────────────────────────────────────

type Theme = "dark" | "light" | "blue" | "green" | "sunset";
type Difficulty = "easy" | "medium" | "hard";
type GameState = "setup" | "playing" | "finished";
type CompletionType = "timer" | "early" | null;
type ChallengeMode = "off" | "move" | "resize" | "both";
type ActivePanel = "typing" | "wallet" | "trading" | "shop";

interface TestResult {
  wpm: number;
  accuracy: number;
  errorCount: number;
  score: number;
  nextDifficulty: Difficulty;
}

interface LeaderboardEntry {
  id: string;
  username: string;
  wpm: number;
  accuracy: number;
  errorCount: number;
  score: number;
  difficulty: string;
  durationSec: number;
  createdAt: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const THEMES: { id: Theme; label: string; symbol: string }[] = [
  { id: "dark",   label: "Dark",    symbol: "◑" },
  { id: "light",  label: "Light",   symbol: "○" },
  { id: "blue",   label: "Blue",    symbol: "◈" },
  { id: "green",  label: "Green",   symbol: "◆" },
  { id: "sunset", label: "Sunset",  symbol: "◇" },
];

const DIFFICULTY_COLORS: Record<Difficulty, string> = {
  easy:   "text-emerald-400",
  medium: "text-amber-400",
  hard:   "text-rose-400",
};

const LS_THEME   = "aether-theme";
const LS_HISTORY = "aether-prompt-history";
const LS_SOUND   = "aether-sound";
const LS_GUEST_WALLET = "aether-wallet";
const GUEST_USERNAME  = "Guest";

// Challenge mode animation parameters
const CHALLENGE_ANIM = {
  xAmp1: 120, xFreq1: 0.7,
  xAmp2: 40,  xFreq2: 0.4,
  yAmp1: 80,  yFreq1: 0.5,
  yAmp2: 30,  yFreq2: 0.9,
  fontFreq: 1.2, fontMin: 14, fontRange: 6, // oscillates fontMin to fontMin+fontRange
  defaultFontSize: 16,
} as const;

// ─── Component ────────────────────────────────────────────────────────────────

export default function Home() {
  // Setup state
  const [username,       setUsername]       = useState("");
  const [duration,       setDuration]       = useState<30 | 60>(30);
  const [difficulty,     setDifficulty]     = useState<Difficulty>("easy");
  const [gameState,      setGameState]      = useState<GameState>("setup");
  const [theme,          setTheme]          = useState<Theme>("dark");
  const [soundEnabled,   setSoundEnabled]   = useState(false);
  const [challengeMode,  setChallengeMode]  = useState<ChallengeMode>("off");
  const [activePanel,    setActivePanel]    = useState<ActivePanel>("typing");

  // Game state
  const [prompt,         setPrompt]         = useState("");
  const [typedText,      setTypedText]       = useState("");
  const [timeLeft,       setTimeLeft]        = useState(0);
  const [wpm,            setWpm]             = useState(0);
  // accuracy: 0–100 (percentage). Note: result.accuracy from /api/submit is 0–1 — multiply by 100 before displaying.
  const [accuracy,       setAccuracy]        = useState(100);
  const [errorCount,     setErrorCount]      = useState(0);
  const [completionType, setCompletionType]  = useState<CompletionType>(null);

  // Results state
  const [result,        setResult]        = useState<TestResult | null>(null);
  const [leaderboard,   setLeaderboard]   = useState<LeaderboardEntry[]>([]);
  const [isSubmitting,  setIsSubmitting]  = useState(false);
  const [isStarting,    setIsStarting]    = useState(false);
  const [creditsEarned, setCreditsEarned] = useState<number | null>(null);

  // History state
  const [promptHistory, setPromptHistory] = useState<string[]>([]);
  const [showHistory,   setShowHistory]   = useState(false);

  // Refs for stable access inside async callbacks
  const inputRef         = useRef<HTMLTextAreaElement>(null);
  const timerRef         = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef     = useRef<number>(0);
  const typedTextRef     = useRef<string>("");
  const submittedRef     = useRef<boolean>(false); // guard against double-submit

  // Forward-only typing: tracks max characters ever typed so backspace can't erase
  const lockedLengthRef  = useRef<number>(0);

  // Challenge mode animation
  const challengeAnimRef = useRef<number | null>(null);
  const [challengeOffset, setChallengeOffset] = useState({ x: 0, y: 0, fontSize: 16 });

  // ── Load persisted preferences on mount ──────────────────────────────────
  useEffect(() => {
    try {
      const t = localStorage.getItem(LS_THEME) as Theme | null;
      if (t && THEMES.find((x) => x.id === t)) setTheme(t);
      const h = localStorage.getItem(LS_HISTORY);
      if (h) {
        try {
          const parsed = JSON.parse(h);
          if (Array.isArray(parsed)) setPromptHistory(parsed);
        } catch {
          // corrupted storage — ignore and start fresh
          localStorage.removeItem(LS_HISTORY);
        }
      }
      const s = localStorage.getItem(LS_SOUND);
      if (s !== null) setSoundEnabled(s === "true");
    } catch { /* ignore */ }
  }, []);

  // ── Apply theme attribute to <html> ──────────────────────────────────────
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    try { localStorage.setItem(LS_THEME, theme); } catch { /* ignore */ }
  }, [theme]);

  // ── Persist sound preference ──────────────────────────────────────────────
  const toggleSound = useCallback(() => {
    setSoundEnabled((prev) => {
      const next = !prev;
      try { localStorage.setItem(LS_SOUND, String(next)); } catch { /* ignore */ }
      return next;
    });
  }, []);

  // ── History helpers ───────────────────────────────────────────────────────
  const addToHistory = useCallback((text: string) => {
    setPromptHistory((prev) => {
      const updated = [text, ...prev.filter((p) => p !== text)].slice(0, 10);
      try { localStorage.setItem(LS_HISTORY, JSON.stringify(updated)); } catch { /* ignore */ }
      return updated;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setPromptHistory([]);
    try { localStorage.removeItem(LS_HISTORY); } catch { /* ignore */ }
  }, []);

  // ── Sound: short completion beep ─────────────────────────────────────────
  const playCompletionSound = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const ctx = new AudioContext();
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(880,  ctx.currentTime);
      osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.5);
      osc.onended = () => ctx.close();
    } catch { /* Web Audio not available */ }
  }, [soundEnabled]);

  // ── Fetch prompt, retrying to avoid recent history (up to 4 attempts) ────
  const fetchPrompt = useCallback(
    async (diff: Difficulty, recentHistory: string[]): Promise<string> => {
      let selected = "";
      for (let i = 0; i < 4; i++) {
        try {
          const res = await fetch(`/api/prompt?difficulty=${diff}`);
          if (!res.ok) throw new Error(`API error: ${res.status}`);
          const data = await res.json();
          selected =
            typeof data.prompt === "string" && data.prompt.length > 0
              ? data.prompt
              : "The quick brown fox jumps over the lazy dog.";
        } catch {
          return "The quick brown fox jumps over the lazy dog.";
        }
        // Accept the prompt if it's not in the last 5 completed prompts
        if (!recentHistory.slice(0, 5).includes(selected)) break;
      }
      return selected;
    },
    []
  );

  // ── Fetch leaderboard ─────────────────────────────────────────────────────
  const fetchLeaderboard = useCallback(async () => {
    try {
      const res = await fetch("/api/leaderboard");
      if (!res.ok) throw new Error(`Leaderboard fetch failed: ${res.status}`);
      const data = await res.json();
      setLeaderboard(data.leaderboard || []);
    } catch {
      setLeaderboard([]);
    }
  }, []);

  // ── Live stats (while typing) ─────────────────────────────────────────────
  const updateLiveStats = useCallback(
    (typed: string) => {
      if (!prompt || typed.length === 0) {
        setWpm(0);
        setAccuracy(100);
        setErrorCount(0);
        return;
      }

      let correct = 0;
      let errors  = 0;
      const minLen = Math.min(prompt.length, typed.length);
      for (let i = 0; i < minLen; i++) {
        if (prompt[i] === typed[i]) correct++;
        else errors++;
      }

      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      const minutes = elapsed / 60;
      const currentWpm      = minutes > 0 ? Math.round((correct / 5) / minutes) : 0;
      const currentAccuracy = typed.length > 0 ? Math.round((correct / typed.length) * 100) : 100;

      setWpm(currentWpm);
      setAccuracy(currentAccuracy);
      setErrorCount(errors);
    },
    [prompt]
  );

  // ── Submit results ────────────────────────────────────────────────────────
  const submitResults = useCallback(
    async (actualDuration?: number, kind: CompletionType = "timer") => {
      // Guard: submittedRef prevents double-submission (avoids stale isSubmitting closure)
      if (submittedRef.current) return;
      submittedRef.current = true;

      setIsSubmitting(true);
      setCompletionType(kind);
      setGameState("finished");

      const effectiveDuration = actualDuration ?? duration;
      // Use the ref to get the very latest typed text (avoids stale closure)
      const currentTyped = typedTextRef.current || " ";

      let sessionId: string | undefined;

      try {
        const res = await fetch("/api/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username:    username || GUEST_USERNAME,
            prompt,
            typedText:   currentTyped,
            durationSec: effectiveDuration,
            difficulty,
          }),
        });
        const data = await res.json();
        if (res.ok) {
          setResult(data);
          setDifficulty(data.nextDifficulty);
          if (kind === "early") playCompletionSound();
          sessionId = data.id;

          // Award credits via wallet API (skip for guest — handled client-side)
          const effectiveUsername = (username || GUEST_USERNAME).trim();
          if (effectiveUsername !== GUEST_USERNAME) {
            try {
              // Determine leaderboard rank after fetching updated leaderboard
              const lbRes = await fetch("/api/leaderboard");
              const lbData = await lbRes.json();
              const lb: LeaderboardEntry[] = lbData.leaderboard ?? [];
              const rank = lb.findIndex((e) => e.id === sessionId) + 1 || null;

              const awardRes = await fetch("/api/wallet/award", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  username:       effectiveUsername,
                  wpm:            data.wpm,
                  accuracy:       data.accuracy,
                  score:          data.score,
                  rank:           rank || null,
                  challengeMode:  challengeMode,
                  sessionId,
                }),
              });
              const awardData = await awardRes.json();
              if (awardRes.ok) setCreditsEarned(awardData.credits);
            } catch { /* award is best-effort */ }
          } else {
            // Guest: award credits via localStorage
            try {
              interface GuestWallet { balance: number; transactions: Array<{ amount: number; reason: string; date: string }> }
              const raw = localStorage.getItem(LS_GUEST_WALLET);
              const gw: GuestWallet = raw ? JSON.parse(raw) : { balance: 0, transactions: [] };
              // Simple guest reward: max(1, round(score * 0.1))
              const guestCredits = Math.max(1, Math.round(data.score * 0.1));
              gw.balance += guestCredits;
              gw.transactions.unshift({ amount: guestCredits, reason: "Typing test reward", date: new Date().toISOString() });
              localStorage.setItem(LS_GUEST_WALLET, JSON.stringify(gw));
              setCreditsEarned(guestCredits);
            } catch { /* ignore */ }
          }
        }
      } catch (err) {
        console.error("Failed to submit results:", err);
      } finally {
        setIsSubmitting(false);
        // Reset locked length after test ends
        lockedLengthRef.current = 0;
      }

      fetchLeaderboard();
    },
    [username, prompt, duration, difficulty, challengeMode, fetchLeaderboard, playCompletionSound]
  );

  // ── Add completed prompt to history when game ends ────────────────────────
  useEffect(() => {
    if (gameState === "finished" && prompt) {
      addToHistory(prompt);
    }
  }, [gameState, prompt, addToHistory]);

  // ── Handle timer reaching zero ────────────────────────────────────────────
  useEffect(() => {
    if (gameState === "playing" && timeLeft === 0) {
      if (timerRef.current) clearInterval(timerRef.current);
      submitResults(duration, "timer");
    }
  }, [timeLeft, gameState, submitResults, duration]);

  // ── Cleanup timer on unmount ──────────────────────────────────────────────
  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  // ── Load leaderboard on mount ─────────────────────────────────────────────
  useEffect(() => { fetchLeaderboard(); }, [fetchLeaderboard]);

  // ── Challenge mode animation loop ─────────────────────────────────────────
  useEffect(() => {
    if (gameState !== "playing" || challengeMode === "off") {
      if (challengeAnimRef.current !== null) cancelAnimationFrame(challengeAnimRef.current);
      challengeAnimRef.current = null;
      setChallengeOffset({ x: 0, y: 0, fontSize: 16 });
      return;
    }

    let startTs: number | null = null;
    const animate = (ts: number) => {
      if (!startTs) startTs = ts;
      const t = (ts - startTs) / 1000; // seconds

      const x = challengeMode === "move" || challengeMode === "both"
        ? Math.sin(t * CHALLENGE_ANIM.xFreq1) * CHALLENGE_ANIM.xAmp1 + Math.cos(t * CHALLENGE_ANIM.xFreq2) * CHALLENGE_ANIM.xAmp2
        : 0;
      const y = challengeMode === "move" || challengeMode === "both"
        ? Math.cos(t * CHALLENGE_ANIM.yFreq1) * CHALLENGE_ANIM.yAmp1 + Math.sin(t * CHALLENGE_ANIM.yFreq2) * CHALLENGE_ANIM.yAmp2
        : 0;
      const fontSize = challengeMode === "resize" || challengeMode === "both"
        ? CHALLENGE_ANIM.fontMin + (Math.sin(t * CHALLENGE_ANIM.fontFreq) + 1) * (CHALLENGE_ANIM.fontRange / 2)
        : CHALLENGE_ANIM.defaultFontSize;

      setChallengeOffset({ x, y, fontSize });
      challengeAnimRef.current = requestAnimationFrame(animate);
    };

    challengeAnimRef.current = requestAnimationFrame(animate);
    return () => { if (challengeAnimRef.current !== null) cancelAnimationFrame(challengeAnimRef.current); };
  }, [gameState, challengeMode]);

  // ── Start test ────────────────────────────────────────────────────────────
  const startTest = useCallback(async () => {
    // Guard against rapid double-clicks while the prompt is being fetched
    if (isStarting) return;
    setIsStarting(true);
    // Clear any stale timer from a previous test
    if (timerRef.current) clearInterval(timerRef.current);

    try {
      const name = username.trim() || "Guest";
      setUsername(name);

      const newPrompt = await fetchPrompt(difficulty, promptHistory);
      setPrompt(newPrompt);
      setTypedText("");
      typedTextRef.current = "";
      submittedRef.current = false;
      lockedLengthRef.current = 0;
      setCreditsEarned(null);
      setTimeLeft(duration);
      setWpm(0);
      setAccuracy(100);
      setErrorCount(0);
      setResult(null);
      setCompletionType(null);
      setGameState("playing");
      startTimeRef.current = Date.now();

      setTimeout(() => inputRef.current?.focus(), 100);

      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) { clearInterval(timer); return 0; }
          return prev - 1;
        });
      }, 1000);
      timerRef.current = timer;
    } finally {
      setIsStarting(false);
    }
  }, [isStarting, username, difficulty, promptHistory, duration, fetchPrompt]);

  // ── Handle typing input (forward-only) ───────────────────────────────────
  const handleTyping = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (gameState !== "playing") return;
    const value = e.target.value;

    // Prevent typing beyond the prompt length
    if (value.length > prompt.length) return;

    // Forward-only: if the new value is shorter than the locked max, restore it
    if (value.length < lockedLengthRef.current) {
      e.target.value = typedTextRef.current;
      return;
    }

    // Update the locked length to the new maximum
    lockedLengthRef.current = Math.max(lockedLengthRef.current, value.length);

    typedTextRef.current = value;
    setTypedText(value);
    updateLiveStats(value);

    // ── Early completion: full prompt typed correctly ──────────────────────
    if (value === prompt) {
      if (timerRef.current) clearInterval(timerRef.current);
      const elapsed = Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000));
      submitResults(elapsed, "early");
    }
  };

  // ── Block keys that allow cursor movement or text deletion ────────────────
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (gameState !== "playing") return;
    const blocked = [
      "Backspace", "Delete",
      "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown",
      "Home", "End",
    ];
    if (blocked.includes(e.key)) { e.preventDefault(); return; }
    // Block Ctrl/Meta shortcuts that reposition or modify text
    if (e.ctrlKey || e.metaKey) {
      const blockedShortcuts = ["a", "z", "x", "ArrowLeft", "ArrowRight", "Home", "End"];
      if (blockedShortcuts.includes(e.key.toLowerCase())) { e.preventDefault(); }
    }
  };

  // ── Prevent mouse-based cursor repositioning ──────────────────────────────
  const handleMouseDown = (e: React.MouseEvent<HTMLTextAreaElement>) => {
    if (gameState !== "playing") return;
    e.preventDefault();
    const el = inputRef.current;
    if (el) {
      el.focus();
      const end = el.value.length;
      el.setSelectionRange(end, end);
    }
  };

  // ── Prevent text selection during active test ─────────────────────────────
  const handleSelect = () => {
    if (gameState !== "playing") return;
    const el = inputRef.current;
    if (el) {
      const end = el.value.length;
      el.setSelectionRange(end, end);
    }
  };

  // ── Render prompt with per-character coloring + cursor highlight ──────────
  const renderPrompt = () => {
    if (!prompt) return null;
    return prompt.split("").map((char, i) => {
      let cls = "opacity-40"; // not yet typed
      if (i < typedText.length) {
        cls = typedText[i] === char
          ? "text-[var(--correct)]"                              // correct
          : "text-[var(--error)] underline decoration-[var(--error)]"; // wrong
      } else if (i === typedText.length) {
        cls = "rounded-sm"; // current character — styled via span style
      }
      const isCursor = i === typedText.length;
      return (
        <span
          key={`${char}-${i}`}
          className={cls}
          style={isCursor ? { backgroundColor: "var(--cursor-bg)", borderRadius: "2px" } : undefined}
        >
          {char}
        </span>
      );
    });
  };

  // ── Progress percentage ───────────────────────────────────────────────────
  const progress = prompt.length > 0 ? Math.round((typedText.length / prompt.length) * 100) : 0;

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <ErrorBoundary>
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] font-[family-name:var(--font-geist-sans)]">
      <div className="max-w-3xl mx-auto px-4 py-8">

        {/* ── Top bar: header + theme/sound controls ── */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold" style={{ background: "var(--accent-gradient)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Aether Evo
            </h1>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>Gamified Typing Test</p>
          </div>

          {/* Theme toggles + sound */}
          <div className="flex items-center gap-2">
            {/* Sound toggle */}
            <button
              onClick={toggleSound}
              title={soundEnabled ? "Sound on" : "Sound off"}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-sm border transition-colors hover:opacity-80"
              style={{
                background: "var(--surface2)",
                borderColor: "var(--border)",
                color: soundEnabled ? "var(--accent)" : "var(--text-muted)",
              }}
            >
              {soundEnabled ? "♪" : "♩"}
            </button>

            {/* Theme buttons */}
            <div className="flex gap-1 p-1 rounded-xl" style={{ background: "var(--surface2)", border: "1px solid var(--border)" }}>
              {THEMES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTheme(t.id)}
                  title={t.label}
                  className="w-7 h-7 rounded-lg text-xs font-bold transition-all"
                  style={{
                    background: theme === t.id ? "var(--accent)" : "transparent",
                    color:      theme === t.id ? "#fff" : "var(--text-muted)",
                  }}
                >
                  {t.symbol}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Nav tabs ── */}
        <div
          className="flex gap-1 mb-6 p-1 rounded-xl"
          style={{ background: "var(--surface2)", border: "1px solid var(--border)" }}
        >
          {([
            { id: "typing",  label: "⌨ Typing"   },
            { id: "wallet",  label: "💰 Wallet"   },
            { id: "trading", label: "📈 Trading"  },
            { id: "shop",    label: "🛍 Shop"     },
          ] as { id: ActivePanel; label: string }[]).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActivePanel(tab.id)}
              className="flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all"
              style={{
                background: activePanel === tab.id ? "var(--accent)" : "transparent",
                color:      activePanel === tab.id ? "#fff" : "var(--text-muted)",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Wallet / Trading / Shop panels ── */}
        {activePanel === "wallet" && (
          <WalletPanel
            username={username || "Guest"}
            onBack={() => setActivePanel("typing")}
            creditGain={creditsEarned ?? undefined}
          />
        )}
        {activePanel === "trading" && (
          <TradingPanel
            username={username || "Guest"}
            onBack={() => setActivePanel("typing")}
          />
        )}
        {activePanel === "shop" && (
          <ShopPanel
            username={username || "Guest"}
            onBack={() => setActivePanel("typing")}
          />
        )}

        {/* ── Typing panel ── */}
        {activePanel === "typing" && (<>

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* Setup screen                                                      */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        {gameState === "setup" && (
          <div className="space-y-5 fade-in">
            {/* Username */}
            <div>
              <label htmlFor="username" className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>
                Username <span className="opacity-50">(leave blank for Guest)</span>
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !isStarting) { e.preventDefault(); startTest(); } }}
                placeholder="Guest"
                maxLength={50}
                className="w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none transition-colors"
                style={{
                  background:  "var(--surface)",
                  border:      "1px solid var(--border)",
                  color:       "var(--text)",
                }}
              />
            </div>

            {/* Duration */}
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>Duration</label>
              <div className="flex gap-2">
                {([30, 60] as const).map((d) => (
                  <button
                    key={d}
                    onClick={() => setDuration(d)}
                    className="px-6 py-2 rounded-xl text-sm font-semibold transition-all"
                    style={{
                      background:  duration === d ? "var(--accent)"  : "var(--surface)",
                      color:       duration === d ? "#fff"            : "var(--text-muted)",
                      border:      duration === d ? "1px solid transparent" : "1px solid var(--border)",
                    }}
                  >
                    {d}s
                  </button>
                ))}
              </div>
            </div>

            {/* Difficulty */}
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>Difficulty</label>
              <div className="flex gap-2">
                {(["easy", "medium", "hard"] as Difficulty[]).map((d) => (
                  <button
                    key={d}
                    onClick={() => setDifficulty(d)}
                    className="px-6 py-2 rounded-xl text-sm font-semibold capitalize transition-all"
                    style={{
                      background:  difficulty === d ? "var(--accent2)" : "var(--surface)",
                      color:       difficulty === d ? "#fff"            : "var(--text-muted)",
                      border:      difficulty === d ? "1px solid transparent" : "1px solid var(--border)",
                    }}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {/* Challenge Mode */}
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>
                Challenge Mode
              </label>
              <div className="flex gap-2 flex-wrap">
                {(["off", "move", "resize", "both"] as ChallengeMode[]).map((m) => (
                  <button
                    key={m}
                    onClick={() => setChallengeMode(m)}
                    className="px-4 py-2 rounded-xl text-sm font-semibold capitalize transition-all"
                    style={{
                      background: challengeMode === m ? "var(--accent2)" : "var(--surface)",
                      color:      challengeMode === m ? "#fff"            : "var(--text-muted)",
                      border:     challengeMode === m ? "1px solid transparent" : "1px solid var(--border)",
                    }}
                  >
                    {m === "off" ? "Off" : m === "move" ? "🌀 Move" : m === "resize" ? "🔠 Resize" : "⚡ Both"}
                  </button>
                ))}
              </div>
              {challengeMode !== "off" && (
                <p className="text-xs mt-1.5 px-1" style={{ color: "var(--error)" }}>
                  ⚠️ Challenge mode may cause visual discomfort. It earns bonus credits.
                </p>
              )}
            </div>

            {/* Completed count */}
            {promptHistory.length > 0 && (
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                ✓ {promptHistory.length} prompt{promptHistory.length !== 1 ? "s" : ""} completed this session
              </p>
            )}

            {/* Start button */}
            <button
              onClick={startTest}
              disabled={isStarting}
              className="w-full py-3 rounded-xl font-bold text-base text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ background: "var(--accent-gradient)", boxShadow: "var(--shadow)" }}
            >
              {isStarting ? "Loading…" : "Start Typing Test"}
            </button>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* Playing screen                                                    */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        {gameState === "playing" && (
          <div className="space-y-4 fade-in">
            {/* Stats bar */}
            <div className="grid grid-cols-4 gap-3">
              {[
                { value: `${timeLeft}s`, label: "Time",     color: "var(--accent)"  },
                { value: wpm,            label: "WPM",      color: "var(--accent2)" },
                { value: `${accuracy}%`, label: "Accuracy", color: "var(--correct)" },
                { value: errorCount,     label: "Errors",   color: "var(--error)"   },
              ].map(({ value, label, color }) => (
                <div
                  key={label}
                  className="rounded-xl p-3 text-center"
                  style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
                >
                  <div className="text-xl font-bold" style={{ color }}>{value}</div>
                  <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{label}</div>
                </div>
              ))}
            </div>

            {/* Progress bar */}
            <div className="h-1 rounded-full overflow-hidden" style={{ background: "var(--surface2)" }}>
              <div
                className="h-full rounded-full transition-all duration-200"
                style={{ width: `${progress}%`, background: "var(--accent-gradient)" }}
              />
            </div>

            {/* Prompt display — wrapped for challenge mode transform */}
            <div
              style={challengeMode !== "off" ? {
                transform: `translate(${challengeOffset.x}px, ${challengeOffset.y}px)`,
                transition: "transform 0.05s linear",
                willChange: "transform",
              } : undefined}
            >
              <div
                className="rounded-xl p-5 font-[family-name:var(--font-geist-mono)] leading-loose select-none"
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  minHeight: "6rem",
                  fontSize: challengeMode !== "off" ? `${challengeOffset.fontSize}px` : "1rem",
                }}
              >
                {renderPrompt()}
              </div>
            </div>

            {/* Typing input */}
            <textarea
              ref={inputRef}
              value={typedText}
              onChange={handleTyping}
              onKeyDown={handleKeyDown}
              onMouseDown={handleMouseDown}
              onSelect={handleSelect}
              disabled={gameState !== "playing"}
              placeholder="Start typing here…"
              className="w-full h-28 px-4 py-3 rounded-xl font-[family-name:var(--font-geist-mono)] text-sm resize-none focus:outline-none transition-colors"
              style={{
                background:  "var(--surface)",
                border:      "1px solid var(--border)",
                color:       "var(--text)",
              }}
              autoFocus
              spellCheck={false}
              autoComplete="off"
              autoCapitalize="off"
            />
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* Results screen                                                    */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        {gameState === "finished" && (
          <div className="space-y-4">
            {isSubmitting ? (
              <div className="text-center py-12 fade-in" style={{ color: "var(--text-muted)" }}>
                <div className="text-4xl mb-3 animate-spin inline-block">⌛</div>
                <div className="text-sm">Calculating results…</div>
              </div>
            ) : result ? (
              <div className={completionType === "early" ? "celebrate-pop" : "fade-in"}>
                {/* Result card */}
                <div
                  className="rounded-2xl p-6 mb-4"
                  style={{ background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "var(--shadow)" }}
                >
                  {/* Header */}
                  <div className="text-center mb-6">
                    {completionType === "early" ? (
                      <>
                        <div className="text-5xl mb-2">🎉</div>
                        <h2 className="text-xl font-bold">Prompt Completed Early!</h2>
                        <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                          You finished before the timer ran out
                        </p>
                      </>
                    ) : (
                      <>
                        <div className="text-4xl mb-2">⏱</div>
                        <h2 className="text-xl font-bold">Time&#39;s Up!</h2>
                      </>
                    )}
                    {/* Credits earned badge */}
                    {creditsEarned !== null && (
                      <div
                        className="inline-flex items-center gap-1 mt-3 px-4 py-1.5 rounded-full text-sm font-bold animate-bounce"
                        style={{ background: "var(--accent)", color: "#fff" }}
                      >
                        +{creditsEarned} credits earned!
                      </div>
                    )}
                  </div>

                  {/* Stats grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                    {[
                      { value: Math.round(result.wpm),                       label: "WPM",      color: "var(--accent2)" },
                      // result.accuracy is 0–1 from API; multiply by 100 for display
                      { value: `${(result.accuracy * 100).toFixed(1)}%`,     label: "Accuracy", color: "var(--correct)" },
                      { value: result.errorCount,                            label: "Errors",   color: "var(--error)"   },
                      { value: result.score,                                 label: "Score",    color: "var(--accent)"  },
                    ].map(({ value, label, color }) => (
                      <div
                        key={label}
                        className="rounded-xl p-3 text-center"
                        style={{ background: "var(--surface2)" }}
                      >
                        <div className="text-2xl font-bold" style={{ color }}>{value}</div>
                        <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Extra info row */}
                  <div className="flex flex-wrap justify-center gap-3 text-xs" style={{ color: "var(--text-muted)" }}>
                    <span>
                      Difficulty:{" "}
                      <span className={`font-semibold capitalize ${DIFFICULTY_COLORS[difficulty]}`}>
                        {difficulty}
                      </span>
                    </span>
                    <span>·</span>
                    <span>
                      Mode:{" "}
                      <span className="font-semibold" style={{ color: "var(--text)" }}>
                        {completionType === "early" ? "Early completion" : `${duration}s timer`}
                      </span>
                    </span>
                    <span>·</span>
                    <span>
                      Next difficulty:{" "}
                      <span className={`font-semibold capitalize ${DIFFICULTY_COLORS[result.nextDifficulty]}`}>
                        {result.nextDifficulty}
                      </span>
                    </span>
                  </div>
                </div>

                {/* Try again */}
                <button
                  onClick={() => setGameState("setup")}
                  className="w-full py-3 rounded-xl font-bold text-base text-white transition-all hover:opacity-90 active:scale-[0.98]"
                  style={{ background: "var(--accent-gradient)", boxShadow: "var(--shadow)" }}
                >
                  Try Again
                </button>
              </div>
            ) : (
              <div className="text-center py-10 fade-in">
                <div className="text-3xl mb-3">⚠️</div>
                <div className="text-sm mb-4" style={{ color: "var(--error)" }}>Failed to submit results.</div>
                <button
                  onClick={() => setGameState("setup")}
                  className="px-6 py-2 rounded-xl text-sm font-medium transition-colors hover:opacity-80"
                  style={{ background: "var(--surface2)", color: "var(--text)" }}
                >
                  Go Back
                </button>
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* Leaderboard                                                       */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        <div className="mt-10">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold">🏆 Leaderboard</h2>
            <button
              onClick={fetchLeaderboard}
              className="text-xs px-3 py-1 rounded-lg transition-colors hover:opacity-80"
              style={{ background: "var(--surface2)", color: "var(--text-muted)", border: "1px solid var(--border)" }}
            >
              Refresh
            </button>
          </div>

          {leaderboard.length > 0 ? (
            <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)", boxShadow: "var(--shadow)" }}>
              <table className="w-full text-xs">
                <thead>
                  <tr style={{ background: "var(--surface2)", color: "var(--text-muted)" }}>
                    {["#", "User", "WPM", "Accuracy", "Score", "Difficulty"].map((h, i) => (
                      <th key={h} className={`px-4 py-2.5 font-semibold ${i > 1 ? "text-right" : "text-left"}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((entry, i) => (
                    <tr
                      key={entry.id}
                      className="transition-colors"
                      style={{
                        borderTop: "1px solid var(--border)",
                        background: "var(--surface)",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface2)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "var(--surface)")}
                    >
                      <td className="px-4 py-2.5" style={{ color: "var(--text-muted)" }}>{i + 1}</td>
                      <td className="px-4 py-2.5 font-medium">{entry.username}</td>
                      <td className="px-4 py-2.5 text-right font-bold" style={{ color: "var(--accent2)" }}>{Math.round(entry.wpm)}</td>
                      <td className="px-4 py-2.5 text-right" style={{ color: "var(--correct)" }}>{(entry.accuracy * 100).toFixed(1)}%</td>
                      <td className="px-4 py-2.5 text-right font-bold" style={{ color: "var(--accent)" }}>{entry.score}</td>
                      <td className="px-4 py-2.5 text-right capitalize" style={{ color: "var(--text-muted)" }}>{entry.difficulty}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div
              className="rounded-xl p-10 text-center"
              style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
            >
              <div className="text-4xl mb-2 opacity-30">🏆</div>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>No scores yet — be the first!</p>
            </div>
          )}
        </div>

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* Prompt History                                                    */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        <div className="mt-6">
          <button
            onClick={() => setShowHistory((v) => !v)}
            className="flex items-center gap-2 text-xs font-medium mb-2 transition-colors hover:opacity-80"
            style={{ color: "var(--text-muted)" }}
          >
            <span>{showHistory ? "▾" : "▸"}</span>
            <span>📋 Recent Prompts ({promptHistory.length})</span>
          </button>

          {showHistory && (
            <div className="space-y-2 fade-in">
              {promptHistory.length === 0 ? (
                <div
                  className="rounded-xl p-6 text-center"
                  style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
                >
                  <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                    No prompts completed yet. Finish a test to start tracking history.
                  </p>
                </div>
              ) : (
                <>
                  {promptHistory.map((p, i) => (
                    <div
                      key={p}
                      className="rounded-xl px-4 py-3 text-xs leading-relaxed font-[family-name:var(--font-geist-mono)]"
                      style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text-muted)" }}
                    >
                      <span className="mr-2 opacity-50">#{i + 1}</span>
                      {p.length > 100 ? `${p.slice(0, 100)}…` : p}
                    </div>
                  ))}
                  <button
                    onClick={clearHistory}
                    className="text-xs transition-colors hover:opacity-80"
                    style={{ color: "var(--error)" }}
                  >
                    Clear history
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="mt-10 text-center text-xs" style={{ color: "var(--text-muted)" }}>
          Aether Evo &copy; {new Date().getFullYear()} — Built with Next.js + Prisma
        </footer>

        {/* End typing panel */}
        </>)}

      </div>
    </div>
    </ErrorBoundary>
  );
}
