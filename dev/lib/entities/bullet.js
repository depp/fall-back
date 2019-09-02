class Bullet extends Entity {
  constructor(config) {
    super();
    const { parent, angle } = config;
    this.parent = parent;
    this.angle = angle;
    this.id = generateId(); // TODO: will need to do something more unique
    this.gameId = parent.gameId;
    this.width = 10;
    this.height = 10;
    this.x = parent.x + (parent.width  / 2) - (this.width  / 2);
    this.y = parent.y + (parent.height / 2) - (this.height / 2);
    this.speedX = Math.cos((this.angle / 180) * Math.PI) * parent.weapon.speed;
    this.speedY = Math.sin((this.angle / 180) * Math.PI) * parent.weapon.speed;
    this.timer = 0;
    this.damage = parent.weapon.damage; // comes from the Player, based on weapon
    this.toRemove = false;

    GAMES[this.gameId].bullets[this.id] = this;
    GAMES[this.gameId].initPack.bullets.push(this.getInitPack());
  }
  update() {
    if (this.timer++ > 100) {
      this.toRemove = true;
    }
    super.update();
    const game = GAMES[this.gameId];

    // TODO: consider quadtree type structure for collisions

    /* Collisions with enemies */
    if (this.parent.type != 'enemy') { // No friendly fire
      for (let id in game.enemies) {
        let enemy = game.enemies[id];
        if (Entity.overlaps(this, enemy)) {
          enemy.hp -= this.damage;
          if (enemy.hp <= 0) {
            // enemy removal handled in Enemy class
            const shooter = game.players[this.parent.id];
            if (shooter) {
              shooter.score += 100;
            }
          }
          this.toRemove = true;
        }
      }
    }

    /* Collisions with enemies */
    for (let id in game.obstacles) {
      let obstacle = game.obstacles[id];
      if (Entity.overlaps(this, obstacle)) {
        this.toRemove = true;
      }
    }

    /* Collisions with players */
    if (this.parent.type != 'player') { // No friendly fire
      for (let id in game.players) {
        let player = game.players[id];
        if (Entity.overlaps(this, player)) {
          player.hp -= this.damage;
          this.toRemove = true;
        }
      }
    }
  }
  setDamage(damage) {
    this.damage = damage;
  }
  getInitPack() {
    return {
      id: this.id,
      x: this.x,
      y: this.y,
    };
  }
  getUpdatePack() {
    return {
      id: this.id,
      x: this.x,
      y: this.y,
    };
  }
  static updateAll(gameId) {
    const pack = [];
    const game = GAMES[gameId];
    for (let id in game.bullets) {
      let bullet = game.bullets[id];
      bullet.update();
      if (bullet.toRemove) {
        delete game.bullets[id];
        game.removePack.bullets.push(bullet.id);
      } else {
        pack.push(bullet.getUpdatePack());
      }
    }
    return pack;
  }
}

/* Not using module.exports because require() is unavailable in the sandbox environment */