import {
  Player,
  Bullet,
  PlayerBullet,
  Enemy,
  Boss,
  PowerUp,
  type GameState,
  type Keys,
  type EnemyType,
  type BulletPattern,
  type MovePattern,
  type PowerUpType,
} from "./game-types"
import { BulletPatternGenerator } from "./bullet-patterns"

export const GAME_WIDTH = 384
export const GAME_HEIGHT = 448
const PLAYER_MARGIN = 16

// Game Manager class
export class GameManager {
  private state: GameState
  private patterns: BulletPattern[] = ["aimed", "radial", "spiral", "random", "wave"]
  private moves: MovePattern[] = ["straight", "sine", "circle", "static"]
  private types: EnemyType[] = ["fairy", "ghost", "spirit"]

  constructor(highScore: number = 0) {
    this.state = this.createInitialState(highScore)
  }

  private createInitialState(highScore: number = 0): GameState {
    return {
      player: new Player(GAME_WIDTH / 2, GAME_HEIGHT - 60),
      bullets: [],
      playerBullets: [],
      enemies: [],
      boss: null,
      powerUps: [],
      gameStatus: "menu",
      stage: 1,
      stageTimer: 0,
      highScore,
      time: 0,
      difficulty: "normal",
    }
  }

  getState(): GameState {
    return this.state
  }

  resetGame(highScore: number): void {
    this.state = {
      ...this.createInitialState(highScore),
      gameStatus: "playing",
    }
  }

  update(keys: Keys, deltaTime: number): void {
    if (this.state.gameStatus !== "playing") return

    this.state.stageTimer += 1
    this.state.time += 1

    this.updatePlayer(keys)
    this.handlePlayerShooting(keys)
    this.handleBomb(keys)
    this.spawnEnemies()
    this.updateEntities()
    this.handleEnemyShooting()
    this.handleBossShooting()
    this.checkCollisions()
    this.updateHighScore()
    this.checkGameOver()
    this.limitBullets()
  }

  private updatePlayer(keys: Keys): void {
    const player = this.state.player
    let dx = 0
    let dy = 0

    if (keys.up) dy -= 1
    if (keys.down) dy += 1
    if (keys.left) dx -= 1
    if (keys.right) dx += 1

    player.move(dx, dy, keys.focus, GAME_WIDTH, GAME_HEIGHT, PLAYER_MARGIN)
    player.update()
  }

  private handlePlayerShooting(keys: Keys): void {
    if (keys.shoot && this.state.stageTimer % 5 === 0) {
      const bullets = this.spawnPlayerBullets()
      this.state.playerBullets.push(...bullets)
    }
  }

  private spawnPlayerBullets(): PlayerBullet[] {
    const player = this.state.player
    const bullets: PlayerBullet[] = []
    const power = Math.min(player.power, 4)

    // Center bullet
    bullets.push(new PlayerBullet(player.x, player.y - 20, -12, 8, 16, 1))

    // Side bullets
    if (power >= 1) {
      bullets.push(new PlayerBullet(player.x - 15, player.y - 15, -11, 6, 12, 1))
      bullets.push(new PlayerBullet(player.x + 15, player.y - 15, -11, 6, 12, 1))
    }

    if (power >= 3) {
      bullets.push(new PlayerBullet(player.x - 25, player.y - 10, -10, 5, 10, 1))
      bullets.push(new PlayerBullet(player.x + 25, player.y - 10, -10, 5, 10, 1))
    }

    return bullets
  }

  private handleBomb(keys: Keys): void {
    if (keys.bomb && this.state.player.useBomb()) {
      this.state.bullets = []

      // Damage all enemies
      this.state.enemies.forEach((e) => e.takeDamage(10))

      // Damage boss
      if (this.state.boss) {
        this.state.boss.takeDamage(20)
      }
    }
  }

  private spawnEnemies(): void {
    const { stageTimer, stage, boss, enemies } = this.state

    // Spawn boss
    if (stageTimer === 1800 && !boss) {
      this.state.boss = new Boss(stage, GAME_WIDTH)
      this.state.bullets = []
      return
    }

    // No enemies during boss fight
    if (boss) return

    // Wave spawning
    if (enemies.length < 8) {
      // Single enemy spawn
      if (stageTimer % 90 === 0) {
        const newEnemy = new Enemy(
          50 + Math.random() * (GAME_WIDTH - 100),
          -30,
          this.types[Math.floor(Math.random() * Math.min(stage, this.types.length))],
          this.patterns[Math.floor(Math.random() * this.patterns.length)],
          this.moves[Math.floor(Math.random() * this.moves.length)]
        )
        this.state.enemies.push(newEnemy)
      }

      // Formation spawn
      if (stageTimer % 300 === 150) {
        const count = 3 + stage
        for (let i = 0; i < count; i++) {
          const newEnemy = new Enemy(
            80 + i * ((GAME_WIDTH - 160) / (count - 1)),
            -30 - i * 20,
            "fairy",
            "aimed",
            "straight"
          )
          this.state.enemies.push(newEnemy)
        }
      }
    }
  }

  private updateEntities(): void {
    // Update enemies
    this.state.enemies = this.state.enemies
      .map((e) => {
        e.update()
        return e
      })
      .filter((e) => !e.isOutOfBounds(GAME_HEIGHT) && e.isAlive())

    // Update boss
    if (this.state.boss) {
      this.state.boss.update()

      // Check boss death
      if (!this.state.boss.isAlive()) {
        this.handleBossDeath()
      }
    }

    // Update bullets
    this.state.bullets = this.state.bullets
      .map((b) => {
        b.update()
        return b
      })
      .filter((b) => !b.isOutOfBounds(GAME_WIDTH, GAME_HEIGHT))

    // Update player bullets
    this.state.playerBullets = this.state.playerBullets
      .map((b) => {
        b.update()
        return b
      })
      .filter((b) => !b.isOutOfBounds())

    // Update power-ups
    this.state.powerUps = this.state.powerUps
      .map((p) => {
        p.update()
        return p
      })
      .filter((p) => !p.isOutOfBounds(GAME_HEIGHT))
  }

  private handleEnemyShooting(): void {
    this.state.enemies.forEach((enemy) => {
      if (enemy.shouldShoot()) {
        const newBullets = BulletPatternGenerator.generatePattern(
          enemy.pattern,
          enemy.x,
          enemy.y,
          this.state.player.x,
          this.state.player.y,
          this.state.stageTimer
        )
        this.state.bullets.push(...newBullets)
      }
    })
  }

  private handleBossShooting(): void {
    if (!this.state.boss) return

    if (this.state.boss.shouldShoot()) {
      const newBullets = BulletPatternGenerator.generateBossPattern(
        this.state.boss,
        this.state.player.x,
        this.state.player.y,
        this.state.stageTimer
      )
      this.state.bullets.push(...newBullets)
      this.state.boss.resetShootTimer()
    }
  }

  private handleBossDeath(): void {
    if (!this.state.boss) return

    this.state.player.addScore(10000)

    // Drop power-ups
    this.state.powerUps.push(
      new PowerUp(this.state.boss.x - 20, this.state.boss.y, "power"),
      new PowerUp(this.state.boss.x, this.state.boss.y, "life"),
      new PowerUp(this.state.boss.x + 20, this.state.boss.y, "bomb")
    )

    // Check victory
    if (this.state.stage >= 3) {
      this.state.gameStatus = "victory"
    } else {
      this.state.stage += 1
      this.state.stageTimer = 0
    }

    this.state.boss = null
    this.state.bullets = []
  }

  private checkCollisions(): void {
    this.checkPlayerBulletCollisions()
    this.checkEnemyBulletCollisions()
    this.checkPowerUpCollisions()
    this.checkGrazeCollisions()
  }

  private checkPlayerBulletCollisions(): void {
    const player = this.state.player
    const newPowerUps: PowerUp[] = []

    // Player bullets vs enemies
    this.state.playerBullets = this.state.playerBullets.filter((pb) => {
      for (let i = 0; i < this.state.enemies.length; i++) {
        const enemy = this.state.enemies[i]

        if (pb.checkCollision(enemy)) {
          const killed = enemy.takeDamage(pb.damage)

          if (killed) {
            player.addScore(enemy.points)

            // Spawn power-ups
            if (Math.random() < 0.3) {
              const types: PowerUpType[] = ["power", "power", "point", "point", "bomb"]
              newPowerUps.push(
                new PowerUp(enemy.x, enemy.y, types[Math.floor(Math.random() * types.length)])
              )
            }
          }
          return false
        }
      }

      // Player bullets vs boss
      if (this.state.boss && pb.checkCollision(this.state.boss)) {
        this.state.boss.takeDamage(pb.damage)
        player.addScore(10)
        return false
      }

      return true
    })

    // Clean up dead enemies
    this.state.enemies = this.state.enemies.filter((e) => e.isAlive())

    // Add new power-ups
    this.state.powerUps.push(...newPowerUps)
  }

  private checkEnemyBulletCollisions(): void {
    const player = this.state.player

    if (player.invincible) return

    for (const bullet of this.state.bullets) {
      if (bullet.checkCollisionWithPlayer(player)) {
        player.takeDamage()
        player.setPosition(GAME_WIDTH / 2, GAME_HEIGHT - 80)
        this.state.bullets = []
        break
      }
    }
  }

  private checkPowerUpCollisions(): void {
    const player = this.state.player

    this.state.powerUps = this.state.powerUps.filter((pu) => {
      if (pu.checkCollisionWithPlayer(player)) {
        pu.applyEffect(player)
        return false
      }
      return true
    })
  }

  private checkGrazeCollisions(): void {
    const player = this.state.player

    if (player.invincible) return

    this.state.bullets.forEach((bullet) => {
      if (bullet.checkGrazeWithPlayer(player)) {
        player.addGraze()
      }
    })
  }

  private updateHighScore(): void {
    if (this.state.player.score > this.state.highScore) {
      this.state.highScore = this.state.player.score
    }
  }

  private checkGameOver(): void {
    if (!this.state.player.isAlive()) {
      this.state.gameStatus = "gameover"
    }
  }

  private limitBullets(): void {
    if (this.state.bullets.length > 500) {
      this.state.bullets = this.state.bullets.slice(-500)
    }
  }
}

// Factory function for backwards compatibility
export function createInitialState(highScore: number = 0): GameState {
  const manager = new GameManager(highScore)
  return manager.getState()
}

export function updateGame(state: GameState, keys: Keys, deltaTime: number): GameState {
  // Create a temporary manager with the current state
  const manager = new GameManager()
  // Override its state
  Object.assign(manager, { state })
  manager.update(keys, deltaTime)
  return manager.getState()
}