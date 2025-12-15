import { Bullet, Boss, type BulletColor, type BulletPattern, type BulletType } from "./game-types";
import { GAME_WIDTH, GAME_HEIGHT } from "./game-engine";

export class BulletPatternGenerator {
  private static readonly COLORS: BulletColor[] = ["red", "white", "red", "white"];
  
  private static createBullet(x: number, y: number, angle: number, speed: number, color: BulletColor = "red", type: BulletType = "rice", radius: number = 6): Bullet {
    return new Bullet(x, y, angle, speed, color, type, radius)
  }
  
  static generatePattern(pattern: BulletPattern, x: number, y: number, targetX: number, targetY: number, timer: number): Bullet[] {
    switch(pattern) {
      case "spiral": return this.generateSpiral(x, y, timer);
      case "radial": return this.generateRadial(x, y);
      case "aimed": return this.generateAimed(x, y, targetX, targetY);
      case "random": return this.generateRandom(x, y);
      case "wave": return this.generateWave(x, y, timer);
      case "flower": return this.generateFlower(x, y, timer);
      default: return []
    }
  }
  
  // -- REGULAR ENEMY PATTERNS --
  private static generateSpiral(x: number, y: number, timer: number): Bullet[] {
    const bullets: Bullet[] = [];
    const count = 6;
    const baseAngle = timer * 0.08;
    for (let i = 0; i < count; i++) {
      const angle = baseAngle + (i * Math.PI * 2) / count;
      bullets.push(this.createBullet(x, y, angle, 1.2, this.COLORS[i % 2], "rice", 7));
    }
    return bullets;
  }
  
  private static generateRadial(x: number, y: number): Bullet[] {
    const bullets: Bullet[] = [];
    const count = 12;
    for (let i = 0; i < count; i++) {
      const angle = (i * Math.PI * 2) / count;
      bullets.push(this.createBullet(x, y, angle, 1.3, "red", "rice", 6));
    }
    return bullets;
  }
  
  private static generateAimed(x: number, y: number, targetX: number, targetY: number): Bullet[] {
    const bullets: Bullet[] = [];
    const angle = Math.atan2(targetY - y, targetX - x);
    for (let i = -2; i <= 2; i++){ 
      bullets.push(this.createBullet(x, y, angle + i * 0.12, 1.6, "white", "rice", 5));
    }
    return bullets;
  }
  
  private static generateRandom(x: number, y: number): Bullet[] {
    const bullets: Bullet[] = [];
    const count = 5;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.8 + Math.random() * 1.0;
      bullets.push(this.createBullet(x, y, angle, speed, this.COLORS[Math.floor(Math.random() * 2)], "rice", 5));
    }
    return bullets;
  }
  
  private static generateWave(x: number, y: number, timer: number): Bullet[] {
    const bullets: Bullet[] = [];
    const count = 7;
    const baseAngle = Math.PI / 2 + Math.sin(timer * 0.05) * 0.6;
    for (let i = 0; i < count; i++) {
      const angle = baseAngle + (i - 3) * 0.15;
      bullets.push(this.createBullet(x, y, angle, 1.4, "red", "kunai", 7));
    }
    return bullets;
  }
  
  private static generateFlower(x: number, y: number, timer: number): Bullet[] {
    const bullets: Bullet[] = [];
    const petals = 5;
    const bulletsPerPetal = 2;
    const baseAngle = timer * 0.04;
    for (let i = 0; i < petals; i++) {
      for (let j = 0; j < bulletsPerPetal; j++) {
        const angle = baseAngle + ((i * Math.PI * 2) / petals) + (j - 0.5) * 0.15;
        const speed = 1.0 + j * 0.4;
        bullets.push(this.createBullet(x, y, angle, speed, this.COLORS[i % 2], "orb", 6));
      }
    }
    return bullets;
  }
  
  // -- BOSS PATTERNS --
  static generateBossPattern(boss: Boss, targetX: number, targetY: number, timer: number): Bullet[] {
    const pattern = boss.getCurrentPattern();
    switch(pattern) {
      // CIRNO (Stage 1)
      case "icicle": return this.generateCirnoIcicle(boss, timer);
      case "perfect-freeze": return this.generateCirnoFreeze(boss);
      case "diamond-blizzard": return this.generateCirnoDiamond(boss, timer);

      // REMILIA (Stage 2)
      case "vampire-night": return this.generateRemiliaVampire(boss, timer, targetX, targetY);
      case "red-magic": return this.generateRemiliaRedMagic(boss, timer);
      case "scarlet-gungnir": return this.generateRemiliaGungnir(boss, targetX, targetY);

      // MARISA (Stage 3)
      case "stardust-reverie": return this.generateMarisaStardust(boss, timer);
      case "non-directional-laser": return []; // Handled by GameEngine
      // Phase 3 Cycle is handled by GameEngine calling specific functions below
      case "master-spark": return []; 
      
      // Fallbacks
      default: return this.generateBossAimed(boss, targetX, targetY);
    }
  }

  // --- CIRNO PATTERNS ---
  private static generateCirnoIcicle(boss: Boss, timer: number): Bullet[] {
    const bullets: Bullet[] = []
    if (timer % 3 !== 0) return []

    // 1. Clockwise Yellow Stream
    const cwArms = 4
    const cwSpin = timer * 0.03 
    for (let i = 0; i < cwArms; i++) {
      const angle = cwSpin + (i * Math.PI * 2) / cwArms
      bullets.push(this.createBullet(boss.x, boss.y, angle, 1.8, "yellow", "rice", 6))
    }

    // 2. Counter-Clockwise White Stream
    const ccwArms = 4
    const ccwSpin = -timer * 0.03
    for (let i = 0; i < ccwArms; i++) {
      const angle = ccwSpin + (i * Math.PI * 2) / ccwArms + (Math.PI / ccwArms)
      bullets.push(this.createBullet(boss.x, boss.y, angle, 1.5, "white", "rice", 6))
    }
    return bullets
  }

  private static generateCirnoFreeze(boss: Boss): Bullet[] {
    const bullets: Bullet[] = []
    const count = 40 
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = 0.5 + Math.random() * 1.0 
      const color: BulletColor = Math.random() > 0.5 ? "cyan" : "white"
      bullets.push(this.createBullet(boss.x, boss.y, angle, speed, color, "circle", 8))
    }
    return bullets
  }

  private static generateCirnoDiamond(boss: Boss, timer: number): Bullet[] {
    const bullets: Bullet[] = []
    const arms = 12
    const baseAngle = timer * 0.1 

    // 1. Existing Diamond Dust (Background)
    for (let i = 0; i < arms; i++) {
      const angle = baseAngle + (i * Math.PI * 2) / arms
      bullets.push(this.createBullet(boss.x, boss.y, angle, 1.8, "blue", "ice", 8)) 
      bullets.push(this.createBullet(boss.x, boss.y, angle - 0.1, 1.5, "cyan", "ice", 6)) 
      bullets.push(this.createBullet(boss.x, boss.y, angle + 0.1, 1.5, "cyan", "ice", 6))
      
      const circleAngle = angle + (Math.PI / arms)
      
      // LAYER 1: Fast Circle
      bullets.push(this.createBullet(boss.x, boss.y, circleAngle, 1.2, "white", "circle", 7))
      
      // LAYER 2: Slow Circle
      bullets.push(this.createBullet(boss.x, boss.y, circleAngle, 0.9, "white", "circle", 7))
    }

    // 2. LASERS (Every 100 frames)
    if (timer % 100 === 0) {
      const laserCount = 6
      const laserBaseAngle = timer * 0.02 
      for (let i = 0; i < laserCount; i++) {
        const angle = laserBaseAngle + (i * Math.PI * 2) / laserCount
        bullets.push(this.createBullet(boss.x, boss.y, angle, 3.5, "cyan", "laser", 10))
      }
    }

    return bullets
  }

  // --- REMILIA PATTERNS ---
  private static generateRemiliaVampire(boss: Boss, timer: number, tx: number, ty: number): Bullet[] {
    const bullets: Bullet[] = []
    const angleToPlayer = Math.atan2(ty - boss.y, tx - boss.x)
    const spread = Math.sin(timer * 0.1) * 0.5 
    
    for(let i = -1; i <= 1; i++) {
      const angle = angleToPlayer + spread + (i * 0.3)
      bullets.push(this.createBullet(boss.x, boss.y, angle, 1.6, "red", "rice", 6))
      bullets.push(this.createBullet(boss.x, boss.y, angle - 0.05, 1.3, "pink", "rice", 6))
    }
    return bullets
  }

  // PHASE 2: RED MAGIC (Continuous + Center Spiral)
  static generateRemiliaRedMagic(boss: Boss, timer: number): Bullet[] {
    const bullets: Bullet[] = []
    
    // 1. Remilia: Rapid Red Spiral (Replaces Circle)
    // HIGH FIRE RATE: Every 4 frames
    if (timer % 4 === 0) {
      const arms = 4
      const spin = timer * 0.08 
      for (let i = 0; i < arms; i++) {
        const angle = spin + (i * Math.PI * 2) / arms
        bullets.push(this.createBullet(boss.x, boss.y, angle, 0.6, "red", "orb", 7))
      }
    }

    // 2. Center Screen: Spiral Gatling Gun
    // SLOW FIRE RATE: Every 12 frames
    if (timer % 12 === 0) {
        const centerX = GAME_WIDTH / 2
        const centerY = GAME_HEIGHT / 2 - 50 
        const spin = timer * 0.1 
        
        bullets.push(this.createBullet(centerX, centerY, spin, 2.5, "pink", "rice", 5))
        bullets.push(this.createBullet(centerX, centerY, spin + 0.1, 2.6, "pink", "rice", 5))
        bullets.push(this.createBullet(centerX, centerY, spin - 0.1, 2.4, "pink", "rice", 5))
    }

    return bullets
  }

  private static generateRemiliaGungnir(boss: Boss, tx: number, ty: number): Bullet[] {
    const bullets: Bullet[] = []
    const angle = Math.atan2(ty - boss.y, tx - boss.x)
    
    // Main "Spear" - Fast line of bullets
    for(let i=0; i<5; i++) {
      bullets.push(this.createBullet(boss.x, boss.y, angle, 2.2 + i * 0.3, "red", "kunai", 8))
    }
    
    // Side "Shockwaves"
    for(let i=0; i<8; i++) {
        const distanceAlongSpear = 20 + Math.random() * 150
        const spawnX = boss.x + Math.cos(angle) * distanceAlongSpear
        const spawnY = boss.y + Math.sin(angle) * distanceAlongSpear
        
        const shockAngle = angle + (Math.random() - 0.5) * 1.5 
        bullets.push(this.createBullet(spawnX, spawnY, shockAngle, 0.8 + Math.random() * 0.7, "white", "rice", 4))
    }
    return bullets
  }
  
  // --- MARISA PATTERNS ---
  
  // Phase 1: Stardust Reverie
  private static generateMarisaStardust(boss: Boss, timer: number): Bullet[] {
    const bullets: Bullet[] = []
    // 1. Primary Wave
    if (timer % 4 === 0) {
      const arms = 8 
      const spin = timer * 0.04 
      for (let i = 0; i < arms; i++) {
        const angle = spin + (i * Math.PI * 2) / arms
        bullets.push(this.createBullet(boss.x, boss.y, angle, 1.3, "yellow", "star", 7))
      }
    }
    // 2. Secondary Wave
    if (timer % 4 === 1) {
      const arms = 8 
      const spin = timer * 0.04 
      for (let i = 0; i < arms; i++) {
        const angle = spin + (i * Math.PI * 2) / arms
        bullets.push(this.createBullet(boss.x, boss.y, angle, 1.3, "red", "star", 7))
      }
    }
    // 3. Ring Burst
    if (timer % 90 === 0) {
      const count = 32
      for(let j=0; j<count; j++) {
           const angle = (j / count) * Math.PI * 2
           bullets.push(this.createBullet(boss.x, boss.y, angle, 1.2, "blue", "star", 6))
      }
    }
    return bullets
  }

  // Phase 2: Non-Directional Laser
  static generateMarisaLaser(boss: Boss, timer: number): Bullet[] {
    const bullets: Bullet[] = []
    // 1. Cross Laser
    if (timer % 4 === 0) {
      const arms = 4
      const laserOffset = (timer / 50) * Math.PI 
      for(let i = 0; i < arms; i++) {
          const angle = laserOffset + (i * Math.PI * 2) / arms
          bullets.push(this.createBullet(boss.x, boss.y, angle, 1.0, "blue", "laser", 4))
      }
    }
    // 2. Pentagram Barrage
    if (timer % 5 === 0) {
        const numPoints = 5
        const orbitRadius = 90
        const orbitSpeed = timer * 0.04
        for(let k = 0; k < numPoints; k++) {
            const angle = orbitSpeed + (k * Math.PI * 2) / numPoints
            const emitterX = boss.x + Math.cos(angle) * orbitRadius
            const emitterY = boss.y + Math.sin(angle) * orbitRadius
            const bulletAngle = Math.atan2(emitterY - boss.y, emitterX - boss.x)
            const swirl = Math.sin(timer * 0.05) * 0.5
            bullets.push(this.createBullet(emitterX, emitterY, bulletAngle + swirl, 2.2, "yellow", "star", 6))
        }
    }
    return bullets
  }

  // Phase 3 Pattern A: 4-CORNER STAR BARRAGE
  static generateMarisaCornerStars(boss: Boss, timer: number): Bullet[] {
    const bullets: Bullet[] = []
    
    // Fire every 45 frames (0.75 seconds) - Rhythmic burst
    if (timer % 45 !== 0) return []

    const corners = [
        { x: 0, y: 0, color: "yellow" as BulletColor },           // Top-Left
        { x: GAME_WIDTH, y: 0, color: "blue" as BulletColor },    // Top-Right
        { x: 0, y: GAME_HEIGHT, color: "green" as BulletColor },  // Bottom-Left
        { x: GAME_WIDTH, y: GAME_HEIGHT, color: "red" as BulletColor } // Bottom-Right
    ]
    
    // Spread: 90 degrees wide angle fan
    const bulletsPerBurst = 7
    const spread = Math.PI / 2 

    corners.forEach(corner => {
        // Aim at center
        const angleToCenter = Math.atan2(400 - corner.y, 300 - corner.x)
        
        for(let i = 0; i < bulletsPerBurst; i++) {
            const offset = spread * (i / (bulletsPerBurst - 1) - 0.5)
            const finalAngle = angleToCenter + offset
            bullets.push(this.createBullet(corner.x, corner.y, finalAngle, 1.2, corner.color, "star", 8))
        }
    })

    return bullets
  }

  // Phase 3 Pattern B: STAR RAIN
  static generateMarisaRain(boss: Boss): Bullet[] {
    // DENSITY REDUCED: 20% chance to run
    if (Math.random() > 0.2) return [] 

    const bullets: Bullet[] = []
    const colors: BulletColor[] = ["yellow", "blue", "white", "red"]
    
    const spawnX = Math.random() * 600 
    const spawnY = -20 
    
    const fallAngle = Math.PI / 2 + (Math.random() - 0.5) * 0.2
    const speed = 1.0 + Math.random() * 1.2 
    const color = colors[Math.floor(Math.random() * colors.length)]
    const size = Math.random() > 0.9 ? 10 : 6
    
    bullets.push(this.createBullet(spawnX, spawnY, fallAngle, speed, color, "star", size))

    return bullets
  }

  // Fallback
  private static generateBossAimed(boss: Boss, targetX: number, targetY: number): Bullet[] {
    const bullets: Bullet[] = []
    const angle = Math.atan2(targetY - boss.y, targetX - boss.x)
    const spread = 5 + boss.phase
    for (let i = -spread; i <= spread; i++) {
      const bulletAngle = angle + i * 0.06 
      const speed = 1.4 + Math.abs(i) * 0.04
      bullets.push(this.createBullet(boss.x, boss.y, bulletAngle, speed, "red", "kunai", 6))
    }
    return bullets
  }
}

let bulletIdCounter = 0
function generateBulletId(): string { return `bullet-${bulletIdCounter++}` }
export function createBullet(x: number, y: number, angle: number, speed: number, color: BulletColor = "red", type: BulletType = "rice", radius: number = 6): Bullet {
  return new Bullet(x, y, angle, speed, color, type, radius)
}
export function generatePattern(pattern: BulletPattern, x: number, y: number, targetX: number, targetY: number, timer: number): Bullet[] {
  return BulletPatternGenerator.generatePattern(pattern, x, y, targetX, targetY, timer)
}
export function generateBossPattern(boss: Boss, targetX: number, targetY: number, timer: number): Bullet[] {
  return BulletPatternGenerator.generateBossPattern(boss, targetX, targetY, timer)
}