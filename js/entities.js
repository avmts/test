class Entity {
    constructor(x, y, team) {
        this.x = x; // Position en cases
        this.y = y;
        this.team = team;
        this.id = Math.random().toString(36).substr(2, 9);
        this.dead = false;
        this.radius = 0.5; // Rayon de collision
    }

    update(dt, game) {
        // Base update
    }

    draw(ctx) {
        // Base draw
    }

    distanceTo(other) {
        return Math.sqrt((this.x - other.x) ** 2 + (this.y - other.y) ** 2);
    }
}

class Building extends Entity {
    constructor(x, y, team, type, hp) {
        super(x, y, team);
        this.type = type; // 'princess' or 'king'
        this.maxHp = hp;
        this.hp = hp;
        this.range = TOWER_RANGE;
        this.damage = TOWER_DAMAGE;
        this.hitSpeed = TOWER_HIT_SPEED;
        this.cooldown = 0;
        this.radius = 1.5;
        this.active = true; // Le roi ne tire que s'il est touché ou une tour détruite (simplifié: actif tout de suite si princesse détruite)
    }

    update(dt, game) {
        if (this.dead) return;

        if (this.cooldown > 0) {
            this.cooldown -= dt;
        }

        // Si c'est le roi, vérifier s'il est actif
        if (this.type === 'king' && !this.active) {
            // Vérifier si une tour princesse est détruite
            const princesses = game.buildings.filter(b => b.team === this.team && b.type === 'princess');
            if (princesses.length < 2 || this.hp < this.maxHp) {
                this.active = true;
            } else {
                return;
            }
        }

        if (this.cooldown <= 0) {
            const target = this.findTarget(game);
            if (target) {
                this.attack(target, game);
                this.cooldown = this.hitSpeed;
            }
        }
    }

    findTarget(game) {
        let bestTarget = null;
        let minDist = this.range;

        // Chercher dans les unités ennemies
        for (const unit of game.units) {
            if (unit.team !== this.team && !unit.dead) {
                const dist = this.distanceTo(unit);
                if (dist <= this.range && dist < minDist) {
                    minDist = dist;
                    bestTarget = unit;
                }
            }
        }
        return bestTarget;
    }

    attack(target, game) {
        // Créer un projectile
        game.projectiles.push(new Projectile(this.x, this.y, target, this.damage, this.team, 'arrow'));
    }

    takeDamage(amount) {
        this.hp -= amount;
        if (this.hp <= 0) {
            this.hp = 0;
            this.dead = true;
        }
    }

    draw(ctx) {
        if (this.dead) return; // Ou dessiner des ruines

        ctx.fillStyle = this.team === TEAM_PLAYER ? '#3498db' : '#e74c3c';

        // Forme de la tour
        const size = this.type === 'king' ? 3 : 2;
        const screenX = this.x * TILE_SIZE;
        const screenY = this.y * TILE_SIZE;

        ctx.fillRect(screenX - (size * TILE_SIZE / 2), screenY - (size * TILE_SIZE / 2), size * TILE_SIZE, size * TILE_SIZE);

        // Barre de vie
        const hpPercent = this.hp / this.maxHp;
        ctx.fillStyle = 'red';
        ctx.fillRect(screenX - 20, screenY - (size * TILE_SIZE / 2) - 10, 40, 5);
        ctx.fillStyle = 'green';
        ctx.fillRect(screenX - 20, screenY - (size * TILE_SIZE / 2) - 10, 40 * hpPercent, 5);
    }
}

class Unit extends Entity {
    constructor(x, y, team, cardId) {
        super(x, y, team);
        const stats = CARDS[cardId];
        this.stats = stats;
        this.hp = stats.hp;
        this.maxHp = stats.hp;
        this.damage = stats.damage;
        this.range = stats.range;
        this.speed = stats.speed * 0.5; // Ajustement arbitraire pour la map
        this.hitSpeed = stats.hitSpeed;
        this.targets = stats.targets;
        this.transport = stats.transport;

        this.cooldown = stats.deployTime; // Temps de déploiement initial
        this.deploying = true;

        this.target = null;
    }

    update(dt, game) {
        if (this.dead) return;

        if (this.deploying) {
            this.cooldown -= dt;
            if (this.cooldown <= 0) {
                this.deploying = false;
                this.cooldown = 0;
            }
            return;
        }

        if (this.cooldown > 0) {
            this.cooldown -= dt;
        }

        // 1. Chercher une cible à attaquer
        this.target = this.findTarget(game);

        if (this.target) {
            const dist = this.distanceTo(this.target);
            // Si à portée
            if (dist <= this.range + this.target.radius) {
                if (this.cooldown <= 0) {
                    this.attack(this.target, game);
                    this.cooldown = this.hitSpeed;
                }
            } else {
                // Avancer vers la cible
                this.moveTowards(this.target.x, this.target.y, dt);
            }
        } else {
            // 2. Si pas de cible, avancer vers la tour ennemie la plus proche (logique de voie)
            const dest = this.getNextWaypoint(game);
            if (dest) {
                this.moveTowards(dest.x, dest.y, dt);
            }
        }
    }

    findTarget(game) {
        let bestTarget = null;
        let minDist = 5; // Rayon de vision (aggro range)

        const potentialTargets = [...game.units, ...game.buildings];

        for (const t of potentialTargets) {
            if (t.team !== this.team && !t.dead) {
                // Vérifier si la cible est valide (sol/air)
                if (this.targets === TARGET_BUILDING && !(t instanceof Building)) continue;
                if (this.targets === TARGET_GROUND && t.transport === TARGET_AIR) continue;
                // 'all' vise tout

                const dist = this.distanceTo(t);
                if (dist < minDist) {
                    minDist = dist;
                    bestTarget = t;
                }
            }
        }
        return bestTarget;
    }

    getNextWaypoint(game) {
        // Cibles prioritaires : Tours ennemies
        const enemies = game.buildings.filter(b => b.team !== this.team && !b.dead);

        if (enemies.length === 0) return null; // Plus de bâtiments ennemis

        // Trier par distance pour trouver la plus proche
        enemies.sort((a, b) => this.distanceTo(a) - this.distanceTo(b));
        const targetBuilding = enemies[0];

        // Si unité volante, ligne droite vers la cible
        if (this.transport === TARGET_AIR) {
            return targetBuilding;
        }

        // Si unité au sol, gestion des ponts
        const bridgeY = ARENA_HEIGHT / 2;

        // Vérifier si on doit traverser la rivière
        // Joueur (y grand) vers Ennemi (y petit) : doit traverser si y > bridgeY et cible.y < bridgeY
        // Ennemi (y petit) vers Joueur (y grand) : doit traverser si y < bridgeY et cible.y > bridgeY
        const needsToCross = (this.team === TEAM_PLAYER && this.y > bridgeY && targetBuilding.y < bridgeY) ||
                             (this.team === TEAM_ENEMY && this.y < bridgeY && targetBuilding.y > bridgeY);

        if (needsToCross) {
            // Choisir le pont le plus approprié (gauche ou droite)
            // On choisit le pont du côté où on est, ou du côté de la cible si on est au milieu
            const bridgeLeftX = 3.5;
            const bridgeRightX = 14.5;

            // Distance vers les deux ponts
            const distLeft = Math.abs(this.x - bridgeLeftX);
            const distRight = Math.abs(this.x - bridgeRightX);

            const targetBridgeX = distLeft < distRight ? bridgeLeftX : bridgeRightX;

            // Si on est proche du pont (en x et y), on considère qu'on a traversé (ou qu'on est dessus)
            // On vise le pont tant qu'on n'est pas "dessus" ou "passé"
            const distToBridge = Math.sqrt((this.x - targetBridgeX)**2 + (this.y - bridgeY)**2);

            if (distToBridge > 2) {
                return { x: targetBridgeX, y: bridgeY };
            }
        }

        return targetBuilding;
    }

    moveTowards(tx, ty, dt) {
        const dx = tx - this.x;
        const dy = ty - this.y;
        const dist = Math.sqrt(dx*dx + dy*dy);

        if (dist > 0) {
            this.x += (dx / dist) * this.speed * dt;
            this.y += (dy / dist) * this.speed * dt;
        }
    }

    attack(target, game) {
        // Mêlée instantanée, distance projectile
        if (this.range < 2) {
            target.takeDamage(this.damage);
        } else {
             game.projectiles.push(new Projectile(this.x, this.y, target, this.damage, this.team, 'fireball')); // ou fleche
        }
    }

    takeDamage(amount) {
        this.hp -= amount;
        if (this.hp <= 0) {
            this.hp = 0;
            this.dead = true;
        }
    }

    draw(ctx) {
        if (this.dead) return;

        const screenX = this.x * TILE_SIZE;
        const screenY = this.y * TILE_SIZE;

        // Effet de déploiement
        if (this.deploying) {
            ctx.globalAlpha = 0.5;
        }

        ctx.fillStyle = this.stats.color || 'white';
        ctx.beginPath();
        ctx.arc(screenX, screenY, TILE_SIZE/2, 0, Math.PI*2);
        ctx.fill();

        // Indication d'équipe
        ctx.strokeStyle = this.team === TEAM_PLAYER ? 'blue' : 'red';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.globalAlpha = 1.0;
    }
}

class Projectile {
    constructor(x, y, target, damage, team, type) {
        this.x = x;
        this.y = y;
        this.target = target;
        this.damage = damage;
        this.team = team;
        this.type = type;
        this.speed = 10;
        this.dead = false;
    }

    update(dt) {
        if (this.dead) return;
        if (this.target.dead) {
            this.dead = true; // Cible morte, projectile perdu
            return;
        }

        const dx = this.target.x - this.x;
        const dy = this.target.y - this.y;
        const dist = Math.sqrt(dx*dx + dy*dy);

        if (dist < 0.5) {
            this.target.takeDamage(this.damage);
            this.dead = true;
        } else {
            this.x += (dx / dist) * this.speed * dt;
            this.y += (dy / dist) * this.speed * dt;
        }
    }

    draw(ctx) {
        if (this.dead) return;

        if (this.type === 'explosion') {
            ctx.fillStyle = 'orange';
            const screenX = this.x * TILE_SIZE;
            const screenY = this.y * TILE_SIZE;
            ctx.beginPath();
            ctx.arc(screenX, screenY, 2.5 * TILE_SIZE, 0, Math.PI*2); // Rayon visuel de la boule de feu
            ctx.globalAlpha = 0.5;
            ctx.fill();
            ctx.globalAlpha = 1.0;

            // L'effet n'est visible qu'une frame en fait si on ne gère pas de durée de vie.
            // Pour l'instant on le tue direct dans update.
            this.dead = true;
            return;
        }

        ctx.fillStyle = 'yellow';
        const screenX = this.x * TILE_SIZE;
        const screenY = this.y * TILE_SIZE;
        ctx.beginPath();
        ctx.arc(screenX, screenY, 5, 0, Math.PI*2);
        ctx.fill();
    }
}
