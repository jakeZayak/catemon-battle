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
  wert:   asset("cat_imgs/wert.png"),
  pipe:   asset("cat_imgs/pipe.webp"),
  stickbug: asset("cat_imgs/stick-bug.gif"),
  sprite: asset("cat_imgs/sprite-cat.jpg"),
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
  wert:   "center 10%",   // tall portrait — frame the face and glasses
  pipe:   "center center",
  stickbug: "center 35%", // frame the bug on the ledge
  sprite: "center center",
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
  wert:   ["sounds/wert.m4a"].map(asset),
  pipe:   ["sounds/metal-pipe-clang.mp3"].map(asset),
  stickbug: ["sounds/stickbug.mp3"].map(asset),
  sprite: ["sounds/sprite-cat-1.mp3"].map(asset),
};

/* one-off game sounds */
export const GAME_SOUNDS = {
  airhorn: asset("sounds/airhorn.mp3"),
  eating:  asset("sounds/eating.mp3"),
  lose:    ["sounds/oof.mp3", "sounds/defeat.mp3"].map(asset),
};

export const HELICOPTER_SOUND = asset("sounds/helicopter-meme.mp3");

/* ---------- looping music tracks + one-shot jingles ---------- */

const music = (name) => asset(`sounds/music/${name}.mp3`);

export const MUSIC = {
  title: music("title"),
  center: music("center"),
  tower: music("tower"),
  areas: ["area-kitchen", "area-livingroom", "area-backrooms", "area-garden", "area-ohio", "area-space"].map(music),
  zones: ["zone-1", "zone-2", "zone-3"].map(music),
  battleWild: music("battle-wild"),
  battleBoss: music("battle-boss"),
  battleFinal: music("battle-final"),
  victoryWild: music("victory-wild"),
  victoryBoss: music("victory-boss"),
};

export const JINGLES = {
  levelup: music("jingle-levelup"),
  item: music("jingle-item"),
  keyitem: music("jingle-keyitem"),
  befriend: music("jingle-befriend"),
};

/* ---------- battle families (type chart) ----------
   Single cycle: each family beats the next and is weak to the previous.
   GOOFY → CHAOS → CLANG → GROOVE → SNACC → ZOOM → GOOFY */
export const FAMILY_BEATS = {
  GOOFY: "CHAOS",
  CHAOS: "CLANG",
  CLANG: "GROOVE",
  GROOVE: "SNACC",
  SNACC: "ZOOM",
  ZOOM: "GOOFY",
};

export const FAMILY_ICONS = { GOOFY: "🤪", CHAOS: "🌀", CLANG: "🔩", GROOVE: "🕺", SNACC: "🍩", ZOOM: "💨" };

/* gentle multipliers — advantages matter but never feel unfair */
export const familyMul = (atkFam, defFam) =>
  FAMILY_BEATS[atkFam] === defFam ? 1.4 : FAMILY_BEATS[defFam] === atkFam ? 0.75 : 1;

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
    family: "GOOFY",
    tagline: "Perpetually bewildered.",
    stats: { hp: 112, atk: 22, def: 24, spd: 18 },
    moves: [
      { key: "huh",   name: "HUH?",        power: 0,  acc: 90,  desc: "Confuses the foe. No damage.",   fx: { confuse: 1.0 } },
      { key: "tilt",  name: "HEAD TILT",    power: 40, acc: 100, desc: "Damage. May lower foe ATK.",     fx: { foeAtkDown: 0.4 } },
      { key: "stare", name: "BLANK STARE",  power: 0,  acc: 100, desc: "Raises own DEF.",                fx: { defUp: 1.0 } },
      { key: "why",   name: "???",          power: 80, acc: 85,  desc: "Big confusing damage.",          fx: {} },
    ],
    learnset: [
      { at: 4, move: { key: "loudhuh", name: "LOUD HUH?",           power: 55, acc: 95, desc: "A deafening question. May confuse.", fx: { confuse: 0.2 } } },
      { at: 8, move: { key: "crisis",  name: "EXISTENTIAL CRISIS",  power: 0,  acc: 90, desc: "Foe questions everything. Lowers ATK.", fx: { foeAtkDown: 1.0 } } },
    ],
  },
  maxwell: {
    id: "maxwell",
    name: "MAXWELL",
    type: "GROOVE",
    family: "GROOVE",
    tagline: "He bops. Relentlessly.",
    stats: { hp: 118, atk: 24, def: 22, spd: 22 },
    moves: [
      { key: "bop",     name: "BOP BOP",       power: 18, acc: 95,  desc: "Hits 2-4 times.",               fx: { multi: true } },
      { key: "dance",   name: "DINGUS DANCE",   power: 0,  acc: 100, desc: "Raises own ATK.",               fx: { atkUp: 1.0 } },
      { key: "speaker", name: "SPEAKER BLAST",  power: 55, acc: 100, desc: "Solid, reliable damage.",       fx: {} },
      { key: "wav",     name: "MAXWELL.WAV",    power: 80, acc: 88,  desc: "Full volume. Big damage.",      fx: {} },
    ],
    learnset: [
      { at: 4, move: { key: "bassdrop", name: "BASS DROP", power: 60, acc: 95,  desc: "The beat hits. Hard.",                fx: {} } },
      { at: 8, move: { key: "encore",   name: "ENCORE",    power: 0,  acc: 100, desc: "Crowd goes wild. Raises ATK and SPD.", fx: { atkUp: 1.0, spdUp: 1.0 } } },
    ],
  },
  oiia: {
    id: "oiia",
    name: "OIIA CAT",
    type: "SPIN",
    family: "ZOOM",
    tagline: "Rotational velocity: yes.",
    stats: { hp: 104, atk: 26, def: 19, spd: 28 },
    moves: [
      { key: "oiia",    name: "OIIAOIIA",     power: 45, acc: 100, desc: "Damage. May confuse.",          fx: { confuse: 0.25 } },
      { key: "hyper",   name: "HYPERSPIN",    power: 85, acc: 95,  desc: "Huge damage, small recoil.",    fx: { recoil: 0.12 } },
      { key: "rave",    name: "RAVE MODE",    power: 0,  acc: 100, desc: "Raises own ATK.",               fx: { atkUp: 1.0 } },
      { key: "screech", name: "UIIA SCREECH", power: 58, acc: 95,  desc: "Piercing sound damage.",        fx: {} },
    ],
    learnset: [
      { at: 4, move: { key: "gyro",      name: "GYROSCOPE",  power: 0,  acc: 100, desc: "Perfect balance. Raises DEF.",          fx: { defUp: 1.0 } } },
      { at: 8, move: { key: "sonicspin", name: "SONIC SPIN", power: 82, acc: 90,  desc: "Spins at unsafe speeds. Small recoil.", fx: { recoil: 0.1 } } },
    ],
  },
  quaso: {
    id: "quaso",
    name: "QUASO CAT",
    type: "CUTE",
    family: "SNACC",
    tagline: "quaso~",
    stats: { hp: 122, atk: 21, def: 26, spd: 14 },
    moves: [
      { key: "quaso",  name: "QUASO~",       power: 0,  acc: 90,  desc: "Confuses the foe instantly.",     fx: { confuse: 1.0 } },
      { key: "uno",    name: "UNO REVERSE",  power: 0,  acc: 85,  desc: "Reflects the foe's move back!",   fx: { reverse: true, priority: true } },
      { key: "bean",   name: "SMOL BEANS",   power: 0,  acc: 100, desc: "Restores 30% max HP.",            fx: { heal: 0.3 } },
      { key: "pounce", name: "POUNCE",       power: 75, acc: 92,  desc: "High-damage leap attack.",        fx: {} },
    ],
    learnset: [
      { at: 4, move: { key: "butter", name: "BUTTER UP",   power: 0,  acc: 100, desc: "Slippery and glossy. Raises DEF.", fx: { defUp: 1.0 } } },
      { at: 8, move: { key: "flaky",  name: "FLAKY FURY",  power: 18, acc: 95,  desc: "Crumbs everywhere. Hits 2-4 times.", fx: { multi: true } } },
    ],
  },
  banana: {
    id: "banana",
    name: "BANANA CAT",
    type: "HAPPY",
    family: "GOOFY",
    tagline: "happy happy happy",
    stats: { hp: 116, atk: 23, def: 22, spd: 12 },
    moves: [
      { key: "suit",    name: "BANANA SUIT",   power: 0,  acc: 90,  desc: "Inexplicable banana. Confuses foe.",  fx: { confuse: 1.0 } },
      { key: "zoomies", name: "ZOOMIES",       power: 50, acc: 100, desc: "Joyful charge. Tiny recoil.",         fx: { recoil: 0.1 } },
      { key: "happy",   name: "HAPPY HAPPY",   power: 80, acc: 85,  desc: "Pure joy at max volume.",             fx: {} },
      { key: "split",   name: "BANANA SPLIT",  power: 0,  acc: 100, desc: "Eats the banana. Restores 30% HP.",   fx: { heal: 0.3 } },
    ],
    learnset: [
      { at: 4, move: { key: "peel",     name: "PEEL SLIP",     power: 45, acc: 100, desc: "A classic. May lower foe ATK.", fx: { foeAtkDown: 0.4 } } },
      { at: 8, move: { key: "maxhappy", name: "MAXIMUM HAPPY", power: 82, acc: 88,  desc: "Joy overload. Huge damage.",    fx: {} } },
    ],
  },
  pedro: {
    id: "pedro",
    name: "PEDRO",
    type: "RACCOON",
    family: "CHAOS",
    tagline: "pedro pedro pedro pe",
    stats: { hp: 108, atk: 24, def: 20, spd: 26 },
    moves: [
      { key: "pedro",   name: "PEDRO PEDRO",    power: 17, acc: 95,  desc: "Hits 2-4 times to the beat.",   fx: { multi: true } },
      { key: "shuffle", name: "TRASH SHUFFLE",  power: 0,  acc: 100, desc: "Raises own ATK.",               fx: { atkUp: 1.0 } },
      { key: "spin",    name: "MANDOLIN SPIN",  power: 55, acc: 95,  desc: "Spins with the mandolin.",      fx: {} },
      { key: "finale",  name: "PE-DRO FINALE",  power: 78, acc: 88,  desc: "The song reaches its peak.",    fx: {} },
    ],
    learnset: [
      { at: 4, move: { key: "tornado", name: "TRASH TORNADO", power: 55, acc: 95,  desc: "Spins the bins into a cyclone.",   fx: {} } },
      { at: 8, move: { key: "solo",    name: "MANDOLIN SOLO", power: 0,  acc: 100, desc: "Hypnotic strumming. Raises SPD.",  fx: { spdUp: 1.0 } } },
    ],
  },
  zoned: {
    id: "zoned",
    name: "ZONED OUT CAT",
    type: "VOID",
    family: "CHAOS",
    tagline: "no thoughts. head empty.",
    stats: { hp: 120, atk: 20, def: 27, spd: 10 },
    moves: [
      { key: "stare",  name: "1000-YARD STARE", power: 0,  acc: 90,  desc: "The stare confuses the foe.",   fx: { confuse: 1.0 } },
      { key: "dissoc", name: "DISSOCIATE",      power: 0,  acc: 100, desc: "Raises own DEF.",               fx: { defUp: 1.0 } },
      { key: "snap",   name: "SNAP BACK",       power: 55, acc: 95,  desc: "Suddenly returns to reality.",  fx: {} },
      { key: "buffer", name: "BUFFERING...",    power: 78, acc: 88,  desc: "Loading... loading... BAM.",    fx: {} },
    ],
    learnset: [
      { at: 4, move: { key: "grass",    name: "TOUCH GRASS", power: 0,  acc: 100, desc: "Grounding. Restores 30% HP.",  fx: { heal: 0.3 } } },
      { at: 8, move: { key: "voidgaze", name: "VOID GAZE",   power: 80, acc: 88,  desc: "The void gazes back. May confuse.", fx: { confuse: 0.2 } } },
    ],
  },
  apple: {
    id: "apple",
    name: "APPLE CAT",
    type: "FRUIT",
    family: "SNACC",
    tagline: "crunchy lil guy",
    stats: { hp: 114, atk: 22, def: 23, spd: 16 },
    moves: [
      { key: "toss",   name: "APPLE TOSS",      power: 45, acc: 100, desc: "Damage. May lower foe ATK.",         fx: { foeAtkDown: 0.3 } },
      { key: "aday",   name: "APPLE A DAY",     power: 0,  acc: 100, desc: "Keeps the vet away. Heals 30%.",     fx: { heal: 0.3 } },
      { key: "crunch", name: "CRUNCH",          power: 55, acc: 95,  desc: "Crisp, reliable damage.",            fx: {} },
      { key: "fury",   name: "FRUIT FURY",      power: 78, acc: 88,  desc: "Full fruit-powered slam.",           fx: {} },
    ],
    learnset: [
      { at: 4, move: { key: "seeds",   name: "SEED SPIT",    power: 17, acc: 95,  desc: "Rapid fire. Hits 2-4 times.",      fx: { multi: true } } },
      { at: 8, move: { key: "caramel", name: "CARAMEL COAT", power: 0,  acc: 100, desc: "Sticky candy armor. Raises DEF.",  fx: { defUp: 1.0 } } },
    ],
  },
  pipe: {
    id: "pipe",
    name: "METAL PIPE",
    type: "CLANG",
    family: "CLANG",
    tagline: "*deafening clang*",
    stats: { hp: 110, atk: 27, def: 25, spd: 11 },
    moves: [
      { key: "conk",   name: "BRO GOT CONK'D",  power: 78, acc: 88,  desc: "The legendary falling pipe.",     fx: {} },
      { key: "clang",  name: "CLANG",           power: 50, acc: 100, desc: "Loud damage. May confuse.",       fx: { confuse: 0.3 } },
      { key: "lean",   name: "LEAN ON WALL",    power: 0,  acc: 100, desc: "Braces itself. Raises own DEF.",  fx: { defUp: 1.0 } },
      { key: "drop",   name: "DROPPED!!",       power: 17, acc: 95,  desc: "Bounces 2-4 times.",              fx: { multi: true } },
    ],
    learnset: [
      { at: 4, move: { key: "echo", name: "ECHO CLANG",    power: 55, acc: 95, desc: "It rings forever. May confuse.", fx: { confuse: 0.2 } } },
      { at: 8, move: { key: "slam", name: "SCAFFOLD SLAM", power: 82, acc: 88, desc: "Full structural failure.",       fx: {} } },
    ],
  },
  stickbug: {
    id: "stickbug",
    name: "STICK BUG",
    type: "BAMBOO",
    family: "GROOVE",
    tagline: "he do be dancing tho",
    stats: { hp: 106, atk: 22, def: 21, spd: 27 },
    moves: [
      { key: "stickbugd", name: "GET STICKBUG'D", power: 0,  acc: 90,  desc: "The ultimate bamboozle. Confuses foe.", fx: { confuse: 1.0 } },
      { key: "sway",      name: "SWAY DANCE",     power: 0,  acc: 100, desc: "Hypnotic groove. Raises own SPD.",      fx: { spdUp: 1.0 } },
      { key: "twig",      name: "TWIG SNAP",      power: 55, acc: 95,  desc: "Snappy, reliable damage.",              fx: {} },
      { key: "bamboo",    name: "BAMBOO SLAM",    power: 78, acc: 88,  desc: "Full-branch body slam.",                fx: {} },
    ],
    learnset: [
      { at: 4, move: { key: "branch", name: "BRANCH OUT",      power: 55, acc: 95,  desc: "Surprise limb from nowhere.",      fx: {} } },
      { at: 8, move: { key: "photo",  name: "PHOTOSYNTHESIZE", power: 0,  acc: 100, desc: "Soaks the sun. Restores 30% HP.",  fx: { heal: 0.3 } } },
    ],
  },
  sprite: {
    id: "sprite",
    name: "SPRITE CAT",
    type: "FIZZY",
    family: "ZOOM",
    tagline: "obey your thirst",
    stats: { hp: 108, atk: 23, def: 20, spd: 25 },
    moves: [
      { key: "rush",   name: "CAFFEINE RUSH", power: 0,  acc: 100, desc: "Zero sugar, all zoom. Raises SPD.",  fx: { spdUp: 1.0 } },
      { key: "fizz",   name: "FIZZ BLAST",    power: 50, acc: 100, desc: "Carbonated spray. May confuse.",     fx: { confuse: 0.3 } },
      { key: "crush",  name: "CAN CRUSH",     power: 78, acc: 88,  desc: "Crushes it. The foe, specifically.", fx: {} },
      { key: "lemon",  name: "LEMON-LIME",    power: 0,  acc: 100, desc: "Refreshing sip. Restores 30% HP.",   fx: { heal: 0.3 } },
    ],
    learnset: [
      { at: 4, move: { key: "bubbles", name: "BUBBLE BARRAGE",  power: 18, acc: 95, desc: "Carbonated chaos. Hits 2-4 times.", fx: { multi: true } } },
      { at: 8, move: { key: "sugarfree", name: "SUGAR-FREE RAGE", power: 82, acc: 88, desc: "Zero sugar. Full power.",         fx: {} } },
    ],
  },
  wert: {
    id: "wert",
    name: "WERT",
    type: "67",
    family: "CLANG",
    tagline: "six... SEVEN!!!",
    stats: { hp: 150, atk: 99, def: 45, spd: 99 },
    moves: [
      { key: "face",  name: "67777545g;= IN YOUR FACE", power: 250, acc: 100, desc: "Eye lasers. Unstoppable.",       fx: { overlay: "sixseven" } },
      { key: "six",   name: "6 SMASH",                  power: 150, acc: 100, desc: "A colossal 6 falls from above.", fx: { overlay: "six" } },
      { key: "seven", name: "7 SMASH",                  power: 175, acc: 100, desc: "A colossal 7 falls from above.", fx: { overlay: "seven" } },
      { key: "hole",  name: "BLACK HOLE OF DOOM",       power: 999, acc: 100, desc: "Deletes the foe from reality.",  fx: { overlay: "blackhole" } },
    ],
    learnset: [
      { at: 4, move: { key: "sixeight", name: "68 SMASH", power: 200, acc: 100, desc: "The number between 6 and 7. Illegal.", fx: {} } },
      { at: 8, move: { key: "combo41",  name: "41 COMBO", power: 120, acc: 100, desc: "6+7=13... ×pi... = 41. Hits 2-4 times.", fx: { multi: true } } },
    ],
  },
};

export const CAT_IDS = ["huh", "maxwell", "oiia", "quaso", "banana", "pedro", "zoned", "apple", "pipe", "stickbug", "sprite", "wert"];

/* every move a cat could know at a given level (base 4 + unlocked learnset moves) */
export const movePool = (catId, level = 99) => {
  const c = CATS[catId];
  return [...c.moves, ...(c.learnset ?? []).filter((l) => l.at <= level).map((l) => l.move)];
};

/* resolve a saved list of move keys back into move objects; falls back to the base 4 */
export const movesFor = (catId, keys) => {
  if (!keys?.length) return CATS[catId].moves;
  const pool = movePool(catId, 99);
  const out = keys.map((k) => pool.find((m) => m.key === k)).filter(Boolean);
  return out.length ? out : CATS[catId].moves;
};

/* wert is a player-only secret weapon — never spawns as an opponent */
export const ENEMY_IDS = CAT_IDS.filter((id) => id !== "wert");
