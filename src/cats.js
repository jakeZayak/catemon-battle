/* ---------- cat data, images, sounds ---------- */

// prefix with Vite's base URL so paths work at "/" in dev and "/catemon-battle/" on Pages
export const asset = (p) => import.meta.env.BASE_URL + p;

export const CAT_IMAGES = {
  huh:    asset("cat_imgs/huh-cat.gif"),
  maxwell: asset("cat_imgs/maxwell-cat-spinning.gif"),
  oiia:   asset("cat_imgs/oiia-cat.gif"),
  quaso:  asset("cat_imgs/quaso_cat.webp"),
  banana: asset("cat_imgs/banana-cat.gif"),
};

// objectPosition to crop each photo nicely in a square container
export const CAT_CROP = {
  huh:    "center 0%",    // anchor top → clips the "HUH" text at the bottom
  maxwell: "60% center",  // shift right to center on the cat body
  oiia:   "center center",
  quaso:  "20% 30%",      // zoom into the face, crop out wall/floor background
  banana: "center 30%",   // tall portrait — favor the face
};

// oiia GIF has a solid black background — match the wrapper so it looks clean
export const CAT_WRAP_BG = { oiia: "#111" };

// each cat has multiple clips — one is picked at random per move
export const CAT_SOUNDS = {
  huh:    ["sounds/huh-1.mp3", "sounds/huh-2.mp3", "sounds/huh-3-long.mp3"].map(asset),
  maxwell: ["sounds/Maxwell-1.mp3", "sounds/Maxwell-2.mp3"].map(asset),
  oiia:   ["sounds/oiia-oiia-1.mp3", "sounds/oiia-oiia-2.mp3"].map(asset),
  banana: ["sounds/happy-cat-1.mp3", "sounds/happy-cat-2.mp3"].map(asset),
  quaso:  ["sounds/quaso-1.mp3"].map(asset),
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
      { key: "why",   name: "???",          power: 95, acc: 60,  desc: "Big damage, shaky aim.",         fx: {} },
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
      { key: "wav",     name: "MAXWELL.WAV",    power: 88, acc: 78,  desc: "Full volume. Sometimes misses.", fx: {} },
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
      { key: "hyper",   name: "HYPERSPIN",    power: 95, acc: 90,  desc: "Huge damage, 25% recoil.",      fx: { recoil: 0.25 } },
      { key: "rave",    name: "RAVE MODE",    power: 0,  acc: 100, desc: "Raises own ATK.",               fx: { atkUp: 1.0 } },
      { key: "screech", name: "UIIA SCREECH", power: 58, acc: 92,  desc: "Piercing sound damage.",        fx: {} },
    ],
  },
  quaso: {
    id: "quaso",
    name: "QUASO CAT",
    type: "CUTE",
    tagline: "quaso~",
    stats: { hp: 122, atk: 21, def: 26, spd: 14 },
    moves: [
      { key: "quaso",  name: "QUASO~",       power: 0,  acc: 90,  desc: "Confuses the foe instantly.",   fx: { confuse: 1.0 } },
      { key: "peek",   name: "CORNER PEEK",  power: 48, acc: 100, desc: "Sneak attack. May lower ATK.",  fx: { foeAtkDown: 0.4 } },
      { key: "bean",   name: "SMOL BEANS",   power: 0,  acc: 100, desc: "Restores 30% max HP.",          fx: { heal: 0.3 } },
      { key: "pounce", name: "POUNCE",       power: 84, acc: 85,  desc: "High-damage leap attack.",      fx: {} },
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
      { key: "zoomies", name: "ZOOMIES",       power: 50, acc: 100, desc: "Joyful charge. 15% crash recoil.",    fx: { recoil: 0.15 } },
      { key: "happy",   name: "HAPPY HAPPY",   power: 90, acc: 72,  desc: "Pure joy at max volume. Risky aim.",  fx: {} },
      { key: "split",   name: "BANANA SPLIT",  power: 0,  acc: 100, desc: "Eats the banana. Restores 30% HP.",   fx: { heal: 0.3 } },
    ],
  },
};

export const CAT_IDS = ["huh", "maxwell", "oiia", "quaso", "banana"];
