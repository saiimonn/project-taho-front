import { useState, useEffect, useCallback, useRef } from "react"
import type { GameState, Keys } from "../lib/game-types"
import { GameManager, GAME_WIDTH, GAME_HEIGHT } from "../lib/game-engine"
import { GameCanvas, drawGame } from "./game-canvas"
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
  // We use refs for the game loop to avoid React re-renders on every frame
  const gameRef = useRef<GameManager | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const keysRef = useRef<Keys>({
    up: false,
    down: false,
    left: false,
    right: false,
    shoot: false,
    focus: false,
    bomb: false,
  })
  
  // We only use React state for UI updates (Score, Lives) to save performance
  // We update this less frequently than 60fps
  const [uiState, setUiState] = useState<GameState | null>(null)
  const [mounted, setMounted] = useState(false)
  
  const gameLoopRef = useRef<number | null>(null)
  const lastTimeRef = useRef<number>(0)

  // Initialize Game Logic
  useEffect(() => {
    setMounted(true)
    // Initialize the manager once
    if (!gameRef.current) {
        gameRef.current = new GameManager(loadHighScore())
        setUiState({ ...gameRef.current.getState() }) // Initial sync
    }
  }, [])

  const startGame = useCallback(() => {
    if (!gameRef.current) return
    const currentState = gameRef.current.getState()
    const highScore = Math.max(currentState.highScore, currentState.player.score)
    saveHighScore(highScore)
    
    // Reset and start
    gameRef.current.resetGame(highScore)
    
    // Force UI update
    setUiState({ ...gameRef.current.getState() })
  }, [])

  const resumeGame = useCallback(() => {
    if (!gameRef.current) return
    const state = gameRef.current.getState()
    state.gameStatus = "playing"
    setUiState({ ...state })
  }, [])

  // The Game Loop
  useEffect(() => {
    if (!mounted || !gameRef.current) return

    const gameLoop = (timestamp: number) => {
      const deltaTime = timestamp - lastTimeRef.current
      lastTimeRef.current = timestamp
      const manager = gameRef.current!
      const state = manager.getState()

      if (state.gameStatus === "playing") {
        // 1. Update Game Logic (Mutable)
        manager.update(keysRef.current, deltaTime)
        
        // 2. Draw directly to canvas (Bypassing React Render)
        if (canvasRef.current) {
            const ctx = canvasRef.current.getContext("2d")
            if (ctx) {
                drawGame(ctx, state)
            }
        }
      }

      // 3. Sync UI (Score/Lives) periodically
      // We check if we need to show a menu or just update score
      // Only update React state if status changed OR every 10 frames for score
      if (
        state.gameStatus !== uiState?.gameStatus || 
        state.stageTimer % 10 === 0
      ) {
         setUiState({ ...state }) // Clone to force React update
      }
      
      // 4. Check High Score Save on Game Over
      if (state.gameStatus === "gameover" || state.gameStatus === "victory") {
        const newHighScore = Math.max(state.highScore, state.player.score)
        if (newHighScore > loadHighScore()) {
            saveHighScore(newHighScore)
        }
      }

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
  }, [mounted, uiState?.gameStatus]) // Re-bind only if status changes drastically

  // Input Handling
  useEffect(() => {
    if (!mounted) return

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase()

      if (
        [
          "arrowup", "arrowdown", "arrowleft", "arrowright",
          "w", "a", "s", "d", "z", "x", " ", "shift", "escape", "enter",
        ].includes(key)
      ) {
        e.preventDefault()
      }

      switch (key) {
        case "arrowup": case "w": keysRef.current.up = true; break
        case "arrowdown": case "s": keysRef.current.down = true; break
        case "arrowleft": case "a": keysRef.current.left = true; break
        case "arrowright": case "d": keysRef.current.right = true; break
        case "z": case " ": keysRef.current.shoot = true; break
        case "shift": keysRef.current.focus = true; break
        case "x": keysRef.current.bomb = true; break
        case "escape":
           if (gameRef.current) {
               const state = gameRef.current.getState()
               if (state.gameStatus === "playing") state.gameStatus = "paused"
               else if (state.gameStatus === "paused") state.gameStatus = "playing"
               setUiState({ ...state }) // Update Menu UI
           }
           break
        case "enter":
           if (gameRef.current) {
             const state = gameRef.current.getState()
             if (state.gameStatus === "menu") {
                startGame()
             }
           }
           break
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.key.toLowerCase()) {
        case "arrowup": case "w": keysRef.current.up = false; break
        case "arrowdown": case "s": keysRef.current.down = false; break
        case "arrowleft": case "a": keysRef.current.left = false; break
        case "arrowright": case "d": keysRef.current.right = false; break
        case "z": case " ": keysRef.current.shoot = false; break
        case "shift": keysRef.current.focus = false; break
        case "x": keysRef.current.bomb = false; break
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("keyup", handleKeyUp)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("keyup", handleKeyUp)
    }
  }, [mounted, startGame])

  if (!mounted || !uiState) {
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
          {/* We pass the Ref directly to the Canvas Component */}
          <GameCanvas ref={canvasRef} gameState={uiState} />

          {uiState.gameStatus !== "playing" && (
            <GameMenu
              status={uiState.gameStatus}
              score={uiState.player.score}
              highScore={uiState.highScore}
              onStart={startGame}
              onResume={resumeGame}
            />
          )}
        </div>
      </div>

      {/* Right sidebar */}
      <div className="py-4 px-6 bg-touhou-frame min-w-[220px]">
        <GameUI gameState={uiState} />
      </div>
    </div>
  )
}