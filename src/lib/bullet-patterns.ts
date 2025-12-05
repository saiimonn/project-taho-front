import type { Bullet, BulletColor, BulletPattern, BulletType, Boss } from "./game-types";

let bulletIdCounter = 0 

function generateBulletId(): string {
  return `bullet-${bulletIdCounter++}`;
}

export function createBullet(
  x: number,
  y: number,
  angle: number,
  speed: number,
  color: BulletColor = "red",
  type: BulletType = "rice",
  radius = 6,
): Bullet {
  return {
    id: generateBulletId(),
    x,
    y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    radius,
    color,
    type,
    angle,
    speed,
    grazed: false,
  }
}

export function generatePattern(
  pattern: BulletPattern,
  x: number,
  y: number,
  targetX: number,
  targetY: number,
  timer: number,
): Bullet[] {
  const bullets: Bullet[] = [];
  
  const colors: BulletColor[] = ["red", "white", "red", "white"];
  
  switch (pattern) {
    case "spiral": {
      const count = 6;
      const baseAngle = timer * 0.08;
      
      for (let i = 0; i < count; i++) {
        const angle = baseAngle + (i * Math.PI * 2) / count;
        bullets.push(createBullet(x, y, angle, 2.5, colors[i % 2], "rice", 7));
      }
      
      break;
    }
    
    case "radial": {
      const count = 12;
      
      for (let i = 0; i < count; i++) {
        const angle = (i * Math.PI * 2) / count;
        bullets.push(createBullet(x, y, angle, 3, "red", "rice", 6));
      }
      
      break;
    }
    
    case "aimed": {
      const angle = Math.atan2(targetY - y, targetX - x);
      
      for (let i = -2; i <= 2; i++) {
        bullets.push(createBullet(x, y, angle + i * 0.12, 4, "white", "rice", 5));
      }
      
      break;
    }
    
    case "random": {
      const count = 5;
      
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 2;
        bullets.push(createBullet(x, y, angle, speed, colors[Math.floor(Math.random() * 2)], "rice", 5));
      }
      
      break;
    }
    
    case "wave": {
      const count = 7;
      const baseAngle = Math.PI / 2 + Math.sin(timer * 0.05) * 0.6;
      
      for (let i = 0; i < count; i++) {
        const angle = baseAngle + (i - 3) * 0.15;
        bullets.push(createBullet(x, y, angle, 3.5, "red", "kunai", 7));
      }
      
      break;
    }
    
    case "flower": {
      const petals = 5;
      const bulletsPerPetal = 2;
      const baseAngle = timer * 0.04;
      
      for (let i = 0; i < petals; i++) {
        for (let j = 0; j < bulletsPerPetal; j++) {
          const angle = baseAngle + (i + Math.PI * 2) / petals + (j - 0.5) * 0.15;
          const speed = 2 + j * 0.5;
          bullets.push(createBullet(x, y, angle, speed, colors[i % 2], "orb", 6));
        }
      }
      
      break;
    }
  }
  
  return bullets
}

export function generateBossPattern(boss: Boss, targetX: number, targetY: number, timer: number): Bullet[] {
  const bullets: Bullet[] = [];
  const phase = boss.phase;
  const pattern = boss.patterns[boss.currentPattern];
  
  switch(pattern) {
    case "spiral": {
      const arms = 6 + phase * 2;
      
      for (let arm = 0; arm < arms; arm++) {
        const baseAngle = timer * 0.06 + (arm * Math.PI * 2) / arms;
        const color: BulletColor = arm % 2 === 0 ? "red" : "white";
        bullets.push(createBullet(boss.x, boss.y, baseAngle, 2.5, color, "rice", 7));
      }
      
      for (let arm = 0; arm < arms; arm++) {
        const baseAngle = -timer * 0.06 + (arm * Math.PI * 2) / arms + 0.3;
        bullets.push(createBullet(boss.x, boss.y, baseAngle, 2, "red", "rice", 6));
      }
      
      break;
    }
    
    case "radial": {
      const rings = 2 + phase;
      for (let ring = 0; ring < rings; ring++) {
        const count = 16 + ring * 4;
        const offset = ring * 0.08;
        
        for (let i = 0; i < count; i++) {
          const angle = (i * Math.PI * 2) / count + offset + timer * 0.02;
          const speed = 2 + ring * 0.4;
          const color: BulletColor = (i + ring) % 2 === 0 ? "red" : "white";
          bullets.push(createBullet(boss.x, boss.y, angle, speed, color, "rice", 5));
        }
      }
      
      break;
    }
    
    case "flower": {
      const petals = 8 + phase * 2;
      const layers = 2;
      
      for (let layer = 0; layer < layers; layer++) {
        for (let petal = 0; petal < petals; petal++) {
          const baseAngle = timer * 0.03 * (layer % 2 === 0 ? 1 : -1);
          const angle = baseAngle + (petal * Math.PI * 2) / petals;
          const speed = 1.8 + layer * 0.6;
          const color: BulletColor = layer === 0 ? "red" : "white";
          bullets.push(createBullet(boss.x, boss.y, angle, speed, color, "orb", 7));
        }
      }
      
      break;
    }
    
    default: {
      const angle = Math.atan2(targetY - boss.y, targetX - boss.x);
      const spread = 6 + phase * 2;
      
      for (let i = -spread; i <= spread; i++) {
        const bulletAngle = angle + i * 0.06;
        const speed = 3.5 + Math.abs(i) * 0.08;
        bullets.push(createBullet(boss.x, boss.y, bulletAngle, speed, "red", "kunai", 6));
      }
    }
  }
  
  return bullets;
}