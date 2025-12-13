export interface Vector2D {
  x: number
  y: number
}

export type BulletColor = "pink" | "cyan" | "yellow" | "green" | "red" | "white"
export type BulletType = "circle" | "rice" | "kunai" | "star" | "orb"
export type EnemyType = "fairy" | "ghost" | "spirit"
export type PowerUpType = "power" | "point" | "bomb" | "life"
export type BulletPattern = "spiral" | "radial" | "aimed" | "random" | "wave" | "flower"
export type MovePattern = "straight" | "sine" | "circle" | "static"

let entityIdCounter = 0;
export function generateEntityId(): string {
  return `entitity-${entityIdCounter++}`;
}

//Base Entity Class
export abstract class Entity {
  id: string
  x: number
  y: number
  width: number
  height: number
  
  constructor(x: number, y: number, width: number, height: number) {
    this.id = generateEntityId();
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }
  
  abstract update(deltaTime?: number): void;
  
  getPosition(): Vector2D {
    return { x: this.x, y: this.y };
  }
  
  setPosition(x: number, y: number): void {
    this.x = x;
    this.y = y;
  }
  
  checkCollision(other: Entity): boolean {
    return (
      this.x < other.x + other.width / 2 &&
      this.x + this.width > other.x - other.width / 2 &&
      this.y < other.y + other.height / 2 &&
      this.y + this.height > other.y - other.height / 2
    );
  }
}

//Player Class
export class Player extends Entity {
  speed: number
  focusSpeed: number
  lives: number
  bombs: number
  power: number
  score: number
  invincible: boolean
  invincibleTimer: number
  bombVisualTimer: number // NEW: Tracks the visual effect duration
  hitboxRadius: number
  graze: number
  point: number
  pointMax: number
  
  constructor(x: number, y: number) {
    super(x, y, 32, 48);
    this.speed = 2.5; 
    this.focusSpeed = 1.2;
    this.lives = 3;
    this.bombs = 3;
    this.power = 0;
    this.score = 0;
    this.invincible = false;
    this.invincibleTimer = 0;
    this.bombVisualTimer = 0; // Initialize
    this.hitboxRadius = 2.5;
    this.graze = 0;
    this.point = 0;
    this.pointMax = 250;
  }
  
  update(deltaTime?: number): void {
    if(this.invincible) {
      this.invincibleTimer -= 1;
      
      if(this.invincibleTimer <= 0) {
        this.invincible = false;
      }
    }

    // NEW: Count down the visual effect
    if (this.bombVisualTimer > 0) {
      this.bombVisualTimer -= 1;
    }
  }
  
  move(dx: number, dy: number, focused: boolean, gameWidth: number, gameHeight: number, margin: number): void {
    const speed = focused ? this.focusSpeed : this.speed;
    this.x += dx * speed;
    this.y += dy * speed;
    this.clampPosition(gameWidth, gameHeight, margin);
  }
  
  clampPosition(gameWidth: number, gameHeight: number, margin: number): void {
    this.x = Math.max(margin, Math.min(gameWidth - margin, this.x));
    this.y = Math.max(margin, Math.min(gameHeight - margin, this.y));
  }
  
  takeDamage(): void {
    if(!this.invincible) {
      this.lives -= 1;
      this.invincible = true;
      this.invincibleTimer = 180;
      this.power = Math.max(0, this.power - 1);
    }
  }
  
  useBomb(): boolean {
    if(this.bombs > 0 && !this.invincible) {
      this.bombs -= 1;
      this.invincible = true;
      this.invincibleTimer = 180;
      this.bombVisualTimer = 120; // NEW: Trigger 2 seconds of visuals
      return true;
    }
    return false;
  }
  
  addPower(amount: number = 1): void {
    this.power = Math.min(this.power + amount, 4);
  }
  
  addBomb(amount: number = 1): void {
    this.bombs = Math.min(this.bombs + amount, 5);
  }
  
  addLife(amount: number = 1): void {
    this.lives = Math.min(this.lives + amount, 5);
  }
  
  addScore(points: number): void {
    this.score += points;
  }
  
  addGraze(): void {
    this.graze += 1;
    this.score += 10;
  }
  
  isAlive(): boolean {
    return this.lives > 0;
  }
  
  checkCircleCollision(x: number, y: number, radius: number): boolean {
    const dx = x - this.x;
    const dy = y - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < radius + this.hitboxRadius;
  }
  
  checkGraze(x: number, y: number, radius: number): boolean {
    const dx = x - this.x;
    const dy = y - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < 24 && distance > this.hitboxRadius + radius;
  }
}

//Bullet class
export class Bullet extends Entity {
  vx: number
  vy: number
  radius: number
  color: BulletColor
  type: BulletType
  angle: number
  speed: number
  grazed: boolean
  
  constructor(x: number, y: number, angle: number, speed: number, color: BulletColor = "red", type: BulletType = "rice", radius: number = 6) {
    super(x, y, radius * 2, radius * 2);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.radius = radius;
    this.color = color;
    this.type = type;
    this.angle = angle;
    this.speed = speed;
    this.grazed = false;
  }
  
  update(): void {
    this.x += this.vx;
    this.y += this.vy;
  }
  
  isOutOfBounds(gameWidth: number, gameHeight: number): boolean {
    return this.x < -20 || this.x > gameWidth + 20 || this.y < -20 || this.y > gameHeight + 20;
  }
  
  checkCollisionWithPlayer(player: Player): boolean {
    return player.checkCircleCollision(this.x, this.y, this.radius);
  }
  
  checkGrazeWithPlayer(player: Player): boolean {
    if (this.grazed) return false;
    if (player.checkGraze(this.x, this.y, this.radius)) {
      this.grazed = true;
      return true;
    }
    return false;
  }
}

// Player Bullet class
export class PlayerBullet extends Entity {
  vy: number
  damage: number
  
  constructor(x: number, y: number, vy: number, width: number, height: number, damage: number = 1) {
    super(x, y, width, height);
    this.vy = vy;
    this.damage = damage;
  }
  
  update(): void {
    this.y += this.vy;
  }
  
  isOutOfBounds(): boolean {
    return this.y < -20;
  }
}

//Enemy class
export class Enemy extends Entity {
  health: number
  maxHealth: number
  type: EnemyType
  pattern: BulletPattern
  shootTimer: number
  shootInterval: number
  movePattern: MovePattern
  moveTimer: number
  points: number
  
  constructor(x: number, y: number, type: EnemyType, pattern: BulletPattern, movePattern: MovePattern) {
    const configs: Record<EnemyType, { width: number; height: number; health: number; points: number; shootInterval: number }> = {
      fairy: { width: 24, height: 24, health: 3, points: 100, shootInterval: 60 },
      ghost: { width: 28, height: 28, health: 5, points: 200, shootInterval: 45 },
      spirit: { width: 32, height: 32, health: 8, points: 300, shootInterval: 30 },
    };
    
    const config = configs[type];
    super(x, y, config.width, config.height);
    this.health = config.health;
    this.maxHealth = config.health;
    this.type = type;
    this.pattern = pattern;
    this.shootTimer = Math.random() * config.shootInterval;
    this.shootInterval = config.shootInterval;
    this.movePattern = movePattern;
    this.moveTimer = 0;
    this.points = config.points;
  }
  
  update(): void {
    this.shootTimer -= 1;
    if(this.shootTimer <= 0) {
      this.shootTimer = this.shootInterval;
    }
    
    this.moveTimer += 0.05;
    
    switch(this.movePattern) {
      case "straight":
        this.y += 0.5; 
        break;
      case "sine":
        this.y += 0.4; 
        this.x += Math.sin(this.moveTimer * 2) * 1.2;
        break;
      case "circle":
        this.x += Math.cos(this.moveTimer) * 0.8; 
        this.y += 0.5 + Math.sin(this.moveTimer) * 0.3;
        break;
      case "static":
        if (this.y < 100) this.y += 0.4;
        break;
    }
  }
  
  takeDamage(damage: number): boolean {
    this.health -= damage;
    return this.health <= 0;
  }
  
  isAlive(): boolean {
    return this.health > 0;
  }
  
  isOutOfBounds(gameHeight: number): boolean {
    return this.y > gameHeight + 50;
  }
  
  shouldShoot(): boolean {
    return this.shootTimer <= 0;
  }
}

//boss class
export class Boss extends Entity {
  health: number
  maxHealth: number
  phase: number
  patterns: BulletPattern[]
  currentPattern: number
  shootTimer: number
  moveTimer: number
  name: string
  anchorX: number
  
  constructor(stage: number, gameWidth: number) {
    super(gameWidth / 2, -100, 64, 64);
    
    const patterns: BulletPattern[][] = [
      ["spiral", "radial", "aimed"],
      ["flower", "spiral", "radial"],
      ["flower", "spiral", "radial", "wave"],
    ];
    
    this.health = 1500 + stage * 500;
    this.maxHealth = this.health;
    this.phase = 0;
    this.patterns = patterns[Math.min(stage - 1, patterns.length - 1)];
    this.currentPattern = 0;
    this.shootTimer = 0;
    this.moveTimer = 0;
    this.name = stage === 1 ? "CIRNO" : stage === 2 ? "MARISA" : "REIMU";
    this.anchorX = gameWidth / 2;
  }
  
  update(): void {
    if (this.moveTimer === 0) {
      this.y += 2.0; 
      if (this.y >= 120) {
        this.moveTimer = 0.01; 
      }
    } 
    else {
      this.shootTimer -= 1;
      this.moveTimer += 0.02;

      const swayDistance = this.anchorX * 0.6;
      this.x = this.anchorX + Math.sin(this.moveTimer * 0.8) * swayDistance; 
      this.y = 120 + Math.sin(this.moveTimer * 1.5) * 15;
    }
    
    const healthPercent = this.health / this.maxHealth;
    if(healthPercent < 0.3 && this.phase < 2) {
      this.phase = 2;
      this.currentPattern = (this.currentPattern + 1) % this.patterns.length;
    } else if(healthPercent < 0.6 && this.phase < 1) {
      this.phase = 1;
      this.currentPattern = (this.currentPattern + 1) % this.patterns.length;
    }
  }
  
  takeDamage(damage: number): boolean {
    this.health -= damage;
    return this.health <= 0;
  }
  
  isAlive(): boolean {
    return this.health > 0;
  }
  
  shouldShoot(): boolean {
    return this.moveTimer > 0 && this.shootTimer <= 0;
  }
  
  resetShootTimer(): void {
    this.shootTimer = 50 - this.phase * 5;
  }
  
  getCurrentPattern(): BulletPattern {
    return this.patterns[this.currentPattern];
  }
}

export class PowerUp extends Entity {
  vy: number
  type: PowerUpType
  
  constructor(x: number, y: number, type: PowerUpType) {
    super(x, y, 12, 12);
    this.vy = 2;
    this.type = type;
  }
  
  update(): void {
    this.y += this.vy;
  }
  
  isOutOfBounds(gameHeight: number): boolean {
    return this.y > gameHeight + 20;
  }
  
  checkCollisionWithPlayer(player: Player): boolean {
    const dx = this.x - player.x;
    const dy = this.y - player.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < 30;
  }
  
  applyEffect(player: Player): void {
    switch (this.type) {
      case "power":
        player.addPower();
        player.addScore(10);
        break;
        
      case "point":
        player.addScore(100);
        break;
        
      case "bomb":
        player.addBomb();
        break;
        
      case "life":
        player.addLife();
        break;
    }
  }
}

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
  difficulty: "easy" | "normal" | "hard" | "lunatic"
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