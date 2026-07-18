/* ---------- overworld: tile maps, items, equipment ---------- */

/* Tile legend:
   #  wall / furniture (blocked)
   .  open floor
   g  tall grass — random encounters
   C  Catemon Center door (heal + shop)
   i  item pickup (one-time, tracked in world.picked)
   B  boss gate — Team Doggit fight, then step through to the next area
   S  player spawn
   All maps are 28 wide × 20 tall; outer edge must be walls. The screen
   shows a 14×10 camera window that follows the player. Trainers stand in
   the 1-tile gaps of the interior walls (Pokemon-style gates). */

export const AREAS = [
  {
    name: "THE KITCHEN",
    flavor: "Something smells illegal in here.",
    bossPrefix: "ALPHA",
    palette: { floor: "#efe6cf", wall: "#8a6a4a", grass: "#a8c47e", accent: "#d8b890" },
    map: [
      "############################",
      "#S...........#.......#.....#",
      "#...gggg.....#.......#.....#",
      "#...gggg..i..#.......#..i..#",
      "#...gggg.....#..ggg..#.....#",
      "#............#..ggg........#",
      "#............#..ggg..#.....#",
      "#...##.......#.......#.ggg.#",
      "#...##.......#.ggggg.#.ggg.#",
      "#..............ggggg.#.ggg.#",
      "#............#.ggggg.#.ggg.#",
      "#...C........#.......#.ggg.#",
      "#............#.......#.....#",
      "#..gg........#..##...#..i..#",
      "#..gg........#..##...#.....#",
      "#............#...i...#.gg..#",
      "#............#.......#.gg..#",
      "#....#####...#.......#.....#",
      "#............#.......#....B#",
      "############################",
    ],
  },
  {
    name: "THE LIVING ROOM",
    flavor: "The forbidden couch. The sacred carpet.",
    bossPrefix: "ALPHA",
    palette: { floor: "#e8d8c0", wall: "#7a4a3a", grass: "#c89898", accent: "#d8c0a8" },
    map: [
      "############################",
      "#S..........ggggg.........i#",
      "#...........ggggg.....###..#",
      "#..###......ggggg.....###..#",
      "#..###.....................#",
      "#..........................#",
      "########.###################",
      "#..........................#",
      "#.gg................ggggg..#",
      "#.gg.##..........##.ggggg..#",
      "#.gg.##.......C..##.ggggg..#",
      "#.gg................gggggi.#",
      "#i.........................#",
      "###################.########",
      "#..........................#",
      "#..gggg..............gggg..#",
      "#..gggg...###........gggg..#",
      "#..gggg...###........gggB..#",
      "#.........................i#",
      "############################",
    ],
  },
  {
    name: "THE BACKROOMS",
    flavor: "Yellow walls. Humming lights. Vibes: off.",
    bossPrefix: "ALPHA",
    palette: { floor: "#e8dc9a", wall: "#9a8a4a", grass: "#c0b46a", accent: "#d8cc8a" },
    map: [
      "############################",
      "#S.......#......i.#.......i#",
      "#....ggg.#.gggg...#.ggg....#",
      "#....ggg.#.gggg...#.ggg....#",
      "#..##ggg.#.gggg.....ggg....#",
      "#..##ggg.#........#........#",
      "#..##....#........#........#",
      "#..##....#........#........#",
      "#..##....#..###...#..###...#",
      "#..##....#..###...#..###...#",
      "#........#..###...#..###...#",
      "#........#........#........#",
      "#........#....ggg.#........#",
      "#........#....ggg.#...gggg.#",
      "#.............ggg.#...gggg.#",
      "#........#..##ggg.#...gggg.#",
      "#.....C..#..##....#...gggg.#",
      "#........#........#.i......#",
      "#i.......#........#.......B#",
      "############################",
    ],
  },
  {
    name: "THE GARDEN",
    flavor: "Cucumber territory. Stay alert.",
    bossPrefix: "ALPHA",
    palette: { floor: "#cfe0b8", wall: "#5a7a4a", grass: "#8ab86a", accent: "#b8d09a" },
    map: [
      "############################",
      "#S.........ggg............i#",
      "#.gggg..##.ggg.....ggg.....#",
      "#.gggg..##.ggg.###.ggg.....#",
      "#.gggg..##.ggg.###.ggg.....#",
      "#.gggg.....ggg.....ggg.....#",
      "#..........................#",
      "######################.#####",
      "#..........................#",
      "#.gggg.......ggggg......ggg#",
      "#.gggg..###..ggggg.....Cggg#",
      "#.gggg..###..ggggg......ggg#",
      "#.gggg.......ggggg......gig#",
      "#..........................#",
      "#####.######################",
      "#..........................#",
      "#i......gggggg......###....#",
      "#.......gggggg..i...###....#",
      "#.......gggggg............B#",
      "############################",
    ],
  },
  {
    name: "OHIO",
    flavor: "Only the strongest memes survive here.",
    bossPrefix: "ALPHA",
    palette: { floor: "#d8b0a0", wall: "#6a3a3a", grass: "#c08a6a", accent: "#b89080" },
    map: [
      "############################",
      "#S........#...............i#",
      "#.gggg....#........gggg....#",
      "#.gggg........###..gggg....#",
      "#.ggggC...#...###..gggg....#",
      "#.........#...###....##....#",
      "#..###....#..........##....#",
      "#..###....#.gggg...........#",
      "#..###....#.gggg...........#",
      "#.........#.gggg...........#",
      "#.........#................#",
      "#...gggg..##############.###",
      "#...gggg..#.i..............#",
      "#...gggg..#.......ggg......#",
      "#...gggg..#.......ggg...ggg#",
      "#...gggg..#...###.ggg...ggg#",
      "#.........#...###.ggg...ggg#",
      "#.......i.#...............i#",
      "#.........#...............B#",
      "############################",
    ],
  },
  {
    name: "SPACE",
    flavor: "The final frontier of memes.",
    bossPrefix: "MEME LORD",
    palette: { floor: "#2a2a4a", wall: "#0a0a1a", grass: "#4a4a7a", accent: "#3a3a6a" },
    map: [
      "############################",
      "#S......#..........#......i#",
      "#.......#.......i..#....gg.#",
      "#.......#..##......#....gg.#",
      "#.......#..##......#..##gg.#",
      "#..##...#..........#..##gg.#",
      "#..##...#..........#.......#",
      "#.......#.ggggg....#.......#",
      "#.......#.ggggg............#",
      "#.gggg..#.ggggg....#.......#",
      "#.gggg..#....C.....#.......#",
      "#.gggg..#..........#.......#",
      "#.gggg..#......##..#.ggggg.#",
      "#.......#.i....##..#.ggggg.#",
      "#.......#..........#.ggggg.#",
      "#.......#..........#.ggggg.#",
      "#...........ggggg..#.......#",
      "#.......#...ggggg..#.......#",
      "#i......#..........#......B#",
      "############################",
    ],
  },
];

export const GRASS_ENCOUNTER_CHANCE = 0.18;

/* wild/boss levels stay a touch below the player's likely level — friendly curve */
export const worldWildLevel = (area) => 1 + area * 2 + Math.floor(Math.random() * 2);
export const worldBossLevel = (area) => 4 + area * 2;

/* ---------- consumables (used from the BAG in battle) ---------- */

export const ITEMS = {
  churu:     { id: "churu",     name: "CHURU",       icon: "🍡", desc: "Restores 50% HP",           price: 10, fx: { heal: 0.5 }, food: true },
  tunacake:  { id: "tunacake",  name: "TUNA CAKE",   icon: "🍰", desc: "Restores ALL HP",           price: 25, fx: { heal: 1.0 }, food: true },
  snapspray: { id: "snapspray", name: "SNAP SPRAY",  icon: "💦", desc: "Cures confusion, +20% HP",  price: 12, fx: { cureConfuse: true, heal: 0.2 } },
  catnip:    { id: "catnip",    name: "CATNIP",      icon: "🌱", desc: "Raises ATK",                price: 15, fx: { atkUp: 1.0 }, food: true },
  armor:     { id: "armor",     name: "THICC ARMOR", icon: "🛡️", desc: "Raises DEF",                price: 15, fx: { defUp: 1.0 } },
  zoomjuice: { id: "zoomjuice", name: "ZOOM JUICE",  icon: "🧃", desc: "Raises SPD",                price: 15, fx: { spdUp: 1.0 }, food: true },
};

export const ITEM_IDS = Object.keys(ITEMS);

/* turn an item into a battle "move" the engine understands; items always act first */
export const itemToMove = (id) => ({
  item: true,
  key: `item-${id}`,
  name: ITEMS[id].name,
  power: 0,
  acc: 100,
  fx: { ...ITEMS[id].fx, priority: true },
  sound: ITEMS[id].food ? "eating" : "select",
});

/* ---------- equipment (passive stat boosts, collar + charm slots) ---------- */

export const EQUIPMENT = {
  spikycollar: { id: "spikycollar", name: "SPIKY COLLAR", icon: "🌵", slot: "collar", desc: "+3 DEF",         price: 30, bonuses: { def: 3 } },
  chonkbell:   { id: "chonkbell",   name: "CHONK BELL",   icon: "🔔", slot: "collar", desc: "+20 max HP",     price: 35, bonuses: { hp: 20 } },
  floofscarf:  { id: "floofscarf",  name: "FLOOF SCARF",  icon: "🧣", slot: "collar", desc: "+2 DEF, +8 HP",  price: 30, bonuses: { def: 2, hp: 8 } },
  mlgshades:   { id: "mlgshades",   name: "MLG SHADES",   icon: "🕶️", slot: "charm",  desc: "+3 ATK",         price: 35, bonuses: { atk: 3 } },
  nyoomboots:  { id: "nyoomboots",  name: "NYOOM BOOTS",  icon: "👟", slot: "charm",  desc: "+4 SPD",         price: 30, bonuses: { spd: 4 } },
  gamerglove:  { id: "gamerglove",  name: "GAMER GLOVE",  icon: "🧤", slot: "charm",  desc: "+2 ATK, +2 SPD", price: 40, bonuses: { atk: 2, spd: 2 } },
};

export const EQUIP_IDS = Object.keys(EQUIPMENT);

/* combined stat bonuses from whatever is equipped */
export function gearBonuses(gear) {
  const total = {};
  for (const id of [gear?.collar, gear?.charm]) {
    if (!id) continue;
    for (const [stat, amt] of Object.entries(EQUIPMENT[id].bonuses)) {
      total[stat] = (total[stat] ?? 0) + amt;
    }
  }
  return total;
}

/* ---------- NPCs: dialog + fetch quests (keyed by area index) ---------- */

export const NPCS = {
  0: [{
    id: "chef", x: 2, y: 15, emoji: "👨‍🍳", name: "CHEF MITTENS",
    hello: "The kitchen is overrun with wild memes! A chef can't work like this!",
    quest: {
      item: "churu", count: 2,
      ask: "Bring me 2 CHURUS and I'll make it worth your while.",
      done: "Magnifique! As promised — take these coins!",
      thanks: "My churu bisque is legendary now. Merci!",
      reward: 40,
    },
  }],
  1: [{
    id: "potato", x: 10, y: 3, emoji: "🛋️", name: "COUCH POTATO",
    hello: "I've been on this couch since the dial-up days.",
    quest: {
      item: "tunacake", count: 1,
      ask: "Bring me a TUNA CAKE. Walking is not an option.",
      done: "You're a hero. The couch thanks you.",
      thanks: "Crumbs everywhere. Worth it.",
      reward: 50,
    },
  }],
  3: [{
    id: "gardener", x: 6, y: 5, emoji: "🧑‍🌾", name: "GRANNY WHISKERS",
    hello: "Those cucumbers keep scaring my cats!",
    quest: {
      item: "catnip", count: 2,
      ask: "Fetch me 2 CATNIP for my anti-cucumber potion, dearie.",
      done: "Bless you! Here's my rainy-day coin jar.",
      thanks: "The garden is at peace. For now.",
      reward: 60,
    },
  }],
  5: [{
    id: "mooncat", x: 4, y: 14, emoji: "🌙", name: "MOON CAT",
    hello: "You made it to space? The memes here are... ancient. Good luck, traveler.",
  }],
};

/* ---------- Team Doggit gate bosses (areas 0-4; area 5 is the Dogovanni finale) ---------- */

export const DOGGIT_GATES = [
  {
    name: "LAUGHING JACK RUSSELL", emoji: "😆", reward: 30,
    team: [{ catId: "jackrussell", level: 4 }],
    intro: `😆 LAUGHING JACK RUSSELL: "heh... heh... HAHAHA! Team Doggit runs this kitchen. Turn around, cat!"`,
    quote: `"HAHAHA... ha... the boss is NOT gonna like this."`,
  },
  {
    name: "SMILING CORGI", emoji: "🙂", reward: 40,
    team: [{ catId: "corgi", level: 6 }],
    intro: `🙂 SMILING CORGI: "Hello, friend! This gate belongs to Team Doggit. Smile and go home!"`,
    quote: `"Still smiling. Crying a little, but smiling."`,
  },
  {
    name: "TEAM DOGGIT", emoji: "😆", reward: 55,
    team: [{ catId: "jackrussell", level: 8 }, { catId: "corgi", level: 9 }],
    intro: `😆 JACK RUSSELL: "You again?! HAHAHA!" 🙂 CORGI: "We practiced. We're a DUO now."`,
    quote: `"We're telling Dogovanni about this!"`,
  },
  {
    name: "TEAM DOGGIT", emoji: "🙂", reward: 70,
    team: [{ catId: "jackrussell", level: 11 }, { catId: "corgi", level: 12 }],
    intro: `🙂 CORGI: "The garden gate is CLOSED." 😆 JACK RUSSELL: "HAHAHA— I mean yeah. Closed. Forever."`,
    quote: `"Dogovanni will deal with you HIMSELF!"`,
  },
  {
    name: "TEAM DOGGIT", emoji: "😤", reward: 85,
    team: [{ catId: "jackrussell", level: 13 }, { catId: "corgi", level: 14 }],
    intro: `😤 JACK RUSSELL: "No more laughing." CORGI: "No more smiling. This is our LAST STAND!"`,
    quote: `"...the boss is waiting in SPACE. You're doomed. Nice moves though."`,
  },
];

/* ---------- trainers: one-time battles against a 2-cat team ---------- */

/* Trainers stand in the wall gaps — beat them to pass (beaten trainers step aside) */
export const TRAINERS = {
  0: [{
    id: "fridgegoblin", x: 13, y: 9, emoji: "🧌", name: "FRIDGE GOBLIN",
    intro: "NOBODY passes the fridge without a battle!", quote: "Fine... take the leftovers.",
    team: [{ catId: "quaso", level: 2 }], reward: 15,
  }, {
    id: "microwavemage", x: 21, y: 5, emoji: "🧙", name: "MICROWAVE MAGE",
    intro: "My magic runs on 30-second intervals!", quote: "I should have added more seconds...",
    team: [{ catId: "huh", level: 3 }], reward: 20,
  }],
  1: [{
    id: "couchcmdr", x: 8, y: 6, emoji: "🕹️", name: "COUCH COMMANDER",
    intro: "My thumbs are undefeated!", quote: "GG. My thumbs need ice.",
    team: [{ catId: "maxwell", level: 4 }, { catId: "pedro", level: 5 }], reward: 45,
  }, {
    id: "remotekeeper", x: 19, y: 13, emoji: "📺", name: "REMOTE KEEPER",
    intro: "You want the remote? FIGHT for it.", quote: "It was between the cushions all along.",
    team: [{ catId: "zoned", level: 5 }], reward: 30,
  }],
  2: [{
    id: "wanderer", x: 9, y: 14, emoji: "🚪", name: "BACKROOMS WANDERER",
    intro: "I've been lost here for years... fight me for directions!", quote: "You... you know the way out?",
    team: [{ catId: "zoned", level: 6 }, { catId: "huh", level: 7 }], reward: 60,
  }, {
    id: "socksorcerer", x: 18, y: 4, emoji: "🧦", name: "WET SOCK WIZARD",
    intro: "Feel the dampness of my power!", quote: "Squish... squish... defeat.",
    team: [{ catId: "pipe", level: 7 }], reward: 35,
  }],
  3: [{
    id: "cucumberknight", x: 22, y: 7, emoji: "🥒", name: "CUCUMBER KNIGHT",
    intro: "Cats fear me. YOU should fear me!", quote: "My cucumber... it did nothing...",
    team: [{ catId: "stickbug", level: 9 }, { catId: "apple", level: 9 }], reward: 55,
  }, {
    id: "molemanager", x: 5, y: 14, emoji: "🕳️", name: "MOLE MANAGER",
    intro: "This tunnel is under NEW management.", quote: "I'm filing a complaint with the dirt.",
    team: [{ catId: "banana", level: 10 }], reward: 45,
  }],
  4: [{
    id: "ohiokid", x: 10, y: 3, emoji: "🧢", name: "OHIO RIZZLER",
    intro: "Only in Ohio do we battle strangers!", quote: "That was NOT very sigma of me.",
    team: [{ catId: "stickbug", level: 11 }, { catId: "pipe", level: 12 }], reward: 80,
  }, {
    id: "toiletplumber", x: 24, y: 11, emoji: "🪠", name: "EMERGENCY PLUMBER",
    intro: "Ohio's pipes NEVER rest, and neither do I!", quote: "Back to the pipes. They miss me.",
    team: [{ catId: "oiia", level: 12 }, { catId: "sprite", level: 13 }], reward: 70,
  }],
  5: [{
    id: "astronaut", x: 8, y: 16, emoji: "🧑‍🚀", name: "SUSPICIOUS ASTRONAUT",
    intro: "Wait. It's all cats?", quote: "Always has been.",
    team: [{ catId: "zoned", level: 14 }, { catId: "huh", level: 15 }], reward: 85,
  }, {
    id: "areaintern", x: 19, y: 8, emoji: "👽", name: "AREA 51 INTERN",
    intro: "This is DEFINITELY not in my job description.", quote: "I'm asking for a raise. And a shield.",
    team: [{ catId: "pedro", level: 15 }, { catId: "maxwell", level: 15 }], reward: 90,
  }],
};

export function findTile(map, ch) {
  for (let y = 0; y < map.length; y++) {
    const x = map[y].indexOf(ch);
    if (x !== -1) return { x, y };
  }
  return null;
}

export const tileAt = (map, x, y) => map[y]?.[x] ?? "#";

/* random pickup contents: mostly a consumable, sometimes coins, rarely gear */
export function rollPickup(ownedEquips = []) {
  const unowned = EQUIP_IDS.filter((id) => !ownedEquips.includes(id));
  if (unowned.length && Math.random() < 0.15) {
    return { equip: unowned[Math.floor(Math.random() * unowned.length)] };
  }
  if (Math.random() < 0.35) return { coins: 10 };
  return { item: ITEM_IDS[Math.floor(Math.random() * ITEM_IDS.length)] };
}
