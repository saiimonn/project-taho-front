export interface Vector2D {
  x: number
  y: number
}

export interface Player {
  x: number
  y: number
  width: number
  height: number
  speed: number
  focusSpeed: number
  lives: number
  bombs: number
  power: number
  score: number
  invincible: boolean
  invincibleTimer: number
  hitboxRadius: number
  graze: number
  point: number
  pointMax: number
}

export interface Bullet {
  id: string
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  color: BulletColor
  type: BulletType
  angle?: number
  speed?: number
  lifetime?: number
  grazed?: boolean
}

export interface PlayerBullet {
  id: string
  x: number
  y: number
  vy: number
  width: number
  height: number
  damage: number
}

export interface Enemy {
  id: string
  x: number
  y: number
  width: number
  height: number
  health: number
  maxHealth: number
  type: EnemyType
  pattern: BulletPattern
  shootTimer: number
  shootInterval: number
  movePattern: MovePattern
  moveTimer: number
  points: number
}

export interface Boss {
  id: string
  x: number
  y: number
  width: number
  height: number
  health: number
  maxHealth: number
  phase: number
  patterns: BulletPattern[]
  currentPattern: number
  shootTimer: number
  moveTimer: number
  name: string
}



export interface PowerUp {
  id: string
  x: number
  y: number
  vy: number
  type: PowerUpType
}

export type BulletColor = "pink" | "cyan" | "yellow" | "green" | "red" | "white"
export type BulletType = "circle" | "rice" | "kunai" | "star" | "orb"
export type EnemyType = "fairy" | "ghost" | "spirit"
export type PowerUpType = "power" | "point" | "bomb" | "life"
export type BulletPattern = "spiral" | "radial" | "aimed" | "random" | "wave" | "flower"
export type MovePattern = "straight" | "sine" | "circle" | "static"

export interface GameState {
  player: Player
  bullets: Bullet[]
  playerBullets: PlayerBullet[]
  enemies: Enemy[]
  boss: Boss | null
  powerUps: PowerUp[]
  gameStatus: "menu" | "playing" | "paused" | "gameover" | "victory"
  stage: number
  stageTimer: number
  highScore: number
  time: number
  difficulty: "easy" | "Normal" | "Hard" | "Lunatic"
}

export interface Keys {
  up: boolean
  down: boolean
  left: boolean
  right: boolean
  shoot: boolean
  focus: boolean
  bomb: boolean
}