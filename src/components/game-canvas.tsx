"use client"

import { useRef, useEffect } from "react"
import type { GameState, Bullet, BulletColor } from "../lib/game-types"
import { GAME_WIDTH, GAME_HEIGHT } from "../lib/game-engine"

interface GameCanvasProps {
  gameState: GameState
}

const BULLET_COLORS: Record<BulletColor, { fill: string; glow: string }> = {
  red: { fill: "#ff4444", glow: "#ff000066" },
  white: { fill: "#ffffff", glow: "#ffffff44" },
  pink: { fill: "#ff88aa", glow: "#ff88aa66" },
  cyan: { fill: "#88ccff", glow: "#88ccff66" },
  yellow: { fill: "#ffdd44", glow: "#ffdd4466" },
  green: { fill: "#44ff88", glow: "#44ff8866" },
}

export function GameCanvas({ gameState }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Clear and draw background
    const bgGradient = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT)
    bgGradient.addColorStop(0, "#0a0818")
    bgGradient.addColorStop(0.5, "#0d0a20")
    bgGradient.addColorStop(1, "#08061a")
    ctx.fillStyle = bgGradient
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT)

    // Starfield
    ctx.fillStyle = "#ffffff"
    for (let i = 0; i < 40; i++) {
      const x = (i * 97 + gameState.stageTimer * 0.1) % GAME_WIDTH
      const y = (i * 73 + gameState.stageTimer * (0.2 + (i % 3) * 0.1)) % GAME_HEIGHT
      const size = 1 + (i % 2)
      ctx.globalAlpha = 0.3 + (i % 3) * 0.2
      ctx.fillRect(x, y, size, size)
    }
    ctx.globalAlpha = 1

    // Draw power-ups
    gameState.powerUps.forEach((pu) => {
      const colors: Record<string, string> = {
        power: "#ff4466",
        point: "#ffff00",
        bomb: "#44ff88",
        life: "#ff88cc",
      }
      ctx.fillStyle = colors[pu.type] || "#ffffff"
      ctx.shadowColor = colors[pu.type] || "#ffffff"
      ctx.shadowBlur = 8
      ctx.beginPath()
      ctx.arc(pu.x, pu.y, 6, 0, Math.PI * 2)
      ctx.fill()
      ctx.shadowBlur = 0
    })

    // Draw enemies
    gameState.enemies.forEach((enemy) => {
      drawEnemy(ctx, enemy.x, enemy.y, enemy.width, enemy.type)
    })

    // Draw boss
    if (gameState.boss) {
      drawBoss(ctx, gameState.boss, gameState.stageTimer)
    }

    // Draw player bullets
    ctx.shadowColor = "#88ff88"
    ctx.shadowBlur = 4
    gameState.playerBullets.forEach((pb) => {
      ctx.fillStyle = "#ffffff"
      ctx.fillRect(pb.x - pb.width / 2, pb.y - pb.height / 2, pb.width, pb.height)
      ctx.fillStyle = "#88ff8866"
      ctx.fillRect(pb.x - pb.width / 2 - 1, pb.y - pb.height / 2 - 1, pb.width + 2, pb.height + 2)
    })
    ctx.shadowBlur = 0

    // Draw enemy bullets
    gameState.bullets.forEach((bullet) => {
      drawBullet(ctx, bullet)
    })

    // Draw player
    if (!gameState.player.invincible || Math.floor(gameState.stageTimer / 4) % 2 === 0) {
      drawPlayer(ctx, gameState.player.x, gameState.player.y, false)
    }

    // Bottom point bar
    ctx.fillStyle = "#ffffff88"
    ctx.font = "10px monospace"
    ctx.textAlign = "left"
    ctx.fillText(`${((gameState.player.point / gameState.player.pointMax) * 100).toFixed(0)}%`, 8, GAME_HEIGHT - 8)

    ctx.fillStyle = "#333366"
    ctx.fillRect(50, GAME_HEIGHT - 14, 100, 6)
    ctx.fillStyle = "#ff4488"
    ctx.fillRect(50, GAME_HEIGHT - 14, 100 * (gameState.player.point / gameState.player.pointMax), 6)
  }, [gameState])

  return (
    <canvas
      ref={canvasRef}
      width={GAME_WIDTH}
      height={GAME_HEIGHT}
      className="block"
      style={{ imageRendering: "pixelated" }}
    />
  )
}

function drawPlayer(ctx: CanvasRenderingContext2D, x: number, y: number, focused: boolean) {
  ctx.save()

  if (focused) {
    ctx.strokeStyle = "#ffffff44"
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(x, y, 28, 0, Math.PI * 2)
    ctx.stroke()
  }

  // Main body (red like Reimu)
  ctx.fillStyle = "#cc2222"
  ctx.beginPath()
  ctx.ellipse(x, y, 10, 14, 0, 0, Math.PI * 2)
  ctx.fill()

  // White undershirt
  ctx.fillStyle = "#ffffff"
  ctx.beginPath()
  ctx.ellipse(x, y - 2, 6, 8, 0, 0, Math.PI * 2)
  ctx.fill()

  // Red bow
  ctx.fillStyle = "#ff2222"
  ctx.beginPath()
  ctx.ellipse(x - 8, y - 12, 6, 4, -0.3, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.ellipse(x + 8, y - 12, 6, 4, 0.3, 0, Math.PI * 2)
  ctx.fill()

  // Hair
  ctx.fillStyle = "#442222"
  ctx.beginPath()
  ctx.arc(x, y - 10, 8, 0, Math.PI * 2)
  ctx.fill()

  // Hitbox indicator
  ctx.fillStyle = "#ffffff"
  ctx.beginPath()
  ctx.arc(x, y, 3, 0, Math.PI * 2)
  ctx.fill()

  ctx.restore()
}

function drawBullet(ctx: CanvasRenderingContext2D, bullet: Bullet) {
  const colors = BULLET_COLORS[bullet.color] || BULLET_COLORS.red

  ctx.save()
  ctx.translate(bullet.x, bullet.y)

  ctx.shadowColor = colors.glow
  ctx.shadowBlur = 6

  if (bullet.type === "rice" || bullet.type === "kunai") {
    const angle = bullet.angle || Math.atan2(bullet.vy, bullet.vx)
    ctx.rotate(angle + Math.PI / 2)

    ctx.fillStyle = colors.fill
    ctx.beginPath()
    ctx.ellipse(0, 0, bullet.radius * 0.5, bullet.radius * 1.8, 0, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = "#ffffff"
    ctx.beginPath()
    ctx.ellipse(0, -bullet.radius * 0.3, bullet.radius * 0.25, bullet.radius * 0.8, 0, 0, Math.PI * 2)
    ctx.fill()
  } else if (bullet.type === "circle" || bullet.type === "orb") {
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, bullet.radius)
    gradient.addColorStop(0, "#ffffff")
    gradient.addColorStop(0.3, colors.fill)
    gradient.addColorStop(1, colors.glow)
    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.arc(0, 0, bullet.radius, 0, Math.PI * 2)
    ctx.fill()
  } else if (bullet.type === "star") {
    ctx.fillStyle = colors.fill
    ctx.beginPath()
    for (let i = 0; i < 10; i++) {
      const a = (i * Math.PI * 2) / 10 - Math.PI / 2
      const r = i % 2 === 0 ? bullet.radius : bullet.radius * 0.5
      if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r)
      else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r)
    }
    ctx.closePath()
    ctx.fill()
  } else {
    ctx.fillStyle = colors.fill
    ctx.beginPath()
    ctx.arc(0, 0, bullet.radius, 0, Math.PI * 2)
    ctx.fill()
  }

  ctx.restore()
}

function drawEnemy(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, type: string) {
  ctx.save()
  ctx.translate(x, y)

  if (type === "fairy") {
    ctx.fillStyle = "#aaccff"
    ctx.beginPath()
    ctx.arc(0, 0, width / 2, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = "#88aaff66"
    ctx.beginPath()
    ctx.ellipse(-width / 2, 0, width / 3, width / 2, -0.3, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.ellipse(width / 2, 0, width / 3, width / 2, 0.3, 0, Math.PI * 2)
    ctx.fill()
  } else {
    ctx.fillStyle = "#8888aa"
    ctx.strokeStyle = "#aaaacc"
    ctx.lineWidth = 2
    ctx.fillRect(-width / 2, -width / 1.5, width, width * 1.3)
    ctx.strokeRect(-width / 2, -width / 1.5, width, width * 1.3)
    ctx.fillStyle = "#666688"
    ctx.fillRect(-width / 4, -width / 2, width / 2, width / 4)
  }

  ctx.restore()
}

function drawBoss(ctx: CanvasRenderingContext2D, boss: NonNullable<GameState["boss"]>, timer: number) {
  ctx.save()
  ctx.translate(boss.x, boss.y)

  ctx.strokeStyle = "#8866cc44"
  ctx.lineWidth = 3
  for (let i = 0; i < 3; i++) {
    ctx.beginPath()
    ctx.arc(0, 0, 30 + i * 8 + Math.sin(timer * 0.1 + i) * 4, 0, Math.PI * 2)
    ctx.stroke()
  }

  ctx.fillStyle = "#6644aa"
  ctx.beginPath()
  ctx.arc(0, 0, 24, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = "#ffddcc"
  ctx.beginPath()
  ctx.arc(0, -4, 14, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = "#442266"
  ctx.beginPath()
  ctx.arc(0, -12, 16, Math.PI, 0)
  ctx.fill()

  ctx.restore()

  ctx.fillStyle = "#ffdd44"
  ctx.font = "10px monospace"
  ctx.textAlign = "center"
  ctx.fillText(`${boss.name} Spell Card`, GAME_WIDTH / 2, 50)

  ctx.fillStyle = "#333344"
  ctx.fillRect(20, 16, GAME_WIDTH - 40, 6)
  ctx.fillStyle = "#ff4466"
  ctx.fillRect(20, 16, (GAME_WIDTH - 40) * (boss.health / boss.maxHealth), 6)
}