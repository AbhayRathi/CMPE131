"use client";

import { useState, useEffect, useRef, useCallback } from "react";

/**
 * Aether Evo — Gamified Typing Test
 * Single-page UI: username input, mode selection, typing test, results, leaderboard
 */

type Difficulty = "easy" | "medium" | "hard";
type GameState = "setup" | "playing" | "finished";

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

export default function Home() {
  // --- Setup state ---
  const [username, setUsername] = useState("");
  const [duration, setDuration] = useState<30 | 60>(30);
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [gameState, setGameState] = useState<GameState>("setup");

  // --- Game state ---
  const [prompt, setPrompt] = useState("");
  const [typedText, setTypedText] = useState("");
  const [timeLeft, setTimeLeft] = useState(0);
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [errorCount, setErrorCount] = useState(0);

  // --- Results state ---
  const [result, setResult] = useState<TestResult | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- Refs ---
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  /** Fetch a prompt from the API */
  const fetchPrompt = useCallback(async (diff: Difficulty) => {
    try {
      const res = await fetch(`/api/prompt?difficulty=${diff}`);
      const data = await res.json();
      return data.prompt as string;
    } catch {
      // Fallback prompt
      return "The quick brown fox jumps over the lazy dog.";
    }
  }, []);

  /** Fetch leaderboard data */
  const fetchLeaderboard = useCallback(async () => {
    try {
      const res = await fetch("/api/leaderboard");
      const data = await res.json();
      setLeaderboard(data.leaderboard || []);
    } catch {
      setLeaderboard([]);
    }
  }, []);

  /** Calculate live stats during typing */
  const updateLiveStats = useCallback(
    (typed: string) => {
      if (!prompt || typed.length === 0) {
        setWpm(0);
        setAccuracy(100);
        setErrorCount(0);
        return;
      }

      // Count correct characters
      let correct = 0;
      let errors = 0;
      const minLen = Math.min(prompt.length, typed.length);
      for (let i = 0; i < minLen; i++) {
        if (prompt[i] === typed[i]) {
          correct++;
        } else {
          errors++;
        }
      }

      // Calculate elapsed time
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      const minutes = elapsed / 60;

      // WPM = (correctChars / 5) / minutes
      const currentWpm = minutes > 0 ? Math.round((correct / 5) / minutes) : 0;
      // Accuracy = correct / total typed
      const currentAccuracy = typed.length > 0 ? Math.round((correct / typed.length) * 100) : 100;

      setWpm(currentWpm);
      setAccuracy(currentAccuracy);
      setErrorCount(errors);
    },
    [prompt]
  );

  /** Start the typing test */
  const startTest = async () => {
    const name = username.trim() || "Guest";
    setUsername(name);

    // Fetch prompt
    const newPrompt = await fetchPrompt(difficulty);
    setPrompt(newPrompt);
    setTypedText("");
    setTimeLeft(duration);
    setWpm(0);
    setAccuracy(100);
    setErrorCount(0);
    setResult(null);
    setGameState("playing");
    startTimeRef.current = Date.now();

    // Focus input
    setTimeout(() => inputRef.current?.focus(), 100);

    // Start countdown timer
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    timerRef.current = timer;
  };

  /** Submit results when timer ends */
  const submitResults = useCallback(async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setGameState("finished");

    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username || "Guest",
          prompt,
          typedText: typedText || " ",
          durationSec: duration,
          difficulty,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setResult(data);
        setDifficulty(data.nextDifficulty);
      }
    } catch (err) {
      console.error("Failed to submit results:", err);
    } finally {
      setIsSubmitting(false);
    }

    // Fetch updated leaderboard
    fetchLeaderboard();
  }, [username, prompt, typedText, duration, difficulty, isSubmitting, fetchLeaderboard]);

  /** Handle timer reaching zero */
  useEffect(() => {
    if (gameState === "playing" && timeLeft === 0) {
      if (timerRef.current) clearInterval(timerRef.current);
      submitResults();
    }
  }, [timeLeft, gameState, submitResults]);

  /** Cleanup timer on unmount */
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  /** Load leaderboard on mount */
  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  /** Handle typing input changes */
  const handleTyping = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (gameState !== "playing") return;
    const value = e.target.value;
    setTypedText(value);
    updateLiveStats(value);
  };

  /** Render the prompt with color-coded characters */
  const renderPrompt = () => {
    return prompt.split("").map((char, i) => {
      let className = "text-gray-400"; // not yet typed
      if (i < typedText.length) {
        className =
          typedText[i] === char
            ? "text-green-400" // correct
            : "text-red-400 underline"; // incorrect
      }
      return (
        <span key={i} className={className}>
          {char}
        </span>
      );
    });
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white font-[family-name:var(--font-geist-sans)]">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
            Aether Evo
          </h1>
          <p className="text-gray-400 mt-2">Gamified Typing Test</p>
        </header>

        {/* Setup Screen */}
        {gameState === "setup" && (
          <div className="space-y-6">
            {/* Username */}
            <div>
              <label htmlFor="username" className="block text-sm text-gray-400 mb-1">
                Username (leave blank for Guest)
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Guest"
                maxLength={50}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
              />
            </div>

            {/* Mode Selection */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">Duration</label>
              <div className="flex gap-3">
                {([30, 60] as const).map((d) => (
                  <button
                    key={d}
                    onClick={() => setDuration(d)}
                    className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                      duration === d
                        ? "bg-purple-600 text-white"
                        : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                    }`}
                  >
                    {d}s
                  </button>
                ))}
              </div>
            </div>

            {/* Difficulty Display */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">Difficulty</label>
              <div className="flex gap-3">
                {(["easy", "medium", "hard"] as Difficulty[]).map((d) => (
                  <button
                    key={d}
                    onClick={() => setDifficulty(d)}
                    className={`px-6 py-2 rounded-lg font-medium capitalize transition-colors ${
                      difficulty === d
                        ? "bg-cyan-600 text-white"
                        : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {/* Start Button */}
            <button
              onClick={startTest}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-cyan-600 rounded-lg font-bold text-lg hover:from-purple-500 hover:to-cyan-500 transition-all"
            >
              Start Typing Test
            </button>
          </div>
        )}

        {/* Playing Screen */}
        {gameState === "playing" && (
          <div className="space-y-6">
            {/* Stats Bar */}
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-gray-800 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-purple-400">{timeLeft}s</div>
                <div className="text-xs text-gray-400">Time Left</div>
              </div>
              <div className="bg-gray-800 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-cyan-400">{wpm}</div>
                <div className="text-xs text-gray-400">WPM</div>
              </div>
              <div className="bg-gray-800 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-green-400">{accuracy}%</div>
                <div className="text-xs text-gray-400">Accuracy</div>
              </div>
              <div className="bg-gray-800 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-red-400">{errorCount}</div>
                <div className="text-xs text-gray-400">Errors</div>
              </div>
            </div>

            {/* Prompt Display */}
            <div className="bg-gray-800 rounded-lg p-6 font-[family-name:var(--font-geist-mono)] text-lg leading-relaxed select-none">
              {renderPrompt()}
            </div>

            {/* Typing Input */}
            <textarea
              ref={inputRef}
              value={typedText}
              onChange={handleTyping}
              disabled={gameState !== "playing"}
              placeholder="Start typing here..."
              className="w-full h-32 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white font-[family-name:var(--font-geist-mono)] placeholder-gray-500 focus:outline-none focus:border-purple-500 resize-none"
              autoFocus
              spellCheck={false}
              autoComplete="off"
              autoCapitalize="off"
            />
          </div>
        )}

        {/* Results Screen */}
        {gameState === "finished" && (
          <div className="space-y-6">
            {isSubmitting ? (
              <div className="text-center py-8">
                <div className="text-xl text-gray-400">Calculating results...</div>
              </div>
            ) : result ? (
              <>
                <div className="bg-gray-800 rounded-lg p-6 text-center">
                  <h2 className="text-2xl font-bold mb-4">Test Complete!</h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <div className="text-3xl font-bold text-cyan-400">{result.wpm}</div>
                      <div className="text-sm text-gray-400">WPM</div>
                    </div>
                    <div>
                      <div className="text-3xl font-bold text-green-400">
                        {(result.accuracy * 100).toFixed(1)}%
                      </div>
                      <div className="text-sm text-gray-400">Accuracy</div>
                    </div>
                    <div>
                      <div className="text-3xl font-bold text-red-400">{result.errorCount}</div>
                      <div className="text-sm text-gray-400">Errors</div>
                    </div>
                    <div>
                      <div className="text-3xl font-bold text-purple-400">{result.score}</div>
                      <div className="text-sm text-gray-400">Score</div>
                    </div>
                  </div>
                  <div className="mt-4 text-gray-400">
                    Next difficulty:{" "}
                    <span className="capitalize font-semibold text-white">
                      {result.nextDifficulty}
                    </span>
                  </div>
                </div>

                {/* Try Again Button */}
                <button
                  onClick={() => setGameState("setup")}
                  className="w-full py-3 bg-gradient-to-r from-purple-600 to-cyan-600 rounded-lg font-bold text-lg hover:from-purple-500 hover:to-cyan-500 transition-all"
                >
                  Try Again
                </button>
              </>
            ) : (
              <div className="text-center py-8">
                <div className="text-xl text-red-400">Failed to submit results.</div>
                <button
                  onClick={() => setGameState("setup")}
                  className="mt-4 px-6 py-2 bg-gray-800 rounded-lg hover:bg-gray-700"
                >
                  Try Again
                </button>
              </div>
            )}
          </div>
        )}

        {/* Leaderboard */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-4 text-center">🏆 Leaderboard</h2>
          {leaderboard.length > 0 ? (
            <div className="bg-gray-800 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-700 text-gray-300">
                    <th className="px-4 py-2 text-left">#</th>
                    <th className="px-4 py-2 text-left">User</th>
                    <th className="px-4 py-2 text-right">WPM</th>
                    <th className="px-4 py-2 text-right">Accuracy</th>
                    <th className="px-4 py-2 text-right">Score</th>
                    <th className="px-4 py-2 text-right">Difficulty</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((entry, i) => (
                    <tr
                      key={entry.id}
                      className="border-t border-gray-700 hover:bg-gray-700/50"
                    >
                      <td className="px-4 py-2">{i + 1}</td>
                      <td className="px-4 py-2 font-medium">{entry.username}</td>
                      <td className="px-4 py-2 text-right text-cyan-400">
                        {Math.round(entry.wpm)}
                      </td>
                      <td className="px-4 py-2 text-right text-green-400">
                        {(entry.accuracy * 100).toFixed(1)}%
                      </td>
                      <td className="px-4 py-2 text-right text-purple-400 font-bold">
                        {entry.score}
                      </td>
                      <td className="px-4 py-2 text-right capitalize text-gray-400">
                        {entry.difficulty}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center text-gray-500">No scores yet. Be the first!</p>
          )}
        </div>

        {/* Footer */}
        <footer className="mt-12 text-center text-gray-600 text-sm">
          Aether Evo &copy; {new Date().getFullYear()} — Built with Next.js + Prisma
        </footer>
      </div>
    </div>
  );
}
