// 游戏常量
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const TANK_WIDTH = 40;
const TANK_HEIGHT = 40;
const BULLET_SIZE = 6;
const BULLET_SPEED = 6;

// 坦克类型定义
const TANK_TYPES = {
  NORMAL: {
    name: '标准坦克',
    color: '#2196f3',
    health: 100,
    attack: 50,
    speed: 3,
    cooldown: 300,
    weaponType: 'bullet',
    description: '平衡的攻击和防御'
  },
  LASER: {
    name: '激光坦克',
    color: '#e91e63',
    health: 80,
    attack: 70,
    speed: 2.5,
    cooldown: 500,
    weaponType: 'laser',
    description: '发射穿透激光'
  },
  SWORD: {
    name: '冲锋坦克',
    color: '#ff9800',
    health: 150,
    attack: 80,
    speed: 4,
    cooldown: 200,
    weaponType: 'sword',
    description: '近战冲撞攻击'
  },
  BOMB: {
    name: '爆破坦克',
    color: '#9c27b0',
    health: 120,
    attack: 60,
    speed: 2,
    cooldown: 800,
    weaponType: 'delayBomb',
    description: '延时爆炸炸弹'
  },
  TRACKING: {
    name: '追踪坦克',
    color: '#607d8b',
    health: 90,
    attack: 40,
    speed: 2.8,
    cooldown: 600,
    weaponType: 'trackingBullet',
    description: '智能追踪弹药'
  }
};

// 游戏属性设置
const gameSettings = {
  player: {
    health: 100,
    attack: 50,
    speed: 3
  },
  enemy: {
    health: 100,
    attack: 50,
    speed: 2
  }
};

// 游戏对象
const gameState = {
  player: {
    x: CANVAS_WIDTH / 2,
    y: CANVAS_HEIGHT - TANK_HEIGHT - 20,
    width: TANK_WIDTH,
    height: TANK_HEIGHT,
    health: 100,
    maxHealth: 100,
    attack: 50,
    speed: 3,
    direction: 'up',
    lives: 3,
    lastShot: 0,
    tankType: 'NORMAL',
    swordCharge: 0, // 冲锋状态
    swordCharging: false,
    // 强化效果状态
    shield: false, // 标准坦克护盾
    shieldHits: 0, // 护盾剩余次数
    frozenEnemies: [], // 激光坦克冰冻的敌人
    killCount: 0 // 击杀计数
  },
  bullets: [],
  enemies: [],
  walls: [],
  effects: [],
  delayBombs: [], // 延时炸弹
  score: 0,
  level: 1,
  gameRunning: false,
  gamePaused: false
};

// 记录按键状态
const keys = {
  w: false,
  a: false,
  s: false,
  d: false
};

// 键盘输入调试和保护
let keyboardDebug = false; // 设为true可以看到按键调试信息

// 防止按键卡死的保护机制
function resetAllKeys() {
  Object.keys(keys).forEach(key => {
    keys[key] = false;
  });
}

// 窗口失去焦点时重置所有按键
window.addEventListener('blur', resetAllKeys);
window.addEventListener('focus', resetAllKeys);

// DOM元素
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const livesElement = document.getElementById('lives');
const levelElement = document.getElementById('level');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const resetBtn = document.getElementById('resetBtn');

// 初始化游戏
function initGame() {
  // 应用当前设置到玩家
  gameState.player.x = CANVAS_WIDTH / 2;
  gameState.player.y = CANVAS_HEIGHT - TANK_HEIGHT - 20;
  gameState.player.lives = 3;
  gameState.player.direction = 'up';
  gameState.player.isMoving = false;
  gameState.player.lastShot = 0;
  gameState.player.swordCharge = 0;
  gameState.player.swordCharging = false;
  // 重置强化状态
  gameState.player.shield = false;
  gameState.player.shieldHits = 0;
  gameState.player.frozenEnemies = [];
  gameState.player.killCount = 0;
  
  // 应用坦克类型属性
  const tankType = TANK_TYPES[gameState.player.tankType];
  gameState.player.health = tankType.health;
  gameState.player.maxHealth = tankType.health;
  gameState.player.attack = tankType.attack;
  gameState.player.speed = tankType.speed;
  
  // 清空游戏对象
  gameState.bullets = [];
  gameState.enemies = [];
  gameState.walls = [];
  gameState.effects = [];
  gameState.delayBombs = [];
  
  // 初始化分数和等级
  gameState.score = 0;
  gameState.level = 1;
  
  // 创建墙壁
  createWalls();
  
  // 创建敌人
  createEnemies();
  
  // 更新UI
  updateUI();
}

// 创建墙壁
function createWalls() {
  // 边界墙
  for (let i = 0; i < 20; i++) {
    // 上边界
    gameState.walls.push({
      x: i * 40,
      y: 0,
      width: 40,
      height: 20
    });
    
    // 下边界
    gameState.walls.push({
      x: i * 40,
      y: CANVAS_HEIGHT - 20,
      width: 40,
      height: 20
    });
  }
  
  for (let i = 1; i < 15; i++) {
    // 左边界
    gameState.walls.push({
      x: 0,
      y: i * 40,
      width: 20,
      height: 40
    });
    
    // 右边界
    gameState.walls.push({
      x: CANVAS_WIDTH - 20,
      y: i * 40,
      width: 20,
      height: 40
    });
  }
  
  // 内部障碍物
  const obstacles = [
    { x: 200, y: 150, width: 60, height: 60 },
    { x: 400, y: 100, width: 60, height: 120 },
    { x: 600, y: 250, width: 60, height: 60 },
    { x: 300, y: 350, width: 120, height: 60 },
    { x: 150, y: 450, width: 60, height: 60 },
    { x: 550, y: 450, width: 60, height: 60 }
  ];
  
  obstacles.forEach(obs => {
    gameState.walls.push(obs);
  });
}

// 创建敌人
function createEnemies() {
  const positions = [
    { x: 100, y: 50 },
    { x: 300, y: 50 },
    { x: 500, y: 50 },
    { x: 700, y: 50 }
  ];
  
  positions.forEach((pos, index) => {
    // 根据等级和位置确定敌人AI等级
    const aiLevel = Math.min(3, Math.floor(gameState.level / 2) + (index % 2));
    
    gameState.enemies.push({
      x: pos.x,
      y: pos.y,
      width: TANK_WIDTH,
      height: TANK_HEIGHT,
      health: gameSettings.enemy.health,
      maxHealth: gameSettings.enemy.health,
      attack: gameSettings.enemy.attack,
      speed: gameSettings.enemy.speed,
      direction: 'down',
      aiLevel: aiLevel, // 0: 基础, 1: 中等, 2: 高级, 3: 专家
      aiPersonality: ['aggressive', 'defensive', 'hunter', 'sniper'][index % 4], // AI性格
      // 状态效果
      frozen: false,
      frozenTimer: 0,
      originalSpeed: gameSettings.enemy.speed,
      beingPulled: false, // 被黑洞炸弹吸引
      pullForce: { x: 0, y: 0 }
    });
  });
}

// 更新UI
function updateUI() {
  scoreElement.textContent = gameState.score;
  livesElement.textContent = gameState.player.lives;
  levelElement.textContent = gameState.level;
}

// 绘制游戏对象
function draw() {
  // 清空画布
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // 绘制墙壁
  gameState.walls.forEach(wall => {
    ctx.fillStyle = '#9e9e9e';
    ctx.fillRect(wall.x, wall.y, wall.width, wall.height);
    
    // 添加墙壁边框
    ctx.strokeStyle = '#757575';
    ctx.lineWidth = 1;
    ctx.strokeRect(wall.x, wall.y, wall.width, wall.height);
  });
  
  // 绘制基地
  ctx.fillStyle = '#4caf50';
  ctx.fillRect(CANVAS_WIDTH/2 - 30, CANVAS_HEIGHT - 30, 60, 20);
  ctx.fillRect(CANVAS_WIDTH/2 - 10, CANVAS_HEIGHT - 50, 20, 20);
  
  // 绘制敌人坦克
  gameState.enemies.forEach(enemy => {
    // 冰冻状态下的颜色变化
    const enemyColor = enemy.frozen ? '#81d4fa' : '#f44336';
    drawTank(enemy.x, enemy.y, enemy.direction, enemyColor, 'NORMAL', false);
    
    // 绘制冰冻效果
    if (enemy.frozen) {
      drawFrozenEffect(enemy.x + enemy.width/2, enemy.y + enemy.height/2);
    }
    
    // 绘制敌人血量条
    drawHealthBar(
      enemy.x, 
      enemy.y - 10, 
      enemy.health, 
      enemy.maxHealth,
      TANK_WIDTH
    );
    
    // 绘制AI状态指示器
    drawAIIndicator(enemy);
  });
  
  // 绘制玩家坦克
  const playerTankType = TANK_TYPES[gameState.player.tankType];
  drawTank(gameState.player.x, gameState.player.y, gameState.player.direction, 
           playerTankType.color, gameState.player.tankType, true);
  
  // 绘制玩家护盾
  if (gameState.player.shield) {
    drawShield(gameState.player.x + gameState.player.width/2, 
               gameState.player.y + gameState.player.height/2);
  }
  
  // 绘制玩家血量条
  drawHealthBar(
    gameState.player.x, 
    gameState.player.y - 10, 
    gameState.player.health, 
    gameState.player.maxHealth,
    TANK_WIDTH
  );
  
  // 绘制子弹和激光
  gameState.bullets.forEach(bullet => {
    if (bullet.type === 'laser') {
      // 绘制激光
      ctx.save();
      ctx.strokeStyle = bullet.isPlayer ? '#e91e63' : '#ef5350';
      ctx.lineWidth = bullet.width;
      ctx.globalAlpha = 0.8;
      ctx.beginPath();
      ctx.moveTo(bullet.x, bullet.y);
      ctx.lineTo(bullet.endX, bullet.endY);
      ctx.stroke();
      
      // 激光核心
      ctx.strokeStyle = bullet.isPlayer ? '#f8bbd9' : '#ffcdd2';
      ctx.lineWidth = bullet.width / 2;
      ctx.beginPath();
      ctx.moveTo(bullet.x, bullet.y);
      ctx.lineTo(bullet.endX, bullet.endY);
      ctx.stroke();
      ctx.restore();
    } else if (bullet.type === 'trackingBullet') {
      // 绘制追踪弹
      const lifePercent = bullet.life / bullet.maxLife;
      ctx.save();
      
      // 主体颜色
      ctx.fillStyle = bullet.isPlayer ? '#607d8b' : '#795548';
      ctx.beginPath();
      ctx.arc(bullet.x, bullet.y, BULLET_SIZE, 0, Math.PI * 2);
      ctx.fill();
      
      // 能量环效果
      ctx.globalAlpha = 0.6;
      ctx.strokeStyle = bullet.isPlayer ? '#607d8b' : '#795548';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(bullet.x, bullet.y, BULLET_SIZE + 3, 0, Math.PI * 2);
      ctx.stroke();
      
      // 脉冲效果
      const pulseTime = Date.now() * 0.01;
      const pulseRadius = BULLET_SIZE + 5 + Math.sin(pulseTime) * 3;
      ctx.globalAlpha = 0.3 * lifePercent;
      ctx.beginPath();
      ctx.arc(bullet.x, bullet.y, pulseRadius, 0, Math.PI * 2);
      ctx.stroke();
      
      // 绘制目标指示线
      if (bullet.target && bullet.isPlayer) {
        ctx.globalAlpha = 0.2;
        ctx.strokeStyle = '#607d8b';
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(bullet.x, bullet.y);
        ctx.lineTo(bullet.target.x + bullet.target.width/2, bullet.target.y + bullet.target.height/2);
        ctx.stroke();
        ctx.setLineDash([]);
      }
      
      ctx.restore();
    } else {
      // 绘制普通子弹
      ctx.fillStyle = bullet.isPlayer ? '#42a5f5' : '#ef5350';
      ctx.beginPath();
      ctx.arc(bullet.x, bullet.y, BULLET_SIZE, 0, Math.PI * 2);
      ctx.fill();
      
      // 添加子弹光晕效果
      ctx.save();
      ctx.globalAlpha = 0.3;
      ctx.beginPath();
      ctx.arc(bullet.x, bullet.y, BULLET_SIZE + 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  });
  
  // 绘制延时炸弹
  drawDelayBombs();
  
  // 绘制效果
  drawEffects();
  
  // 绘制调试信息
  if (keyboardDebug) {
    drawKeyboardDebug();
  }
  
  // 绘制武器调试信息
  drawWeaponDebug();
  
  // 绘制游戏状态信息
  if (gameState.gamePaused) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = '48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('游戏暂停', CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
    ctx.font = '24px Arial';
    ctx.fillText('按空格键继续', CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 50);
  }
}

// 绘制坦克
function drawTank(x, y, direction, color, tankType = 'NORMAL', isPlayer = false) {
  ctx.save();
  ctx.translate(x + TANK_WIDTH/2, y + TANK_HEIGHT/2);
  
  // 根据方向旋转坦克
  switch(direction) {
    case 'right':
      ctx.rotate(Math.PI / 2);
      break;
    case 'down':
      ctx.rotate(Math.PI);
      break;
    case 'left':
      ctx.rotate(Math.PI * 1.5);
      break;
    // 'up' 是默认方向，不需要旋转
  }
  
  // 绘制坦克主体
  ctx.fillStyle = color;
  ctx.fillRect(-TANK_WIDTH/2, -TANK_HEIGHT/2, TANK_WIDTH, TANK_HEIGHT);
  
  // 绘制履带
  ctx.fillStyle = isPlayer ? '#1976d2' : '#d32f2f';
  ctx.fillRect(-TANK_WIDTH/2, -TANK_HEIGHT/2 - 5, TANK_WIDTH, 5);
  ctx.fillRect(-TANK_WIDTH/2, TANK_HEIGHT/2, TANK_WIDTH, 5);
  
  // 绘制方向指示器（小三角形）
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(0, -TANK_HEIGHT/2 + 5);
  ctx.lineTo(-5, -TANK_HEIGHT/2 + 12);
  ctx.lineTo(5, -TANK_HEIGHT/2 + 12);
  ctx.closePath();
  ctx.fill();
  
  // 根据坦克类型绘制不同的武器
  if (isPlayer) {
    drawTankWeapon(tankType);
  } else {
    // 敌人坦克的普通炮管 - 从坦克前方伸出
    ctx.fillStyle = '#757575';
    ctx.fillRect(-3, -TANK_HEIGHT/2 - 15, 6, 15);
  }
  
  // 如果是冲锋坦克且正在蓄力，绘制蓄力效果
  if (isPlayer && tankType === 'SWORD' && gameState.player.swordCharging) {
    const chargePercent = gameState.player.swordCharge / 100;
    ctx.save();
    ctx.globalAlpha = 0.7;
    ctx.strokeStyle = '#ff9800';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, TANK_WIDTH/2 + 5 + chargePercent * 10, 0, Math.PI * 2 * chargePercent);
    ctx.stroke();
    ctx.restore();
  }
  
  ctx.restore();
}

// 绘制坦克武器
function drawTankWeapon(tankType) {
  ctx.fillStyle = '#757575';
  
  switch(tankType) {
    case 'NORMAL':
      // 普通炮管 - 从坦克前方伸出
      ctx.fillRect(-3, -TANK_HEIGHT/2 - 15, 6, 15);
      break;
      
    case 'LASER':
      // 激光发射器 - 从坦克前方伸出
      ctx.fillStyle = '#e91e63';
      ctx.fillRect(-2, -TANK_HEIGHT/2 - 18, 4, 18);
      ctx.fillStyle = '#ad1457';
      ctx.fillRect(-1, -TANK_HEIGHT/2 - 18, 2, 3);
      break;
      
    case 'SWORD':
      // 冲撞装置 - 从坦克前方伸出
      ctx.fillStyle = '#ff9800';
      ctx.fillRect(-4, -TANK_HEIGHT/2 - 20, 8, 20);
      ctx.fillStyle = '#f57c00';
      ctx.fillRect(-2, -TANK_HEIGHT/2 - 20, 4, 4);
      break;
      
    case 'BOMB':
      // 炸弹发射器 - 从坦克前方伸出
      ctx.fillStyle = '#9c27b0';
      ctx.fillRect(-4, -TANK_HEIGHT/2 - 16, 8, 16);
      ctx.fillStyle = '#7b1fa2';
      ctx.fillRect(-3, -TANK_HEIGHT/2 - 16, 6, 4);
      break;
      
    case 'TRACKING':
      // 追踪导弹发射器 - 从坦克前方伸出
      ctx.fillStyle = '#607d8b';
      ctx.fillRect(-3, -TANK_HEIGHT/2 - 17, 6, 17);
      // 导弹仓
      ctx.fillStyle = '#455a64';
      ctx.fillRect(-2, -TANK_HEIGHT/2 - 17, 4, 5);
      // 天线/雷达
      ctx.fillStyle = '#37474f';
      ctx.fillRect(-1, -TANK_HEIGHT/2 - 19, 2, 2);
      break;
  }
}

// 计算武器发射位置
function calculateWeaponPosition(tankX, tankY, direction, tankType = 'NORMAL') {
  const centerX = tankX + TANK_WIDTH/2;
  const centerY = tankY + TANK_HEIGHT/2;
  
  // 根据坦克类型确定武器长度
  let weaponLength;
  switch(tankType) {
    case 'NORMAL':
      weaponLength = 15;
      break;
    case 'LASER':
      weaponLength = 18;
      break;
    case 'SWORD':
      weaponLength = 20;
      break;
    case 'BOMB':
      weaponLength = 16;
      break;
    case 'TRACKING':
      weaponLength = 17;
      break;
    default:
      weaponLength = 15;
  }
  
  // 计算炮管末端位置
  let weaponX = centerX;
  let weaponY = centerY;
  
  switch(direction) {
    case 'up':
      weaponY = centerY - TANK_HEIGHT/2 - weaponLength;
      break;
    case 'right':
      weaponX = centerX + TANK_WIDTH/2 + weaponLength;
      break;
    case 'down':
      weaponY = centerY + TANK_HEIGHT/2 + weaponLength;
      break;
    case 'left':
      weaponX = centerX - TANK_WIDTH/2 - weaponLength;
      break;
  }
  
  return { x: weaponX, y: weaponY };
}

// 键盘状态检查计数器
let keyboardCheckCounter = 0;

// 更新游戏状态
function update() {
  if (!gameState.gameRunning || gameState.gamePaused) return;
  
  // 定期检查键盘状态（每60帧检查一次，约1秒）
  keyboardCheckCounter++;
  if (keyboardCheckCounter >= 60) {
    keyboardCheckCounter = 0;
    checkKeyboardHealth();
  }
  
  // 更新玩家
  updatePlayer();
  
  // 更新敌人
  updateEnemies();
  
  // 更新子弹
  updateBullets();
  
  // 更新延时炸弹
  updateDelayBombs();
  
  // 更新效果
  updateEffects();
  
  // 检查碰撞
  checkCollisions();
  
  // 检查游戏结束条件
  if (gameState.player.lives <= 0) {
    gameOver();
  }
  
  // 检查胜利条件
  if (gameState.enemies.length === 0) {
    nextLevel();
  }
}

// 检查键盘健康状态
function checkKeyboardHealth() {
  // 如果所有按键都被按下，很可能是出现了问题
  const allKeysPressed = Object.values(keys).every(pressed => pressed);
  if (allKeysPressed) {
    console.warn('检测到所有按键都被按下，重置键盘状态');
    resetAllKeys();
  }
  
  // 如果键盘调试模式开启，输出当前状态
  if (keyboardDebug) {
    console.log('键盘状态检查:', keys);
  }
}

// 更新玩家
function updatePlayer() {
  const player = gameState.player;
  let newX = player.x;
  let newY = player.y;
  let moved = false;
  
  // 根据按键状态移动玩家
  if (keys.w) {
    newY -= player.speed;
    player.direction = 'up';
    moved = true;
  }
  if (keys.d) {
    newX += player.speed;
    player.direction = 'right';
    moved = true;
  }
  if (keys.s) {
    newY += player.speed;
    player.direction = 'down';
    moved = true;
  }
  if (keys.a) {
    newX -= player.speed;
    player.direction = 'left';
    moved = true;
  }
  
  // 调试信息
  if (keyboardDebug && moved) {
    console.log('玩家移动:', {
      keys: {...keys},
      direction: player.direction,
      position: {x: player.x, y: player.y},
      newPosition: {x: newX, y: newY}
    });
  }
  
  // 检查是否与墙壁碰撞
  if (!checkWallCollision(newX, newY, player.width, player.height)) {
    player.x = newX;
    player.y = newY;
  }
  
  // 更新冲锋蓄力
  if (player.swordCharging && player.swordCharge < 100) {
    player.swordCharge += 2; // 蓄力速度
  }
}

// 更新敌人
function updateEnemies() {
  gameState.enemies.forEach((enemy, index) => {
    // 更新冰冻状态
    if (enemy.frozen) {
      enemy.frozenTimer--;
      if (enemy.frozenTimer <= 0) {
        enemy.frozen = false;
        enemy.speed = enemy.originalSpeed;
        // 从冰冻列表中移除
        const frozenIndex = gameState.player.frozenEnemies.indexOf(enemy);
        if (frozenIndex > -1) {
          gameState.player.frozenEnemies.splice(frozenIndex, 1);
        }
      } else {
        // 冰冻状态下不能移动和射击
        return;
      }
    }
    
    // 重置吸引状态
    enemy.beingPulled = false;
    
    // 初始化敌人的AI状态
    if (!enemy.aiState) {
      enemy.aiState = {
        lastDirectionChange: 0,
        targetDirection: enemy.direction,
        stuckCounter: 0,
        lastPosition: { x: enemy.x, y: enemy.y },
        lastShot: 0,
        huntMode: false,
        huntTarget: null,
        pathfindingCooldown: 0
      };
    }
    
    const currentTime = Date.now();
    const player = gameState.player;
    
    // 计算与玩家的距离
    const distanceToPlayer = Math.sqrt(
      Math.pow(player.x - enemy.x, 2) + Math.pow(player.y - enemy.y, 2)
    );
    
    // 检查是否能看到玩家（视线检测）
    const canSeePlayer = hasLineOfSight(enemy, player);
    
    // AI决策系统 - 根据AI等级调整感知范围
    const detectionRange = 150 + enemy.aiLevel * 50;
    const loseTargetRange = 250 + enemy.aiLevel * 100;
    
    if (canSeePlayer && distanceToPlayer < detectionRange) {
      enemy.aiState.huntMode = true;
      enemy.aiState.huntTarget = { x: player.x, y: player.y };
    } else if (distanceToPlayer > loseTargetRange) {
      enemy.aiState.huntMode = false;
      enemy.aiState.huntTarget = null;
    }
    
    // 根据AI性格和等级选择移动策略
    if (enemy.aiState.huntMode && enemy.aiState.huntTarget) {
      personalityBasedMovement(enemy, enemy.aiState.huntTarget, player);
    } else {
      patrolMovement(enemy);
    }
    
    // 智能射击
    if (canSeePlayer && distanceToPlayer < 250) {
      smartShoot(enemy, player, currentTime);
    }
  });
}

// 视线检测
function hasLineOfSight(enemy, target) {
  const dx = target.x + target.width/2 - (enemy.x + enemy.width/2);
  const dy = target.y + target.height/2 - (enemy.y + enemy.height/2);
  const distance = Math.sqrt(dx * dx + dy * dy);
  const steps = Math.floor(distance / 10);
  
  for (let i = 1; i < steps; i++) {
    const checkX = enemy.x + enemy.width/2 + (dx / steps) * i;
    const checkY = enemy.y + enemy.height/2 + (dy / steps) * i;
    
    if (checkBulletWallCollision({ x: checkX, y: checkY })) {
      return false;
    }
  }
  return true;
}

// 基于性格的移动策略
function personalityBasedMovement(enemy, target, player) {
  const dx = target.x - enemy.x;
  const dy = target.y - enemy.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  switch(enemy.aiPersonality) {
    case 'aggressive':
      // 激进型：直接冲向玩家
      smartMoveTowardsTarget(enemy, target);
      break;
      
    case 'defensive':
      // 防御型：保持一定距离，不会太靠近
      if (distance < 100) {
        // 太近了，后退
        const retreatTarget = {
          x: enemy.x - dx * 0.5,
          y: enemy.y - dy * 0.5
        };
        smartMoveTowardsTarget(enemy, retreatTarget);
      } else if (distance > 180) {
        // 太远了，靠近一点
        smartMoveTowardsTarget(enemy, target);
      } else {
        // 距离合适，侧向移动
        sideStepMovement(enemy, player);
      }
      break;
      
    case 'hunter':
      // 猎手型：尝试包抄玩家
      const flankTarget = calculateFlankPosition(enemy, player);
      smartMoveTowardsTarget(enemy, flankTarget);
      break;
      
    case 'sniper':
      // 狙击手型：寻找有利射击位置
      const sniperPosition = findBestShootingPosition(enemy, player);
      if (sniperPosition) {
        smartMoveTowardsTarget(enemy, sniperPosition);
      } else {
        smartMoveTowardsTarget(enemy, target);
      }
      break;
      
    default:
      smartMoveTowardsTarget(enemy, target);
  }
}

// 智能移动到目标
function smartMoveTowardsTarget(enemy, target) {
  const dx = target.x - enemy.x;
  const dy = target.y - enemy.y;
  
  // 选择最佳移动方向
  let bestDirection = enemy.direction;
  let bestScore = -Infinity;
  
  const directions = ['up', 'right', 'down', 'left'];
  const directionVectors = {
    'up': { x: 0, y: -1 },
    'right': { x: 1, y: 0 },
    'down': { x: 0, y: 1 },
    'left': { x: -1, y: 0 }
  };
  
  directions.forEach(direction => {
    const vector = directionVectors[direction];
    let newX = enemy.x + vector.x * enemy.speed;
    let newY = enemy.y + vector.y * enemy.speed;
    
    // 检查是否会撞墙
    if (checkWallCollision(newX, newY, enemy.width, enemy.height)) {
      return; // 跳过这个方向
    }
    
    // 计算这个方向的得分
    const newDx = target.x - newX;
    const newDy = target.y - newY;
    const newDistance = Math.sqrt(newDx * newDx + newDy * newDy);
    
    // 方向得分：距离越近越好，与目标方向越一致越好
    const directionScore = (dx * vector.x + dy * vector.y) / Math.sqrt(dx * dx + dy * dy);
    const distanceScore = -newDistance; // 距离越近得分越高
    const totalScore = directionScore * 100 + distanceScore;
    
    if (totalScore > bestScore) {
      bestScore = totalScore;
      bestDirection = direction;
    }
  });
  
  // 执行移动
  enemy.direction = bestDirection;
  const vector = directionVectors[bestDirection];
  const newX = enemy.x + vector.x * enemy.speed;
  const newY = enemy.y + vector.y * enemy.speed;
  
  if (!checkWallCollision(newX, newY, enemy.width, enemy.height)) {
    enemy.x = newX;
    enemy.y = newY;
  }
}

// 侧向移动
function sideStepMovement(enemy, player) {
  const dx = player.x - enemy.x;
  const dy = player.y - enemy.y;
  
  // 选择垂直于玩家方向的移动
  let sideTarget;
  if (Math.abs(dx) > Math.abs(dy)) {
    // 玩家在水平方向，垂直移动
    sideTarget = {
      x: enemy.x,
      y: enemy.y + (Math.random() > 0.5 ? 50 : -50)
    };
  } else {
    // 玩家在垂直方向，水平移动
    sideTarget = {
      x: enemy.x + (Math.random() > 0.5 ? 50 : -50),
      y: enemy.y
    };
  }
  
  smartMoveTowardsTarget(enemy, sideTarget);
}

// 计算包抄位置
function calculateFlankPosition(enemy, player) {
  const dx = player.x - enemy.x;
  const dy = player.y - enemy.y;
  const angle = Math.atan2(dy, dx);
  
  // 在玩家侧面45度角的位置
  const flankAngle = angle + (Math.random() > 0.5 ? Math.PI/3 : -Math.PI/3);
  const flankDistance = 120;
  
  return {
    x: player.x + Math.cos(flankAngle) * flankDistance,
    y: player.y + Math.sin(flankAngle) * flankDistance
  };
}

// 寻找最佳射击位置
function findBestShootingPosition(enemy, player) {
  const positions = [
    { x: enemy.x - 60, y: enemy.y },
    { x: enemy.x + 60, y: enemy.y },
    { x: enemy.x, y: enemy.y - 60 },
    { x: enemy.x, y: enemy.y + 60 }
  ];
  
  let bestPosition = null;
  let bestScore = -1;
  
  positions.forEach(pos => {
    if (!checkWallCollision(pos.x, pos.y, enemy.width, enemy.height)) {
      // 检查从这个位置是否能看到玩家
      if (hasLineOfSight({x: pos.x, y: pos.y, width: enemy.width, height: enemy.height}, player)) {
        const distance = Math.sqrt(Math.pow(pos.x - player.x, 2) + Math.pow(pos.y - player.y, 2));
        const score = 200 - distance; // 距离适中的位置得分更高
        
        if (score > bestScore) {
          bestScore = score;
          bestPosition = pos;
        }
      }
    }
  });
  
  return bestPosition;
}

// 巡逻移动
function patrolMovement(enemy) {
  const currentTime = Date.now();
  
  // 检查是否卡住了
  const distanceMoved = Math.abs(enemy.x - enemy.aiState.lastPosition.x) + 
                       Math.abs(enemy.y - enemy.aiState.lastPosition.y);
  
  if (distanceMoved < 1) {
    enemy.aiState.stuckCounter++;
  } else {
    enemy.aiState.stuckCounter = 0;
  }
  
  // 如果卡住了或者随机改变方向
  if (enemy.aiState.stuckCounter > 30 || 
      (Math.random() < 0.02 && currentTime - enemy.aiState.lastDirectionChange > 1000)) {
    const directions = ['up', 'right', 'down', 'left'];
    enemy.direction = directions[Math.floor(Math.random() * directions.length)];
    enemy.aiState.lastDirectionChange = currentTime;
    enemy.aiState.stuckCounter = 0;
  }
  
  // 更新上次位置
  enemy.aiState.lastPosition = { x: enemy.x, y: enemy.y };
  
  // 移动敌人
  let newX = enemy.x;
  let newY = enemy.y;
  
  switch (enemy.direction) {
    case 'up':
      newY -= enemy.speed;
      break;
    case 'right':
      newX += enemy.speed;
      break;
    case 'down':
      newY += enemy.speed;
      break;
    case 'left':
      newX -= enemy.speed;
      break;
  }
  
  // 检查是否与墙壁碰撞
  if (!checkWallCollision(newX, newY, enemy.width, enemy.height)) {
    enemy.x = newX;
    enemy.y = newY;
  } else {
    // 如果撞墙则改变方向
    const directions = ['up', 'right', 'down', 'left'];
    enemy.direction = directions[Math.floor(Math.random() * directions.length)];
    enemy.aiState.lastDirectionChange = currentTime;
  }
}

// 智能射击
function smartShoot(enemy, target, currentTime) {
  // 根据AI等级调整射击冷却时间
  const baseCooldown = 800;
  const cooldownReduction = enemy.aiLevel * 150;
  const shootCooldown = Math.max(300, baseCooldown - cooldownReduction);
  
  if (currentTime - enemy.aiState.lastShot < shootCooldown) return;
  
  // 根据AI等级和性格调整射击策略
  let shootStrategy = getShootStrategy(enemy, target);
  
  if (shootStrategy.shouldShoot) {
    const shootDirection = shootStrategy.direction;
    
    // 检查射击路径是否清晰
    if (hasLineOfSight(enemy, shootStrategy.targetPosition)) {
      enemy.direction = shootDirection; // 转向目标
      
      // 计算子弹发射位置（使用统一的武器位置计算）
      const weaponPosition = calculateWeaponPosition(enemy.x, enemy.y, shootDirection, 'NORMAL');
      const bulletX = weaponPosition.x;
      const bulletY = weaponPosition.y;
      
      shoot(bulletX, bulletY, shootDirection, false, enemy.attack);
      enemy.aiState.lastShot = currentTime;
    }
  }
}

// 获取射击策略
function getShootStrategy(enemy, target) {
  const dx = target.x + target.width/2 - (enemy.x + enemy.width/2);
  const dy = target.y + target.height/2 - (enemy.y + enemy.height/2);
  
  let targetPosition = target;
  let shouldShoot = true;
  
  // 根据AI等级进行预测射击
  if (enemy.aiLevel >= 1) {
    const targetVelocity = estimateTargetVelocity(target);
    const predictionFrames = 20 + enemy.aiLevel * 10;
    targetPosition = predictTargetPosition(target, targetVelocity, predictionFrames);
  }
  
  // 根据AI性格调整射击行为
  switch(enemy.aiPersonality) {
    case 'aggressive':
      // 激进型：更频繁射击，预测更激进
      shouldShoot = Math.random() < 0.8 + enemy.aiLevel * 0.1;
      break;
      
    case 'defensive':
      // 防御型：只在较近距离射击
      const distance = Math.sqrt(dx * dx + dy * dy);
      shouldShoot = distance < 150 + enemy.aiLevel * 50;
      break;
      
    case 'hunter':
      // 猎手型：优先攻击移动中的目标
      const targetVelocity = estimateTargetVelocity(target);
      const isTargetMoving = Math.abs(targetVelocity.x) + Math.abs(targetVelocity.y) > 1;
      shouldShoot = isTargetMoving || Math.random() < 0.3;
      break;
      
    case 'sniper':
      // 狙击手型：精确射击，但射击频率较低
      shouldShoot = Math.random() < 0.4 + enemy.aiLevel * 0.15;
      if (enemy.aiLevel >= 2) {
        // 高级狙击手会等待最佳射击时机
        const targetVelocity = estimateTargetVelocity(target);
        const isTargetSlowing = Math.abs(targetVelocity.x) + Math.abs(targetVelocity.y) < 2;
        shouldShoot = shouldShoot && isTargetSlowing;
      }
      break;
  }
  
  // 计算射击方向
  const newDx = targetPosition.x + targetPosition.width/2 - (enemy.x + enemy.width/2);
  const newDy = targetPosition.y + targetPosition.height/2 - (enemy.y + enemy.height/2);
  
  let shootDirection;
  if (Math.abs(newDx) > Math.abs(newDy)) {
    shootDirection = newDx > 0 ? 'right' : 'left';
  } else {
    shootDirection = newDy > 0 ? 'down' : 'up';
  }
  
  return {
    shouldShoot: shouldShoot,
    direction: shootDirection,
    targetPosition: targetPosition
  };
}

// 估算目标速度
function estimateTargetVelocity(target) {
  if (!target.lastPositions) {
    target.lastPositions = [];
  }
  
  target.lastPositions.push({ x: target.x, y: target.y, time: Date.now() });
  
  // 只保留最近5个位置
  if (target.lastPositions.length > 5) {
    target.lastPositions.shift();
  }
  
  if (target.lastPositions.length < 2) {
    return { x: 0, y: 0 };
  }
  
  const recent = target.lastPositions[target.lastPositions.length - 1];
  const previous = target.lastPositions[target.lastPositions.length - 2];
  const timeDiff = recent.time - previous.time;
  
  if (timeDiff === 0) return { x: 0, y: 0 };
  
  return {
    x: (recent.x - previous.x) / timeDiff * 16.67, // 转换为每帧速度
    y: (recent.y - previous.y) / timeDiff * 16.67
  };
}

// 预测目标位置
function predictTargetPosition(target, velocity, frames) {
  return {
    x: target.x + velocity.x * frames,
    y: target.y + velocity.y * frames,
    width: target.width,
    height: target.height
  };
}

// 更新子弹
function updateBullets() {
  for (let i = gameState.bullets.length - 1; i >= 0; i--) {
    const bullet = gameState.bullets[i];
    
    if (bullet.type === 'laser') {
      // 激光持续时间很短
      bullet.life = (bullet.life || 5) - 1;
      if (bullet.life <= 0) {
        gameState.bullets.splice(i, 1);
      }
      continue;
    }
    
    if (bullet.type === 'trackingBullet') {
      // 更新追踪弹
      updateTrackingBullet(bullet);
      
      // 检查生命周期
      bullet.life--;
      if (bullet.life <= 0) {
        gameState.bullets.splice(i, 1);
        continue;
      }
      
      // 检查是否撞墙或超出边界
      if (bullet.x < 0 || bullet.x > CANVAS_WIDTH || bullet.y < 0 || bullet.y > CANVAS_HEIGHT ||
          checkBulletWallCollision(bullet)) {
        gameState.bullets.splice(i, 1);
        continue;
      }
    } else {
      // 更新普通子弹位置
      switch (bullet.direction) {
        case 'up':
          bullet.y -= BULLET_SPEED;
          break;
        case 'right':
          bullet.x += BULLET_SPEED;
          break;
        case 'down':
          bullet.y += BULLET_SPEED;
          break;
        case 'left':
          bullet.x -= BULLET_SPEED;
          break;
      }
      
      // 移除超出画布的子弹
      if (bullet.x < 0 || bullet.x > CANVAS_WIDTH || bullet.y < 0 || bullet.y > CANVAS_HEIGHT) {
        gameState.bullets.splice(i, 1);
        continue;
      }
      
      // 检查子弹是否撞墙
      if (checkBulletWallCollision(bullet)) {
        // 子弹撞墙后消失，但不摧毁墙
        gameState.bullets.splice(i, 1);
      }
    }
  }
}

// 更新追踪弹
function updateTrackingBullet(bullet) {
  // 检查目标是否还存在
  if (bullet.isPlayer) {
    // 玩家的追踪弹检查敌人是否还存在
    if (!gameState.enemies.includes(bullet.target)) {
      // 目标已死，寻找新目标
      if (gameState.enemies.length > 0) {
        let minDistance = Infinity;
        let newTarget = null;
        gameState.enemies.forEach(enemy => {
          const distance = Math.sqrt((enemy.x - bullet.x) ** 2 + (enemy.y - bullet.y) ** 2);
          if (distance < minDistance) {
            minDistance = distance;
            newTarget = enemy;
          }
        });
        bullet.target = newTarget;
      } else {
        bullet.target = null;
      }
    }
  }
  
  if (!bullet.target) {
    // 没有目标，直线飞行
    bullet.x += bullet.vx;
    bullet.y += bullet.vy;
    return;
  }
  
  // 每30帧重新计算路径（约0.5秒）
  bullet.recalculateTimer++;
  if (bullet.recalculateTimer >= 30 || bullet.pathNodes.length === 0) {
    bullet.recalculateTimer = 0;
    const targetCenter = {
      x: bullet.target.x + bullet.target.width / 2,
      y: bullet.target.y + bullet.target.height / 2
    };
    bullet.pathNodes = findPath({x: bullet.x, y: bullet.y}, targetCenter);
    bullet.currentNodeIndex = 0;
  }
  
  // 沿着路径移动
  if (bullet.pathNodes.length > 0 && bullet.currentNodeIndex < bullet.pathNodes.length) {
    const targetNode = bullet.pathNodes[bullet.currentNodeIndex];
    const dx = targetNode.x - bullet.x;
    const dy = targetNode.y - bullet.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance < 10) {
      // 到达当前节点，移动到下一个
      bullet.currentNodeIndex++;
    } else {
      // 向当前目标节点移动
      bullet.vx = (dx / distance) * bullet.speed;
      bullet.vy = (dy / distance) * bullet.speed;
      bullet.x += bullet.vx;
      bullet.y += bullet.vy;
    }
  } else {
    // 直接向目标移动（作为备用）
    const targetCenter = {
      x: bullet.target.x + bullet.target.width / 2,
      y: bullet.target.y + bullet.target.height / 2
    };
    const dx = targetCenter.x - bullet.x;
    const dy = targetCenter.y - bullet.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > 0) {
      bullet.vx = (dx / distance) * bullet.speed;
      bullet.vy = (dy / distance) * bullet.speed;
      bullet.x += bullet.vx;
      bullet.y += bullet.vy;
    }
  }
}

// 更新延时炸弹
function updateDelayBombs() {
  for (let i = gameState.delayBombs.length - 1; i >= 0; i--) {
    const bomb = gameState.delayBombs[i];
    bomb.timer--;
    
    // 黑洞吸引效果（仅对玩家炸弹生效）
    if (bomb.isPlayer && bomb.timer > 0) {
      const centerX = bomb.x + bomb.width/2;
      const centerY = bomb.y + bomb.height/2;
      
      gameState.enemies.forEach(enemy => {
        const dx = centerX - (enemy.x + enemy.width/2);
        const dy = centerY - (enemy.y + enemy.height/2);
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance <= bomb.pullRadius && distance > 0) {
          // 计算吸引力
          const pullStrength = bomb.pullStrength * (1 - distance / bomb.pullRadius);
          const pullX = (dx / distance) * pullStrength;
          const pullY = (dy / distance) * pullStrength;
          
          // 应用吸引力
          const newX = enemy.x + pullX;
          const newY = enemy.y + pullY;
          
          if (!checkWallCollision(newX, newY, enemy.width, enemy.height)) {
            enemy.x = newX;
            enemy.y = newY;
            enemy.beingPulled = true;
            enemy.pullForce = { x: pullX, y: pullY };
          }
          
          // 创建吸引粒子效果
          if (Math.random() < 0.3) {
            createPullEffect(enemy.x + enemy.width/2, enemy.y + enemy.height/2, centerX, centerY);
          }
        }
      });
    }
    
    if (bomb.timer <= 0 && !bomb.exploded) {
      bomb.exploded = true;
      
      // 爆炸效果
      createExplosionEffect(bomb.x + bomb.width/2, bomb.y + bomb.height/2);
      
      // 检查爆炸范围内的敌人
      gameState.enemies.forEach((enemy, enemyIndex) => {
        const dx = (enemy.x + enemy.width/2) - (bomb.x + bomb.width/2);
        const dy = (enemy.y + enemy.height/2) - (bomb.y + bomb.height/2);
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance <= bomb.explosionRadius) {
          enemy.health -= bomb.attack * 1.5; // 爆炸伤害更高
          createHitEffect(enemy.x + enemy.width/2, enemy.y + enemy.height/2, '#ff5722');
          
          if (enemy.health <= 0) {
            gameState.enemies.splice(enemyIndex, 1);
            gameState.score += 120 * gameState.level;
            // 标准坦克击杀奖励
            if (gameState.player.tankType === 'NORMAL') {
              handleNormalTankKill();
            }
            createExplosionEffect(enemy.x + enemy.width/2, enemy.y + enemy.height/2);
            updateUI();
          }
        }
      });
      
      // 检查玩家是否在爆炸范围内
      if (!bomb.isPlayer) {
        const player = gameState.player;
        const dx = (player.x + player.width/2) - (bomb.x + bomb.width/2);
        const dy = (player.y + player.height/2) - (bomb.y + bomb.width/2);
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance <= bomb.explosionRadius) {
          // 检查护盾
          if (player.shield && player.shieldHits > 0) {
            player.shieldHits--;
            if (player.shieldHits <= 0) {
              player.shield = false;
            }
            createShieldEffect(player.x + player.width/2, player.y + player.height/2);
          } else {
            player.health -= bomb.attack;
            createHitEffect(player.x + player.width/2, player.y + player.height/2, '#f44336');
            
            if (player.health <= 0) {
              gameState.player.lives--;
              player.health = player.maxHealth;
              player.x = CANVAS_WIDTH / 2;
              player.y = CANVAS_HEIGHT - TANK_HEIGHT - 20;
              player.direction = 'up';
              updateUI();
            }
          }
        }
      }
      
      gameState.delayBombs.splice(i, 1);
    }
  }
}

// 检查墙壁碰撞
function checkWallCollision(x, y, width, height) {
  for (const wall of gameState.walls) {
    if (x < wall.x + wall.width &&
        x + width > wall.x &&
        y < wall.y + wall.height &&
        y + height > wall.y) {
      return true;
    }
  }
  return false;
}

// 检查子弹与墙壁的碰撞
function checkBulletWallCollision(bullet) {
  for (let i = 0; i < gameState.walls.length; i++) {
    const wall = gameState.walls[i];
    if (bullet.x > wall.x &&
        bullet.x < wall.x + wall.width &&
        bullet.y > wall.y &&
        bullet.y < wall.y + wall.height) {
      return true; // 子弹撞墙
    }
  }
  return false; // 没有撞墙
}

// 射击系统
function shoot(x, y, direction, isPlayer, attack, weaponType = 'bullet') {
  if (weaponType === 'laser') {
    createLaser(x, y, direction, isPlayer, attack);
  } else if (weaponType === 'delayBomb') {
    createDelayBomb(x, y, isPlayer, attack);
  } else if (weaponType === 'trackingBullet') {
    createTrackingBullet(x, y, isPlayer, attack);
  } else {
    gameState.bullets.push({
      x: x,
      y: y,
      direction: direction,
      isPlayer: isPlayer,
      attack: attack || (isPlayer ? gameState.player.attack : 50),
      type: 'bullet'
    });
  }
}

// 创建激光
function createLaser(x, y, direction, isPlayer, attack) {
  const laser = {
    x: x,
    y: y,
    direction: direction,
    isPlayer: isPlayer,
    attack: attack,
    type: 'laser',
    length: 0,
    maxLength: 400,
    width: 4
  };
  
  // 计算激光终点
  let endX = x, endY = y;
  let step = 5;
  
  for (let i = 0; i < laser.maxLength; i += step) {
    let testX = x, testY = y;
    
    switch(direction) {
      case 'up': testY = y - i; break;
      case 'right': testX = x + i; break;
      case 'down': testY = y + i; break;
      case 'left': testX = x - i; break;
    }
    
    // 检查是否撞墙
    if (checkBulletWallCollision({x: testX, y: testY})) {
      break;
    }
    
    endX = testX;
    endY = testY;
    laser.length = i;
  }
  
  laser.endX = endX;
  laser.endY = endY;
  
  gameState.bullets.push(laser);
}

// 创建延时炸弹
function createDelayBomb(x, y, isPlayer, attack) {
  gameState.delayBombs.push({
    x: x - 10,
    y: y - 10,
    width: 20,
    height: 20,
    isPlayer: isPlayer,
    attack: attack,
    timer: 180, // 3秒 (60fps)
    maxTimer: 180,
    exploded: false,
    explosionRadius: 80, // 爆炸范围
    pullRadius: 150, // 黑洞吸引范围
    pullStrength: 2 // 吸引力强度
  });
}

// 创建追踪弹
function createTrackingBullet(x, y, isPlayer, attack) {
  // 寻找最近的目标
  let target = null;
  if (isPlayer && gameState.enemies.length > 0) {
    // 玩家的追踪弹锁定最近的敌人
    let minDistance = Infinity;
    gameState.enemies.forEach(enemy => {
      const distance = Math.sqrt((enemy.x - x) ** 2 + (enemy.y - y) ** 2);
      if (distance < minDistance) {
        minDistance = distance;
        target = enemy;
      }
    });
  } else if (!isPlayer) {
    // 敌人的追踪弹锁定玩家
    target = gameState.player;
  }

  if (target) {
    gameState.bullets.push({
      x: x,
      y: y,
      vx: 0,
      vy: 0,
      speed: 4,
      isPlayer: isPlayer,
      attack: attack,
      type: 'trackingBullet',
      target: target,
      life: 300, // 5秒生命周期
      maxLife: 300,
      pathNodes: [], // A*路径节点
      currentNodeIndex: 0,
      recalculateTimer: 0 // 重新计算路径的计时器
    });
  }
}

// A*寻路算法（简化版）
function findPath(start, end, avoidWalls = true) {
  const gridSize = 20; // 网格大小
  const startNode = {
    x: Math.floor(start.x / gridSize),
    y: Math.floor(start.y / gridSize)
  };
  const endNode = {
    x: Math.floor(end.x / gridSize),
    y: Math.floor(end.y / gridSize)
  };
  
  // 简化的寻路：如果直线路径清晰，直接返回目标点
  if (!avoidWalls || hasDirectPath(start, end)) {
    return [end];
  }
  
  // 否则返回绕路点
  const waypoints = findWaypoints(start, end);
  return waypoints;
}

// 检查两点间是否有直线路径
function hasDirectPath(start, end) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  const steps = Math.floor(distance / 5);
  
  for (let i = 1; i < steps; i++) {
    const checkX = start.x + (dx / steps) * i;
    const checkY = start.y + (dy / steps) * i;
    
    if (checkBulletWallCollision({x: checkX, y: checkY})) {
      return false;
    }
  }
  return true;
}

// 寻找绕路点
function findWaypoints(start, end) {
  const waypoints = [];
  
  // 简单的绕墙策略：尝试几个可能的路径点
  const candidates = [
    {x: start.x + 60, y: start.y},
    {x: start.x - 60, y: start.y},
    {x: start.x, y: start.y + 60},
    {x: start.x, y: start.y - 60},
    {x: start.x + 40, y: start.y + 40},
    {x: start.x - 40, y: start.y + 40},
    {x: start.x + 40, y: start.y - 40},
    {x: start.x - 40, y: start.y - 40}
  ];
  
  // 选择最佳绕路点
  let bestWaypoint = null;
  let bestScore = Infinity;
  
  candidates.forEach(candidate => {
    // 检查候选点是否可行
    if (!checkBulletWallCollision({x: candidate.x, y: candidate.y}) &&
        candidate.x > 20 && candidate.x < CANVAS_WIDTH - 20 &&
        candidate.y > 20 && candidate.y < CANVAS_HEIGHT - 20) {
      
      const distanceToCandidate = Math.sqrt((candidate.x - start.x) ** 2 + (candidate.y - start.y) ** 2);
      const distanceToEnd = Math.sqrt((end.x - candidate.x) ** 2 + (end.y - candidate.y) ** 2);
      const totalDistance = distanceToCandidate + distanceToEnd;
      
      if (totalDistance < bestScore) {
        bestScore = totalDistance;
        bestWaypoint = candidate;
      }
    }
  });
  
  if (bestWaypoint) {
    waypoints.push(bestWaypoint);
  }
  waypoints.push(end);
  
  return waypoints;
}

// 智能冲撞攻击
function swordCharge(player) {
  const chargeRange = 150; // 冲撞检测范围
  
  // 寻找冲撞范围内的最佳目标
  const target = findBestChargeTarget(player, chargeRange);
  
  if (target) {
    // 智能瞬移冲撞到目标
    smartChargeToTarget(player, target);
  } else {
    // 没有目标时，按原方向冲撞
    directionalCharge(player, 100);
  }
}

// 寻找最佳冲撞目标
function findBestChargeTarget(player, range) {
  let bestTarget = null;
  let bestScore = -1;
  
  gameState.enemies.forEach(enemy => {
    const dx = enemy.x + enemy.width/2 - (player.x + player.width/2);
    const dy = enemy.y + enemy.height/2 - (player.y + player.height/2);
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance <= range) {
      // 检查是否有清晰的冲撞路径
      if (hasChargeLineOfSight(player, enemy)) {
        // 计算目标优先级：距离越近，血量越少，优先级越高
        const distanceScore = (range - distance) / range; // 0-1
        const healthScore = 1 - (enemy.health / enemy.maxHealth); // 0-1
        const totalScore = distanceScore * 0.6 + healthScore * 0.4;
        
        if (totalScore > bestScore) {
          bestScore = totalScore;
          bestTarget = enemy;
        }
      }
    }
  });
  
  return bestTarget;
}

// 检查冲撞路径是否清晰
function hasChargeLineOfSight(player, target) {
  const dx = target.x + target.width/2 - (player.x + player.width/2);
  const dy = target.y + target.height/2 - (player.y + player.height/2);
  const distance = Math.sqrt(dx * dx + dy * dy);
  const steps = Math.floor(distance / 5);
  
  for (let i = 1; i < steps; i++) {
    const checkX = player.x + player.width/2 + (dx / steps) * i - player.width/2;
    const checkY = player.y + player.height/2 + (dy / steps) * i - player.height/2;
    
    if (checkWallCollision(checkX, checkY, player.width, player.height)) {
      return false;
    }
  }
  return true;
}

// 智能冲撞到目标
function smartChargeToTarget(player, target) {
  const dx = target.x + target.width/2 - (player.x + player.width/2);
  const dy = target.y + target.height/2 - (player.y + player.height/2);
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  // 计算冲撞终点（目标前方一点点，避免重叠）
  const chargeDistance = Math.min(distance - 10, 120);
  const normalizedDx = dx / distance;
  const normalizedDy = dy / distance;
  
  const targetX = player.x + normalizedDx * chargeDistance;
  const targetY = player.y + normalizedDy * chargeDistance;
  
  // 更新玩家朝向
  if (Math.abs(dx) > Math.abs(dy)) {
    player.direction = dx > 0 ? 'right' : 'left';
  } else {
    player.direction = dy > 0 ? 'down' : 'up';
  }
  
  // 创建冲撞路径效果
  createChargeTrail(player.x + player.width/2, player.y + player.height/2, 
                   targetX + player.width/2, targetY + player.height/2);
  
  // 瞬移到目标位置
  player.x = targetX;
  player.y = targetY;
  
  // 对路径上的所有敌人造成伤害
  damageEnemiesInChargePath(
    player.x + player.width/2 - normalizedDx * chargeDistance, 
    player.y + player.height/2 - normalizedDy * chargeDistance,
    player.x + player.width/2, 
    player.y + player.height/2, 
    player.attack * 2 // 智能冲撞伤害更高
  );
  
  // 创建冲撞效果
  createChargeEffect(player.x + player.width/2, player.y + player.height/2);
}

// 方向性冲撞（没有目标时）
function directionalCharge(player, chargeDistance) {
  let newX = player.x, newY = player.y;
  
  switch(player.direction) {
    case 'up': newY -= chargeDistance; break;
    case 'right': newX += chargeDistance; break;
    case 'down': newY += chargeDistance; break;
    case 'left': newX -= chargeDistance; break;
  }
  
  // 检查墙壁碰撞
  const steps = 20;
  const stepX = (newX - player.x) / steps;
  const stepY = (newY - player.y) / steps;
  
  for (let i = 1; i <= steps; i++) {
    const testX = player.x + stepX * i;
    const testY = player.y + stepY * i;
    
    if (checkWallCollision(testX, testY, player.width, player.height)) {
      newX = player.x + stepX * (i - 1);
      newY = player.y + stepY * (i - 1);
      break;
    }
  }
  
  // 创建冲撞路径效果
  createChargeTrail(player.x + player.width/2, player.y + player.height/2, 
                   newX + player.width/2, newY + player.height/2);
  
  // 对路径上的敌人造成伤害
  damageEnemiesInChargePath(
    player.x + player.width/2, player.y + player.height/2,
    newX + player.width/2, newY + player.height/2, 
    player.attack * 1.5
  );
  
  player.x = newX;
  player.y = newY;
  
  // 创建冲撞效果
  createChargeEffect(player.x + player.width/2, player.y + player.height/2);
}

// 对冲撞路径上的敌人造成范围伤害
function damageEnemiesInChargePath(startX, startY, endX, endY, damage) {
  const dx = endX - startX;
  const dy = endY - startY;
  const distance = Math.sqrt(dx * dx + dy * dy);
  const steps = Math.floor(distance / 8); // 更密集的检测点
  const chargeRadius = 35; // 冲撞范围半径
  
  for (let i = 0; i <= steps; i++) {
    const checkX = startX + (dx / steps) * i;
    const checkY = startY + (dy / steps) * i;
    
    gameState.enemies.forEach((enemy, index) => {
      const enemyCenterX = enemy.x + enemy.width/2;
      const enemyCenterY = enemy.y + enemy.height/2;
      const distToEnemy = Math.sqrt(
        Math.pow(checkX - enemyCenterX, 2) + Math.pow(checkY - enemyCenterY, 2)
      );
      
      if (distToEnemy < chargeRadius && !enemy.chargeHit) { // 范围伤害
        enemy.chargeHit = true;
        enemy.health -= damage;
        createHitEffect(enemyCenterX, enemyCenterY, '#ff9800');
        
        // 击退效果
        const knockbackForce = 15;
        const knockbackX = (enemyCenterX - checkX) / distToEnemy * knockbackForce;
        const knockbackY = (enemyCenterY - checkY) / distToEnemy * knockbackForce;
        
        const newEnemyX = enemy.x + knockbackX;
        const newEnemyY = enemy.y + knockbackY;
        
        if (!checkWallCollision(newEnemyX, newEnemyY, enemy.width, enemy.height)) {
          enemy.x = newEnemyX;
          enemy.y = newEnemyY;
        }
        
        if (enemy.health <= 0) {
          gameState.enemies.splice(index, 1);
          gameState.score += 200 * gameState.level; // 冲撞击杀奖励更高
          // 标准坦克击杀奖励
          if (gameState.player.tankType === 'NORMAL') {
            handleNormalTankKill();
          }
          createExplosionEffect(enemyCenterX, enemyCenterY);
          updateUI();
        }
        
        // 清除标记（下次冲撞可以再次伤害）
        setTimeout(() => {
          if (enemy) enemy.chargeHit = false;
        }, 1000);
      }
    });
  }
  
  // 创建冲撞范围视觉效果
  for (let i = 0; i <= steps; i += 3) {
    const effectX = startX + (dx / steps) * i;
    const effectY = startY + (dy / steps) * i;
    
    gameState.effects.push({
      x: effectX,
      y: effectY,
      color: '#ff9800',
      size: chargeRadius,
      life: 8,
      maxLife: 8,
      type: 'chargeArea'
    });
  }
}

// 创建冲撞轨迹效果
function createChargeTrail(startX, startY, endX, endY) {
  const dx = endX - startX;
  const dy = endY - startY;
  const distance = Math.sqrt(dx * dx + dy * dy);
  const steps = Math.floor(distance / 15);
  
  for (let i = 0; i <= steps; i++) {
    const x = startX + (dx / steps) * i;
    const y = startY + (dy / steps) * i;
    
    gameState.effects.push({
      x: x,
      y: y,
      color: '#ff9800',
      size: 8 + Math.random() * 4,
      life: 20 + i * 2,
      maxLife: 20 + i * 2,
      type: 'chargeTrail'
    });
  }
}

// 标准坦克击杀奖励
function handleNormalTankKill() {
  const player = gameState.player;
  player.killCount++;
  
  // 获得护盾
  player.shield = true;
  player.shieldHits = 1;
  
  // 恢复血量
  const healAmount = 20;
  player.health = Math.min(player.maxHealth, player.health + healAmount);
  
  // 创建治疗效果
  createHealEffect(player.x + player.width/2, player.y + player.height/2);
  createShieldEffect(player.x + player.width/2, player.y + player.height/2);
}

// 激光冰冻效果
function freezeEnemy(enemy, duration = 180) { // 3秒
  enemy.frozen = true;
  enemy.frozenTimer = duration;
  enemy.originalSpeed = enemy.speed;
  enemy.speed = 0;
  
  // 添加到冰冻列表
  if (!gameState.player.frozenEnemies.includes(enemy)) {
    gameState.player.frozenEnemies.push(enemy);
  }
  
  // 创建冰冻效果
  createFreezeEffect(enemy.x + enemy.width/2, enemy.y + enemy.height/2);
}

// 创建护盾效果
function createShieldEffect(x, y) {
  gameState.effects.push({
    x: x,
    y: y,
    color: '#42a5f5',
    size: 25,
    life: 30,
    maxLife: 30,
    type: 'shield'
  });
}

// 创建治疗效果
function createHealEffect(x, y) {
  for (let i = 0; i < 5; i++) {
    gameState.effects.push({
      x: x + (Math.random() - 0.5) * 20,
      y: y + (Math.random() - 0.5) * 20,
      vx: (Math.random() - 0.5) * 2,
      vy: -Math.random() * 3 - 1,
      color: '#4caf50',
      size: 4 + Math.random() * 3,
      life: 40,
      maxLife: 40,
      type: 'heal'
    });
  }
}

// 创建冰冻效果
function createFreezeEffect(x, y) {
  for (let i = 0; i < 8; i++) {
    gameState.effects.push({
      x: x,
      y: y,
      vx: (Math.random() - 0.5) * 4,
      vy: (Math.random() - 0.5) * 4,
      color: '#81d4fa',
      size: 3 + Math.random() * 2,
      life: 60,
      maxLife: 60,
      type: 'freeze'
    });
  }
}

// 创建吸引粒子效果
function createPullEffect(startX, startY, endX, endY) {
  const dx = endX - startX;
  const dy = endY - startY;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  gameState.effects.push({
    x: startX,
    y: startY,
    vx: (dx / distance) * 3,
    vy: (dy / distance) * 3,
    color: '#9c27b0',
    size: 2 + Math.random() * 2,
    life: 20,
    maxLife: 20,
    type: 'pull'
  });
}

// 检查碰撞
function checkCollisions() {
  // 检查玩家子弹与敌人碰撞
  for (let i = gameState.bullets.length - 1; i >= 0; i--) {
    const bullet = gameState.bullets[i];
    
    if (bullet.isPlayer) {
      for (let j = gameState.enemies.length - 1; j >= 0; j--) {
        const enemy = gameState.enemies[j];
        let hit = false;
        
        if (bullet.type === 'laser') {
          // 激光碰撞检测
          hit = checkLaserCollision(bullet, enemy);
        } else {
          // 普通子弹碰撞检测
          hit = bullet.x > enemy.x && bullet.x < enemy.x + enemy.width &&
                bullet.y > enemy.y && bullet.y < enemy.y + enemy.height;
        }
        
        if (hit) {
          // 击中敌人
          if (bullet.type !== 'laser') {
            gameState.bullets.splice(i, 1);
          }
          enemy.health -= bullet.attack;
          
          // 激光坦克特殊效果：冰冻敌人
          if (bullet.type === 'laser' && bullet.isPlayer && gameState.player.tankType === 'LASER') {
            freezeEnemy(enemy, 180); // 冰冻3秒
          }
          
          // 添加击中效果
          createHitEffect(enemy.x + enemy.width/2, enemy.y + enemy.height/2, '#ff9800');
          
          // 如果敌人血量降到0以下，则移除敌人
          if (enemy.health <= 0) {
            gameState.enemies.splice(j, 1);
            gameState.score += 100 * gameState.level;
            // 标准坦克击杀奖励
            if (gameState.player.tankType === 'NORMAL') {
              handleNormalTankKill();
            }
            createExplosionEffect(enemy.x + enemy.width/2, enemy.y + enemy.height/2);
            updateUI();
          }
          
          if (bullet.type !== 'laser') break; // 激光可以穿透多个敌人
        }
      }
    }
  }
  
  // 检查敌人子弹与玩家碰撞
  for (let i = gameState.bullets.length - 1; i >= 0; i--) {
    const bullet = gameState.bullets[i];
    
    if (!bullet.isPlayer) {
      const player = gameState.player;
      
      // 使用矩形碰撞检测
      if (bullet.x > player.x && bullet.x < player.x + player.width &&
          bullet.y > player.y && bullet.y < player.y + player.height) {
        // 击中玩家
        gameState.bullets.splice(i, 1);
        
        // 检查护盾
        if (player.shield && player.shieldHits > 0) {
          player.shieldHits--;
          if (player.shieldHits <= 0) {
            player.shield = false;
          }
          createShieldEffect(player.x + player.width/2, player.y + player.height/2);
        } else {
          player.health -= bullet.attack;
          
          // 添加击中效果
          createHitEffect(player.x + player.width/2, player.y + player.height/2, '#f44336');
          
          // 如果玩家血量降到0以下，则失去一条生命
          if (player.health <= 0) {
            gameState.player.lives--;
            player.health = player.maxHealth;
            
            // 玩家重生位置
            player.x = CANVAS_WIDTH / 2;
            player.y = CANVAS_HEIGHT - TANK_HEIGHT - 20;
            player.direction = 'up';
            
            updateUI();
          }
        }
        break;
      }
    }
  }
  
  // 检查坦克之间的碰撞
  gameState.enemies.forEach(enemy => {
    const player = gameState.player;
    if (player.x < enemy.x + enemy.width &&
        player.x + player.width > enemy.x &&
        player.y < enemy.y + enemy.height &&
        player.y + player.height > enemy.y) {
      // 坦克碰撞，推开玩家
      const dx = (player.x + player.width/2) - (enemy.x + enemy.width/2);
      const dy = (player.y + player.height/2) - (enemy.y + enemy.height/2);
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance > 0) {
        const pushX = (dx / distance) * 2;
        const pushY = (dy / distance) * 2;
        
        const newX = player.x + pushX;
        const newY = player.y + pushY;
        
        if (!checkWallCollision(newX, newY, player.width, player.height)) {
          player.x = newX;
          player.y = newY;
        }
      }
    }
  });
}

// 检查激光与目标的碰撞
function checkLaserCollision(laser, target) {
  // 简化的线段与矩形碰撞检测
  const targetCenterX = target.x + target.width / 2;
  const targetCenterY = target.y + target.height / 2;
  
  // 计算点到线段的距离
  const dx = laser.endX - laser.x;
  const dy = laser.endY - laser.y;
  const length = Math.sqrt(dx * dx + dy * dy);
  
  if (length === 0) return false;
  
  const t = Math.max(0, Math.min(1, ((targetCenterX - laser.x) * dx + (targetCenterY - laser.y) * dy) / (length * length)));
  const projectionX = laser.x + t * dx;
  const projectionY = laser.y + t * dy;
  
  const distanceToLine = Math.sqrt((targetCenterX - projectionX) ** 2 + (targetCenterY - projectionY) ** 2);
  
  return distanceToLine < Math.max(target.width, target.height) / 2;
}

// 下一关
function nextLevel() {
  gameState.level++;
  
  // 清空子弹和效果
  gameState.bullets = [];
  gameState.effects = [];
  
  // 恢复玩家血量
  gameState.player.health = gameState.player.maxHealth;
  
  // 创建更多敌人
  createEnemies();
  
  // 增加难度：敌人属性随等级提升
  gameState.enemies.forEach(enemy => {
    enemy.health += gameState.level * 10;
    enemy.maxHealth = enemy.health;
    enemy.attack += gameState.level * 5;
    enemy.speed = Math.min(enemy.speed + gameState.level * 0.2, 4);
  });
  
  updateUI();
  
  // 显示等级提升信息
  setTimeout(() => {
    alert(`恭喜！进入第 ${gameState.level} 关！`);
  }, 100);
}

// 游戏结束
function gameOver() {
  gameState.gameRunning = false;
  alert(`游戏结束！最终得分: ${gameState.score}`);
}

// 游戏循环
function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

// 事件监听器
document.addEventListener('keydown', (e) => {
  const key = e.key.toLowerCase();
  
  // 防止默认行为（特别是WASD可能触发的浏览器行为）
  if (['w', 'a', 's', 'd', 'e', ' '].includes(key)) {
    e.preventDefault();
  }
  
  // 暂停/继续游戏
  if (key === ' ') {
    if (gameState.gameRunning) {
      gameState.gamePaused = !gameState.gamePaused;
      pauseBtn.innerHTML = gameState.gamePaused ? 
        '<span class="material-symbols-outlined">play_arrow</span> 继续' :
        '<span class="material-symbols-outlined">pause</span> 暂停';
    }
    return;
  }
  
  // 更新按键状态（即使游戏暂停也要记录，这样恢复时不会丢失按键状态）
  if (keys.hasOwnProperty(key)) {
    keys[key] = true;
  }
  
  // 如果游戏未运行或暂停，不执行游戏逻辑
  if (!gameState.gameRunning || gameState.gamePaused) return;
  
  // 射击/特殊攻击
  if (key === 'e') {
    const currentTime = Date.now();
    const player = gameState.player;
    const tankType = TANK_TYPES[player.tankType];
    
    if (player.tankType === 'SWORD') {
      // 冲锋坦克：开始蓄力
      if (!player.swordCharging) {
        player.swordCharging = true;
        player.swordCharge = 0;
      }
    } else {
      // 其他坦克：正常射击
      if (currentTime - player.lastShot < tankType.cooldown) return;
      
      player.lastShot = currentTime;
      
      // 计算武器发射位置（从炮管末端）
      const weaponPosition = calculateWeaponPosition(player.x, player.y, player.direction, tankType);
      const weaponX = weaponPosition.x;
      const weaponY = weaponPosition.y;
      
      shoot(weaponX, weaponY, player.direction, true, player.attack, tankType.weaponType);
    }
  }
});

document.addEventListener('keyup', (e) => {
  const key = e.key.toLowerCase();
  
  // 防止默认行为
  if (['w', 'a', 's', 'd', 'e', ' '].includes(key)) {
    e.preventDefault();
  }
  
  // 更新按键状态（总是更新，不管游戏状态）
  if (keys.hasOwnProperty(key)) {
    keys[key] = false;
  }
  
  // 冲锋坦克：释放蓄力（只有在游戏运行时才执行）
  if (gameState.gameRunning && !gameState.gamePaused && 
      key === 'e' && gameState.player.tankType === 'SWORD' && gameState.player.swordCharging) {
    const player = gameState.player;
    player.swordCharging = false;
    
    if (player.swordCharge >= 50) { // 最少蓄力50%才能冲撞
      swordCharge(player);
    }
    
    player.swordCharge = 0;
  }
});

startBtn.addEventListener('click', () => {
  if (!gameState.gameRunning) {
    initGame();
    gameState.gameRunning = true;
    gameState.gamePaused = false;
    startBtn.innerHTML = '<span class="material-symbols-outlined">play_arrow</span> 继续';
  } else if (gameState.gamePaused) {
    gameState.gamePaused = false;
    pauseBtn.innerHTML = '<span class="material-symbols-outlined">pause</span> 暂停';
  }
});

pauseBtn.addEventListener('click', () => {
  if (gameState.gameRunning && !gameState.gamePaused) {
    gameState.gamePaused = true;
    pauseBtn.innerHTML = '<span class="material-symbols-outlined">play_arrow</span> 继续';
  } else if (gameState.gameRunning && gameState.gamePaused) {
    gameState.gamePaused = false;
    pauseBtn.innerHTML = '<span class="material-symbols-outlined">pause</span> 暂停';
  }
});

resetBtn.addEventListener('click', () => {
  initGame();
  gameState.gameRunning = false;
  gameState.gamePaused = false;
  startBtn.innerHTML = '<span class="material-symbols-outlined">play_arrow</span> 开始游戏';
  pauseBtn.innerHTML = '<span class="material-symbols-outlined">pause</span> 暂停';
});

// 绘制血量条
function drawHealthBar(x, y, health, maxHealth, width) {
  const barWidth = width;
  const barHeight = 5;
  const healthPercent = health / maxHealth;
  
  // 血量条背景
  ctx.fillStyle = '#333';
  ctx.fillRect(x, y, barWidth, barHeight);
  
  // 血量条
  ctx.fillStyle = healthPercent > 0.6 ? '#4caf50' : healthPercent > 0.3 ? '#ff9800' : '#f44336';
  ctx.fillRect(x, y, barWidth * healthPercent, barHeight);
}

// 获取滑块元素
const playerHealthSlider = document.getElementById('playerHealth');
const playerAttackSlider = document.getElementById('playerAttack');
const playerSpeedSlider = document.getElementById('playerSpeed');
const enemyHealthSlider = document.getElementById('enemyHealth');
const enemyAttackSlider = document.getElementById('enemyAttack');
const enemySpeedSlider = document.getElementById('enemySpeed');
const applySettingsBtn = document.getElementById('applySettings');

// 获取显示值的元素
const playerHealthValue = document.getElementById('playerHealthValue');
const playerAttackValue = document.getElementById('playerAttackValue');
const playerSpeedValue = document.getElementById('playerSpeedValue');
const enemyHealthValue = document.getElementById('enemyHealthValue');
const enemyAttackValue = document.getElementById('enemyAttackValue');
const enemySpeedValue = document.getElementById('enemySpeedValue');

// 滑块值更新显示
function updateSliderValues() {
  playerHealthValue.textContent = Math.round(playerHealthSlider.value);
  playerAttackValue.textContent = Math.round(playerAttackSlider.value);
  playerSpeedValue.textContent = parseFloat(playerSpeedSlider.value).toFixed(1);
  enemyHealthValue.textContent = Math.round(enemyHealthSlider.value);
  enemyAttackValue.textContent = Math.round(enemyAttackSlider.value);
  enemySpeedValue.textContent = parseFloat(enemySpeedSlider.value).toFixed(1);
}

// 应用设置
function applySettings() {
  gameSettings.player.health = parseInt(playerHealthSlider.value);
  gameSettings.player.attack = parseInt(playerAttackSlider.value);
  gameSettings.player.speed = parseFloat(playerSpeedSlider.value);
  gameSettings.enemy.health = parseInt(enemyHealthSlider.value);
  gameSettings.enemy.attack = parseInt(enemyAttackSlider.value);
  gameSettings.enemy.speed = parseFloat(enemySpeedSlider.value);
  
  // 如果游戏正在进行中，更新当前游戏对象的属性
  if (gameState.gameRunning) {
    gameState.player.maxHealth = gameSettings.player.health;
    gameState.player.health = Math.min(gameState.player.health, gameSettings.player.maxHealth);
    gameState.player.attack = gameSettings.player.attack;
    gameState.player.speed = gameSettings.player.speed;
    
    gameState.enemies.forEach(enemy => {
      enemy.maxHealth = gameSettings.enemy.health;
      enemy.health = Math.min(enemy.health, enemy.maxHealth);
      enemy.attack = gameSettings.enemy.attack;
      enemy.speed = gameSettings.enemy.speed;
    });
  }
  
  // 显示应用成功的提示
  applySettingsBtn.innerHTML = '<span class="material-symbols-outlined">check</span> 已应用';
  setTimeout(() => {
    applySettingsBtn.innerHTML = '<span class="material-symbols-outlined">settings</span> 应用设置';
  }, 1500);
}

// 添加滑块事件监听器
playerHealthSlider.addEventListener('input', updateSliderValues);
playerAttackSlider.addEventListener('input', updateSliderValues);
playerSpeedSlider.addEventListener('input', updateSliderValues);
enemyHealthSlider.addEventListener('input', updateSliderValues);
enemyAttackSlider.addEventListener('input', updateSliderValues);
enemySpeedSlider.addEventListener('input', updateSliderValues);

// 应用设置按钮事件监听器
applySettingsBtn.addEventListener('click', applySettings);

// 实时更新设置（可选，让用户可以实时看到效果）
function enableRealTimeSettings() {
  const sliders = [playerHealthSlider, playerAttackSlider, playerSpeedSlider, 
                   enemyHealthSlider, enemyAttackSlider, enemySpeedSlider];
  
  sliders.forEach(slider => {
    slider.addEventListener('input', () => {
      updateSliderValues();
      // 实时应用设置
      applySettings();
    });
  });
}

// 创建击中效果
function createHitEffect(x, y, color) {
  gameState.effects.push({
    x: x,
    y: y,
    color: color,
    size: 10,
    life: 20,
    maxLife: 20,
    type: 'hit'
  });
}

// 创建爆炸效果
function createExplosionEffect(x, y) {
  for (let i = 0; i < 8; i++) {
    gameState.effects.push({
      x: x,
      y: y,
      vx: (Math.random() - 0.5) * 6,
      vy: (Math.random() - 0.5) * 6,
      color: ['#ff6b35', '#f7931e', '#ffcc02'][Math.floor(Math.random() * 3)],
      size: Math.random() * 8 + 4,
      life: 30,
      maxLife: 30,
      type: 'explosion'
    });
  }
}

// 创建冲撞效果
function createChargeEffect(x, y) {
  gameState.effects.push({
    x: x,
    y: y,
    color: '#ff9800',
    size: 30,
    life: 15,
    maxLife: 15,
    type: 'charge'
  });
}

// 绘制AI状态指示器
function drawAIIndicator(enemy) {
  if (!enemy.aiState) return;
  
  const x = enemy.x + enemy.width + 5;
  const y = enemy.y - 5;
  
  // AI等级指示器
  ctx.save();
  ctx.fillStyle = ['#666', '#ff9800', '#f44336', '#9c27b0'][enemy.aiLevel];
  ctx.fillRect(x, y, 3, 8);
  
  // 状态指示器
  if (enemy.aiState.huntMode) {
    ctx.fillStyle = '#f44336';
    ctx.beginPath();
    ctx.arc(x + 8, y + 4, 2, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // 性格指示器（小图标）
  ctx.fillStyle = '#fff';
  ctx.font = '8px Arial';
  ctx.textAlign = 'center';
  const personalityIcons = {
    'aggressive': '⚡',
    'defensive': '🛡',
    'hunter': '🎯',
    'sniper': '🔍'
  };
  ctx.fillText(personalityIcons[enemy.aiPersonality] || '?', x + 8, y + 18);
  
  ctx.restore();
}

// 绘制护盾
function drawShield(x, y) {
  ctx.save();
  const time = Date.now() * 0.01;
  ctx.globalAlpha = 0.6 + Math.sin(time) * 0.2;
  ctx.strokeStyle = '#42a5f5';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, 25, 0, Math.PI * 2);
  ctx.stroke();
  
  // 护盾光芒
  ctx.globalAlpha = 0.3;
  ctx.fillStyle = '#42a5f5';
  ctx.beginPath();
  ctx.arc(x, y, 25, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// 绘制冰冻效果
function drawFrozenEffect(x, y) {
  ctx.save();
  const time = Date.now() * 0.005;
  
  // 冰晶效果
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2 + time;
    const radius = 15 + Math.sin(time + i) * 3;
    const crystalX = x + Math.cos(angle) * radius;
    const crystalY = y + Math.sin(angle) * radius;
    
    ctx.fillStyle = '#81d4fa';
    ctx.globalAlpha = 0.7;
    ctx.beginPath();
    ctx.arc(crystalX, crystalY, 2, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // 冰冻光环
  ctx.globalAlpha = 0.3;
  ctx.strokeStyle = '#81d4fa';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, 20, 0, Math.PI * 2);
  ctx.stroke();
  
  ctx.restore();
}

// 更新效果
function updateEffects() {
  for (let i = gameState.effects.length - 1; i >= 0; i--) {
    const effect = gameState.effects[i];
    effect.life--;
    
    if (effect.type === 'explosion') {
      effect.x += effect.vx;
      effect.y += effect.vy;
      effect.vx *= 0.95;
      effect.vy *= 0.95;
    }
    
    if (effect.life <= 0) {
      gameState.effects.splice(i, 1);
    }
  }
}

// 绘制延时炸弹
function drawDelayBombs() {
  gameState.delayBombs.forEach(bomb => {
    const timerPercent = bomb.timer / bomb.maxTimer;
    const centerX = bomb.x + bomb.width/2;
    const centerY = bomb.y + bomb.height/2;
    
    // 黑洞吸引范围（大圆）
    if (bomb.isPlayer) {
      ctx.save();
      ctx.globalAlpha = 0.1 + Math.sin(Date.now() * 0.01) * 0.05;
      ctx.strokeStyle = '#9c27b0';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.arc(centerX, centerY, bomb.pullRadius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
      
      // 黑洞漩涡效果
      ctx.save();
      ctx.globalAlpha = 0.3;
      const spiralTime = Date.now() * 0.005;
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2 + spiralTime;
        const radius = bomb.pullRadius * 0.8;
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;
        
        ctx.fillStyle = '#9c27b0';
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
    
    // 炸弹主体
    ctx.fillStyle = bomb.isPlayer ? '#9c27b0' : '#f44336';
    ctx.fillRect(bomb.x, bomb.y, bomb.width, bomb.height);
    
    // 闪烁效果
    if (bomb.timer < 60 && Math.floor(bomb.timer / 5) % 2 === 0) {
      ctx.fillStyle = '#ffeb3b';
      ctx.fillRect(bomb.x + 2, bomb.y + 2, bomb.width - 4, bomb.height - 4);
    }
    
    // 倒计时圆环
    ctx.save();
    ctx.strokeStyle = timerPercent > 0.3 ? '#4caf50' : '#f44336';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(centerX, centerY, 12, 
            -Math.PI/2, -Math.PI/2 + Math.PI * 2 * timerPercent);
    ctx.stroke();
    ctx.restore();
    
    // 爆炸范围预览（小圆）
    if (bomb.timer < 120) {
      ctx.save();
      ctx.globalAlpha = 0.15;
      ctx.fillStyle = '#ff5722';
      ctx.beginPath();
      ctx.arc(centerX, centerY, bomb.explosionRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  });
}

// 绘制效果
function drawEffects() {
  gameState.effects.forEach(effect => {
    const alpha = effect.life / effect.maxLife;
    ctx.save();
    ctx.globalAlpha = alpha;
    
    if (effect.type === 'hit') {
      ctx.fillStyle = effect.color;
      ctx.beginPath();
      ctx.arc(effect.x, effect.y, effect.size * alpha, 0, Math.PI * 2);
      ctx.fill();
    } else if (effect.type === 'explosion') {
      ctx.fillStyle = effect.color;
      ctx.beginPath();
      ctx.arc(effect.x, effect.y, effect.size * alpha, 0, Math.PI * 2);
      ctx.fill();
    } else if (effect.type === 'charge') {
      ctx.strokeStyle = effect.color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(effect.x, effect.y, effect.size * (1 - alpha), 0, Math.PI * 2);
      ctx.stroke();
    } else if (effect.type === 'chargeTrail') {
      ctx.fillStyle = effect.color;
      ctx.beginPath();
      ctx.arc(effect.x, effect.y, effect.size * alpha, 0, Math.PI * 2);
      ctx.fill();
      
      // 添加光晕效果
      ctx.globalAlpha = alpha * 0.3;
      ctx.beginPath();
      ctx.arc(effect.x, effect.y, effect.size * alpha * 2, 0, Math.PI * 2);
      ctx.fill();
    } else if (effect.type === 'shield') {
      ctx.strokeStyle = effect.color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(effect.x, effect.y, effect.size * alpha, 0, Math.PI * 2);
      ctx.stroke();
      
      // 护盾闪光
      ctx.globalAlpha = alpha * 0.5;
      ctx.fillStyle = effect.color;
      ctx.beginPath();
      ctx.arc(effect.x, effect.y, effect.size * alpha * 0.8, 0, Math.PI * 2);
      ctx.fill();
    } else if (effect.type === 'heal') {
      effect.x += effect.vx;
      effect.y += effect.vy;
      effect.vy += 0.1; // 重力
      
      ctx.fillStyle = effect.color;
      ctx.beginPath();
      ctx.arc(effect.x, effect.y, effect.size * alpha, 0, Math.PI * 2);
      ctx.fill();
    } else if (effect.type === 'freeze') {
      effect.x += effect.vx;
      effect.y += effect.vy;
      effect.vx *= 0.95;
      effect.vy *= 0.95;
      
      ctx.fillStyle = effect.color;
      ctx.beginPath();
      ctx.arc(effect.x, effect.y, effect.size * alpha, 0, Math.PI * 2);
      ctx.fill();
    } else if (effect.type === 'pull') {
      effect.x += effect.vx;
      effect.y += effect.vy;
      
      ctx.fillStyle = effect.color;
      ctx.beginPath();
      ctx.arc(effect.x, effect.y, effect.size * alpha, 0, Math.PI * 2);
      ctx.fill();
    } else if (effect.type === 'chargeArea') {
      ctx.strokeStyle = effect.color;
      ctx.lineWidth = 2;
      ctx.globalAlpha = alpha * 0.3;
      ctx.beginPath();
      ctx.arc(effect.x, effect.y, effect.size * alpha, 0, Math.PI * 2);
      ctx.stroke();
    }
    
    ctx.restore();
  });
}

// 坦克选择功能
function initTankSelector() {
  const tankOptions = document.querySelectorAll('.tank-option');
  
  // 默认选择标准坦克
  tankOptions[0].classList.add('selected');
  
  tankOptions.forEach(option => {
    option.addEventListener('click', () => {
      // 移除所有选中状态
      tankOptions.forEach(opt => opt.classList.remove('selected'));
      
      // 添加选中状态
      option.classList.add('selected');
      
      // 更新玩家坦克类型
      const tankType = option.dataset.type;
      gameState.player.tankType = tankType;
      
      // 如果游戏未运行，立即应用新属性
      if (!gameState.gameRunning) {
        const tankTypeData = TANK_TYPES[tankType];
        gameState.player.health = tankTypeData.health;
        gameState.player.maxHealth = tankTypeData.health;
        gameState.player.attack = tankTypeData.attack;
        gameState.player.speed = tankTypeData.speed;
      }
    });
  });
}

// 绘制键盘调试信息
function drawKeyboardDebug() {
  ctx.save();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(10, 10, 150, 120);
  
  ctx.fillStyle = '#ffffff';
  ctx.font = '14px Arial';
  ctx.textAlign = 'left';
  
  let y = 30;
  ctx.fillText('键盘状态:', 20, y);
  y += 20;
  
  Object.keys(keys).forEach(key => {
    const status = keys[key] ? '按下' : '释放';
    const color = keys[key] ? '#4caf50' : '#f44336';
    ctx.fillStyle = color;
    ctx.fillText(`${key.toUpperCase()}: ${status}`, 20, y);
    y += 15;
  });
  
  // 显示武器调试信息
  ctx.fillStyle = '#ffeb3b';
  ctx.fillText('F2: 武器调试', 20, y);
  
  ctx.restore();
}

// 武器调试模式
let weaponDebug = false;

// 绘制武器调试信息
function drawWeaponDebug() {
  if (!weaponDebug) return;
  
  ctx.save();
  
  // 绘制玩家武器位置
  const player = gameState.player;
  const playerWeaponPos = calculateWeaponPosition(player.x, player.y, player.direction, player.tankType);
  
  // 武器发射点（绿色大圆）
  ctx.fillStyle = '#00ff00';
  ctx.beginPath();
  ctx.arc(playerWeaponPos.x, playerWeaponPos.y, 5, 0, Math.PI * 2);
  ctx.fill();
  
  // 坦克中心点（绿色小圆）
  const centerX = player.x + player.width/2;
  const centerY = player.y + player.height/2;
  ctx.fillStyle = '#00ff00';
  ctx.beginPath();
  ctx.arc(centerX, centerY, 2, 0, Math.PI * 2);
  ctx.fill();
  
  // 连接线
  ctx.strokeStyle = '#00ff00';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(centerX, centerY);
  ctx.lineTo(playerWeaponPos.x, playerWeaponPos.y);
  ctx.stroke();
  
  // 方向标签
  ctx.fillStyle = '#00ff00';
  ctx.font = '12px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(`${player.direction.toUpperCase()}`, centerX, centerY - 25);
  ctx.fillText(`${player.tankType}`, centerX, centerY - 10);
  
  // 绘制敌人武器位置
  gameState.enemies.forEach((enemy, index) => {
    const enemyWeaponPos = calculateWeaponPosition(enemy.x, enemy.y, enemy.direction, 'NORMAL');
    
    // 武器发射点（红色圆）
    ctx.fillStyle = '#ff0000';
    ctx.beginPath();
    ctx.arc(enemyWeaponPos.x, enemyWeaponPos.y, 3, 0, Math.PI * 2);
    ctx.fill();
    
    // 坦克中心点
    const enemyCenterX = enemy.x + enemy.width/2;
    const enemyCenterY = enemy.y + enemy.height/2;
    ctx.fillStyle = '#ff0000';
    ctx.beginPath();
    ctx.arc(enemyCenterX, enemyCenterY, 1, 0, Math.PI * 2);
    ctx.fill();
    
    // 连接线
    ctx.strokeStyle = '#ff0000';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(enemyCenterX, enemyCenterY);
    ctx.lineTo(enemyWeaponPos.x, enemyWeaponPos.y);
    ctx.stroke();
    
    // 方向标签
    ctx.fillStyle = '#ff0000';
    ctx.font = '10px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(enemy.direction.toUpperCase(), enemyCenterX, enemyCenterY - 15);
  });
  
  // 调试信息面板
  ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
  ctx.fillRect(CANVAS_WIDTH - 200, 10, 190, 80);
  
  ctx.fillStyle = '#ffffff';
  ctx.font = '12px Arial';
  ctx.textAlign = 'left';
  ctx.fillText('武器调试模式 (F2关闭)', CANVAS_WIDTH - 195, 30);
  ctx.fillText('绿色: 玩家武器发射点', CANVAS_WIDTH - 195, 45);
  ctx.fillText('红色: 敌人武器发射点', CANVAS_WIDTH - 195, 60);
  ctx.fillText('线条: 坦克中心到武器', CANVAS_WIDTH - 195, 75);
  
  ctx.restore();
}

// 添加调试功能切换（F1键盘调试，F2武器调试）
document.addEventListener('keydown', (e) => {
  if (e.key === 'F1') {
    e.preventDefault();
    keyboardDebug = !keyboardDebug;
    console.log('键盘调试模式:', keyboardDebug ? '开启' : '关闭');
  }
  if (e.key === 'F2') {
    e.preventDefault();
    weaponDebug = !weaponDebug;
    console.log('武器调试模式:', weaponDebug ? '开启' : '关闭');
  }
});

// 预设配置
const presets = {
  normal: {
    playerHealth: 100,
    playerAttack: 50,
    playerSpeed: 3,
    enemyHealth: 100,
    enemyAttack: 50,
    enemySpeed: 2
  },
  godMode: {
    playerHealth: 1000,
    playerAttack: 500,
    playerSpeed: 10,
    enemyHealth: 50,
    enemyAttack: 10,
    enemySpeed: 1
  },
  hardcore: {
    playerHealth: 50,
    playerAttack: 25,
    playerSpeed: 2,
    enemyHealth: 200,
    enemyAttack: 100,
    enemySpeed: 5
  },
  speed: {
    playerHealth: 100,
    playerAttack: 50,
    playerSpeed: 15,
    enemyHealth: 100,
    enemyAttack: 50,
    enemySpeed: 10
  }
};

// 应用预设
function applyPreset(presetName) {
  const preset = presets[presetName];
  if (!preset) return;
  
  // 更新滑块值
  playerHealthSlider.value = preset.playerHealth;
  playerAttackSlider.value = preset.playerAttack;
  playerSpeedSlider.value = preset.playerSpeed;
  enemyHealthSlider.value = preset.enemyHealth;
  enemyAttackSlider.value = preset.enemyAttack;
  enemySpeedSlider.value = preset.enemySpeed;
  
  // 更新显示值
  updateSliderValues();
  
  // 应用设置
  applySettings();
  
  // 显示应用成功的提示
  const button = document.getElementById(`preset${presetName.charAt(0).toUpperCase() + presetName.slice(1)}`);
  const originalText = button.innerHTML;
  button.innerHTML = '<span class="material-symbols-outlined">check</span>已应用';
  setTimeout(() => {
    button.innerHTML = originalText;
  }, 1500);
}

// 初始化预设按钮
function initPresetButtons() {
  document.getElementById('presetNormal').addEventListener('click', () => applyPreset('normal'));
  document.getElementById('presetGodMode').addEventListener('click', () => applyPreset('godMode'));
  document.getElementById('presetHardcore').addEventListener('click', () => applyPreset('hardcore'));
  document.getElementById('presetSpeed').addEventListener('click', () => applyPreset('speed'));
}

// 启用实时设置更新
enableRealTimeSettings();

// 初始化坦克选择器
initTankSelector();

// 初始化预设按钮
initPresetButtons();

// 初始化游戏
initGame();

// 启动游戏循环
gameLoop();