import { useRef, useState } from "react";

// Berry types and their colors
const BERRIES = [
    { name: "Jumbleberry", color: "#d72660", points: 2, icon: "🍓" },
    { name: "Sugarberry", color: "#fbb13c", points: 2, icon: "🍬" },
    { name: "Pickleberry", color: "#3bb273", points: 4, icon: "🥒" },
    { name: "Moonberry", color: "#4e54c8", points: 7, icon: "🌙" },
    { name: "Pest", color: "#222", points: 0, icon: "🐞" },
];

const SPECIAL_CATEGORIES = [
    { name: "Any 3 Berries", color: "#000", points: 0 },
    { name: "Any 4 Berries", color: "#000", points: 0 },
    { name: "Any 5 Berries", color: "#000", points: 0 },
    { name: "One of Each Berry", color: "#ff69b4", points: 0 },
    { name: "Free Round", color: "#222", points: 0 },
];

const DICE_COUNT = 5;
const MAX_ROLLS = 3;
const ROUNDS = 9;

// Each die has 10 sides: 3 Jumbleberry, 3 Sugarberry, 2 Pickleberry, 1 Moonberry, 1 Pest
const DIE_SIDES = [
    0,
    0,
    0, // Jumbleberry
    1,
    1,
    1, // Sugarberry
    2,
    2, // Pickleberry
    3, // Moonberry
    4, // Pest
];

function getRandomDie() {
    const idx = Math.floor(Math.random() * DIE_SIDES.length);
    return DIE_SIDES[idx];
}

function App() {
    // State
    const [dice, setDice] = useState<(number | null)[]>(Array(DICE_COUNT).fill(null));
    const [kept, setKept] = useState<boolean[]>(Array(DICE_COUNT).fill(false));
    const [rolls, setRolls] = useState(0);
    const [round, setRound] = useState(1);
    const [gameOver, setGameOver] = useState(false);
    // Add five more slots for the special categories
    const [categoryScores, setCategoryScores] = useState<(number | null)[]>([null, null, null, null, null, null, null, null, null]);
    const [message, setMessage] = useState("");
    // Animation state
    const [animating, setAnimating] = useState<boolean[]>(Array(DICE_COUNT).fill(false));
    const [animDice, setAnimDice] = useState<(number | null)[]>(Array(DICE_COUNT).fill(null));
    const animationTimeouts = useRef<(ReturnType<typeof setTimeout> | null)[]>(Array(DICE_COUNT).fill(null));

    // Roll dice that are not kept, with animation
    const rollDice = () => {
        if (rolls >= MAX_ROLLS || gameOver) return;
        setMessage("");
        const newAnimating = kept.map((k) => !k);
        setAnimating(newAnimating);
        // Start cycling animation for each die
        newAnimating.forEach((isAnim, i) => {
            if (isAnim) {
                const interval = setInterval(() => {
                    setAnimDice((prev) => {
                        const next = [...prev];
                        // Only cycle through berry indices (0-3) and pest (4)
                        next[i] = Math.floor(Math.random() * 5);
                        return next;
                    });
                }, 50);
                // Stop animation after 600ms and set real value
                animationTimeouts.current[i] = setTimeout(() => {
                    clearInterval(interval);
                    setDice((prev) => prev.map((d, idx) => (kept[idx] ? d : getRandomDie())));
                    setAnimating((prev) => prev.map((a, idx) => (idx === i ? false : a)));
                }, 600);
            }
        });
        setRolls((r) => r + 1);
    };

    // Toggle keep for a die
    const toggleKeep = (i: number) => {
        if (rolls === 0 || gameOver) return;
        setKept((prev) => prev.map((k, idx) => (idx === i ? !k : k)));
    };

    // Score for a selected category
    const selectCategory = (catIdx: number) => {
        if (rolls === 0 || gameOver || categoryScores[catIdx] !== null) return;
        if (dice.includes(null)) return;
        let score = 0;
        if (catIdx < 4) {
            // Regular berry categories
            const count = dice.filter((d) => d === catIdx).length;
            score = count * BERRIES[catIdx].points;
            setMessage(`Scored ${score} points for ${BERRIES[catIdx].name}!`);
        } else if (catIdx === 4) {
            // Special category: Exactly 3 of the same non-pest berry
            let found = false;
            for (let berryIdx = 0; berryIdx < 4; berryIdx++) {
                const count = dice.filter((d) => d === berryIdx).length;
                if (count === 3) {
                    score = 3 * BERRIES[berryIdx].points;
                    setMessage(`Scored ${score} points for 3 ${BERRIES[berryIdx].name}s!`);
                    found = true;
                    break;
                }
            }
            if (!found) {
                score = 0;
                setMessage("Criteria not met for Any 3 Berries. 0 points awarded.");
            }
        } else if (catIdx === 5) {
            // Special category: Exactly 4 of the same non-pest berry
            let found = false;
            for (let berryIdx = 0; berryIdx < 4; berryIdx++) {
                const count = dice.filter((d) => d === berryIdx).length;
                if (count === 4) {
                    score = 4 * BERRIES[berryIdx].points;
                    setMessage(`Scored ${score} points for 4 ${BERRIES[berryIdx].name}s!`);
                    found = true;
                    break;
                }
            }
            if (!found) {
                score = 0;
                setMessage("Criteria not met for Any 4 Berries. 0 points awarded.");
            }
        } else if (catIdx === 6) {
            // Special category: Exactly 5 of the same non-pest berry
            let found = false;
            for (let berryIdx = 0; berryIdx < 4; berryIdx++) {
                const count = dice.filter((d) => d === berryIdx).length;
                if (count === 5) {
                    score = 5 * BERRIES[berryIdx].points;
                    setMessage(`Scored ${score} points for 5 ${BERRIES[berryIdx].name}s!`);
                    found = true;
                    break;
                }
            }
            if (!found) {
                score = 0;
                setMessage("Criteria not met for Any 5 Berries. 0 points awarded.");
            }
        } else if (catIdx === 7) {
            // Special category: At least one of each berry (+2x if Pest, include all dice in score)
            const berryCounts = [0, 0, 0, 0];
            dice.forEach((d) => {
                if (d !== null && d < 4) berryCounts[d]++;
            });
            if (berryCounts.every((c) => c >= 1)) {
                // Find the remaining die (the one not used for the first instance of each berry)
                const used = [0, 0, 0, 0];
                let remainingDie: number | null = null;
                for (let i = 0; i < dice.length; i++) {
                    const d = dice[i];
                    if (typeof d === "number" && d < 4 && used[d] < 1) {
                        used[d]++;
                    } else if (remainingDie === null) {
                        remainingDie = d;
                    }
                }
                // Score is the sum of all five dice
                score = dice.reduce((sum: number, d) => {
                    if (typeof d === "number" && d >= 0) {
                        return sum + BERRIES[d].points;
                    }
                    return sum;
                }, 0);
                if (remainingDie === 4) {
                    score *= 2;
                    setMessage(`Scored ${score} points for at least one of each berry + pest (2x, all dice included)!`);
                } else {
                    setMessage(`Scored ${score} points for at least one of each berry (all dice included)!`);
                }
            } else {
                score = 0;
                setMessage("Criteria not met for One of Each Berry. 0 points awarded.");
            }
        } else if (catIdx === 8) {
            // Free Round: Try all other categories and pick the highest score
            let bestScore = 0;
            let bestCategory = "";
            // Try regular berry categories
            for (let i = 0; i < 4; i++) {
                const count = dice.filter((d) => d === i).length;
                const s = count * BERRIES[i].points;
                if (s > bestScore) {
                    bestScore = s;
                    bestCategory = BERRIES[i].name;
                }
            }
            // Any 3 Berries
            for (let berryIdx = 0; berryIdx < 4; berryIdx++) {
                const count = dice.filter((d) => d === berryIdx).length;
                if (count === 3) {
                    const s = 3 * BERRIES[berryIdx].points;
                    if (s > bestScore) {
                        bestScore = s;
                        bestCategory = `3 ${BERRIES[berryIdx].name}s`;
                    }
                }
            }
            // Any 4 Berries
            for (let berryIdx = 0; berryIdx < 4; berryIdx++) {
                const count = dice.filter((d) => d === berryIdx).length;
                if (count === 4) {
                    const s = 4 * BERRIES[berryIdx].points;
                    if (s > bestScore) {
                        bestScore = s;
                        bestCategory = `4 ${BERRIES[berryIdx].name}s`;
                    }
                }
            }
            // Any 5 Berries
            for (let berryIdx = 0; berryIdx < 4; berryIdx++) {
                const count = dice.filter((d) => d === berryIdx).length;
                if (count === 5) {
                    const s = 5 * BERRIES[berryIdx].points;
                    if (s > bestScore) {
                        bestScore = s;
                        bestCategory = `5 ${BERRIES[berryIdx].name}s`;
                    }
                }
            }
            // One of Each Berry (+2x if Pest, all dice included)
            const berryCounts = [0, 0, 0, 0];
            dice.forEach((d) => {
                if (typeof d === "number" && d < 4) berryCounts[d]++;
            });
            if (berryCounts.every((c) => c >= 1)) {
                // Find the remaining die (the one not used for the first instance of each berry)
                const used = [0, 0, 0, 0];
                let remainingDie: number | null = null;
                for (let i = 0; i < dice.length; i++) {
                    const d = dice[i];
                    if (typeof d === "number" && d < 4 && used[d] < 1) {
                        used[d]++;
                    } else if (remainingDie === null) {
                        remainingDie = d;
                    }
                }
                let s = dice.reduce((sum: number, d) => {
                    if (typeof d === "number" && d >= 0) {
                        return sum + BERRIES[d].points;
                    }
                    return sum;
                }, 0);
                if (remainingDie === 4) {
                    s *= 2;
                    if (s > bestScore) {
                        bestScore = s;
                        bestCategory = "One of Each Berry + Pest (2x, all dice included)";
                    }
                } else {
                    if (s > bestScore) {
                        bestScore = s;
                        bestCategory = "One of Each Berry (all dice included)";
                    }
                }
            }
            score = bestScore;
            setMessage(`Free Round: Scored ${score} points (best possible: ${bestCategory})`);
        }
        const newScores = [...categoryScores];
        newScores[catIdx] = score;
        setCategoryScores(newScores);
        // Next round or end game
        if (round >= ROUNDS || newScores.every((s) => s !== null)) {
            setGameOver(true);
        } else {
            setRound((r) => r + 1);
            setDice(Array(DICE_COUNT).fill(null));
            setKept(Array(DICE_COUNT).fill(false));
            setRolls(0);
        }
    };

    // Start new game
    const resetGame = () => {
        setDice(Array(DICE_COUNT).fill(null));
        setKept(Array(DICE_COUNT).fill(false));
        setRolls(0);
        setRound(1);
        setGameOver(false);
        setCategoryScores([null, null, null, null, null, null, null, null, null]);
        setMessage("");
    };

    // Total score
    const totalScore: number = categoryScores.reduce((sum: number, s) => sum + (s || 0), 0);

    // UI
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-100 to-green-100 flex flex-col items-center py-8 px-2">
            <h1 className="text-4xl font-extrabold text-pink-700 mb-4 drop-shadow-lg flex items-center gap-4 justify-between">
                Jumbleberry Fields
                <button
                    className="ml-4 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-1 px-3 rounded text-sm border border-gray-400"
                    onClick={resetGame}
                >
                    Reset Game
                </button>
            </h1>
            <div className="w-full max-w-xl bg-white/80 rounded-xl shadow-lg p-6 flex flex-col gap-4">
                <div className="flex flex-row justify-between items-center text-lg font-semibold text-gray-700">
                    <div>
                        Round: <span className="text-blue-700">{round}</span> / {ROUNDS}
                    </div>
                    <div>
                        Rolls: <span className="text-green-700">{rolls}</span> / {MAX_ROLLS}
                    </div>
                    <div>
                        Score: <span className="text-orange-600 font-bold">{totalScore}</span>
                    </div>
                </div>
                {message && <div className="text-center text-lg text-pink-700 font-bold">{message}</div>}
                <div className="flex flex-row justify-center gap-4 my-4">
                    {dice.map((d, i) => (
                        <button
                            key={i}
                            className={`w-20 h-20 rounded-full shadow-lg border-4 flex flex-col items-center justify-center text-lg font-bold transition-all duration-150
                ${kept[i] ? "ring-4 ring-yellow-400 scale-110" : "hover:scale-105"}
                ${dice[i] !== null ? "text-white" : "text-gray-400"}
              `}
                            style={{
                                background: animating[i] ? BERRIES[animDice[i] ?? 0].color : dice[i] !== null ? BERRIES[dice[i]!].color : "#e5e7eb",
                                borderColor: kept[i] ? "#fbbf24" : "#d1d5db",
                            }}
                            onClick={() => toggleKeep(i)}
                            disabled={rolls === 0 || gameOver}
                            title={dice[i] !== null ? BERRIES[dice[i]!].name : "?"}
                        >
                            {animating[i] ? (
                                <>
                                    <span className="text-2xl mb-1">{BERRIES[animDice[i] ?? 0].icon}</span>
                                    <span className="text-[10px]">{BERRIES[animDice[i] ?? 0].name}</span>
                                </>
                            ) : dice[i] !== null ? (
                                <>
                                    <span className="text-2xl mb-1">{BERRIES[dice[i]!].icon}</span>
                                    <span className="text-[10px]">{BERRIES[dice[i]!].name}</span>
                                </>
                            ) : (
                                "?"
                            )}
                        </button>
                    ))}
                </div>
                <div className="flex flex-row justify-center gap-4 mt-2">
                    <button
                        className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={rollDice}
                        disabled={rolls >= MAX_ROLLS || gameOver}
                    >
                        {rolls === 0 ? "Start Turn" : rolls < MAX_ROLLS ? "Roll" : "No Rolls Left"}
                    </button>
                </div>
                {/* Category selection UI */}
                <div className="mt-4">
                    <h3 className="text-lg font-bold text-gray-700 mb-2">Select a Category to Score</h3>
                    <div className="grid grid-cols-2 gap-3">
                        {BERRIES.slice(0, 4).map((b, idx) => (
                            <button
                                key={b.name}
                                className={`px-3 py-2 rounded-lg font-bold shadow-md border-2 transition-all
                  ${
                      categoryScores[idx] !== null
                          ? "bg-gray-200 border-gray-400 text-gray-400 cursor-not-allowed"
                          : "bg-white border-gray-300 hover:bg-blue-100 hover:border-blue-400 text-gray-800"
                  }
                  ${rolls === 0 || gameOver || dice.includes(null) ? "opacity-50 cursor-not-allowed" : ""}
                `}
                                style={{
                                    background: categoryScores[idx] !== null ? "#e5e7eb" : b.color + "22",
                                    borderColor: categoryScores[idx] !== null ? "#d1d5db" : b.color,
                                    color: categoryScores[idx] !== null ? "#9ca3af" : b.color,
                                }}
                                onClick={() => selectCategory(idx)}
                                disabled={categoryScores[idx] !== null || rolls === 0 || gameOver || dice.includes(null)}
                            >
                                <div className="flex flex-row items-center gap-2">
                                    <span
                                        className="inline-block w-5 h-5 rounded-full flex items-center justify-center text-base"
                                        style={{ background: b.color }}
                                    >
                                        <span className="text-base">{b.icon}</span>
                                    </span>
                                    {b.name}
                                </div>
                                {categoryScores[idx] !== null ? (
                                    <span className="block w-full text-xs text-gray-500 font-normal mt-1">{categoryScores[idx]} pts</span>
                                ) : (
                                    <span className="block w-full text-xs text-gray-300 font-normal mt-1">—</span>
                                )}
                            </button>
                        ))}
                        {/* Special category buttons */}
                        {SPECIAL_CATEGORIES.map((cat, i) => (
                            <button
                                key={cat.name}
                                className={`px-3 py-2 rounded-lg font-bold shadow-md border-2 transition-all
                  ${
                      categoryScores[4 + i] !== null
                          ? "bg-gray-200 border-gray-400 text-gray-400 cursor-not-allowed"
                          : "bg-white border-gray-300 hover:bg-blue-100 hover:border-blue-400 text-gray-800"
                  }
                  ${rolls === 0 || gameOver || dice.includes(null) ? "opacity-50 cursor-not-allowed" : ""}
                `}
                                style={{
                                    background: categoryScores[4 + i] !== null ? "#e5e7eb" : cat.color + "22",
                                    borderColor: categoryScores[4 + i] !== null ? "#d1d5db" : cat.color,
                                    color: categoryScores[4 + i] !== null ? "#9ca3af" : cat.color,
                                }}
                                onClick={() => selectCategory(4 + i)}
                                disabled={categoryScores[4 + i] !== null || rolls === 0 || gameOver || dice.includes(null)}
                            >
                                <div className="flex flex-row items-center gap-2">
                                    <span
                                        className="inline-block w-5 h-5 rounded-full flex items-center justify-center text-base"
                                        style={{ background: cat.color }}
                                    >
                                        {/* For special categories, show a relevant icon or a star as a placeholder */}
                                        <span className="text-base">{i === 0 ? "🍓" : i === 1 ? "🍬" : i === 2 ? "🥒" : i === 3 ? "🌙" : "⭐"}</span>
                                    </span>
                                    {cat.name}
                                </div>
                                {categoryScores[4 + i] !== null ? (
                                    <span className="block w-full text-xs text-gray-500 font-normal mt-1">{categoryScores[4 + i]} pts</span>
                                ) : (
                                    <span className="block w-full text-xs text-gray-300 font-normal mt-1">—</span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
                {/* Game Over Modal */}
                {gameOver && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                        <div className="bg-white rounded-xl shadow-2xl p-8 flex flex-col items-center max-w-sm w-full">
                            <h2 className="text-2xl font-bold text-pink-700 mb-2">Game Over!</h2>
                            <div className="text-xl font-bold text-orange-700 mb-1">Your Score: {totalScore}</div>
                            <button
                                className="mt-4 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-6 rounded-lg shadow-md text-lg"
                                onClick={resetGame}
                            >
                                Reset Game
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default App;
