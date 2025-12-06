// Logique principale du jeu

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');

        this.lastTime = 0;
        this.gameTime = 0;
        this.gameOver = false;

        // État du joueur
        this.elixir = 5;
        this.deck = [...DEFAULT_DECK].sort(() => Math.random() - 0.5);
        this.hand = [];
        this.nextCard = null;
        this.selectedCardIndex = -1;

        // Entités
        this.buildings = [];
        this.units = [];
        this.projectiles = [];

        // IA
        this.ai = new AI(this);

        this.init();
        this.bindEvents();

        requestAnimationFrame((t) => this.loop(t));
    }

    init() {
        // Initialiser la main du joueur
        for(let i=0; i<4; i++) {
            this.hand.push(this.deck.pop());
        }
        this.nextCard = this.deck.pop();
        this.updateHandUI();

        // Initialiser les tours
        this.initTowers();
    }

    initTowers() {
        // Positions approximatives
        // Joueur (bas)
        this.buildings.push(new Building(3.5, 28, TEAM_PLAYER, 'princess', TOWER_HP_PRINCESS));
        this.buildings.push(new Building(14.5, 28, TEAM_PLAYER, 'princess', TOWER_HP_PRINCESS));
        this.buildings.push(new Building(9, 30, TEAM_PLAYER, 'king', TOWER_HP_KING));

        // IA (haut)
        this.buildings.push(new Building(3.5, 4, TEAM_ENEMY, 'princess', TOWER_HP_PRINCESS));
        this.buildings.push(new Building(14.5, 4, TEAM_ENEMY, 'princess', TOWER_HP_PRINCESS));
        this.buildings.push(new Building(9, 2, TEAM_ENEMY, 'king', TOWER_HP_KING));
    }

    bindEvents() {
        // Clic sur le canvas pour poser une unité
        this.canvas.addEventListener('mousedown', (e) => this.handleInput(e));

        // Sélection de carte (géré par onclick dans le HTML généré)
    }

    handleInput(e) {
        if (this.gameOver) return;
        if (this.selectedCardIndex === -1) return;

        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;

        const clickX = (e.clientX - rect.left) * scaleX;
        const clickY = (e.clientY - rect.top) * scaleY;

        const tileX = clickX / TILE_SIZE;
        const tileY = clickY / TILE_SIZE;

        // Vérifier si la position est valide pour le joueur
        // Zone de déploiement joueur: y > rivière (sauf exceptions comme mineur mais on simplifie)
        // Disons y > 16 pour l'instant
        if (tileY < 16) {
            // Afficher message "Zone invalide"
            return;
        }

        const cardId = this.hand[this.selectedCardIndex];
        const cardCost = CARDS[cardId].cost;

        if (this.elixir >= cardCost) {
            this.spawnUnit(cardId, tileX, tileY, TEAM_PLAYER);
            this.elixir -= cardCost;

            // Cycle carte
            this.hand.splice(this.selectedCardIndex, 1);
            this.hand.push(this.nextCard);
            this.deck.unshift(cardId);
            this.nextCard = this.deck.pop();

            this.selectedCardIndex = -1;
            this.updateHandUI();
        } else {
            // Pas assez d'élixir
        }
    }

    spawnUnit(cardId, x, y, team) {
        const stats = CARDS[cardId];
        if (stats.type === 'spell') {
            if (cardId === 'fireball') {
                 // Effet immédiat pour simplifier (pas de projectile visible depuis le roi pour l'instant)
                 // Rayon de dégâts
                 const radius = stats.radius;
                 const damage = stats.damage;

                 // Créer une animation simple (projectile statique ou particule)
                 // Pour simplifier : on applique les dégâts et on fait un effet visuel
                 this.projectiles.push(new Projectile(x, y, {x: x, y: y, dead: false, takeDamage: () => {}}, 0, team, 'explosion'));

                 // Trouver les cibles dans la zone
                 const targets = [...this.units, ...this.buildings];
                 targets.forEach(t => {
                     // Les sorts touchent tout le monde ou juste les ennemis ? Dans Clash Royale, Boule de Feu touche Ennemis seulement (troupes et batiments)
                     if (t.team !== team && !t.dead) {
                         const dist = Math.sqrt((t.x - x)**2 + (t.y - y)**2);
                         // On ajoute le rayon de l'unité pour être généreux
                         if (dist <= radius + (t.radius || 0)) {
                             t.takeDamage(damage);
                         }
                     }
                 });
            }
        } else {
            const count = stats.count || 1;
            for(let i=0; i<count; i++) {
                // Petit décalage si plusieurs unités
                const offsetX = (Math.random() - 0.5) * 1;
                const offsetY = (Math.random() - 0.5) * 1;
                this.units.push(new Unit(x + offsetX, y + offsetY, team, cardId));
            }
        }
    }

    updateHandUI() {
        const container = document.getElementById('cards-container');
        container.innerHTML = '';

        this.hand.forEach((cardId, index) => {
            const cardStats = CARDS[cardId];
            const el = document.createElement('div');
            el.className = 'card';
            if (index === this.selectedCardIndex) el.classList.add('selected');

            el.innerHTML = `
                <div class="card-cost">${cardStats.cost}</div>
                <div class="card-img" style="background-color:${cardStats.color}"></div>
                <div class="card-name">${cardStats.name}</div>
            `;

            el.onclick = () => {
                if (this.elixir >= cardStats.cost) {
                    this.selectedCardIndex = index;
                    this.updateHandUI();
                }
            };
            container.appendChild(el);
        });

        const nextContainer = document.getElementById('next-card');
        const nextStats = CARDS[this.nextCard];
        nextContainer.innerHTML = `
            <div class="card">
                <div class="card-img" style="background-color:${nextStats.color}"></div>
            </div>
        `;
    }

    updateElixirUI() {
        const fill = document.getElementById('elixir-bar-fill');
        const count = document.getElementById('elixir-count');
        const percent = (this.elixir / 10) * 100;
        fill.style.width = `${percent}%`;
        count.innerText = Math.floor(this.elixir);

        // Griser les cartes trop chères
        const cards = document.querySelectorAll('#cards-container .card');
        this.hand.forEach((id, idx) => {
            if (CARDS[id].cost > this.elixir) {
                cards[idx].style.opacity = '0.5';
            } else {
                cards[idx].style.opacity = '1';
            }
        });
    }

    loop(timestamp) {
        const dt = (timestamp - this.lastTime) / 1000;
        this.lastTime = timestamp;

        if (!this.gameOver) {
            this.update(dt);
            this.draw();
        }

        requestAnimationFrame((t) => this.loop(t));
    }

    update(dt) {
        this.gameTime += dt;

        // Timer
        const timeLeft = Math.max(0, GAME_DURATION - this.gameTime);
        const mins = Math.floor(timeLeft / 60);
        const secs = Math.floor(timeLeft % 60);
        document.getElementById('time-display').innerText = `${mins}:${secs < 10 ? '0'+secs : secs}`;

        if (timeLeft <= 0) {
            this.endGame();
            return;
        }

        // Elixir Joueur
        this.elixir += dt / ELIXIR_RATE;
        if (this.elixir > 10) this.elixir = 10;
        this.updateElixirUI();

        // Update IA
        this.ai.update(dt);

        // Update Entités
        this.buildings.forEach(b => b.update(dt, this));
        this.units.forEach(u => u.update(dt, this));
        this.projectiles.forEach(p => p.update(dt));

        // Nettoyage des morts
        // On garde les bâtiments morts pour l'instant pour ne pas crash (ou on les marque)
        // Mais pour l'affichage c'est géré.
        // Pour la logique, on filtre dans findTarget

        this.units = this.units.filter(u => !u.dead);
        this.projectiles = this.projectiles.filter(p => !p.dead);

        // Vérification condition de victoire (Roi détruit)
        const kings = this.buildings.filter(b => b.type === 'king');
        const playerKing = kings.find(k => k.team === TEAM_PLAYER);
        const enemyKing = kings.find(k => k.team === TEAM_ENEMY);

        if (playerKing.dead) this.endGame('Défaite !');
        else if (enemyKing.dead) this.endGame('Victoire !');
    }

    draw() {
        // Effacer
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Dessiner le sol (Arène)
        this.drawArena();

        // Dessiner entités
        // Ordre de profondeur (y-sort)
        const allEntities = [...this.buildings, ...this.units];
        allEntities.sort((a, b) => a.y - b.y);

        allEntities.forEach(e => e.draw(this.ctx));
        this.projectiles.forEach(p => p.draw(this.ctx));
    }

    drawArena() {
        // Fond Herbe
        this.ctx.fillStyle = '#5d9e44';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Rivière
        this.ctx.fillStyle = '#3498db';
        const riverY = (ARENA_HEIGHT / 2) * TILE_SIZE - (TILE_SIZE);
        this.ctx.fillRect(0, riverY, this.canvas.width, TILE_SIZE * 2);

        // Ponts
        this.ctx.fillStyle = '#8d6e63'; // Bois
        const bridgeWidth = 3 * TILE_SIZE;
        const bridgeHeight = 4 * TILE_SIZE;
        const bridgeY = riverY - TILE_SIZE;

        // Pont gauche
        const bridgeLeftX = 2 * TILE_SIZE;
        this.ctx.fillRect(bridgeLeftX, bridgeY, bridgeWidth, bridgeHeight);

        // Pont droit
        const bridgeRightX = (ARENA_WIDTH - 5) * TILE_SIZE;
        this.ctx.fillRect(bridgeRightX, bridgeY, bridgeWidth, bridgeHeight);

        // Grille (debug optionnel, faible opacité)
        /*
        this.ctx.strokeStyle = 'rgba(0,0,0,0.1)';
        this.ctx.lineWidth = 1;
        for(let x=0; x<=ARENA_WIDTH; x++) {
            this.ctx.beginPath();
            this.ctx.moveTo(x*TILE_SIZE, 0);
            this.ctx.lineTo(x*TILE_SIZE, this.canvas.height);
            this.ctx.stroke();
        }
        for(let y=0; y<=ARENA_HEIGHT; y++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y*TILE_SIZE);
            this.ctx.lineTo(this.canvas.width, y*TILE_SIZE);
            this.ctx.stroke();
        }
        */
    }

    endGame(message) {
        if (!message) {
             // Si message n'est pas fourni (fin du temps), on calcule le gagnant
             const playerTowers = this.buildings.filter(b => b.team === TEAM_PLAYER && !b.dead).length;
             const enemyTowers = this.buildings.filter(b => b.team === TEAM_ENEMY && !b.dead).length;

             if (playerTowers > enemyTowers) {
                 message = "Victoire !";
             } else if (enemyTowers > playerTowers) {
                 message = "Défaite !";
             } else {
                 message = "Égalité !";
             }
        }

        this.gameOver = true;
        const msgOverlay = document.getElementById('message-overlay');
        const msgText = document.getElementById('message-text');
        msgText.innerText = message;
        msgOverlay.classList.remove('hidden');
    }
}

window.onload = () => {
    new Game();
};
