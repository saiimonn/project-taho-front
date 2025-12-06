import { Bullet, Boss, type BulletColor, type BulletPattern, type BulletType } from "./game-types";

export class BulletPatternGenerator {
  private static readonly COLORS: BulletColor[] = ["red", "white", "red", "white"];
  
  private static createBullet(x: number, y: number, angle: number, speed: number, color: BulletColor = "red", type: BulletType = "rice", radius: number = 6): Bullet {
    return new Bullet(x, y, angle, speed, color, type, radius)
  }
  
  static generatePattern(pattern: BulletPattern, x: number, y: number, targetX: number, targetY: number, timer: number): Bullet[] {
    switch(pattern) {
      case "spiral":
        return this.generateSpiral(x, y, timer);
        
      case "radial":
        return this.generateRadial(x, y);
        
      case "aimed":
        return this.generateAimed(x, y, targetX, targetY);
        
      case "random":
        return this.generateRandom(x, y);
        
      case "wave":
        return this.generateWave(x, y, timer);
        
      case "flower":
        return this.generateFlower(x, y, timer);
        
      default:
        return []
    }
  }
  
  private static generateSpiral(x: number, y: number, timer: number): Bullet[] {
    const bullets: Bullet[] = [];
    const count = 6;
    const baseAngle = timer * 0.08;
    
    for (let i = 0; i < count; i++) {
      const angle = baseAngle + (i * Math.PI * 2) / count;
      bullets.push(this.createBullet(x, y, angle, 2.5, this.COLORS[i % 2], "rice", 7));
    }
    return bullets;
  }
  
  private static generateRadial(x: number, y: number): Bullet[] {
    const bullets: Bullet[] = [];
    const count = 12;
    
    for (let i = 0; i < count; i++) {
      const angle = (i * Math.PI * 2) / count;
      bullets.push(this.createBullet(x, y, angle, 3, "red", "rice", 6));
    }
    return bullets;
  }
  
  private static generateAimed(x: number, y: number, targetX: number, targetY: number): Bullet[] {
    const bullets: Bullet[] = [];
    const angle = Math.atan2(targetY - y, targetX - x);
    
    for (let i = -2; i <= 2; i++){ 
      bullets.push(this.createBullet(x, y, angle + i * 0.12, 4, "white", "rice", 5));
    }
    return bullets;
  }
  
  private static generateRandom(x: number, y: number): Bullet[] {
    const bullets: Bullet[] = [];
    const count = 5;
    
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 2;
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
      bullets.push(this.createBullet(x, y, angle, 3.5, "red", "kunai", 7));
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
        const speed = 2 + j * 0.5;
        bullets.push(this.createBullet(x, y, angle, speed, this.COLORS[i % 2], "orb", 6));
      }
    }
    return bullets;
  }
  
  static generateBossPattern(boss: Boss, targetX: number, targetY: number, timer: number): Bullet[] {
    const pattern = boss.getCurrentPattern();
    
    switch(pattern) {
      case "spiral":
        return this.generateBossSpiral(boss, timer);
      
      case "radial":
        return this.generateBossRadial(boss, timer);
        
      case "flower":
        return this.generateBossFlower(boss, timer);
        
      default:
        return this.generateBossAimed(boss, targetX, targetY);
    }
  }
  
  private static generateBossSpiral(boss: Boss, timer: number): Bullet[] {
    const bullets: Bullet[] = []
    const arms = 6 + boss.phase * 2

    // Forward spiral
    for (let arm = 0; arm < arms; arm++) {
      const baseAngle = timer * 0.06 + (arm * Math.PI * 2) / arms
      const color: BulletColor = arm % 2 === 0 ? "red" : "white"
      bullets.push(this.createBullet(boss.x, boss.y, baseAngle, 2.5, color, "rice", 7))
    }

    // Reverse spiral
    for (let arm = 0; arm < arms; arm++) {
      const baseAngle = -timer * 0.06 + (arm * Math.PI * 2) / arms + 0.3
      bullets.push(this.createBullet(boss.x, boss.y, baseAngle, 2, "red", "rice", 6))
    }

    return bullets
  }
    
  private static generateBossRadial(boss: Boss, timer: number): Bullet[] {
    const bullets: Bullet[] = []
    const rings = 2 + boss.phase

    for (let ring = 0; ring < rings; ring++) {
      const count = 16 + ring * 4
      const offset = ring * 0.08

      for (let i = 0; i < count; i++) {
        const angle = (i * Math.PI * 2) / count + offset + timer * 0.02
        const speed = 2 + ring * 0.4
        const color: BulletColor = (i + ring) % 2 === 0 ? "red" : "white"
        bullets.push(this.createBullet(boss.x, boss.y, angle, speed, color, "rice", 5))
      }
    }

    return bullets
  }
    
  private static generateBossFlower(boss: Boss, timer: number): Bullet[] {
    const bullets: Bullet[] = []
    const petals = 8 + boss.phase * 2
    const layers = 2

    for (let layer = 0; layer < layers; layer++) {
      for (let petal = 0; petal < petals; petal++) {
        const baseAngle = timer * 0.03 * (layer % 2 === 0 ? 1 : -1)
        const angle = baseAngle + (petal * Math.PI * 2) / petals
        const speed = 1.8 + layer * 0.6
        const color: BulletColor = layer === 0 ? "red" : "white"
        bullets.push(this.createBullet(boss.x, boss.y, angle, speed, color, "orb", 7))
      }
    }

    return bullets
  }
  
  private static generateBossAimed(boss: Boss, targetX: number, targetY: number): Bullet[] {
    const bullets: Bullet[] = []
    const angle = Math.atan2(targetY - boss.y, targetX - boss.x)
    const spread = 6 + boss.phase * 2

    for (let i = -spread; i <= spread; i++) {
      const bulletAngle = angle + i * 0.06
      const speed = 3.5 + Math.abs(i) * 0.08
      bullets.push(this.createBullet(boss.x, boss.y, bulletAngle, speed, "red", "kunai", 6))
    }

    return bullets
  }
}

// Backwards-compatible functional exports
let bulletIdCounter = 0

function generateBulletId(): string {
  return `bullet-${bulletIdCounter++}`
}

export function createBullet(
  x: number,
  y: number,
  angle: number,
  speed: number,
  color: BulletColor = "red",
  type: BulletType = "rice",
  radius: number = 6
): Bullet {
  return new Bullet(x, y, angle, speed, color, type, radius)
}

export function generatePattern(
  pattern: BulletPattern,
  x: number,
  y: number,
  targetX: number,
  targetY: number,
  timer: number
): Bullet[] {
  return BulletPatternGenerator.generatePattern(pattern, x, y, targetX, targetY, timer)
}

export function generateBossPattern(boss: Boss, targetX: number, targetY: number, timer: number): Bullet[] {
  return BulletPatternGenerator.generateBossPattern(boss, targetX, targetY, timer)
}