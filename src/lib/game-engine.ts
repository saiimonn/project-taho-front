import {
  Player,
  Bullet,
  PlayerBullet,
  Enemy,
  Boss,
  PowerUp,
  Particle,
  type GameState,
  type Keys,
  type EnemyType,
  type BulletPattern,
  type MovePattern,
  type PowerUpType,
} from "./game-types"
import { BulletPatternGenerator } from "./bullet-patterns"

export const GAME_WIDTH = 600
export const GAME_HEIGHT = 800
const PLAYER_MARGIN = 16

export class GameManager {
  private state: GameState
  private patterns: BulletPattern[] = ["aimed", "radial", "spiral", "random", "wave"]
  private moves: MovePattern[] = ["straight", "sine", "circle", "static"]
  private types: EnemyType[] = ["fairy", "ghost", "spirit"]

  constructor(highScore: number = 0) {
    this.state = this.createInitialState(highScore)
  }

  getState(): GameState {
    return this.state
  }

  private createInitialState(highScore: number = 0): GameState {
    return {
      player: new Player(GAME_WIDTH / 2, GAME_HEIGHT - 60),
      bullets: [],
      playerBullets: [],
      enemies: [],
      boss: null,
      powerUps: [],
      particles: [],
      screenShake: 0,
      gameStatus: "menu",
      stage: 1, // changed for testing purposes 
      stageTimer: 0, // changed for testing purposes
      highScore,
      time: 0,
      difficulty: "normal",
    }
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
    
    if (this.state.screenShake > 0) {
      this.state.screenShake *= 0.9;
      if (this.state.screenShake < 0.5) this.state.screenShake = 0;
    }

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

  private spawnParticles(x: number, y: number, count: number, color: string, type: "spark" | "energy") {
    for(let i=0; i<count; i++) {
      this.state.particles.push(new Particle(x, y, color, type))
    }
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

    bullets.push(new PlayerBullet(player.x, player.y - 20, -12, 8, 16, 1))

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
      this.state.enemies.forEach((e) => e.takeDamage(10))
      
      this.state.screenShake = 15;
      
      if (this.state.boss) {
        this.state.boss.takeDamage(20)
      }
    }
  }

  private spawnEnemies(): void {
    const { stageTimer, stage, boss, enemies } = this.state

    if (stageTimer === 1800 && !boss) {
      this.state.boss = new Boss(stage, GAME_WIDTH)
      this.state.bullets = []
      this.state.screenShake = 10;
      return
    }

    if (boss) return

    if (enemies.length < 12) {
      if (stageTimer > 10 && stageTimer % 60 === 0) { 
        const enemyType = this.types[Math.floor(Math.random() * Math.min(stage, this.types.length))]!
        const pattern = this.patterns[Math.floor(Math.random() * this.patterns.length)]!
        const move = this.moves[Math.floor(Math.random() * this.moves.length)]!

        const newEnemy = new Enemy(
          30 + Math.random() * (GAME_WIDTH - 60),
          -30,
          enemyType,
          pattern,
          move
        )
        this.state.enemies.push(newEnemy)
      }

      if (stageTimer > 60 && stageTimer % 300 === 150) {
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
    this.state.particles = this.state.particles
      .map(p => { p.update(); return p; })
      .filter(p => p.life > 0)

    this.state.enemies = this.state.enemies
      .map((e) => {
        e.update()
        return e
      })
      .filter((e) => !e.isOutOfBounds(GAME_HEIGHT) && e.isAlive())

    if (this.state.boss) {
      this.state.boss.update()
      
      if (this.state.boss.shootTimer < 60 && this.state.boss.shootTimer > 0) {
         if (this.state.boss.shootTimer % 5 === 0) {
            this.spawnParticles(
                this.state.boss.x + (Math.random() - 0.5) * 100, 
                this.state.boss.y + (Math.random() - 0.5) * 100,
                1,
                "#ff00ff",
                "energy"
            )
         }
      }
      
      if (!this.state.boss.isAlive()) {
        this.handleBossDeath()
      }
    }

    this.state.bullets = this.state.bullets
      .map((b) => {
        b.update()
        return b
      })
      .filter((b) => !b.isOutOfBounds(GAME_WIDTH, GAME_HEIGHT))

    this.state.playerBullets = this.state.playerBullets
      .map((b) => {
        b.update()
        return b
      })
      .filter((b) => !b.isOutOfBounds())

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
      
      this.spawnParticles(this.state.boss.x, this.state.boss.y, 20, "#ffffff", "spark")
      this.state.screenShake = 5;
    }
  }

  private handleBossDeath(): void {
    if (!this.state.boss) return

    this.state.player.addScore(10000)
    
    this.spawnParticles(this.state.boss.x, this.state.boss.y, 100, "#ff0088", "spark")
    this.state.screenShake = 20;

    this.state.powerUps.push(
      new PowerUp(this.state.boss.x - 20, this.state.boss.y, "power"),
      new PowerUp(this.state.boss.x, this.state.boss.y, "life"),
      new PowerUp(this.state.boss.x + 20, this.state.boss.y, "bomb")
    )

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

    this.state.playerBullets = this.state.playerBullets.filter((pb) => {
      let hit = false
      
      for (const enemy of this.state.enemies) {
        if (pb.checkCollision(enemy)) {
          const killed = enemy.takeDamage(pb.damage)
          this.spawnParticles(pb.x, pb.y, 3, "#ffffff", "spark")
          
          if (killed) {
            player.addScore(enemy.points)
            this.spawnParticles(enemy.x, enemy.y, 15, "#ffaa00", "spark")
            
            if (Math.random() < 0.3) {
              const types: PowerUpType[] = ["power", "power", "point", "point", "bomb"]
              const type = types[Math.floor(Math.random() * types.length)]! 
              newPowerUps.push(
                new PowerUp(enemy.x, enemy.y, type)
              )
            }
          }
          hit = true
          break 
        }
      }

      if (!hit && this.state.boss && pb.checkCollision(this.state.boss)) {
        this.state.boss.takeDamage(pb.damage)
        this.spawnParticles(pb.x, pb.y, 1, "#aaaaff", "spark")
        player.addScore(10)
        hit = true
      }

      return !hit
    })

    this.state.enemies = this.state.enemies.filter((e) => e.isAlive())
    this.state.powerUps.push(...newPowerUps)
  }

  private checkEnemyBulletCollisions(): void {
    const player = this.state.player
    if (player.invincible) return

    for (const bullet of this.state.bullets) {
      if (bullet.checkCollisionWithPlayer(player)) {
        player.takeDamage()
        this.state.screenShake = 15;
        this.spawnParticles(player.x, player.y, 30, "#ff0000", "spark")
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
        this.spawnParticles(player.x, player.y, 1, "#ffffff", "spark")
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
    if (this.state.bullets.length > 2000) {
      this.state.bullets = this.state.bullets.slice(-2000)
    }
  }
}