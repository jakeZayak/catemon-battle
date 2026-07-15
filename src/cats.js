/* ---------- cat data, images, sounds ---------- */

// prefix with Vite's base URL so paths work at "/" in dev and "/catemon-battle/" on Pages
export const asset = (p) => import.meta.env.BASE_URL + p;

export const CAT_IMAGES = {
  huh:    asset("cat_imgs/huh-cat.gif"),
  maxwell: asset("cat_imgs/maxwell-cat-spinning.gif"),
  oiia:   asset("cat_imgs/oiia-cat.gif"),
  quaso:  asset("cat_imgs/quaso_cat.webp"),
  banana: asset("cat_imgs/banana-cat.gif"),
  pedro:  asset("cat_imgs/pedro.gif"),
  zoned:  asset("cat_imgs/zoned-out-cat.gif"),
  apple:  asset("cat_imgs/apple-cat.gif"),
};

// objectPosition to crop each photo nicely in a square container
export const CAT_CROP = {
  huh:    "center 0%",    // anchor top → clips the "HUH" text at the bottom
  maxwell: "60% center",  // shift right to center on the cat body
  oiia:   "center center",
  quaso:  "20% 30%",      // zoom into the face, crop out wall/floor background
  banana: "center 30%",   // tall portrait — favor the face
  pedro:  "center center",
  zoned:  "center 25%",   // favor the eyes
  apple:  "center center",
};

// oiia GIF has a solid black background — match the wrapper so it looks clean
export const CAT_WRAP_BG = { oiia: "#111", pedro: "#111" };

// each cat has multiple clips — one is picked at random per move
export const CAT_SOUNDS = {
  huh:    ["sounds/huh-1.mp3", "sounds/huh-2.mp3", "sounds/huh-3-long.mp3"].map(asset),
  maxwell: ["sounds/Maxwell-1.mp3", "sounds/Maxwell-2.mp3"].map(asset),
  oiia:   ["sounds/oiia-oiia-1.mp3", "sounds/oiia-oiia-2.mp3"].map(asset),
  banana: ["sounds/happy-cat-1.mp3", "sounds/happy-cat-2.mp3"].map(asset),
  quaso:  ["sounds/quaso-1.mp3"].map(asset),
  pedro:  ["sounds/pedro-1.mp3", "sounds/pedro-2.mp3", "sounds/pedro-song.mp3"].map(asset),
  zoned:  ["sounds/zoned-out-cat-1.mp3", "sounds/zoning-out-cat.mp3"].map(asset),
  apple:  ["sounds/happy-cat-1.mp3", "sounds/happy-cat-2.mp3"].map(asset), // shares banana's clips
};

export const HELICOPTER_SOUND = asset("sounds/helicopter-meme.mp3");

/* Bosses get this appended to their move list (enemies only) */
export const BOSS_MOVE = {
  key: "heli",
  name: "HELICOPTER HELICOPTER",
  power: 60,
  acc: 90,
  desc: "The blades. They spin.",
  fx: { heliSpin: true },
  sound: "helicopter",
};

export const CATS = {
  huh: {
    id: "huh",
    name: "HUH CAT",
    type: "CONFUSION",
    tagline: "Perpetually bewildered.",
    stats: { hp: 112, atk: 22, def: 24, spd: 18 },
    moves: [
      { key: "huh",   name: "HUH?",        power: 0,  acc: 90,  desc: "Confuses the foe. No damage.",   fx: { confuse: 1.0 } },
      { key: "tilt",  name: "HEAD TILT",    power: 40, acc: 100, desc: "Damage. May lower foe ATK.",     fx: { foeAtkDown: 0.4 } },
      { key: "stare", name: "BLANK STARE",  power: 0,  acc: 100, desc: "Raises own DEF.",                fx: { defUp: 1.0 } },
      { key: "why",   name: "???",          power: 80, acc: 85,  desc: "Big confusing damage.",          fx: {} },
    ],
  },
  maxwell: {
    id: "maxwell",
    name: "MAXWELL",
    type: "GROOVE",
    tagline: "He bops. Relentlessly.",
    stats: { hp: 118, atk: 24, def: 22, spd: 22 },
    moves: [
      { key: "bop",     name: "BOP BOP",       power: 18, acc: 95,  desc: "Hits 2-4 times.",               fx: { multi: true } },
      { key: "dance",   name: "DINGUS DANCE",   power: 0,  acc: 100, desc: "Raises own ATK.",               fx: { atkUp: 1.0 } },
      { key: "speaker", name: "SPEAKER BLAST",  power: 55, acc: 100, desc: "Solid, reliable damage.",       fx: {} },
      { key: "wav",     name: "MAXWELL.WAV",    power: 80, acc: 88,  desc: "Full volume. Big damage.",      fx: {} },
    ],
  },
  oiia: {
    id: "oiia",
    name: "OIIA CAT",
    type: "SPIN",
    tagline: "Rotational velocity: yes.",
    stats: { hp: 104, atk: 26, def: 19, spd: 28 },
    moves: [
      { key: "oiia",    name: "OIIAOIIA",     power: 45, acc: 100, desc: "Damage. May confuse.",          fx: { confuse: 0.25 } },
      { key: "hyper",   name: "HYPERSPIN",    power: 85, acc: 95,  desc: "Huge damage, small recoil.",    fx: { recoil: 0.12 } },
      { key: "rave",    name: "RAVE MODE",    power: 0,  acc: 100, desc: "Raises own ATK.",               fx: { atkUp: 1.0 } },
      { key: "screech", name: "UIIA SCREECH", power: 58, acc: 95,  desc: "Piercing sound damage.",        fx: {} },
    ],
  },
  quaso: {
    id: "quaso",
    name: "QUASO CAT",
    type: "CUTE",
    tagline: "quaso~",
    stats: { hp: 122, atk: 21, def: 26, spd: 14 },
    moves: [
      { key: "quaso",  name: "QUASO~",       power: 0,  acc: 90,  desc: "Confuses the foe instantly.",     fx: { confuse: 1.0 } },
      { key: "uno",    name: "UNO REVERSE",  power: 0,  acc: 85,  desc: "Reflects the foe's move back!",   fx: { reverse: true, priority: true } },
      { key: "bean",   name: "SMOL BEANS",   power: 0,  acc: 100, desc: "Restores 30% max HP.",            fx: { heal: 0.3 } },
      { key: "pounce", name: "POUNCE",       power: 75, acc: 92,  desc: "High-damage leap attack.",        fx: {} },
    ],
  },
  banana: {
    id: "banana",
    name: "BANANA CAT",
    type: "HAPPY",
    tagline: "happy happy happy",
    stats: { hp: 116, atk: 23, def: 22, spd: 12 },
    moves: [
      { key: "suit",    name: "BANANA SUIT",   power: 0,  acc: 90,  desc: "Inexplicable banana. Confuses foe.",  fx: { confuse: 1.0 } },
      { key: "zoomies", name: "ZOOMIES",       power: 50, acc: 100, desc: "Joyful charge. Tiny recoil.",         fx: { recoil: 0.1 } },
      { key: "happy",   name: "HAPPY HAPPY",   power: 80, acc: 85,  desc: "Pure joy at max volume.",             fx: {} },
      { key: "split",   name: "BANANA SPLIT",  power: 0,  acc: 100, desc: "Eats the banana. Restores 30% HP.",   fx: { heal: 0.3 } },
    ],
  },
  pedro: {
    id: "pedro",
    name: "PEDRO",
    type: "RACCOON",
    tagline: "pedro pedro pedro pe",
    stats: { hp: 108, atk: 24, def: 20, spd: 26 },
    moves: [
      { key: "pedro",   name: "PEDRO PEDRO",    power: 17, acc: 95,  desc: "Hits 2-4 times to the beat.",   fx: { multi: true } },
      { key: "shuffle", name: "TRASH SHUFFLE",  power: 0,  acc: 100, desc: "Raises own ATK.",               fx: { atkUp: 1.0 } },
      { key: "spin",    name: "MANDOLIN SPIN",  power: 55, acc: 95,  desc: "Spins with the mandolin.",      fx: {} },
      { key: "finale",  name: "PE-DRO FINALE",  power: 78, acc: 88,  desc: "The song reaches its peak.",    fx: {} },
    ],
  },
  zoned: {
    id: "zoned",
    name: "ZONED OUT CAT",
    type: "VOID",
    tagline: "no thoughts. head empty.",
    stats: { hp: 120, atk: 20, def: 27, spd: 10 },
    moves: [
      { key: "stare",  name: "1000-YARD STARE", power: 0,  acc: 90,  desc: "The stare confuses the foe.",   fx: { confuse: 1.0 } },
      { key: "dissoc", name: "DISSOCIATE",      power: 0,  acc: 100, desc: "Raises own DEF.",               fx: { defUp: 1.0 } },
      { key: "snap",   name: "SNAP BACK",       power: 55, acc: 95,  desc: "Suddenly returns to reality.",  fx: {} },
      { key: "buffer", name: "BUFFERING...",    power: 78, acc: 88,  desc: "Loading... loading... BAM.",    fx: {} },
    ],
  },
  apple: {
    id: "apple",
    name: "APPLE CAT",
    type: "FRUIT",
    tagline: "crunchy lil guy",
    stats: { hp: 114, atk: 22, def: 23, spd: 16 },
    moves: [
      { key: "toss",   name: "APPLE TOSS",      power: 45, acc: 100, desc: "Damage. May lower foe ATK.",         fx: { foeAtkDown: 0.3 } },
      { key: "aday",   name: "APPLE A DAY",     power: 0,  acc: 100, desc: "Keeps the vet away. Heals 30%.",     fx: { heal: 0.3 } },
      { key: "crunch", name: "CRUNCH",          power: 55, acc: 95,  desc: "Crisp, reliable damage.",            fx: {} },
      { key: "fury",   name: "FRUIT FURY",      power: 78, acc: 88,  desc: "Full fruit-powered slam.",           fx: {} },
    ],
  },
};

export const CAT_IDS = ["huh", "maxwell", "oiia", "quaso", "banana", "pedro", "zoned", "apple"];
