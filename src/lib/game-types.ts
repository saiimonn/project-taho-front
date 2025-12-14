export interface Vector2D {
  x: number
  y: number
}

export type BulletColor = "pink" | "cyan" | "yellow" | "green" | "red" | "white" | "blue"
export type BulletType = "circle" | "rice" | "kunai" | "star" | "orb" | "ice" | "laser"
export type EnemyType = "fairy" | "ghost" | "spirit"
export type PowerUpType = "power" | "point" | "bomb" | "life"

export type BulletPattern = 
  | "spiral" | "radial" | "aimed" | "random" | "wave" | "flower" 
  | "icicle" | "perfect-freeze" | "diamond-blizzard" 
  | "vampire-night" | "red-magic" | "scarlet-gungnir"
  | "stardust-reverie" | "non-directional-laser" | "master-spark"

export type MovePattern = "straight" | "sine" | "circle" | "static"
export type ParticleType = "spark" | "smoke" | "ring" | "energy"

let entityIdCounter = 0;
export function generateEntityId(): string {
  return `entitity-${entityIdCounter++}`;
}

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

export class Particle extends Entity {
  vx: number
  vy: number
  life: number
  maxLife: number
  color: string
  size: number
  type: ParticleType

  constructor(x: number, y: number, color: string, type: ParticleType) {
    super(x, y, 0, 0)
    this.color = color
    this.type = type
    
    const angle = Math.random() * Math.PI * 2
    const speed = Math.random() * 2 + 0.5
    
    if (type === "spark") {
      this.vx = Math.cos(angle) * speed * 3
      this.vy = Math.sin(angle) * speed * 3
      this.life = 30 + Math.random() * 20
      this.size = 2 + Math.random() * 3
    } else if (type === "energy") {
      this.vx = (Math.random() - 0.5) * 1
      this.vy = (Math.random() - 0.5) * 1 - 2 
      this.life = 40 + Math.random() * 20
      this.size = 4 + Math.random() * 4
    } else {
      this.vx = Math.cos(angle) * speed
      this.vy = Math.sin(angle) * speed
      this.life = 40
      this.size = 3
    }
    this.maxLife = this.life
  }

  update(): void {
    this.x += this.vx
    this.y += this.vy
    this.life -= 1
    this.vx *= 0.95
    this.vy *= 0.95
    if (this.life < 10) {
      this.size *= 0.8
    }
  }
}

export class Player extends Entity {
  speed: number
  focusSpeed: number
  lives: number
  bombs: number
  power: number
  score: number
  invincible: boolean
  invincibleTimer: number
  bombVisualTimer: number
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
    this.bombVisualTimer = 0; 
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
      this.bombVisualTimer = 120; 
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
  
  shouldShoot(): boolean {
    return this.shootTimer <= 0;
  }

  isOutOfBounds(gameHeight: number): boolean {
    return this.y > gameHeight + 50; 
  }
}

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
  stageIndex: number 
  gameWidth: number
  
  // Movement Logic
  destX: number = -1
  destY: number = -1
  moveWait: number = 0
  
  // Phase Transitions
  transitionTimer: number = 0
  pendingPhase: number = -1
  
  cycleTimer: number 
  isResting: boolean
  
  constructor(stage: number, gameWidth: number) {
    super(gameWidth / 2, -100, 64, 64);
    this.gameWidth = gameWidth;
    
    const patterns: BulletPattern[][] = [
      ["icicle", "perfect-freeze", "diamond-blizzard"],
      ["vampire-night", "red-magic", "scarlet-gungnir"],
      ["stardust-reverie", "non-directional-laser", "master-spark"], 
    ];
    
    this.stageIndex = stage;
    this.health = 2000 + stage * 1000;
    
    this.maxHealth = this.health;
    this.phase = 0;
    this.patterns = patterns[Math.min(stage - 1, patterns.length - 1)];
    this.currentPattern = 0;
    this.shootTimer = 0;
    this.moveTimer = 0;
    
    this.name = stage === 1 ? "CIRNO" : stage === 2 ? "REMILIA" : "MARISA";
    this.anchorX = gameWidth / 2;
    
    this.cycleTimer = 0;
    this.isResting = false;
  }
  
  update(): void {
    // 1. Entrance Animation
    if (this.moveTimer === 0) {
      this.y += 2.0; 
      if (this.y >= 120) {
        this.moveTimer = 0.01; 
      }
      return;
    }
    
    this.shootTimer -= 1;
    this.moveTimer += 0.02;

    // 2. MARISA PHASE 3 MOVEMENT
    if (this.name === "MARISA" && this.phase === 2 && this.transitionTimer <= 0) {
        this.cycleTimer++; 
        if (this.cycleTimer >= 1680) this.cycleTimer = 0; 

        if (this.moveWait > 0) {
            this.moveWait--;
        } else {
            if (this.destX === -1) {
                this.destX = 60 + Math.random() * (this.gameWidth - 120);
                this.destY = 60 + Math.random() * 120;
            }
            const dx = this.destX - this.x;
            const dy = this.destY - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const speed = 5.0; 

            if (dist < speed) {
                this.x = this.destX;
                this.y = this.destY;
                this.destX = -1; 
                this.moveWait = 180; 
            } else {
                this.x += (dx / dist) * speed;
                this.y += (dy / dist) * speed;
            }
        }
    } 
    // 3. STANDARD MOVEMENT
    else {
        // Cirno specific logic
        if (this.stageIndex === 1 && this.phase === 0) {
            this.cycleTimer++;
            const ATTACK_DURATION = 300; 
            const REST_DURATION = 180;   
            
            if (!this.isResting) {
                if (this.cycleTimer >= ATTACK_DURATION) {
                this.isResting = true;
                this.cycleTimer = 0;
                }
            } else {
                if (this.cycleTimer >= REST_DURATION) {
                this.isResting = false;
                this.cycleTimer = 0;
                }
            }
        } else {
            this.isResting = false; 
        }

        const swayDistance = 50; 
        this.x = this.anchorX + Math.sin(this.moveTimer * 0.5) * swayDistance; 
        this.y = 120 + Math.sin(this.moveTimer * 1.0) * 10;
    }
    
    // 4. PHASE TRANSITIONS (With 5s Rest)
    const healthPercent = this.health / this.maxHealth;
    
    // Check if we need to start transition
    if (this.transitionTimer === 0) {
        if (healthPercent < 0.3 && this.phase < 2) {
            this.transitionTimer = 300; // 5 Seconds (60fps * 5)
            this.pendingPhase = 2;
        } else if (healthPercent < 0.6 && this.phase < 1) {
            this.transitionTimer = 300; // 5 Seconds
            this.pendingPhase = 1;
        }
    }

    // Execute Transition
    if (this.transitionTimer > 0) {
        this.transitionTimer--;
        
        // When timer hits 0, apply the change
        if (this.transitionTimer <= 0 && this.pendingPhase !== -1) {
            this.phase = this.pendingPhase;
            this.currentPattern = (this.currentPattern + 1) % this.patterns.length;
            this.pendingPhase = -1;
            
            // Marisa P3 Specific Reset
            if (this.name === "MARISA" && this.phase === 2) {
                this.cycleTimer = 0; 
                this.moveWait = 60; 
            }
        }
    }
  }
  
  takeDamage(damage: number): boolean {
    if (this.transitionTimer > 0) return false; // Invincible during transition
    this.health -= damage;
    return this.health <= 0;
  }
  
  isAlive(): boolean {
    return this.health > 0;
  }
  
  shouldShoot(): boolean {
    // Stop shooting if moving entrance, cooldown, resting, or transitioning
    return this.moveTimer > 0 && 
           this.shootTimer <= 0 && 
           !this.isResting && 
           this.transitionTimer <= 0;
  }
  
  resetShootTimer(): void {
    const pattern = this.patterns[this.currentPattern];
    
    // MARISA TIMERS
    if (pattern === "master-spark") {
      this.shootTimer = 240; 
    } else if (pattern === "non-directional-laser") {
      this.shootTimer = 60; 
    } else if (pattern === "stardust-reverie") {
      this.shootTimer = 8; 
    }
    // Existing timers
    else if (pattern === "scarlet-gungnir") {
      this.shootTimer = 120;
    } else if (pattern === "vampire-night") {
      this.shootTimer = 15; 
    } else if (pattern === "icicle") {
      this.shootTimer = 10;
    } else if (pattern === "perfect-freeze") {
      this.shootTimer = 60;
    } else {
      this.shootTimer = 45;
    }
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
  particles: Particle[]
  screenShake: number
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