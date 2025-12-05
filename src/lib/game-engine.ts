import type { 
  GameState,
  Player,
  PlayerBullet,
  Enemy,
  Boss,
  PowerUp,
  Keys,
  EnemyType,
  BulletPattern,
  MovePattern,
  PowerUpType,
} from "./game-types";
import { generatePattern, generateBossPattern } from "./bullet-patterns";

const GAME_WIDTH = 384;
const GAME_HEIGHT = 448;
const PLAYER_MARGIN = 16;

let entityIdCounter = 0;
function generateId(): string {
  return `entity-${entityIdCounter++}`;
}

export function createInitialState(highScore = 0): GameState {
  return {
    player: createPlayer(),
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
    difficulty: "Normal",
  }
}

function createPlayer(): Player {
  return {
    x: GAME_WIDTH / 2,
    y: GAME_HEIGHT - 60,
    width: 32,
    height: 48,
    speed: 4.5,
    focusSpeed: 1.8,
    lives: 3,
    bombs: 3,
    power: 0,
    score: 0,
    invincible: false,
    invincibleTimer: 0,
    hitboxRadius: 2.5,
    graze: 0,
    point: 0,
    pointMax: 250,
  }
}

function createEnemy(x: number, y: number, type: EnemyType, pattern: BulletPattern, movePattern: MovePattern): Enemy {
  const configs: Record<
    EnemyType,
    { width: number; height: number; health: number; points: number; shootInterval: number; }
  > = {
    fairy: { width: 24, height: 24, health: 3, points: 100, shootInterval: 60 },
    ghost: { width: 28, height: 28, health: 5, points: 200, shootInterval: 45 },
    spirit: { width: 32, height: 32, health: 8, points: 300, shootInterval: 30 },
  }
  
  const config = configs[type]
  return {
    id: generateId(),
    x,
    y,
    width: config.width,
    height: config.height,
    health: config.health,
    maxHealth: config.health,
    type,
    pattern,
    shootTimer: Math.random() * config.shootInterval,
    shootInterval: config.shootInterval,
    movePattern,
    moveTimer: 0,
    points: config.points,
  }
}

function createBoss(stage: number): Boss {
  const patterns: BulletPattern[][] = [
    ["spiral", "radial", "aimed"],
    ["flower", "spiral", "radial"],
    ["flower", "spiral", "radial", "wave"],
  ]
  
  return {
    id: generateId(),
    x: GAME_WIDTH / 2,
    y: -60,
    width: 64,
    height: 64,
    health: 100 + stage * 50,
    maxHealth: 100 + stage * 50,
    phase: 0,
    patterns: patterns[Math.min(stage - 1, patterns.length - 1)],
    currentPattern: 0,
    shootTimer: 0,
    moveTimer: 0,
    name: stage === 1 ? "CIRNO" : stage === 2 ? "MARISA" : "REIMU", //change boss names bruh
  }
}

function createPowerUp(x: number, y: number, type: PowerUpType): PowerUp {
  return {
    id: generateId(),
    x,
    y,
    vy: 2,
    type,
  }
}

export function updateGame(state: GameState, keys: Keys, deltaTime: number): GameState {
  if (state.gameStatus !== "playing") return state;
  
  let newState = { ...state };
  newState.stageTimer += 1;
  newState.time += 1;
  
  newState.player = updatePlayer(newState.player, keys);
  
  //spawn player bullets
  if(keys.shoot && newState.stageTimer % 5 === 0) {
    newState.playerBullets = [...newState.playerBullets, ...spawnPlayerBullets(newState.player)];
  }
  
  //use bomb
  if(keys.bomb && newState.player.bombs > 0 && !newState.player.invincible) {
    newState.player = { ...newState.player, bombs: newState.player.bombs - 1, invincible: true, invincibleTimer: 180 };
    newState.bullets = [];
    
    //damage all enemies
    newState.enemies = newState.enemies.map((e) => ({ ...e, health: e.health - 10 }));
    
    if(newState.boss) {
      newState.boss = { ...newState.boss, health: newState.boss.health - 20 };
    }
  }
  
  if(newState.player.invincible) {
    newState.player = {
      ...newState.player,
      invincibleTimer: newState.player.invincibleTimer - 1,
      invincible: newState.player.invincibleTimer > 1,
    }
  }
  
  newState = spawnEnemies(newState);
  
  newState.enemies = newState.enemies.map((e) => updateEnemy(e, newState.player)).filter((e) => e.y < GAME_HEIGHT + 50 && e.health > 0);
  
  newState.enemies.forEach((enemy) => {
    if(enemy.shootTimer <= 0) {
      const newBullets = generatePattern(
        enemy.pattern,
        enemy.x,
        enemy.y,
        newState.player.x,
        newState.player.y,
        newState.stageTimer
      )
      newState.bullets = [...newState.bullets, ...newBullets];
    }
  })
  
  if (newState.boss) {
    newState.boss = updateBoss(newState.boss)

    // Boss shooting
    if (newState.boss.shootTimer <= 0) {
      const newBullets = generateBossPattern(newState.boss, newState.player.x, newState.player.y, newState.stageTimer)
      newState.bullets = [...newState.bullets, ...newBullets]
      newState.boss = { ...newState.boss, shootTimer: 20 - newState.boss.phase * 3 }
    }

    // Check boss death
    if (newState.boss.health <= 0) {
      newState.player = { ...newState.player, score: newState.player.score + 10000 }
      newState.powerUps = [
        ...newState.powerUps,
        createPowerUp(newState.boss.x - 20, newState.boss.y, "power"),
        createPowerUp(newState.boss.x, newState.boss.y, "life"),
        createPowerUp(newState.boss.x + 20, newState.boss.y, "bomb"),
      ]

      if (newState.stage >= 3) {
        newState.gameStatus = "victory"
      } else {
        newState.stage += 1
        newState.stageTimer = 0
      }
      newState.boss = null
      newState.bullets = []
    }
  }
  
  // Update bullets
    newState.bullets = newState.bullets
      .map((b) => ({ ...b, x: b.x + b.vx, y: b.y + b.vy }))
      .filter((b) => b.x > -20 && b.x < GAME_WIDTH + 20 && b.y > -20 && b.y < GAME_HEIGHT + 20)
  
    // Update player bullets
    newState.playerBullets = newState.playerBullets.map((b) => ({ ...b, y: b.y + b.vy })).filter((b) => b.y > -20)
  
    // Update power-ups
    newState.powerUps = newState.powerUps.map((p) => ({ ...p, y: p.y + p.vy })).filter((p) => p.y < GAME_HEIGHT + 20)
  
    // Collision detection
    newState = checkCollisions(newState)
  
    // Update high score
    if (newState.player.score > newState.highScore) {
      newState.highScore = newState.player.score
    }
  
    // Check game over
    if (newState.player.lives <= 0) {
      newState.gameStatus = "gameover"
    }
  
    // Limit bullets for performance
    if (newState.bullets.length > 500) {
      newState.bullets = newState.bullets.slice(-500)
    }
  
    return newState
}

function updatePlayer(player: Player, keys: Keys): Player {
  let { x, y } = player;
  const speed = keys.focus ? player.focusSpeed : player.speed;
  
  if (keys.up) y -= speed;
  if (keys.down) y += speed;
  if (keys.left) x -= speed;
  if (keys.right) x += speed;
  
  x = Math.max(PLAYER_MARGIN, Math.min(GAME_WIDTH - PLAYER_MARGIN, x));
  y = Math.max(PLAYER_MARGIN, Math.min(GAME_HEIGHT - PLAYER_MARGIN, y));
  
  return { ...player, x, y };
}

function spawnPlayerBullets(player: Player): PlayerBullet[] {
  const bullets: PlayerBullet[] = [];
  const power = Math.min(player.power, 4);
  
  //center bullet
  bullets.push({
    id: generateId(),
    x: player.x,
    y: player.y - 20,
    vy: -12,
    width: 8,
    height: 16,
    damage: 1,
  });
  
  //side bullets
  if(power >= 1) {
    bullets.push({
      id: generateId(),
      x: player.x - 15,
      y: player.y - 15,
      vy: -11,
      width: 6,
      height: 12,
      damage: 1,
    });
    
    bullets.push({
      id: generateId(),
      x: player.x + 15,
      y: player.y - 15,
      vy: -11,
      width: 6,
      height: 12,
      damage: 1,
    });
  }
  
  if(power >= 3) {
    bullets.push({
      id: generateId(),
      x: player.x - 25,
      y: player.y - 10,
      vy: -10,
      width: 5,
      height: 10,
      damage: 1,
    });
    
    bullets.push({
      id: generateId(),
      x: player.x + 25,
      y: player.y - 10,
      vy: -10,
      width: 5,
      height: 10,
      damage: 1,
    });
  }
  
  return bullets;
}

function updateEnemy(enemy: Enemy, player: Player): Enemy {
  let { x, y, shootTimer, moveTimer } = enemy;
  
  shootTimer -= 1;
  if(shootTimer <= 0) {
    shootTimer = enemy.shootInterval;
  }
  
  moveTimer += 0.05;
  
  switch(enemy.movePattern) {
    case "straight":
      y += 1.5;
      break;
    
    case "sine":
      y += 1.2;
      x += Math.sin(moveTimer * 2) * 2;
      break;
      
    case "circle":
      x += Math.cos(moveTimer) * 1.5;
      y += 0.8 + Math.sin(moveTimer) * 0.5;
      break;
      
    case "static":
      if (y < 100) y += 1;
      break;
  }
  
  return { ...enemy, x, y, shootTimer, moveTimer };
}

function updateBoss(boss: Boss): Boss {
  let { x, y, shootTimer, moveTimer, phase, currentPattern, health, maxHealth } = boss;
  
  if (y < 80) y += 1;
  
  shootTimer -= 1;
  moveTimer += 0.02;
  
  //movement pattern
  x = GAME_WIDTH / 2 + Math.sin(moveTimer) * 150;
  
  const healthPercent = health / maxHealth;
  if(healthPercent < 0.3 && phase < 2) {
    phase = 2;
    currentPattern = (currentPattern + 1) % boss.patterns.length;
  } else if (healthPercent < 0.6 && phase < 1) {
    phase = 1;
    currentPattern = (currentPattern + 1) % boss.patterns.length;
  }
  
  return { ...boss, x, y, shootTimer, moveTimer, phase, currentPattern };
}

function spawnEnemies(state: GameState): GameState {
  const { stageTimer, stage, boss, enemies } = state;
  
  if(stageTimer === 1800 && !boss) {
    return { ...state, boss: createBoss(stage), bullets: [] };
  }
  
  //no enemies spawned during boss fight
  if (boss) return state;
  
  //wave spawning based on timer
  if(enemies.length < 8) {
    const patterns: BulletPattern[] = ["aimed", "radial", "spiral", "random", "wave"];
    const moves: MovePattern[] = ["straight", "sine", "circle", "static"];
    const types: EnemyType[] = ["fairy", "ghost", "spirit"];
    
    if(stageTimer % 90 === 0) {
      const newEnemy = createEnemy(
        50 + Math.random() * (GAME_WIDTH - 100),
        -30,
        types[Math.floor(Math.random() * Math.min(stage, types.length))],
        patterns[Math.floor(Math.random() * patterns.length)],
        moves[Math.floor(Math.random() * moves.length)],
      )
      return { ...state, enemies: [...enemies, newEnemy] };
    }
    
    //formation spawn
    if(stageTimer % 300 === 150) {
      const newEnemies: Enemy[] = [];
      const count = 3 + stage;
      for (let i = 0; i < count; i++) {
        newEnemies.push(createEnemy(80 + i * ((GAME_WIDTH - 160) / (count - 1)), -30 - 1 * 20, "fairy", "aimed", "straight"),)
      }
      return { ...state, enemies: [...enemies, ...newEnemies] };
    }
  }
  
  return state;
}

function checkCollisions(state: GameState): GameState {
  let { player, bullets, playerBullets, enemies, boss, powerUps } = state;
  const newPowerUps: PowerUp[] = [];
  
  //player bullets vs enemies
  playerBullets = playerBullets.filter((pb) => {
    for (let i = 0; i < enemies.length; i++) {
      const enemy = enemies[i];
      
      if (
        pb.x < enemy.x + enemy.width / 2 &&
        pb.x + pb.width > enemy.x - enemy.width / 2 &&
        pb.y < enemy.y + enemy.height / 2 &&
        pb.y + pb.height > enemy.y - enemy.height / 2
      ) {
        enemies[i] = { ...enemy, health: enemy.health - pb.damage }
        if (enemies[i].health <= 0) {
          player = { ...player, score: player.score + enemy.points };
          
          if (Math.random() < 0.3) {
            const types: PowerUpType[] = ["power", "power", "point", "point", "bomb"];
            newPowerUps.push(createPowerUp(enemy.x, enemy.y, types[Math.floor(Math.random() * types.length)]));
          }
        }
        return false;
      }
    }
    
    //player bullets vs boss
    if (boss) {
      if (
        pb.x < boss.x + boss.width / 2 &&
        pb.x + pb.width > boss.x - boss.width / 2 &&
        pb.y < boss.y + boss.height / 2 &&
        pb.y + pb.height > boss.y - boss.height / 2
      ) {
        boss = { ...boss, health: boss.health - pb.damage }
        player = { ...player, score: player.score + 10 }
        return false
      }
    }

    return true
  });
  
  enemies = enemies.filter((e) => e.health > 0);
  
  //enemy bullets and player
  if(!player.invincible) {
    for(const bullet of bullets) {
      const dx = bullet.x - player.x;
      const dy = bullet.y - player.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < bullet.radius + player.hitboxRadius) {
        player = {
          ...player,
          lives: player.lives - 1,
          invincible: true,
          invincibleTimer: 180,
          power: Math.max(0, player.power - 1),
          x: GAME_WIDTH / 2,
          y: GAME_HEIGHT - 80,
        }
        bullets = [];
        break;
      }
    }
  }
  
  //power-ups and player
  powerUps = [...state.powerUps, ...newPowerUps].filter((pu) => {
    const dx = pu.x - player.x;
    const dy = pu.y - player.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if(distance < 30) {
      switch(pu.type) {
        case "power":
          player = { ...player, power: Math.min(player.power + 1, 4), score: player.score + 10 };
          break;
          
        case "point":
          player = { ...player, score: player.score + 100 };
          break;
          
        case "bomb":
          player = { ...player, bombs: Math.min(player.bombs + 1, 5) };
          break;
        
        case "life":
          player = { ...player, lives: Math.min(player.lives + 1, 5) };
          break;
      }
      return false;
    }
    return true;
  })
  
  if(!player.invincible) {
    bullets.forEach((bullet) => {
      if (bullet.grazed) return;
      
      const dx = bullet.x - player.x;
      const dy = bullet.y - player.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if(distance < 24 && distance > player.hitboxRadius + bullet.radius) {
        player = {
          ...player,
          graze: player.graze + 1,
          score: player.score + 10,
        }
        bullet.grazed = true;
      }
    })
  }
  
  return { ...state, player, bullets, playerBullets, enemies, boss, powerUps };
}

export { GAME_WIDTH, GAME_HEIGHT };