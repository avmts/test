class AI {
    constructor(game) {
        this.game = game;
        this.elixir = 5; // L'IA commence aussi avec 5
        this.deck = [...DEFAULT_DECK]; // Même deck pour l'instant
        this.hand = [];
        this.nextCard = null;
        this.timer = 0;

        this.initHand();
    }

    initHand() {
        // Mélanger le deck
        this.deck.sort(() => Math.random() - 0.5);
        for(let i=0; i<4; i++) {
            this.hand.push(this.deck.pop());
        }
        this.nextCard = this.deck.pop();
    }

    update(dt) {
        if (this.game.gameOver) return;

        // Génération d'élixir (même que joueur)
        // Note: Dans une vraie implémentation, Game gèrerait l'élixir pour les deux.
        // Ici on le fait séparément pour simplifier la classe AI autonome.
        this.elixir += dt / ELIXIR_RATE;
        if (this.elixir > 10) this.elixir = 10;

        this.timer += dt;

        // Décision simple : Si assez d'élixir, jouer une carte
        if (this.timer > 2) { // Vérifier toutes les 2 secondes
            this.timer = 0;
            if (this.elixir >= 4) { // Attendre d'avoir un peu de réserve
                this.playCard();
            }
        }
    }

    playCard() {
        // Choisir une carte jouable
        const availableCards = this.hand.filter(id => CARDS[id].cost <= this.elixir);

        if (availableCards.length > 0) {
            const cardId = availableCards[Math.floor(Math.random() * availableCards.length)];
            const cardStats = CARDS[cardId];

            // Choisir une position
            // L'IA joue en haut (y < ARENA_HEIGHT/2)
            // Zone de déploiement: y entre 0 et 14 (environ)
            const x = Math.random() * (ARENA_WIDTH - 2) + 1;
            const y = Math.random() * 10 + 2; // Un peu en retrait

            // Jouer la carte
            this.game.spawnUnit(cardId, x, y, TEAM_ENEMY);

            // Payer le coût
            this.elixir -= cardStats.cost;

            // Cycle de carte
            const index = this.hand.indexOf(cardId);
            this.hand.splice(index, 1);
            this.hand.push(this.nextCard);
            this.deck.unshift(cardId); // Remettre sous le paquet
            this.nextCard = this.deck.pop();
        }
    }
}
