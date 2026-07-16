/* ---------- overworld: tile maps, items, equipment ---------- */

/* Tile legend:
   #  wall / furniture (blocked)
   .  open floor
   g  tall grass — random encounters
   C  Catemon Center door (heal + shop)
   i  item pickup (one-time, tracked in world.picked)
   B  boss gate — fight the boss, then step through to the next area
   S  player spawn
   All maps are 14 wide × 10 tall; outer edge must be walls. */

export const AREAS = [
  {
    name: "THE KITCHEN",
    flavor: "Something smells illegal in here.",
    bossPrefix: "ALPHA",
    palette: { floor: "#efe6cf", wall: "#8a6a4a", grass: "#a8c47e", accent: "#d8b890" },
    map: [
      "##############",
      "#S....gg.....#",
      "#..##.gg.##..#",
      "#..##....##i.#",
      "#.....gg.....#",
      "#.C...gg.....#",
      "#....####....#",
      "#.i..####.gg.#",
      "#.......ggggB#",
      "##############",
    ],
  },
  {
    name: "THE LIVING ROOM",
    flavor: "The forbidden couch. The sacred carpet.",
    bossPrefix: "ALPHA",
    palette: { floor: "#e8d8c0", wall: "#7a4a3a", grass: "#c89898", accent: "#d8c0a8" },
    map: [
      "##############",
      "#S...##..gg.i#",
      "#....##..gg..#",
      "#.##......##.#",
      "#.##.gg...##.#",
      "#....gg..C...#",
      "#.##.....##..#",
      "#.##..gg.##.i#",
      "#.....gg....B#",
      "##############",
    ],
  },
  {
    name: "THE BACKROOMS",
    flavor: "Yellow walls. Humming lights. Vibes: off.",
    bossPrefix: "ALPHA",
    palette: { floor: "#e8dc9a", wall: "#9a8a4a", grass: "#c0b46a", accent: "#d8cc8a" },
    map: [
      "##############",
      "#S...##..gg.i#",
      "#.##.##..gg..#",
      "#.##......##.#",
      "#....gg...##.#",
      "#.##.gg......#",
      "#.##....C....#",
      "#....##......#",
      "#.i..##.gggg.B",
      "##############",
    ],
  },
  {
    name: "THE GARDEN",
    flavor: "Cucumber territory. Stay alert.",
    bossPrefix: "ALPHA",
    palette: { floor: "#cfe0b8", wall: "#5a7a4a", grass: "#8ab86a", accent: "#b8d09a" },
    map: [
      "##############",
      "#S.gg....#..i#",
      "#..gg....#...#",
      "#.....##.....#",
      "#.##..##..gg.#",
      "#.##..C...gg.#",
      "#......##....#",
      "#.gggg.##.##.#",
      "#.i.......##B#",
      "##############",
    ],
  },
  {
    name: "OHIO",
    flavor: "Only the strongest memes survive here.",
    bossPrefix: "ALPHA",
    palette: { floor: "#d8b0a0", wall: "#6a3a3a", grass: "#c08a6a", accent: "#b89080" },
    map: [
      "##############",
      "#S..gg...##.i#",
      "#...gg...##..#",
      "#.##....gg...#",
      "#.##.C..gg...#",
      "#........##..#",
      "#.gg.##..##..#",
      "#.gg.##......#",
      "#.i......ggg.B",
      "##############",
    ],
  },
  {
    name: "SPACE",
    flavor: "The final frontier of memes.",
    bossPrefix: "MEME LORD",
    palette: { floor: "#2a2a4a", wall: "#0a0a1a", grass: "#4a4a7a", accent: "#3a3a6a" },
    map: [
      "##############",
      "#S...gg..##.i#",
      "#....gg..##..#",
      "#.##.........#",
      "#.##..C..gg..#",
      "#........gg..#",
      "#.##.##......#",
      "#.##.##.gggg.#",
      "#.i.......ggB#",
      "##############",
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
