/* ---------- overworld: tile maps, items ---------- */

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
    name: "OHIO",
    flavor: "Only the strongest memes survive here.",
    bossPrefix: "MEME LORD",
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
];

export const GRASS_ENCOUNTER_CHANCE = 0.18;

/* wild/boss levels stay a touch below the player's likely level — friendly curve */
export const worldWildLevel = (area) => 1 + area * 3 + Math.floor(Math.random() * 2);
export const worldBossLevel = (area) => 4 + area * 3;

export const ITEMS = {
  churu:  { id: "churu",  name: "CHURU",       icon: "🍡", desc: "Restores 50% HP",  price: 10, fx: { heal: 0.5 } },
  catnip: { id: "catnip", name: "CATNIP",      icon: "🌱", desc: "Raises ATK",       price: 15, fx: { atkUp: 1.0 } },
  armor:  { id: "armor",  name: "THICC ARMOR", icon: "🛡️", desc: "Raises DEF",       price: 15, fx: { defUp: 1.0 } },
};

export const ITEM_IDS = Object.keys(ITEMS);

/* turn an item into a battle "move" the engine understands */
export const itemToMove = (id) => ({
  item: true,
  key: `item-${id}`,
  name: ITEMS[id].name,
  power: 0,
  acc: 100,
  fx: ITEMS[id].fx,
});

export function findTile(map, ch) {
  for (let y = 0; y < map.length; y++) {
    const x = map[y].indexOf(ch);
    if (x !== -1) return { x, y };
  }
  return null;
}

export const tileAt = (map, x, y) => map[y]?.[x] ?? "#";

/* random pickup contents: mostly an item, sometimes coins */
export function rollPickup() {
  if (Math.random() < 0.35) return { coins: 10 };
  return { item: ITEM_IDS[Math.floor(Math.random() * ITEM_IDS.length)] };
}
