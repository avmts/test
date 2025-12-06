// Constantes du jeu (2016)

// Dimensions de l'arène (logique)
const ARENA_WIDTH = 18; // Cases de largeur
const ARENA_HEIGHT = 32; // Cases de hauteur
const TILE_SIZE = 30; // Taille d'une case en pixels pour le rendu (540 / 18 = 30)

// Temps
const FPS = 60;
const ELIXIR_RATE = 2.8; // Secondes pour 1 élixir
const GAME_DURATION = 180; // 3 minutes en secondes
const OVERTIME_DURATION = 60; // 1 minute
const TICK_RATE = 1000 / FPS;

// Équipes
const TEAM_PLAYER = 0;
const TEAM_ENEMY = 1;

// Types de cibles
const TARGET_GROUND = 'ground';
const TARGET_AIR = 'air';
const TARGET_BUILDING = 'building';

// Carte des identifiants (ID) pour les cartes
const CARD_KNIGHT = 'knight';
const CARD_ARCHERS = 'archers';
const CARD_GIANT = 'giant';
const CARD_MINI_PEKKA = 'mini_pekka';
const CARD_FIREBALL = 'fireball';
const CARD_MUSKETEER = 'musketeer';
const CARD_BABY_DRAGON = 'baby_dragon'; // Volant
const CARD_SKELETON_ARMY = 'skeleton_army';

// Définitions des cartes (Statistiques approximatives de 2016 niveau tournoi)
const CARDS = {
    [CARD_KNIGHT]: {
        name: "Chevalier",
        cost: 3,
        count: 1,
        type: 'troop',
        hp: 660,
        damage: 75,
        hitSpeed: 1.1,
        speed: 3, // Lent
        range: 0.5, // Mêlée
        targets: TARGET_GROUND,
        transport: TARGET_GROUND,
        deployTime: 1,
        color: '#3498db'
    },
    [CARD_ARCHERS]: {
        name: "Archers",
        cost: 3,
        count: 2,
        type: 'troop',
        hp: 125,
        damage: 41,
        hitSpeed: 1.2,
        speed: 4, // Moyen
        range: 5,
        targets: 'all',
        transport: TARGET_GROUND,
        deployTime: 1,
        color: '#e74c3c'
    },
    [CARD_GIANT]: {
        name: "Géant",
        cost: 5,
        count: 1,
        type: 'troop',
        hp: 2000,
        damage: 126,
        hitSpeed: 1.5,
        speed: 2, // Très lent
        range: 0.5,
        targets: TARGET_BUILDING,
        transport: TARGET_GROUND,
        deployTime: 1,
        color: '#e67e22'
    },
    [CARD_MINI_PEKKA]: {
        name: "Mini P.E.K.K.A",
        cost: 4,
        count: 1,
        type: 'troop',
        hp: 600,
        damage: 325,
        hitSpeed: 1.8,
        speed: 5, // Rapide
        range: 0.5,
        targets: TARGET_GROUND,
        transport: TARGET_GROUND,
        deployTime: 1,
        color: '#5dade2'
    },
    [CARD_FIREBALL]: {
        name: "Boule de feu",
        cost: 4,
        type: 'spell',
        damage: 325, // Dégâts de zone
        radius: 2.5,
        color: '#c0392b'
    },
    [CARD_MUSKETEER]: {
        name: "Mousquetaire",
        cost: 4,
        count: 1,
        type: 'troop',
        hp: 340,
        damage: 100,
        hitSpeed: 1.1,
        speed: 4,
        range: 6,
        targets: 'all',
        transport: TARGET_GROUND,
        deployTime: 1,
        color: '#8e44ad'
    },
    [CARD_BABY_DRAGON]: {
        name: "Bébé Dragon",
        cost: 4,
        count: 1,
        type: 'troop',
        hp: 800,
        damage: 100, // Zone
        hitSpeed: 1.8,
        speed: 5,
        range: 3,
        targets: 'all',
        transport: TARGET_AIR,
        deployTime: 1,
        color: '#27ae60'
    },
    [CARD_SKELETON_ARMY]: {
        name: "Armée squelettes",
        cost: 3,
        count: 14, // C'était beaucoup en 2016
        type: 'troop',
        hp: 30,
        damage: 30,
        hitSpeed: 1,
        speed: 5,
        range: 0.5,
        targets: TARGET_GROUND,
        transport: TARGET_GROUND,
        deployTime: 1,
        color: '#ecf0f1'
    }
};

// Deck par défaut
const DEFAULT_DECK = [
    CARD_KNIGHT, CARD_ARCHERS, CARD_GIANT, CARD_MINI_PEKKA,
    CARD_FIREBALL, CARD_MUSKETEER, CARD_BABY_DRAGON, CARD_SKELETON_ARMY
];

// PV des Tours (Niveau Tournoi)
const TOWER_HP_PRINCESS = 1400;
const TOWER_HP_KING = 2400;
const TOWER_DAMAGE = 50;
const TOWER_HIT_SPEED = 0.8;
const TOWER_RANGE = 7.5;
