"use client"

import type { GameState } from "../lib/game-types"

interface GameUIProps {
  gameState: GameState
}

export function GameUI({ gameState }: GameUIProps) {
  const { player, highScore, time, difficulty } = gameState

  const formatTime = (frames: number) => {
    const seconds = Math.floor(frames / 60)
    return `${seconds}/0`
  }

  return (
    <div className="w-[200px] font-mono text-xs">
      {/* Score display */}
      <div className="mb-4">
        <div className="flex justify-between mb-1">
          <span className="text-touhou-text-dim">HiScore</span>
          <span className="text-touhou-text tracking-wider">{highScore.toString().padStart(10, "0")}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-touhou-text-dim">Score</span>
          <span className="text-touhou-text tracking-wider">{player.score.toString().padStart(10, "0")}</span>
        </div>
      </div>

      {/* Player lives */}
      <div className="flex justify-between items-center mb-1">
        <span className="text-touhou-text-dim">Player</span>
        <div className="flex gap-0.5">
          {Array.from({ length: 8 }).map((_, i) => (
            <span key={i} className={`text-sm ${i < player.lives ? "text-touhou-red" : "text-touhou-text-muted"}`}>
              ★
            </span>
          ))}
        </div>
      </div>

      {/* Spell/Bombs */}
      <div className="flex justify-between items-center mb-4">
        <span className="text-touhou-text-dim">Spell</span>
        <div className="flex gap-0.5">
          {Array.from({ length: 8 }).map((_, i) => (
            <span key={i} className={`text-sm ${i < player.bombs ? "text-touhou-blue" : "text-touhou-text-muted"}`}>
              ★
            </span>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="mb-4">
        <div className="flex justify-between mb-0.5">
          <span className="text-touhou-text-dim">Power</span>
          <span className={player.power >= 4 ? "text-touhou-yellow" : "text-touhou-text"}>
            {player.power >= 4 ? "MAX" : player.power.toFixed(2)}
          </span>
        </div>
        <div className="flex justify-between mb-0.5">
          <span className="text-touhou-text-dim">Graze</span>
          <span className="text-touhou-text">{player.graze}</span>
        </div>
        <div className="flex justify-between mb-0.5">
          <span className="text-touhou-text-dim">Point</span>
          <span className="text-touhou-text">
            {player.point}/{player.pointMax}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-touhou-text-dim">Time</span>
          <span className="text-touhou-text">{formatTime(time)}</span>
        </div>
      </div>

      {/* Difficulty */}
      <div className="text-right mb-6">
        <span className="text-touhou-pink italic">{difficulty}</span>
      </div>

      {/* Moon emblem and title */}
      <div className="flex flex-col items-center mt-8">
        <div className="w-16 h-16 rounded-full bg-linear-to-br from-[rgba(180,140,200,0.4)] to-[rgba(100,60,120,0.2)] mb-2 relative">
          <div className="absolute -right-2 top-0 w-10 h-16 bg-linear-to-r from-transparent to-[rgba(100,200,100,0.2)] blur-sm rounded-full" />
        </div>

        {/* Japanese title vertical */}
        <div className="text-center">
          {["東", "方", "永", "夜", "抄"].map((char, i) => (
            <div key={i} className="text-2xl text-touhou-pink-dim leading-tight">
              {char}
            </div>
          ))}
        </div>

        <div className="mt-2 text-[10px] text-touhou-pink-dim/50 italic">Imperishable Night</div>
      </div>

      {/* FPS */}
      <div className="mt-4 text-right text-[10px] text-touhou-text-darker">60.00fps</div>
    </div>
  )
}