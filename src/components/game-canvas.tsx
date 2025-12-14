"use client"

import { forwardRef } from "react"
import type { GameState, Bullet, BulletColor, Player, Particle } from "../lib/game-types"
import { GAME_WIDTH, GAME_HEIGHT } from "../lib/game-engine"

const BULLET_COLORS: Record<BulletColor, { fill: string; glow: string }> = {
  red: { fill: "#ff4444", glow: "#ff000066" },
  white: { fill: "#ffffff", glow: "#ffffff44" },
  pink: { fill: "#ff88aa", glow: "#ff88aa66" },
  cyan: { fill: "#88ccff", glow: "#88ccff66" },
  yellow: { fill: "#ffdd44", glow: "#ffdd4466" },
  green: { fill: "#44ff88", glow: "#44ff8866" },
  blue: { fill: "#4488ff", glow: "#0044ff66" },
}

// This exported function is REQUIRED for the game loop to work
export function drawGame(ctx: CanvasRenderingContext2D, gameState: GameState) {
  ctx.save()
  
  // 1. Screen Shake
  if (gameState.screenShake > 0) {
    const dx = (Math.random() - 0.5) * gameState.screenShake
    const dy = (Math.random() - 0.5) * gameState.screenShake
    ctx.translate(dx, dy)
  }

  // 2. Background
  const bgGradient = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT)
  bgGradient.addColorStop(0, "#0a0818")
  bgGradient.addColorStop(0.5, "#0d0a20")
  bgGradient.addColorStop(1, "#08061a")
  ctx.fillStyle = bgGradient
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT)

  // 3. Starfield
  ctx.fillStyle = "#ffffff"
  for (let i = 0; i < 40; i++) {
    const x = (i * 97 + gameState.stageTimer * 0.1) % GAME_WIDTH
    const y = (i * 73 + gameState.stageTimer * (0.2 + (i % 3) * 0.1)) % GAME_HEIGHT
    const size = 1 + (i % 2)
    ctx.globalAlpha = 0.3 + (i % 3) * 0.2
    ctx.fillRect(x, y, size, size)
  }
  ctx.globalAlpha = 1

  // 4. Power-ups
  gameState.powerUps.forEach((pu) => {
    const colors: Record<string, string> = {
      power: "#ff4466",
      point: "#ffff00",
      bomb: "#44ff88",
      life: "#ff88cc",
    }
    const color = colors[pu.type] || "#ffffff"
    ctx.globalAlpha = 0.4
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.arc(pu.x, pu.y, 10, 0, Math.PI * 2)
    ctx.fill()
    ctx.globalAlpha = 1.0
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.arc(pu.x, pu.y, 6, 0, Math.PI * 2)
    ctx.fill()
  })

  // 5. Enemies
  gameState.enemies.forEach((enemy) => {
    drawEnemy(ctx, enemy.x, enemy.y, enemy.width, enemy.type)
  })

  // 6. Boss
  if (gameState.boss) {
    drawBoss(ctx, gameState.boss, gameState.stageTimer)
  }

  // 7. Bomb Effect
  if (gameState.player.bombVisualTimer > 0) {
    drawBombEffect(ctx, gameState.player)
  }

  // 8. Player Bullets
  gameState.playerBullets.forEach((pb) => {
    ctx.fillStyle = "#88ff8866"
    ctx.fillRect(pb.x - pb.width / 2 - 2, pb.y - pb.height / 2 - 2, pb.width + 4, pb.height + 4)
    ctx.fillStyle = "#ffffff"
    ctx.fillRect(pb.x - pb.width / 2, pb.y - pb.height / 2, pb.width, pb.height)
  })

  // 9. Enemy Bullets
  gameState.bullets.forEach((bullet) => {
    drawBullet(ctx, bullet)
  })

  // 10. Particles
  if (gameState.particles) {
    gameState.particles.forEach((p) => {
      drawParticle(ctx, p)
    })
  }

  // 11. Player
  if (!gameState.player.invincible || Math.floor(gameState.stageTimer / 4) % 2 === 0) {
    drawPlayer(ctx, gameState.player.x, gameState.player.y, false)
  }

  // 12. Point Bar UI
  ctx.fillStyle = "#ffffff88"
  ctx.font = "10px monospace"
  ctx.textAlign = "left"
  ctx.fillText(`${((gameState.player.point / gameState.player.pointMax) * 100).toFixed(0)}%`, 8, GAME_HEIGHT - 8)

  ctx.fillStyle = "#333366"
  ctx.fillRect(50, GAME_HEIGHT - 14, 100, 6)
  ctx.fillStyle = "#ff4488"
  ctx.fillRect(50, GAME_HEIGHT - 14, 100 * (gameState.player.point / gameState.player.pointMax), 6)
  
  ctx.restore()
}

// This Component is now just a wrapper for the ref
export const GameCanvas = forwardRef<HTMLCanvasElement>((props, ref) => {
  return (
    <canvas
      ref={ref}
      width={GAME_WIDTH}
      height={GAME_HEIGHT}
      className="block"
      style={{ imageRendering: "pixelated" }}
    />
  )
})
GameCanvas.displayName = "GameCanvas"

// --- Helper Drawing Functions ---

function drawParticle(ctx: CanvasRenderingContext2D, p: Particle) {
  ctx.save()
  ctx.translate(p.x, p.y)
  ctx.fillStyle = p.color
  const alpha = p.life / p.maxLife
  ctx.globalAlpha = alpha
  if (p.type === "spark") {
    ctx.fillRect(-p.size/2, -p.size/2, p.size, p.size)
  } else if (p.type === "energy") {
    ctx.beginPath()
    ctx.arc(0, 0, p.size, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()
}

function drawBombEffect(ctx: CanvasRenderingContext2D, player: Player) {
  const maxTime = 120
  const time = player.bombVisualTimer
  const progress = 1 - time / maxTime
  ctx.save()
  const opacity = Math.max(0, Math.min(0.6, Math.sin(progress * Math.PI) * 0.8))
  ctx.fillStyle = `rgba(255, 230, 240, ${opacity})`
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT)
  ctx.translate(player.x, player.y)
  ctx.rotate(progress * 4)
  const radius1 = progress * 600
  ctx.beginPath()
  ctx.arc(0, 0, radius1, 0, Math.PI * 2)
  ctx.strokeStyle = `rgba(255, 100, 150, ${1 - progress})`
  ctx.lineWidth = 40 * (1 - progress)
  ctx.stroke()
  ctx.rotate(-progress * 8)
  const radius2 = progress * 400
  ctx.beginPath()
  ctx.arc(0, 0, radius2, 0, Math.PI * 2)
  ctx.strokeStyle = `rgba(255, 255, 255, ${1 - progress})`
  ctx.lineWidth = 20 * (1 - progress)
  ctx.stroke()
  if (progress < 0.2) {
      ctx.fillStyle = `rgba(255, 255, 255, ${1 - progress * 5})`
      ctx.beginPath()
      ctx.arc(0, 0, 100, 0, Math.PI * 2)
      ctx.fill()
  }
  ctx.restore()
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
  ctx.fillStyle = "#cc2222"
  ctx.beginPath()
  ctx.ellipse(x, y, 10, 14, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = "#ffffff"
  ctx.beginPath()
  ctx.ellipse(x, y - 2, 6, 8, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = "#ff2222"
  ctx.beginPath()
  ctx.ellipse(x - 8, y - 12, 6, 4, -0.3, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.ellipse(x + 8, y - 12, 6, 4, 0.3, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = "#442222"
  ctx.beginPath()
  ctx.arc(x, y - 10, 8, 0, Math.PI * 2)
  ctx.fill()
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
  
  if (bullet.type === "ice") {
    const angle = bullet.angle || Math.atan2(bullet.vy, bullet.vx)
    ctx.rotate(angle + Math.PI / 2)
    ctx.fillStyle = colors.fill
    ctx.shadowColor = colors.glow
    ctx.shadowBlur = 5 
    ctx.beginPath()
    ctx.moveTo(0, -bullet.radius * 1.5)
    ctx.lineTo(bullet.radius, 0)
    ctx.lineTo(0, bullet.radius * 1.5)
    ctx.lineTo(-bullet.radius, 0)
    ctx.closePath()
    ctx.fill()
    ctx.shadowBlur = 0 
  } else {
    ctx.fillStyle = colors.glow
    ctx.beginPath()
    ctx.arc(0, 0, bullet.radius * 2, 0, Math.PI * 2)
    ctx.fill()
    
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

  // BOSS WINDUP EFFECT
  if (boss.shootTimer > 0 && boss.shootTimer < 60) {
    ctx.save()
    ctx.globalAlpha = 0.5 + Math.sin(timer * 0.5) * 0.3
    ctx.strokeStyle = "#00ccff"
    ctx.lineWidth = 3
    const size = (boss.shootTimer / 60) * 100 + 40
    ctx.beginPath()
    ctx.arc(0, 0, size, 0, Math.PI * 2)
    ctx.stroke()
    const size2 = (boss.shootTimer / 60) * 150 + 40
    ctx.beginPath()
    ctx.arc(0, 0, size2, 0, Math.PI * 2)
    ctx.stroke()
    ctx.restore()
  }

  // Ice Aura
  ctx.strokeStyle = "#88ccff44"
  ctx.lineWidth = 3
  for (let i = 0; i < 3; i++) {
    ctx.beginPath()
    ctx.arc(0, 0, 30 + i * 8 + Math.sin(timer * 0.1 + i) * 4, 0, Math.PI * 2)
    ctx.stroke()
  }

  // Boss Body
  ctx.fillStyle = "#4488ff" // Blue Dress
  ctx.beginPath()
  ctx.arc(0, 0, 24, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = "#ffddcc" // Face
  ctx.beginPath()
  ctx.arc(0, -4, 14, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = "#88ccff" // Hair
  ctx.beginPath()
  ctx.arc(0, -12, 16, Math.PI, 0)
  ctx.fill()
  
  // Wings
  ctx.fillStyle = "#ccffff88"
  for(let i=0; i<6; i++) {
     const ang = (i / 6) * Math.PI * 2 + timer * 0.05
     const wx = Math.cos(ang) * 40
     const wy = Math.sin(ang) * 40
     ctx.beginPath()
     ctx.moveTo(wx, wy - 10)
     ctx.lineTo(wx + 10, wy)
     ctx.lineTo(wx, wy + 10)
     ctx.lineTo(wx - 10, wy)
     ctx.fill()
  }

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