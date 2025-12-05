import { useState, useEffect, useCallback, useRef } from "react"
import type { GameState, Keys } from "../lib/game-types"
import { createInitialState, updateGame, GAME_WIDTH, GAME_HEIGHT } from "../lib/game-engine"
import { GameCanvas } from "./game-canvas"
import { GameUI } from "./game-ui"
import { GameMenu } from "./game-menu"

const STORAGE_KEY = "touhou-high-score"

function loadHighScore(): number {
  if (typeof window === "undefined") return 0
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? Number.parseInt(saved, 10) : 0
  } catch {
    return 0
  }
}

function saveHighScore(score: number): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(STORAGE_KEY, score.toString())
  } catch {
    // ignore
  }
}

export function Game() {
  const [mounted, setMounted] = useState(false)
  const [gameState, setGameState] = useState<GameState | null>(null)
  const keysRef = useRef<Keys>({
    up: false,
    down: false,
    left: false,
    right: false,
    shoot: false,
    focus: false,
    bomb: false,
  })
  const gameLoopRef = useRef<number | null>(null)
  const lastTimeRef = useRef<number>(0)

  useEffect(() => {
    setMounted(true)
    setGameState(createInitialState(loadHighScore()))
  }, [])

  const startGame = useCallback(() => {
    if (!gameState) return
    const highScore = Math.max(gameState.highScore, gameState.player.score)
    saveHighScore(highScore)
    setGameState({
      ...createInitialState(highScore),
      gameStatus: "playing",
    })
  }, [gameState])

  const resumeGame = useCallback(() => {
    setGameState((prev) => (prev ? { ...prev, gameStatus: "playing" } : prev))
  }, [])

  useEffect(() => {
    if (!gameState || gameState.gameStatus !== "playing") {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current)
        gameLoopRef.current = null
      }
      return
    }

    const gameLoop = (timestamp: number) => {
      const deltaTime = timestamp - lastTimeRef.current
      lastTimeRef.current = timestamp

      setGameState((prev) => (prev ? updateGame(prev, keysRef.current, deltaTime) : prev))
      gameLoopRef.current = requestAnimationFrame(gameLoop)
    }

    lastTimeRef.current = performance.now()
    gameLoopRef.current = requestAnimationFrame(gameLoop)

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current)
        gameLoopRef.current = null
      }
    }
  }, [gameState])

  useEffect(() => {
    if (!gameState) return
    if (gameState.gameStatus === "gameover" || gameState.gameStatus === "victory") {
      const newHighScore = Math.max(gameState.highScore, gameState.player.score)
      if (newHighScore > loadHighScore()) {
        saveHighScore(newHighScore)
      }
    }
  }, [gameState])

  useEffect(() => {
    if (!mounted) return

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase()

      if (
        [
          "arrowup",
          "arrowdown",
          "arrowleft",
          "arrowright",
          "w",
          "a",
          "s",
          "d",
          "z",
          "x",
          " ",
          "shift",
          "escape",
          "enter",
        ].includes(key)
      ) {
        e.preventDefault()
      }

      switch (key) {
        case "arrowup":
        case "w":
          keysRef.current.up = true
          break
        case "arrowdown":
        case "s":
          keysRef.current.down = true
          break
        case "arrowleft":
        case "a":
          keysRef.current.left = true
          break
        case "arrowright":
        case "d":
          keysRef.current.right = true
          break
        case "z":
        case " ":
          keysRef.current.shoot = true
          break
        case "shift":
          keysRef.current.focus = true
          break
        case "x":
          keysRef.current.bomb = true
          break
        case "escape":
          setGameState((prev) => {
            if (!prev) return prev
            if (prev.gameStatus === "playing") return { ...prev, gameStatus: "paused" }
            if (prev.gameStatus === "paused") return { ...prev, gameStatus: "playing" }
            return prev
          })
          break
        case "enter":
          setGameState((prev) => {
            if (!prev) return prev
            if (prev.gameStatus === "menu") {
              const highScore = Math.max(prev.highScore, prev.player.score)
              return { ...createInitialState(highScore), gameStatus: "playing" }
            }
            return prev
          })
          break
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.key.toLowerCase()) {
        case "arrowup":
        case "w":
          keysRef.current.up = false
          break
        case "arrowdown":
        case "s":
          keysRef.current.down = false
          break
        case "arrowleft":
        case "a":
          keysRef.current.left = false
          break
        case "arrowright":
        case "d":
          keysRef.current.right = false
          break
        case "z":
        case " ":
          keysRef.current.shoot = false
          break
        case "shift":
          keysRef.current.focus = false
          break
        case "x":
          keysRef.current.bomb = false
          break
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("keyup", handleKeyUp)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("keyup", handleKeyUp)
    }
  }, [mounted])

  if (!mounted || !gameState) {
    return (
      <div
        className="flex items-center justify-center bg-touhou-frame text-touhou-pink text-lg font-mono"
        style={{ width: GAME_WIDTH + 220 + 48, height: GAME_HEIGHT + 48 }}
      >
        Loading...
      </div>
    )
  }

  return (
    <div className="flex items-start bg-touhou-frame p-4 gap-0">
      {/* Game area with maroon border frame */}
      <div className="p-2 bg-touhou-frame-inner shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]">
        <div className="relative border-2 border-touhou-border" style={{ width: GAME_WIDTH, height: GAME_HEIGHT }}>
          <GameCanvas gameState={gameState} />

          {gameState.gameStatus !== "playing" && (
            <GameMenu
              status={gameState.gameStatus}
              score={gameState.player.score}
              highScore={gameState.highScore}
              onStart={startGame}
              onResume={resumeGame}
            />
          )}
        </div>
      </div>

      {/* Right sidebar */}
      <div className="py-4 px-6 bg-touhou-frame min-w-[220px]">
        <GameUI gameState={gameState} />
      </div>
    </div>
  )
}
