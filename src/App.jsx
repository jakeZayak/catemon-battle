import { useState, useRef, useEffect, useCallback } from "react";
import { CATS, CAT_IDS, ENEMY_IDS, CAT_IMAGES, CAT_CROP, CAT_WRAP_BG, CAT_SOUNDS, HELICOPTER_SOUND, GAME_SOUNDS, BOSS_MOVE, FAMILY_BEATS, FAMILY_ICONS } from "./cats.js";
import { newFighter, buildRound, enemyFreeRound, levelMul } from "./battle.js";
import { AREAS, GRASS_ENCOUNTER_CHANCE, worldWildLevel, worldBossLevel, ITEMS, itemToMove, findTile, tileAt, rollPickup, EQUIPMENT, EQUIP_IDS, gearBonuses, NPCS, TRAINERS } from "./world.js";

/* ============================================================
   CATÉMON — meme cat battle & adventure
   ============================================================ */

function CatPhoto({ id, size = 96, flip = false, className = "", style = {} }) {
  return (
    <div
      className={`cat-photo-wrap ${className}`}
      style={{
        width: size,
        height: size,
        transform: flip ? "scaleX(-1)" : undefined,
        background: CAT_WRAP_BG[id],
        ...style,
      }}
    >
      <img src={CAT_IMAGES[id]} alt={id} style={{ objectPosition: CAT_CROP[id] }} />
    </div>
  );
}

/* ---------- roguelike data ---------- */

const ROGUE_SAVE = "catemon-save-v1";
const WORLD_SAVE = "catemon-world-v1";
const META_SAVE = "catemon-meta-v1"; // cross-run data: CAT-DEX, records

const loadMeta = () => {
  try { return JSON.parse(localStorage.getItem(META_SAVE)) ?? {}; } catch (e) { return {}; }
};

const ACHIEVEMENTS = [
  { id: "firstwin",   icon: "🏆", name: "FIRST W",           desc: "Win your first battle" },
  { id: "quickwin",   icon: "🥊", name: "MEME BRAWLER",      desc: "Win a Quick Battle" },
  { id: "roguechamp", icon: "👑", name: "ROGUE CHAMPION",    desc: "Beat the roguelike" },
  { id: "worldchamp", icon: "🌌", name: "MEME LORD SLAYER",  desc: "Beat adventure mode" },
  { id: "flawless",   icon: "✨", name: "UNTOUCHABLE",       desc: "Win at full HP" },
  { id: "befriend1",  icon: "💖", name: "NEW BESTIE",        desc: "Befriend a wild cat" },
  { id: "fulldex",    icon: "📖", name: "MEMEOLOGIST",       desc: "Meet all 12 cats" },
  { id: "allfriends", icon: "🫂", name: "EVERYONE'S FRIEND", desc: "Befriend all 12 cats" },
  { id: "tower5",     icon: "🗼", name: "OHIO SURVIVOR",     desc: "Reach floor 5 of ENDLESS OHIO" },
  { id: "rich",       icon: "💰", name: "FAT STACKS",        desc: "Hold 200 coins at once" },
  { id: "wertwin",    icon: "7️⃣", name: "SIX SEVEN!!!",      desc: "Win a battle as WERT" },
];

const ZONES = [
  { name: "THE KITCHEN", flavor: "Something smells illegal in here.", bossPrefix: "ALPHA" },
  { name: "THE BACKROOMS", flavor: "Yellow walls. Humming lights. Vibes: off.", bossPrefix: "ALPHA" },
  { name: "OHIO", flavor: "Only the strongest memes survive here.", bossPrefix: "MEME LORD" },
];

const NODE_ICONS = { battle: "😾", event: "❓", rest: "🛏️", shop: "🛒", boss: "👑" };
const NODE_LABELS = { battle: "FIGHT", event: "???", rest: "THE VET", shop: "MEME MART", boss: "BOSS" };

/* 4 floors of 2-3 nodes + a boss floor. Floor 1 is always a fight. */
function genZoneMap(rng = Math.random) {
  const floors = [];
  for (let f = 0; f < 4; f++) {
    const count = rng() < 0.4 ? 3 : 2;
    const nodes = [];
    for (let i = 0; i < count; i++) {
      if (f === 0) { nodes.push("battle"); continue; }
      const r = rng();
      nodes.push(r < 0.5 ? "battle" : r < 0.8 ? "event" : r < 0.9 ? "rest" : "shop");
    }
    floors.push(nodes);
  }
  // every zone gets at least one MEME MART so coins are always spendable
  if (!floors.flat().includes("shop")) {
    const f = 1 + Math.floor(rng() * 3);
    floors[f][Math.floor(rng() * floors[f].length)] = "shop";
  }
  floors.push(["boss"]);
  return floors;
}

/* friendly curve: wilds lag behind the player's expected level */
const rogueWildLevel = (zone, floor) => 1 + zone * 2 + Math.floor(floor / 2);
const rogueBossLevel = (zone) => 5 + zone * 3;

/* Meme events: each has 2 choices; apply(run) => [newRun, resultText] */
const clampHp = (r) => ({ ...r, hp: Math.max(1, Math.min(r.hp, r.maxHp)) });
const addBonus = (r, stat, amt) => ({ ...r, bonuses: { ...r.bonuses, [stat]: (r.bonuses[stat] ?? 0) + amt } });

const EVENTS = [
  {
    title: "CATNIP STASH",
    text: "You found a suspicious pile of catnip behind the fridge.",
    choices: [
      { label: "ROLL IN IT", desc: "+2 ATK permanently", apply: (r) => [addBonus(r, "atk", 2), "You feel unstoppable. ATK +2!"] },
      { label: "EAT ALL OF IT", desc: "Full heal", apply: (r) => [{ ...r, hp: r.maxHp }, "Incredible. HP fully restored!"] },
    ],
  },
  {
    title: "A CUCUMBER APPEARS",
    text: "Someone placed a cucumber directly behind you. The audacity.",
    choices: [
      { label: "SLOWLY BACK AWAY", desc: "Nothing happens", apply: (r) => [r, "You escape the cucumber. Dignity intact."] },
      { label: "INVESTIGATE", desc: "+2 SPD, but -10 HP jump scare", apply: (r) => [clampHp(addBonus({ ...r, hp: r.hp - 10 }, "spd", 2)), "AAAAAA! You jumped 4 feet vertically. SPD +2, HP -10."] },
    ],
  },
  {
    title: "SUNBEAM",
    text: "A perfect sunbeam hits the carpet. It calls to you.",
    choices: [
      { label: "QUICK NAP", desc: "Heal 40% HP", apply: (r) => [clampHp({ ...r, hp: r.hp + Math.round(r.maxHp * 0.4) }), "Warm. Soft. Restored 40% HP."] },
      { label: "BASK FOREVER", desc: "+6 max HP permanently", apply: (r) => [{ ...addBonus(r, "hp", 6), maxHp: r.maxHp + 6, hp: r.hp + 6 }, "You have become one with the sunbeam. Max HP +6!"] },
    ],
  },
  {
    title: "THE RED DOT",
    text: "It's back. The unattainable red dot dances on the wall.",
    choices: [
      {
        label: "CHASE IT", desc: "50/50: +3 random stat or nothing",
        apply: (r) => {
          if (Math.random() < 0.5) return [r, "It vanished. It always vanishes. You feel nothing."];
          const stats = ["atk", "def", "spd"];
          const s = stats[Math.floor(Math.random() * stats.length)];
          return [addBonus(r, s, 3), `YOU CAUGHT IT?! ${s.toUpperCase()} +3!`];
        },
      },
      { label: "IGNORE IT", desc: "Nothing happens (power move)", apply: (r) => [r, "You look away. The dot weeps. Respect earned, nothing gained."] },
    ],
  },
  {
    title: "CARDBOARD BOX",
    text: "A box. Slightly too small for you. Perfect.",
    choices: [
      { label: "SIT", desc: "+2 DEF permanently", apply: (r) => [addBonus(r, "def", 2), "If it fits, you sits. DEF +2!"] },
      { label: "NAP IN IT", desc: "Heal 25% HP", apply: (r) => [clampHp({ ...r, hp: r.hp + Math.round(r.maxHp * 0.25) }), "Box nap achieved. Restored 25% HP."] },
    ],
  },
  {
    title: "THE ROOMBA",
    text: "A Roomba approaches, humming its ancient song.",
    choices: [
      { label: "RIDE IT", desc: "+2 SPD permanently", apply: (r) => [addBonus(r, "spd", 2), "You are the captain now. SPD +2!"] },
      { label: "NAP NEARBY", desc: "Heal 15% HP", apply: (r) => [clampHp({ ...r, hp: r.hp + Math.round(r.maxHp * 0.15) }), "The hum soothes you. Restored 15% HP."] },
    ],
  },
];

/* ---------- sfx (real audio + chiptune fallback) ---------- */

/* looping chiptune tracks: notes/bass are [midi (0 = rest), beats] */
const MUSIC_TRACKS = {
  overworld: {
    bpm: 132, wave: "triangle", vol: 0.022,
    notes: [[72,1],[76,1],[79,1],[76,1],[81,1.5],[79,0.5],[76,1],[72,1],[74,1],[77,1],[81,1],[77,1],[79,1.5],[76,0.5],[74,1],[72,1]],
    bass: [[48,2],[52,2],[45,2],[43,2],[50,2],[53,2],[43,2],[48,2]],
  },
  battle: {
    bpm: 168, wave: "square", vol: 0.016,
    notes: [[69,0.5],[69,0.5],[72,0.5],[74,0.5],[76,1],[74,0.5],[72,0.5],[69,1],[67,0.5],[69,0.5],[72,1],[65,0.5],[67,0.5],[69,2]],
    bass: [[45,1],[45,1],[41,1],[43,1],[45,1],[48,1],[43,2],[45,2]],
  },
};
const midiHz = (m) => 440 * Math.pow(2, (m - 69) / 12);

function useSfx() {
  const ctxRef = useRef(null);
  const mutedRef = useRef(false);
  const catAudioRef = useRef(null);
  const musicRef = useRef({ timer: null, track: null, gainNode: null });

  const play = useCallback((kind) => {
    if (mutedRef.current) return;

    const playFile = (src) => {
      if (catAudioRef.current) { catAudioRef.current.pause(); catAudioRef.current.currentTime = 0; }
      const audio = new Audio(src);
      catAudioRef.current = audio;
      audio.play().catch(() => {});
    };

    if (kind === "helicopter") { playFile(HELICOPTER_SOUND); return; }
    if (kind === "airhorn") { playFile(GAME_SOUNDS.airhorn); return; }
    if (kind === "eating") { playFile(GAME_SOUNDS.eating); return; }
    if (kind === "lose") { playFile(GAME_SOUNDS.lose[Math.floor(Math.random() * GAME_SOUNDS.lose.length)]); return; }

    // Cat move sounds — random clip from the cat's pool
    if (kind.startsWith("cat:")) {
      const pool = CAT_SOUNDS[kind.slice(4)];
      if (pool?.length) { playFile(pool[Math.floor(Math.random() * pool.length)]); return; }
      kind = "select"; // no audio files for this cat → chiptune
    }

    // Chiptune for hit / buff / status / heal / faint / start / select fallback
    try {
      if (!ctxRef.current) ctxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      const ctx = ctxRef.current;
      if (ctx.state === "suspended") ctx.resume();
      const now = ctx.currentTime;
      const beep = (freq, t0, dur, type = "square", vol = 0.06) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = type;
        o.frequency.setValueAtTime(freq, now + t0);
        g.gain.setValueAtTime(vol, now + t0);
        g.gain.exponentialRampToValueAtTime(0.001, now + t0 + dur);
        o.connect(g).connect(ctx.destination);
        o.start(now + t0);
        o.stop(now + t0 + dur + 0.02);
      };
      if (kind === "select") beep(880, 0, 0.06);
      if (kind === "hit") { beep(220, 0, 0.08, "sawtooth", 0.08); beep(160, 0.05, 0.1, "sawtooth", 0.06); }
      if (kind === "buff") { beep(523, 0, 0.07); beep(659, 0.08, 0.07); beep(784, 0.16, 0.09); }
      if (kind === "status") { beep(392, 0, 0.09); beep(330, 0.1, 0.12); }
      if (kind === "heal") { beep(659, 0, 0.08); beep(784, 0.09, 0.08); beep(1046, 0.18, 0.12); }
      if (kind === "faint") { beep(330, 0, 0.12, "triangle", 0.09); beep(220, 0.12, 0.14, "triangle", 0.08); beep(147, 0.26, 0.25, "triangle", 0.08); }
      if (kind === "start") { beep(523, 0, 0.08); beep(523, 0.1, 0.08); beep(784, 0.2, 0.16); }
      if (kind === "coin") { beep(988, 0, 0.06); beep(1319, 0.07, 0.1); }
      if (kind === "step") beep(180, 0, 0.03, "triangle", 0.02);
      if (kind === "warn") { beep(660, 0, 0.08, "square", 0.05); beep(660, 0.16, 0.08, "square", 0.05); }
      if (kind === "victory") { beep(523, 0, 0.09); beep(659, 0.1, 0.09); beep(784, 0.2, 0.09); beep(1046, 0.3, 0.2); beep(784, 0.44, 0.08); beep(1046, 0.54, 0.3); }
    } catch (e) {
      /* audio unavailable */
    }
  }, []);

  /* ---------- looping background music ---------- */

  const stopMusic = useCallback(() => {
    clearTimeout(musicRef.current.timer);
    musicRef.current.timer = null;
    musicRef.current.track = null;
    musicRef.current.gainNode?.disconnect(); // silences any already-scheduled notes
    musicRef.current.gainNode = null;
  }, []);

  const startMusic = useCallback((trackName) => {
    if (musicRef.current.track === trackName) return;
    stopMusic();
    try {
      if (!ctxRef.current) ctxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      const ctx = ctxRef.current;
      if (ctx.state === "suspended") ctx.resume();
      const master = ctx.createGain();
      master.gain.value = 1;
      master.connect(ctx.destination);
      musicRef.current.track = trackName;
      musicRef.current.gainNode = master;

      const scheduleLoop = () => {
        if (musicRef.current.track !== trackName || musicRef.current.gainNode !== master) return;
        const t = MUSIC_TRACKS[trackName];
        const beat = 60 / t.bpm;
        const start = ctx.currentTime + 0.06;
        const noteOn = (midi, at, len, type, vol) => {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.type = type;
          o.frequency.value = midiHz(midi);
          g.gain.setValueAtTime(vol, at);
          g.gain.exponentialRampToValueAtTime(0.001, at + len * 0.92);
          o.connect(g).connect(master);
          o.start(at);
          o.stop(at + len);
        };
        let at = start;
        for (const [m, b] of t.notes) { if (m) noteOn(m, at, b * beat, t.wave, t.vol); at += b * beat; }
        let bt = start;
        for (const [m, b] of t.bass) { if (m) noteOn(m, bt, b * beat, "triangle", t.vol * 1.3); bt += b * beat; }
        musicRef.current.timer = setTimeout(scheduleLoop, (at - start - 0.08) * 1000);
      };
      scheduleLoop();
    } catch (e) {
      /* audio unavailable */
    }
  }, [stopMusic]);

  return { play, mutedRef, catAudioRef, startMusic, stopMusic };
}

/* ---------- UI components ---------- */

function HpBar({ hp, maxHp }) {
  const pct = Math.max(0, (hp / maxHp) * 100);
  const color = pct > 50 ? "#4cc45a" : pct > 20 ? "#e8b830" : "#e05038";
  return (
    <div className="hpbar-outer">
      <span className="hp-label">HP</span>
      <div className="hpbar-track">
        <div className={`hpbar-fill ${pct <= 25 && hp > 0 ? "hp-low" : ""}`} style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

function StatusRow({ f }) {
  const tags = [];
  if (f.atkStage > 0) tags.push(`ATK${"▲".repeat(f.atkStage)}`);
  if (f.atkStage < 0) tags.push(`ATK${"▼".repeat(-f.atkStage)}`);
  if (f.defStage > 0) tags.push(`DEF${"▲".repeat(f.defStage)}`);
  if (f.defStage < 0) tags.push(`DEF${"▼".repeat(-f.defStage)}`);
  if (f.spdStage > 0) tags.push(`SPD${"▲".repeat(f.spdStage)}`);
  if (f.confusedTurns > 0) tags.push("CONFUSED");
  if (f.reflect) tags.push("UNO!");
  if (!tags.length) return null;
  return (
    <div className="status-row">
      {tags.map((t) => <span key={t} className={`tag ${t === "CONFUSED" ? "tag-conf" : ""}`}>{t}</span>)}
    </div>
  );
}

function InfoBox({ f, showNum, align, showLv }) {
  return (
    <div className={`infobox ${align}`}>
      <div className="infobox-top">
        <span className="fighter-name">{f.name}</span>
        <span className="fighter-lv">{FAMILY_ICONS[f.base.family]}{showLv ? ` L${f.level}` : ""}</span>
      </div>
      <HpBar hp={f.hp} maxHp={f.maxHp} />
      {showNum && <div className="hp-num">{f.hp}/{f.maxHp}</div>}
      <StatusRow f={f} />
    </div>
  );
}

/* ---------- main app ---------- */

export default function CatemonBattle() {
  const [screen, setScreen] = useState("title"); // title|select|map|world|center|event|notice|battle|over|victory
  const [mode, setMode] = useState("quick");     // quick | rogue | world
  const [run, setRun] = useState(null);          // roguelike run state
  const [world, setWorld] = useState(null);      // overworld state
  const [currentEvent, setCurrentEvent] = useState(null);
  const [notice, setNotice] = useState(null);    // { text, goto }
  const [confirm, setConfirm] = useState(null);  // { text, onYes }
  const [toast, setToast] = useState(null);      // transient overworld message
  const [playerF, setPlayerF] = useState(null);
  const [enemyF, setEnemyF] = useState(null);
  const [queue, setQueue] = useState([]);
  const [current, setCurrent] = useState(null);
  const [phase, setPhase] = useState("intro");
  const [outcome, setOutcome] = useState(null);
  const [anim, setAnim] = useState({ player: null, enemy: null }); // sprite animation classes
  const animTimers = useRef({ player: null, enemy: null });
  const [unoCard, setUnoCard] = useState(false);
  const [moveOverlay, setMoveOverlay] = useState(null); // { type, from } — wert's screen effects
  const [fainting, setFainting] = useState(null);
  const [showBag, setShowBag] = useState(false);
  const [showCats, setShowCats] = useState(false);
  const [meta, setMeta] = useState(loadMeta);
  const [muted, setMuted] = useState(false);
  const [musicOn, setMusicOn] = useState(() => localStorage.getItem("catemon-music") !== "0");
  const [floats, setFloats] = useState({ player: null, enemy: null });
  const [battleFlash, setBattleFlash] = useState(false);
  const [saves, setSaves] = useState(() => ({
    rogue: !!localStorage.getItem(ROGUE_SAVE),
    world: !!localStorage.getItem(WORLD_SAVE),
  }));
  // title mascot: random cat per visit (skip oiia — its big GIF can fail to load)
  const [titleCat] = useState(() => {
    const pool = ENEMY_IDS.filter((id) => id !== "oiia");
    return pool[Math.floor(Math.random() * pool.length)];
  });
  const [showChart, setShowChart] = useState(false);
  const [npcDialog, setNpcDialog] = useState(null);
  const [tower, setTower] = useState(null); // { catId, level, hp, maxHp, healsLeft, floor }
  const battleIsBoss = useRef(false);
  const encounterPending = useRef(false);
  const trainerRef = useRef(null);     // active trainer during a trainer battle
  const enemyBenchRef = useRef([]);    // trainer's remaining cats
  const toastTimer = useRef(null);
  const swipeStart = useRef(null);
  const { play, mutedRef, catAudioRef, startMusic, stopMusic } = useSfx();
  const rng = Math.random;
  const floatId = useRef(0);
  const floatTimers = useRef({});
  const flashTimer = useRef(null);

  // persist meta + award the achievements that derive from it
  useEffect(() => {
    localStorage.setItem(META_SAVE, JSON.stringify(meta));
    const met = CAT_IDS.filter((id) => meta.dex?.[id]).length;
    const friends = CAT_IDS.filter((id) => meta.dex?.[id] === "befriended").length;
    if (met === CAT_IDS.length) unlock("fulldex");
    if (friends === CAT_IDS.length) unlock("allfriends");
    if ((meta.towerBest ?? 0) >= 5) unlock("tower5");
  }, [meta]); // eslint-disable-line react-hooks/exhaustive-deps

  // CAT-DEX: "seen" upgrades to "befriended", never the other way
  const markDex = (id, st) =>
    setMeta((m) => {
      const cur = m.dex?.[id];
      if (cur === "befriended" || cur === st) return m;
      return { ...m, dex: { ...m.dex, [id]: st } };
    });

  const unlock = (id) => {
    if (meta.ach?.[id]) return;
    setMeta((m) => (m.ach?.[id] ? m : { ...m, ach: { ...m.ach, [id]: true } }));
    const a = ACHIEVEMENTS.find((x) => x.id === id);
    showToast(`🏆 ACHIEVEMENT: ${a.name}!`);
    play("victory");
  };

  const bumpStat = (key, n = 1) =>
    setMeta((m) => ({ ...m, stats: { ...m.stats, [key]: (m.stats?.[key] ?? 0) + n } }));

  // background music follows the screen; battle gets its own track
  useEffect(() => {
    localStorage.setItem("catemon-music", musicOn ? "1" : "0");
    if (!musicOn || muted) { stopMusic(); return; }
    startMusic(screen === "battle" ? "battle" : "overworld");
  }, [screen, musicOn, muted, startMusic, stopMusic]);

  useEffect(() => {
    mutedRef.current = muted;
    if (muted && catAudioRef.current) {
      catAudioRef.current.pause();
      catAudioRef.current.currentTime = 0;
    }
  }, [muted, mutedRef, catAudioRef]);

  const END_SCREENS = ["victory", "over", "title"];

  // auto-save both modes at safe boundaries
  useEffect(() => {
    if (run && !END_SCREENS.includes(screen)) {
      localStorage.setItem(ROGUE_SAVE, JSON.stringify(run));
      setSaves((s) => ({ ...s, rogue: true }));
    }
    if ((run?.coins ?? 0) >= 200) unlock("rich");
  }, [run, screen]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (world && !END_SCREENS.includes(screen)) {
      localStorage.setItem(WORLD_SAVE, JSON.stringify(world));
      setSaves((s) => ({ ...s, world: true }));
    }
    if ((world?.coins ?? 0) >= 200) unlock("rich");
  }, [world, screen]); // eslint-disable-line react-hooks/exhaustive-deps

  const clearSave = (key) => {
    localStorage.removeItem(key === ROGUE_SAVE ? ROGUE_SAVE : WORLD_SAVE);
    setSaves((s) => ({ ...s, [key === ROGUE_SAVE ? "rogue" : "world"]: false }));
  };

  const showToast = (text) => {
    setToast(text);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2200);
  };

  /* ---------- quick battle ---------- */

  const startQuickBattle = (catId) => {
    battleIsBoss.current = false;
    const p = newFighter(catId);
    const others = ENEMY_IDS.filter((c) => c !== catId);
    const e = newFighter(others[Math.floor(Math.random() * others.length)], { statScale: 0.9 });
    beginBattle(p, e, `A wild ${e.name} appeared!`);
  };

  const beginBattle = (p, e, introText) => {
    encounterPending.current = false;
    trainerRef.current = null;
    enemyBenchRef.current = [];
    setPlayerF(p);
    setEnemyF(e);
    setOutcome(null);
    setFainting(null);
    setAnim({ player: null, enemy: null });
    setMoveOverlay(null);
    setShowBag(false);
    setShowCats(false);
    markDex(p.base.id, "befriended");
    markDex(e.base.id, "seen");
    setMeta((m) => ({
      ...m,
      stats: { ...m.stats, plays: { ...(m.stats?.plays ?? {}), [p.base.id]: (m.stats?.plays?.[p.base.id] ?? 0) + 1 } },
    }));
    setQueue([]);
    setCurrent({ text: introText });
    setFloats({ player: null, enemy: null });
    setPhase("intro");
    setScreen("battle");
    setBattleFlash(true);
    clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => setBattleFlash(false), 700);
    play("airhorn");
  };

  /* ---------- roguelike ---------- */

  const startRogue = (catId) => {
    const f = newFighter(catId);
    setRun({
      catId, level: 1, hp: f.maxHp, maxHp: f.maxHp,
      bonuses: {}, healsLeft: 3, zone: 0, floor: 0, map: genZoneMap(),
      coins: 15, bag: { churu: 1 },
      gear: { owned: [], collar: null, charm: null },
    });
    setScreen("map");
    play("start");
  };

  const continueRogue = () => {
    try {
      const saved = JSON.parse(localStorage.getItem(ROGUE_SAVE));
      if (saved?.catId && saved?.map) {
        // migrate pre-item saves
        saved.coins ??= 15;
        saved.bag ??= { churu: 1 };
        saved.gear ??= { owned: [], collar: null, charm: null };
        setRun(saved);
        setMode("rogue");
        setScreen("map");
        play("start");
        return;
      }
    } catch (e) { /* corrupted save */ }
    clearSave(ROGUE_SAVE);
  };

  const showNotice = (text, goto = "map") => {
    setNotice({ text, goto });
    setScreen("notice");
  };

  const chooseNode = (type) => {
    play("select");
    if (type === "battle" || type === "boss") {
      startRogueBattle(type === "boss");
    } else if (type === "event") {
      setCurrentEvent(EVENTS[Math.floor(Math.random() * EVENTS.length)]);
      setScreen("event");
    } else if (type === "rest") {
      const healed = Math.min(Math.round(run.maxHp * 0.6), run.maxHp - run.hp);
      setRun({ ...run, hp: run.hp + healed, healsLeft: 3, floor: run.floor + 1 });
      showNotice(`The vet was surprisingly gentle. Restored ${healed} HP and restocked snacks!`);
    } else if (type === "shop") {
      setRun({ ...run, floor: run.floor + 1 });
      setScreen("center");
    }
  };

  const pickEventChoice = (choice) => {
    play("select");
    const [newRun, text] = choice.apply(run);
    setRun({ ...newRun, floor: run.floor + 1 });
    showNotice(text);
  };

  /* perk bonuses + equipped gear folded together for the battle fighter */
  const totalBonuses = (s) => {
    const b = { ...s.bonuses };
    if (s.gear) {
      for (const [stat, amt] of Object.entries(gearBonuses(s.gear))) {
        b[stat] = (b[stat] ?? 0) + amt;
      }
    }
    return b;
  };

  const playerFighterFrom = (s) =>
    newFighter(s.catId, { level: s.level, bonuses: totalBonuses(s), hp: s.hp, healsLeft: s.healsLeft });

  const randomFoeId = (notId) => {
    const others = ENEMY_IDS.filter((c) => c !== notId);
    return others[Math.floor(Math.random() * others.length)];
  };

  const startRogueBattle = (isBoss) => {
    battleIsBoss.current = isBoss;
    const p = playerFighterFrom(run);
    const wildId = randomFoeId(run.catId);
    const zone = ZONES[run.zone];
    const e = isBoss
      ? newFighter(wildId, { level: rogueBossLevel(run.zone), name: `${zone.bossPrefix} ${CATS[wildId].name}`, extraMoves: [BOSS_MOVE], statScale: 0.95 })
      : newFighter(wildId, { level: rogueWildLevel(run.zone, run.floor), statScale: 0.9 });
    beginBattle(p, e, isBoss ? `${e.name} blocks your path!` : `A wild ${e.name} appeared!`);
  };

  /* max HP from level + perks + gear — the single source of truth */
  const computeMaxHp = (s, level = s.level) =>
    Math.round(CATS[s.catId].stats.hp * levelMul(level)) + (totalBonuses(s).hp ?? 0);

  /* levels: +1 per win, stats +6%/level; the max-HP gain also heals */
  const levelUpState = (s, finalPlayer) => {
    const lvl = s.level + 1;
    const newMaxHp = computeMaxHp(s, lvl);
    const hpGain = newMaxHp - s.maxHp;
    return {
      ...s, level: lvl, maxHp: newMaxHp,
      hp: Math.min(newMaxHp, finalPlayer.hp + hpGain),
      healsLeft: finalPlayer.healsLeft,
    };
  };

  const finishRogueBattle = (won, finalPlayer) => {
    if (!won) {
      clearSave(ROGUE_SAVE);
      setScreen("over");
      return;
    }
    let r = levelUpState(run, finalPlayer);
    const coins = battleIsBoss.current ? 25 : 5 + enemyF.level;
    r = { ...r, coins: (r.coins ?? 0) + coins };
    const catName = CATS[run.catId].name;
    if (battleIsBoss.current) {
      if (run.zone === ZONES.length - 1) {
        clearSave(ROGUE_SAVE);
        setRun(r);
        unlock("roguechamp");
        setScreen("victory");
        return;
      }
      r = { ...r, zone: run.zone + 1, floor: 0, map: genZoneMap() };
      setRun(r);
      showNotice(`ZONE CLEARED! ${catName} grew to LV.${r.level}! Next: ${ZONES[r.zone].name}... (+${coins} coins)`);
    } else {
      r = { ...r, floor: run.floor + 1 };
      setRun(r);
      showNotice(`${catName} grew to LV.${r.level}! Found ${coins} coins!`);
    }
  };

  /* ---------- overworld ---------- */

  const startWorld = (catId) => {
    const f = newFighter(catId);
    const spawn = findTile(AREAS[0].map, "S");
    setWorld({
      catId, level: 1, hp: f.maxHp, maxHp: f.maxHp,
      bonuses: {}, healsLeft: 3,
      area: 0, x: spawn.x, y: spawn.y,
      coins: 15, bag: { churu: 1 }, picked: [],
      gear: { owned: [], collar: null, charm: null },
      bench: [], quests: {}, beaten: [],
    });
    setScreen("world");
    play("start");
  };

  const continueWorld = () => {
    try {
      const saved = JSON.parse(localStorage.getItem(WORLD_SAVE));
      if (saved?.catId && saved?.bag) {
        // migrate pre-equipment / pre-team / pre-quest saves
        saved.gear ??= { owned: [], collar: null, charm: null };
        saved.bench ??= [];
        saved.quests ??= {};
        saved.beaten ??= [];
        setWorld(saved);
        setMode("world");
        setScreen("world");
        play("start");
        return;
      }
    } catch (e) { /* corrupted save */ }
    clearSave(WORLD_SAVE);
  };

  const startWorldBattle = (isBoss) => {
    battleIsBoss.current = isBoss;
    const p = playerFighterFrom(world);
    const wildId = randomFoeId(world.catId);
    const area = AREAS[world.area];
    const e = isBoss
      ? newFighter(wildId, { level: worldBossLevel(world.area), name: `${area.bossPrefix} ${CATS[wildId].name}`, extraMoves: [BOSS_MOVE], statScale: 0.95 })
      : newFighter(wildId, { level: worldWildLevel(world.area), statScale: 0.9 });
    beginBattle(p, e, isBoss ? `${e.name} guards the way out!` : `A wild ${e.name} appeared!`);
  };

  const startTrainerBattle = (tr) => {
    battleIsBoss.current = true; // trainers allow no fleeing or befriending
    const p = playerFighterFrom(world);
    const fighters = tr.team.map((m) => newFighter(m.catId, { level: m.level, statScale: 0.95 }));
    beginBattle(p, fighters[0], `${tr.emoji} ${tr.name}: "${tr.intro}"`);
    trainerRef.current = tr;
    enemyBenchRef.current = fighters.slice(1);
  };

  const finishWorldBattle = (won, finalPlayer) => {
    if (!won) {
      trainerRef.current = null;
      enemyBenchRef.current = [];
      // friendly: no game over in the overworld — wake up at the area start
      const spawn = findTile(AREAS[world.area].map, "S");
      setWorld({
        ...world, hp: world.maxHp, healsLeft: 3, x: spawn.x, y: spawn.y,
        bench: (world.bench ?? []).map((m) => ({ ...m, hp: memberMaxHp(m), healsLeft: 2 })),
      });
      showNotice("You blacked out... and woke up back at the start, fully rested!", "world");
      return;
    }
    if (trainerRef.current) {
      const tr = trainerRef.current;
      trainerRef.current = null;
      let w = levelUpState(world, finalPlayer);
      w = { ...w, coins: w.coins + tr.reward, beaten: [...(w.beaten ?? []), tr.id] };
      setWorld(w);
      showNotice(`${tr.name}: "${tr.quote}" Won ¢${tr.reward}! ${CATS[world.catId].name} grew to LV.${w.level}!`, "world");
      return;
    }
    let w = levelUpState(world, finalPlayer);
    const coins = battleIsBoss.current ? 25 : 5 + enemyF.level;
    w = { ...w, coins: w.coins + coins };
    const catName = CATS[world.catId].name;
    if (battleIsBoss.current) {
      if (world.area === AREAS.length - 1) {
        clearSave(WORLD_SAVE);
        setWorld(w);
        setMeta((m) => (m.towerUnlocked ? m : { ...m, towerUnlocked: true }));
        unlock("worldchamp");
        setScreen("victory");
        return;
      }
      // bosses drop a piece of gear you don't own yet
      let dropText = "";
      const unowned = EQUIP_IDS.filter((id) => !w.gear.owned.includes(id));
      if (unowned.length) {
        const drop = unowned[Math.floor(Math.random() * unowned.length)];
        w = { ...w, gear: { ...w.gear, owned: [...w.gear.owned, drop] } };
        dropText = ` The boss dropped a ${EQUIPMENT[drop].name}!`;
      }
      const nextArea = world.area + 1;
      const spawn = findTile(AREAS[nextArea].map, "S");
      setWorld({ ...w, area: nextArea, x: spawn.x, y: spawn.y });
      showNotice(`The gate opens! ${catName} grew to LV.${w.level}!${dropText} Welcome to ${AREAS[nextArea].name}. (+${coins} coins)`, "world");
    } else {
      setWorld(w);
      showNotice(`${catName} grew to LV.${w.level}! Found ${coins} coins!`, "world");
    }
  };

  const completeQuest = () => {
    const q = npcDialog.quest;
    play("coin");
    setWorld({
      ...world,
      bag: { ...world.bag, [q.item]: (world.bag[q.item] ?? 0) - q.count },
      coins: world.coins + q.reward,
      quests: { ...(world.quests ?? {}), [npcDialog.id]: true },
    });
    showToast(`Quest complete! +¢${q.reward}`);
    setNpcDialog(null);
  };

  /* ---------- endless tower (post-game) ---------- */

  const startTower = (catId) => {
    const f = newFighter(catId, { level: 12 });
    setTower({ catId, level: 12, hp: f.maxHp, maxHp: f.maxHp, healsLeft: 3, floor: 1 });
    setScreen("tower");
    play("start");
  };

  const startTowerBattle = () => {
    battleIsBoss.current = true;
    const p = newFighter(tower.catId, { level: tower.level, hp: tower.hp, healsLeft: tower.healsLeft });
    const wildId = randomFoeId(tower.catId);
    const e = newFighter(wildId, {
      level: 10 + tower.floor * 2,
      name: `OHIO ${CATS[wildId].name}`,
      extraMoves: [BOSS_MOVE],
      statScale: 0.95,
    });
    beginBattle(p, e, `FLOOR ${tower.floor}: ${e.name} blocks the stairs!`);
  };

  const finishTowerBattle = (won, finalPlayer) => {
    if (!won) {
      setMeta((m) => ({ ...m, towerBest: Math.max(m.towerBest ?? 0, tower.floor - 1) }));
      setScreen("over");
      return;
    }
    const lvl = tower.level + 1;
    const newMax = Math.round(CATS[tower.catId].stats.hp * levelMul(lvl));
    const gain = newMax - tower.maxHp;
    let t = {
      ...tower, level: lvl, maxHp: newMax, floor: tower.floor + 1,
      hp: Math.min(newMax, finalPlayer.hp + gain),
      healsLeft: finalPlayer.healsLeft,
    };
    let text = `FLOOR ${tower.floor} CLEARED!`;
    if (tower.floor % 3 === 0) {
      t = { ...t, hp: t.maxHp, healsLeft: 3 };
      text += " A kind Ohio grandma patches you up!";
    }
    setTower(t);
    setMeta((m) => ({ ...m, towerBest: Math.max(m.towerBest ?? 0, tower.floor) }));
    showNotice(text, "tower");
  };

  const tryMove = useCallback((dx, dy) => {
    if (screen !== "world" || confirm || npcDialog) return;
    setWorld((w) => {
      if (!w) return w;
      const map = AREAS[w.area].map;
      const nx = w.x + dx;
      const ny = w.y + dy;
      const t = tileAt(map, nx, ny);
      if (t === "#") return w;

      // NPCs and trainers occupy their tile — bumping into them interacts
      const npc = (NPCS[w.area] ?? []).find((n) => n.x === nx && n.y === ny);
      if (npc) {
        setTimeout(() => setNpcDialog(npc), 60);
        return w;
      }
      const tr = (TRAINERS[w.area] ?? []).find((n) => n.x === nx && n.y === ny);
      if (tr) {
        if ((w.beaten ?? []).includes(tr.id)) {
          showToast(`${tr.name}: "${tr.quote}"`);
          return w;
        }
        if (!encounterPending.current) {
          encounterPending.current = true;
          setTimeout(() => startTrainerBattle(tr), 120);
        }
        return w;
      }

      play("step");
      let next = { ...w, x: nx, y: ny };

      // encounterPending stops double battles from rapid input (and dev double-invoke)
      if (t === "B") {
        if (!encounterPending.current) {
          encounterPending.current = true;
          setTimeout(() => startWorldBattle(true), 120);
        }
        return next;
      }
      if (t === "C") {
        setTimeout(() => setScreen("center"), 120);
        return next;
      }
      if (t === "i") {
        const key = `${w.area}:${nx},${ny}`;
        if (!w.picked.includes(key)) {
          const got = rollPickup(w.gear?.owned ?? []);
          next = { ...next, picked: [...w.picked, key] };
          if (got.coins) {
            next = { ...next, coins: next.coins + got.coins };
            showToast(`Found ${got.coins} coins!`);
          } else if (got.equip) {
            next = { ...next, gear: { ...next.gear, owned: [...next.gear.owned, got.equip] } };
            showToast(`Found a ${EQUIPMENT[got.equip].name}! (gear)`);
          } else {
            next = { ...next, bag: { ...next.bag, [got.item]: (next.bag[got.item] ?? 0) + 1 } };
            showToast(`Found a ${ITEMS[got.item].name}!`);
          }
          play("coin");
        }
        return next;
      }
      if (t === "g" && !encounterPending.current && Math.random() < GRASS_ENCOUNTER_CHANCE) {
        encounterPending.current = true;
        setTimeout(() => startWorldBattle(false), 120);
      }
      return next;
    });
  }, [screen, confirm, npcDialog, play]); // eslint-disable-line react-hooks/exhaustive-deps

  /* keyboard: overworld movement + battle advance */
  useEffect(() => {
    const h = (e) => {
      if (screen === "world") {
        const k = e.key.toLowerCase();
        if (k === "arrowup" || k === "w") { e.preventDefault(); tryMove(0, -1); }
        if (k === "arrowdown" || k === "s") { e.preventDefault(); tryMove(0, 1); }
        if (k === "arrowleft" || k === "a") { e.preventDefault(); tryMove(-1, 0); }
        if (k === "arrowright" || k === "d") { e.preventDefault(); tryMove(1, 0); }
      }
      if (e.key === "Enter" || e.key === " ") {
        if (screen === "battle" && phase !== "command" && !confirm) onAdvance();
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  });

  /* ---------- center (heal + shop) ---------- */

  /* the active adventure save — center, gear, and bag work for both world and rogue */
  const adv = mode === "world" ? world : run;
  const setAdv = mode === "world" ? setWorld : setRun;
  const advScreen = mode === "world" ? "world" : "map";

  const centerHeal = () => {
    play("heal");
    setAdv({
      ...adv,
      hp: adv.maxHp,
      healsLeft: 3,
      bench: (adv.bench ?? []).map((m) => ({ ...m, hp: memberMaxHp(m), healsLeft: 2 })),
    });
    showToast("Fully healed! Snacks restocked!");
  };

  const buyItem = (id) => {
    const item = ITEMS[id];
    if (adv.coins < item.price) { showToast("Not enough coins!"); return; }
    play("coin");
    setAdv({
      ...adv,
      coins: adv.coins - item.price,
      bag: { ...adv.bag, [id]: (adv.bag[id] ?? 0) + 1 },
    });
  };

  const buyEquip = (id) => {
    const eq = EQUIPMENT[id];
    if (adv.gear.owned.includes(id)) return;
    if (adv.coins < eq.price) { showToast("Not enough coins!"); return; }
    play("coin");
    setAdv({
      ...adv,
      coins: adv.coins - eq.price,
      gear: { ...adv.gear, owned: [...adv.gear.owned, id] },
    });
  };

  /* equip/unequip; max HP changes flow into current HP sensibly */
  const setGearSlot = (slot, id) => {
    play("select");
    const s2 = { ...adv, gear: { ...adv.gear, [slot]: id } };
    const newMaxHp = computeMaxHp(s2);
    const hpDelta = newMaxHp - adv.maxHp;
    s2.maxHp = newMaxHp;
    s2.hp = Math.max(1, Math.min(newMaxHp, adv.hp + Math.max(0, hpDelta)));
    setAdv(s2);
  };

  /* ---------- battle event loop ---------- */

  const pickMove = (move) => {
    if (phase !== "command") return;
    setShowBag(false);
    setShowCats(false);
    const { events, outcome: oc } = buildRound(playerF, enemyF, move, rng);
    setOutcome(oc);
    setQueue(events);
    setCurrent(null);
    setPhase("playing");
    advanceWith(events, oc);
  };

  const useItem = (id) => {
    if ((adv?.bag?.[id] ?? 0) <= 0) return;
    setAdv({ ...adv, bag: { ...adv.bag, [id]: adv.bag[id] - 1 } });
    pickMove(itemToMove(id));
  };

  /* ---------- team: switching + befriending (world mode) ---------- */

  /* a benched member's max HP — no gear bonus, gear only helps the active cat */
  const memberMaxHp = (m) => Math.round(CATS[m.catId].stats.hp * levelMul(m.level)) + (m.bonuses?.hp ?? 0);

  const performSwitch = (benchIdx, free = false) => {
    const bench = [...(world.bench ?? [])];
    const incoming = bench[benchIdx];
    if (!incoming || incoming.hp <= 0) return;
    const outgoing = {
      catId: playerF.base.id, level: playerF.level,
      bonuses: world.bonuses ?? {}, healsLeft: playerF.healsLeft,
    };
    outgoing.hp = Math.min(playerF.hp, memberMaxHp(outgoing));
    bench[benchIdx] = outgoing;
    const w2 = { ...world, catId: incoming.catId, level: incoming.level, bonuses: incoming.bonuses ?? {}, healsLeft: incoming.healsLeft, bench };
    w2.maxHp = computeMaxHp(w2);
    w2.hp = Math.min(incoming.hp, w2.maxHp);
    setWorld(w2);
    const pf = newFighter(incoming.catId, { level: incoming.level, bonuses: totalBonuses(w2), hp: w2.hp, healsLeft: incoming.healsLeft });
    setPlayerF(pf);
    setShowCats(false);
    markDex(pf.base.id, "befriended");
    const goEv = { text: `Go, ${pf.name}!`, snapshot: { player: pf, enemy: enemyF }, sfx: "select" };
    let evs = [goEv];
    let oc = null;
    if (!free) {
      // a voluntary switch gives the enemy a free move
      const r = enemyFreeRound(pf, enemyF, rng);
      evs = [goEv, ...r.events];
      oc = r.outcome;
    }
    setOutcome(oc); setQueue(evs); setCurrent(null); setPhase("playing");
    advanceWith(evs, oc);
  };

  const tryBefriend = () => {
    if (phase !== "command") return;
    if ((world.bench ?? []).length >= 2) { showToast("Your team is full! (3 cats max)"); return; }
    setShowBag(false);
    setShowCats(false);
    const snap = { player: { ...playerF }, enemy: { ...enemyF } };
    // weakening the wild cat makes friendship much more likely
    const chance = 0.25 + 0.65 * (1 - enemyF.hp / enemyF.maxHp);
    if (Math.random() < chance) {
      markDex(enemyF.base.id, "befriended");
      bumpStat("befriended");
      unlock("befriend1");
      const member = { catId: enemyF.base.id, level: enemyF.level, hp: Math.max(1, enemyF.hp), bonuses: {}, healsLeft: 2 };
      setWorld({ ...world, hp: playerF.hp, healsLeft: playerF.healsLeft, bench: [...(world.bench ?? []), member] });
      const evs = [
        { text: `You offer a snack and gentle head pats...`, snapshot: snap, sfx: "select" },
        { text: `💖 ${enemyF.name} joined your team!`, snapshot: snap, sfx: "victory" },
      ];
      setOutcome("caught"); setQueue(evs); setCurrent(null); setPhase("playing");
      advanceWith(evs, "caught");
    } else {
      const r = enemyFreeRound(playerF, enemyF, rng);
      const evs = [
        { text: `You offer friendship... but ${enemyF.name} hissed politely.`, snapshot: snap, sfx: "status" },
        ...r.events,
      ];
      setOutcome(r.outcome); setQueue(evs); setCurrent(null); setPhase("playing");
      advanceWith(evs, r.outcome);
    }
  };

  const spawnFloat = (target, text, kind) => {
    const id = ++floatId.current;
    setFloats((f) => ({ ...f, [target]: { id, text, kind } }));
    clearTimeout(floatTimers.current[target]);
    floatTimers.current[target] = setTimeout(
      () => setFloats((f) => (f[target]?.id === id ? { ...f, [target]: null } : f)),
      950
    );
  };

  const advanceWith = (q, oc) => {
    if (!q.length) {
      if (oc) {
        if (oc === "caught") { setScreen("world"); return; }
        const won = oc === "win";
        // trainers send out their next cat before the battle can end
        if (won && enemyBenchRef.current.length) {
          const nextE = enemyBenchRef.current.shift();
          markDex(nextE.base.id, "seen");
          setEnemyF(nextE);
          setFainting(null);
          const ev = {
            text: `${trainerRef.current?.name ?? "The trainer"} sent out ${nextE.name}!`,
            snapshot: { player: playerF, enemy: nextE },
            sfx: "select",
          };
          setOutcome(null); setQueue([ev]); setCurrent(null); setPhase("playing");
          advanceWith([ev], null);
          return;
        }
        // a fainted cat isn't the end while teammates can still fight
        if (!won && mode === "world" && (world?.bench ?? []).some((m) => m.hp > 0)) {
          setPhase("switch");
          setCurrent({ text: "Choose your next cat!" });
          return;
        }
        if (won) {
          play("victory");
          bumpStat("wins");
          unlock("firstwin");
          if (mode === "quick") unlock("quickwin");
          if (playerF.hp === playerF.maxHp) unlock("flawless");
          if (playerF.base.id === "wert") unlock("wertwin");
        } else {
          bumpStat("losses");
        }
        if (mode === "rogue") finishRogueBattle(won, playerF);
        else if (mode === "world") finishWorldBattle(won, playerF);
        else if (mode === "tower") finishTowerBattle(won, playerF);
        else setScreen("over");
      } else {
        setPhase("command");
        setCurrent({ text: `What will ${playerF?.name ?? "your cat"} do?` });
      }
      return;
    }
    const [next, ...rest] = q;
    setCurrent(next);
    setQueue(rest);
    if (next.snapshot) {
      // soft warning beep the moment the player's HP drops into the red
      const wasLow = playerF.hp / playerF.maxHp < 0.25;
      const isLow = next.snapshot.player.hp / next.snapshot.player.maxHp < 0.25;
      if (!wasLow && isLow && next.snapshot.player.hp > 0) play("warn");
      setPlayerF(next.snapshot.player);
      setEnemyF(next.snapshot.enemy);
    }
    if (next.sfx) play(next.sfx);
    if (next.dmg && next.shake) spawnFloat(next.shake, `-${next.dmg}`, next.crit ? "crit" : "dmg");
    if (next.healed && next.healAnim) spawnFloat(next.healAnim, `+${next.healed}`, "heal");
    // one CSS animation class per fighter per event line
    const ANIMS = {
      shake:   { cls: "shaking",   ms: 350 },
      spin:    { cls: "heli-spin", ms: 1300 },
      lunge:   { cls: "lunging",   ms: 450 },
      wobble:  { cls: "wobbling",  ms: 750 },
      buffAnim: { cls: "buffing",  ms: 750 },
      healAnim: { cls: "healing",  ms: 850 },
      debuff:  { cls: "debuffed",  ms: 650 },
    };
    for (const [flag, { cls, ms }] of Object.entries(ANIMS)) {
      const target = next[flag];
      if (!target) continue;
      clearTimeout(animTimers.current[target]);
      setAnim((a) => ({ ...a, [target]: cls }));
      animTimers.current[target] = setTimeout(() => setAnim((a) => ({ ...a, [target]: null })), ms);
    }
    if (next.uno) {
      setUnoCard(true);
      setTimeout(() => setUnoCard(false), 1000);
    }
    if (next.overlay) {
      setMoveOverlay({ type: next.overlay, from: next.overlayFrom });
      const ms = next.overlay === "blackhole" ? 1800 : next.overlay === "sixseven" ? 1400 : 1000;
      setTimeout(() => setMoveOverlay(null), ms);
    }
    if (next.faint) setFainting(next.faint);
  };

  const onAdvance = () => {
    if (phase === "intro") {
      setPhase("command");
      setCurrent({ text: `What will ${playerF.name} do?` });
      return;
    }
    if (phase === "playing") advanceWith(queue, outcome);
  };

  /* ---------- run away / menu ---------- */

  const fleeBattle = () => {
    if (battleIsBoss.current) {
      showToast("Can't run from a boss!");
      return;
    }
    setConfirm({
      text: "Run away from this battle?",
      onYes: () => {
        play("select");
        if (mode === "rogue") setScreen("map");
        else if (mode === "world") setScreen("world");
        else setScreen("title");
      },
    });
  };

  const menuButton = () => {
    const saved = mode === "quick" ? "" : mode === "tower" ? " Tower progress is NOT saved!" : " Your progress is saved.";
    setConfirm({
      text: `Return to the title screen?${saved}`,
      onYes: () => {
        play("select");
        setScreen("title");
      },
    });
  };

  /* ---------- css ---------- */

  const css = (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
      .cb-root { font-family: 'Press Start 2P', 'Courier New', monospace; -webkit-tap-highlight-color: transparent;
        background: #1a1c22; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 12px; }
      .cb-shell { width: 100%; max-width: 440px; background: #2e3040; border-radius: 18px; padding: 14px 14px 18px;
        box-shadow: 0 8px 0 #14151c, inset 0 2px 0 rgba(255,255,255,0.08); }
      .cb-shell-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; gap: 6px; }
      .cb-brand { color: #8a8ea6; font-size: 8px; letter-spacing: 1px; flex: 1; }
      .cb-mute, .cb-menu { background: #1e2028; color: #b8bcd0; border: 2px solid #4a4d62; border-radius: 6px;
        font-family: inherit; font-size: 8px; padding: 6px 8px; cursor: pointer; }
      .screen { background: #f4f2e2; border: 4px solid #14151c; border-radius: 8px; overflow: hidden;
        aspect-ratio: 10 / 11; display: flex; flex-direction: column; position: relative; }
      .arena { flex: 1; position: relative; background: linear-gradient(#dfe8d0 62%, #c8d8b0 62%); padding: 8px; }
      .platform { position: absolute; background: #b0c494; border-radius: 50%; opacity: 0.8; }
      .plat-enemy { width: 34%; height: 7%; right: 6%; top: 34%; }
      .plat-player { width: 40%; height: 8%; left: 4%; bottom: 2%; }
      .slot-enemy { position: absolute; right: 8%; top: 6%; text-align: center; }
      .slot-player { position: absolute; left: 6%; bottom: 4%; text-align: center; }
      .infobox { background: #f8f6e8; border: 3px solid #3a3c30; border-radius: 6px 6px 6px 2px; padding: 7px 9px;
        width: 58%; box-shadow: 2px 2px 0 rgba(0,0,0,0.18); position: absolute; }
      .infobox.enemy { left: 4%; top: 5%; }
      .infobox.player { right: 4%; bottom: 5%; }
      .infobox-top { display: flex; justify-content: space-between; align-items: baseline; gap: 4px; }
      .fighter-name { font-size: 9px; color: #24261e; }
      .fighter-lv { font-size: 7px; color: #8a5a2a; white-space: nowrap; }
      .hpbar-outer { display: flex; align-items: center; gap: 5px; margin-top: 6px; }
      .hp-label { font-size: 7px; color: #c8742a; }
      .hpbar-track { flex: 1; height: 8px; background: #4a4c40; border-radius: 4px; padding: 1.5px; }
      .hpbar-fill { height: 100%; border-radius: 3px; transition: width 0.5s cubic-bezier(.4,0,.2,1), background 0.3s; }
      .hp-low { animation: hp-pulse 0.7s steps(2) infinite; }
      @keyframes hp-pulse { 50% { opacity: 0.55; } }
      .dmgfloat { position: absolute; top: -12px; left: 50%; font-size: 13px; color: #e05038; z-index: 5;
        text-shadow: 2px 2px 0 rgba(255,255,255,0.85); white-space: nowrap; pointer-events: none;
        animation: floatup 0.95s ease-out forwards; }
      .dmgfloat.crit { font-size: 16px; color: #e8a020; }
      .dmgfloat.heal { color: #2a9a4a; }
      @keyframes floatup { 0% { opacity: 0; transform: translate(-50%, 6px); } 15% { opacity: 1; }
        100% { opacity: 0; transform: translate(-50%, -28px); } }
      .battle-swirl { position: absolute; inset: 0; z-index: 30; pointer-events: none;
        background: repeating-radial-gradient(circle at 50% 45%, #14151c 0 14px, #2e3040 14px 28px);
        animation: swirl-out 0.65s steps(8) forwards; }
      @keyframes swirl-out { 0% { opacity: 1; } 100% { opacity: 0; } }
      .hp-num { font-size: 8px; text-align: right; margin-top: 5px; color: #24261e; }
      .status-row { margin-top: 5px; display: flex; gap: 4px; flex-wrap: wrap; }
      .tag { font-size: 6px; background: #d8d4b8; border: 1px solid #6a6c58; border-radius: 3px; padding: 2px 3px; color: #34362a; }
      .tag-conf { background: #ecc8e0; border-color: #9a5a8a; color: #6a2858; }
      .textbox { background: #fdfbf0; border-top: 4px solid #14151c; padding: 12px; min-height: 34%;
        display: flex; flex-direction: column; justify-content: space-between; cursor: pointer; user-select: none; }
      .msg { font-size: 10px; line-height: 1.8; color: #22241c; }
      .continue { align-self: flex-end; font-size: 10px; color: #c8742a; animation: bob 0.8s steps(2) infinite; }
      @keyframes bob { 50% { transform: translateY(3px); } }
      .movegrid { display: grid; grid-template-columns: 1fr 1fr; gap: 7px; }
      .movebtn { font-family: inherit; font-size: 8px; padding: 11px 6px; background: #fdfbf0; color: #22241c;
        border: 3px solid #3a3c30; border-radius: 6px; cursor: pointer; line-height: 1.5; }
      .movebtn:active { background: #ece8d0; transform: translateY(1px); }
      .movebtn small { display: block; font-size: 6px; color: #8a8c74; margin-top: 4px; }
      .battle-actions { display: flex; gap: 7px; margin-top: 7px; }
      .actionbtn { flex: 1; font-family: inherit; font-size: 7px; padding: 8px 6px; background: #e8e2c8;
        color: #4a4c40; border: 3px solid #3a3c30; border-radius: 6px; cursor: pointer; }
      .actionbtn:active { background: #d8d2b8; }
      .shaking { animation: shake 0.32s steps(4); }
      @keyframes shake { 25% { transform: translateX(-5px);} 50% { transform: translateX(5px);} 75% { transform: translateX(-3px);} }
      .heli-spin { animation: helispin 1.2s cubic-bezier(0.3, 0, 0.7, 1); }
      @keyframes helispin { to { transform: rotate(1080deg); } }
      .slot-player.lunging { animation: lunge-r 0.45s ease; }
      @keyframes lunge-r { 35% { transform: translate(28px, -20px); } }
      .slot-enemy.lunging { animation: lunge-l 0.45s ease; }
      @keyframes lunge-l { 35% { transform: translate(-28px, 20px); } }
      .wobbling { animation: wobble 0.7s ease; }
      @keyframes wobble { 20% { transform: rotate(13deg);} 40% { transform: rotate(-13deg);}
        60% { transform: rotate(9deg);} 80% { transform: rotate(-9deg);} }
      .buffing { animation: buffup 0.7s ease; }
      @keyframes buffup { 40% { transform: scale(1.16); filter: drop-shadow(0 0 10px #f6c860) brightness(1.25); } }
      .healing { animation: healup 0.8s ease; }
      @keyframes healup { 45% { transform: translateY(-8px); filter: brightness(1.5) hue-rotate(60deg); } }
      .debuffed { animation: debuffdown 0.6s ease; }
      @keyframes debuffdown { 45% { transform: scale(0.85) translateY(6px); filter: grayscale(0.9) brightness(0.7); } }
      .fainted-anim { animation: faint 0.6s steps(6) forwards; }
      @keyframes faint { to { transform: translateY(30px); opacity: 0; } }
      .uno-overlay { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
        pointer-events: none; z-index: 5; }
      .uno-card { width: 90px; height: 130px; background: linear-gradient(135deg, #d02020 48%, #b01818 52%);
        border: 5px solid #fff; border-radius: 12px; box-shadow: 0 6px 18px rgba(0,0,0,0.45);
        display: flex; align-items: center; justify-content: center; animation: unopop 1s ease; }
      .uno-card .uno-inner { width: 62px; height: 96px; background: #fff; border-radius: 50% / 42%;
        transform: rotate(-25deg); display: flex; align-items: center; justify-content: center;
        color: #d02020; font-size: 26px; font-weight: bold; }
      @keyframes unopop { 0% { transform: scale(0) rotate(-360deg); } 55% { transform: scale(1.15) rotate(8deg); }
        75% { transform: scale(1) rotate(0deg); } 100% { transform: scale(1); opacity: 0.9; } }
      /* wert move effects */
      .fx-overlay { position: absolute; inset: 0; z-index: 6; pointer-events: none; overflow: hidden;
        display: flex; align-items: center; justify-content: center; }
      .big-num { font-size: 120px; color: #f6c860; text-shadow: 7px 7px 0 #14151c, -3px -3px 0 #b05a2a;
        animation: numpop 0.95s ease forwards; }
      .big-num.sixseven { font-size: 84px; color: #ff3030; text-shadow: 6px 6px 0 #14151c, 0 0 24px #ff2020; }
      @keyframes numpop { 0% { transform: scale(0) rotate(-40deg); } 45% { transform: scale(1.5) rotate(8deg); }
        65% { transform: scale(1) rotate(0deg); } 85% { opacity: 1; } 100% { transform: scale(1.1); opacity: 0; } }
      .laser { position: absolute; height: 6px; width: 160%; background: linear-gradient(90deg, #ff2020, #ffb0b0, #ff2020);
        box-shadow: 0 0 14px 4px rgba(255,32,32,0.7); animation: laserfire 1.3s ease forwards; }
      .laser.from-player { left: 12%; bottom: 32%; transform-origin: left center; }
      .laser.laser-a.from-player { transform: rotate(-24deg); }
      .laser.laser-b.from-player { transform: rotate(-31deg); bottom: 29%; }
      .laser.from-enemy { right: 12%; top: 26%; transform-origin: right center; }
      .laser.laser-a.from-enemy { transform: rotate(-24deg); }
      .laser.laser-b.from-enemy { transform: rotate(-31deg); top: 29%; }
      @keyframes laserfire { 0% { opacity: 0; } 12% { opacity: 1; } 30% { opacity: 0.5; } 45% { opacity: 1; }
        60% { opacity: 0.6; } 80% { opacity: 1; } 100% { opacity: 0; } }
      .fx-overlay.blackhole-bg { animation: holedark 1.8s ease forwards; }
      @keyframes holedark { 20% { background: rgba(8,2,16,0.85); } 80% { background: rgba(8,2,16,0.92); }
        100% { background: transparent; } }
      .blackhole { width: 60px; height: 60px; border-radius: 50%;
        background: conic-gradient(from 0deg, #000 0%, #4a1a7a 12%, #000 28%, #7a2aaa 44%, #000 58%, #3a0a5a 74%, #000 90%, #5a1a8a 100%);
        box-shadow: 0 0 70px 40px rgba(40,8,64,0.9), inset 0 0 30px 18px #000;
        animation: holegrow 1.8s cubic-bezier(0.5, 0, 0.6, 1) forwards; }
      @keyframes holegrow { 0% { transform: scale(0) rotate(0deg); }
        55% { transform: scale(11) rotate(480deg); } 80% { transform: scale(12) rotate(720deg); }
        100% { transform: scale(0.01) rotate(1080deg); } }
      .title-screen { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center;
        gap: 11px; background: #2a2c3a; }
      .title-logo { font-size: 24px; color: #f6c860; text-shadow: 3px 3px 0 #b05a2a, 6px 6px 0 #14151c; letter-spacing: 2px; }
      .title-sub { font-size: 7px; color: #a8acc4; line-height: 1.9; text-align: center; padding: 0 16px; }
      .spinwrap { animation: spin3d 1.6s linear infinite; }
      @keyframes spin3d { from { transform: rotateY(0deg);} to { transform: rotateY(360deg);} }
      @media (prefers-reduced-motion: reduce) { .spinwrap, .continue { animation: none; } }
      .bigbtn { font-family: inherit; font-size: 10px; padding: 12px 20px; background: #f6c860; color: #34220a;
        border: 3px solid #14151c; border-radius: 8px; box-shadow: 0 4px 0 #b05a2a; cursor: pointer; }
      .bigbtn:active { transform: translateY(3px); box-shadow: 0 1px 0 #b05a2a; }
      .bigbtn.alt { background: #a8c4e8; box-shadow: 0 4px 0 #4a6a9a; }
      .bigbtn.alt:active { box-shadow: 0 1px 0 #4a6a9a; }
      .bigbtn.small { font-size: 8px; padding: 9px 14px; }
      .select-screen { flex: 1; background: #eae6d2; padding: 10px; display: flex; flex-direction: column; overflow-y: auto; }
      .select-title { font-size: 10px; color: #34362a; text-align: center; margin-bottom: 10px; }
      .catgrid { display: flex; flex-wrap: wrap; justify-content: center; align-content: center; gap: 7px; flex: 1; }
      .catcard { background: #fdfbf0; border: 3px solid #3a3c30; border-radius: 8px; padding: 7px 3px;
        flex: 0 1 31%; display: flex; flex-direction: column; align-items: center; gap: 4px; cursor: pointer; }
      .catcard:active { background: #ece8d0; }
      .catcard .cname { font-size: 7px; color: #22241c; text-align: center; }
      .catcard .ctype { font-size: 6px; color: #8a5a2a; background: #f4e2c0; border: 1px solid #c89a5a;
        border-radius: 3px; padding: 2px 4px; }
      .dexcard { cursor: default; }
      .dexcard.seen .cat-photo-wrap img { filter: grayscale(1) brightness(0.45); }
      .dex-unknown { width: 48px; height: 48px; border-radius: 6px; background: #c8c4a8; color: #6a6c58;
        display: flex; align-items: center; justify-content: center; font-size: 20px; }
      .over-screen { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center;
        gap: 18px; background: #2a2c3a; padding: 16px; }
      .over-title { font-size: 16px; color: #f6c860; text-shadow: 2px 2px 0 #14151c; text-align: center; line-height: 1.8; }
      .cat-photo-wrap { overflow: hidden; display: inline-block; border-radius: 6px; flex-shrink: 0; }
      .cat-photo-wrap img { width: 100%; height: 100%; object-fit: cover; display: block; }
      /* roguelike map */
      .map-screen { flex: 1; background: #eae6d2; padding: 10px 12px; display: flex; flex-direction: column; }
      .zone-banner { text-align: center; margin-bottom: 4px; }
      .zone-name { font-size: 11px; color: #34362a; }
      .zone-flavor { font-size: 6px; color: #8a8c74; margin-top: 5px; line-height: 1.6; }
      .map-floors { flex: 1; display: flex; flex-direction: column-reverse; justify-content: center; gap: 7px; }
      .floor-row { display: flex; justify-content: center; gap: 8px; }
      .nodebtn { font-family: inherit; font-size: 7px; padding: 8px 10px; background: #fdfbf0; color: #22241c;
        border: 3px solid #3a3c30; border-radius: 8px; cursor: pointer; display: flex; flex-direction: column;
        align-items: center; gap: 4px; min-width: 62px; }
      .nodebtn .nicon { font-size: 14px; }
      .nodebtn:disabled { opacity: 0.38; cursor: default; }
      .nodebtn.done { opacity: 0.25; }
      .nodebtn.current:not(:disabled) { border-color: #b05a2a; box-shadow: 0 0 0 2px #f6c860; }
      .nodebtn.current:not(:disabled):active { background: #ece8d0; transform: translateY(1px); }
      .runbar { display: flex; align-items: center; gap: 8px; background: #fdfbf0; border: 3px solid #3a3c30;
        border-radius: 8px; padding: 6px 8px; margin-top: 6px; }
      .runbar .rb-info { flex: 1; }
      .runbar .rb-name { font-size: 7px; color: #22241c; }
      .runbar .rb-hp { font-size: 7px; color: #8a5a2a; margin-top: 4px; }
      /* overworld */
      .world-screen { flex: 1; display: flex; flex-direction: column; background: #22241c; }
      .world-header { display: flex; justify-content: space-between; padding: 6px 10px; background: #14151c; }
      .world-header span { font-size: 7px; color: #d8d4b8; }
      .tilegrid { flex: 1; display: grid; grid-template-columns: repeat(14, 1fr); align-content: center; padding: 4px; gap: 0;
        touch-action: none; cursor: grab; user-select: none; -webkit-user-select: none; }
      .tilegrid img { pointer-events: none; -webkit-user-drag: none; }
      .tile { aspect-ratio: 1; display: flex; align-items: center; justify-content: center; font-size: 10px;
        position: relative; }
      .tile .tile-emoji { font-size: 11px; line-height: 1; }
      .world-footer { display: flex; align-items: center; justify-content: space-between; padding: 6px 10px;
        background: #14151c; gap: 8px; }
      .world-stats { font-size: 6px; color: #d8d4b8; line-height: 1.8; flex: 1; }
      .world-hint { font-size: 5px; color: #6a6d84; text-align: right; line-height: 1.9; }
      .toast { position: absolute; bottom: 14%; left: 50%; transform: translateX(-50%); background: #14151c;
        color: #f6c860; font-size: 7px; padding: 8px 12px; border-radius: 6px; border: 2px solid #f6c860;
        z-index: 6; white-space: nowrap; }
      /* center */
      .center-screen { flex: 1; background: #d8e8e0; padding: 14px; display: flex; flex-direction: column; gap: 8px;
        overflow-y: auto; }
      .shop-section { font-size: 7px; color: #4a6a5a; margin-top: 6px; letter-spacing: 1px; }
      .gear-none { font-size: 6px; color: #8a8c74; padding: 4px 0; }
      .gearbtn { font-family: inherit; font-size: 7px; background: #2e3040; color: #f6c860;
        border: 2px solid #4a4d62; border-radius: 6px; padding: 8px 8px; cursor: pointer; }
      .center-title { font-size: 10px; color: #2a4c3a; text-align: center; }
      .center-coins { font-size: 8px; color: #8a5a2a; text-align: center; }
      .shop-item { display: flex; align-items: center; gap: 8px; background: #fdfbf0; border: 3px solid #3a3c30;
        border-radius: 6px; padding: 8px; }
      .shop-item .si-info { flex: 1; }
      .shop-item .si-name { font-size: 8px; color: #22241c; }
      .shop-item .si-desc { font-size: 6px; color: #8a8c74; margin-top: 3px; }
      .shop-item button { font-family: inherit; font-size: 7px; padding: 6px 10px; background: #f6c860;
        border: 2px solid #14151c; border-radius: 5px; cursor: pointer; }
      .shop-item button:disabled { opacity: 0.4; }
      /* event / notice / confirm */
      .event-screen { flex: 1; background: #2a2c3a; padding: 18px; display: flex; flex-direction: column;
        align-items: center; justify-content: center; gap: 16px; }
      .event-card { background: #fdfbf0; border: 4px solid #14151c; border-radius: 10px; padding: 16px;
        width: 100%; max-width: 340px; display: flex; flex-direction: column; gap: 12px; }
      .event-title { font-size: 11px; color: #b05a2a; text-align: center; }
      .event-text { font-size: 8px; color: #22241c; line-height: 1.9; text-align: center; }
      .event-choices { display: flex; flex-direction: column; gap: 8px; }
      .confirm-overlay { position: absolute; inset: 0; background: rgba(20,21,28,0.72); z-index: 10;
        display: flex; align-items: center; justify-content: center; padding: 20px; }
      .confirm-card { background: #fdfbf0; border: 4px solid #14151c; border-radius: 10px; padding: 16px;
        width: 100%; max-width: 300px; display: flex; flex-direction: column; gap: 12px; }
      .confirm-text { font-size: 8px; color: #22241c; line-height: 1.9; text-align: center; }
      .confirm-btns { display: flex; gap: 8px; }
      .confirm-btns button { flex: 1; }
    `}</style>
  );

  /* ---------- screens ---------- */

  let inner;

  if (screen === "title") {
    inner = (
      <div className="title-screen">
        <div className="spinwrap"><CatPhoto id={titleCat} size={64} /></div>
        <div className="title-logo">CATÉMON</div>
        <div className="title-sub">MEME CAT BATTLE</div>
        <button className="bigbtn" onClick={() => { setMode("world"); setScreen("select"); play("select"); }}>ADVENTURE</button>
        <button className="bigbtn alt" onClick={() => { setMode("rogue"); setScreen("select"); play("select"); }}>ROGUELIKE</button>
        <button className="bigbtn alt" onClick={() => { setMode("quick"); setScreen("select"); play("select"); }}>QUICK BATTLE</button>
        {meta.towerUnlocked && (
          <button className="bigbtn alt" onClick={() => { setMode("tower"); setScreen("select"); play("select"); }}>
            🗼 ENDLESS OHIO{meta.towerBest ? ` · BEST ${meta.towerBest}` : ""}
          </button>
        )}
        {saves.world && <button className="bigbtn small" onClick={continueWorld}>CONTINUE ADVENTURE</button>}
        {saves.rogue && <button className="bigbtn small" onClick={continueRogue}>CONTINUE ROGUELIKE</button>}
        <button className="bigbtn small" onClick={() => { setScreen("dex"); play("select"); }}>
          📖 CAT-DEX {CAT_IDS.filter((id) => meta.dex?.[id]).length}/{CAT_IDS.length}
        </button>
        <button className="bigbtn small" onClick={() => { setScreen("trophies"); play("select"); }}>
          🏆 TROPHIES {Object.keys(meta.ach ?? {}).length}/{ACHIEVEMENTS.length}
        </button>
      </div>
    );
  } else if (screen === "trophies") {
    const st = meta.stats ?? {};
    const plays = st.plays ?? {};
    const fav = Object.keys(plays).sort((a, b) => plays[b] - plays[a])[0];
    inner = (
      <div className="center-screen">
        <div className="center-title">🏆 TROPHIES</div>
        <div className="center-coins">
          BATTLES WON: {st.wins ?? 0} · LOST: {st.losses ?? 0} · BEFRIENDED: {st.befriended ?? 0}
          {fav && <><br />FAVORITE CAT: {CATS[fav].name} ({plays[fav]} battles)</>}
          {meta.towerBest ? <><br />ENDLESS OHIO BEST: FLOOR {meta.towerBest}</> : null}
        </div>
        {ACHIEVEMENTS.map((a) => {
          const got = meta.ach?.[a.id];
          return (
            <div key={a.id} className="shop-item" style={got ? undefined : { opacity: 0.45 }}>
              <span>{got ? a.icon : "🔒"}</span>
              <div className="si-info">
                <div className="si-name">{a.name}</div>
                <div className="si-desc">{a.desc}</div>
              </div>
              {got && <span>✅</span>}
            </div>
          );
        })}
        <button className="bigbtn small" style={{ marginTop: 8 }} onClick={() => { setScreen("title"); play("select"); }}>BACK</button>
      </div>
    );
  } else if (screen === "dex") {
    const met = CAT_IDS.filter((id) => meta.dex?.[id]).length;
    const friends = CAT_IDS.filter((id) => meta.dex?.[id] === "befriended").length;
    inner = (
      <div className="select-screen">
        <div className="select-title">CAT-DEX · {met}/{CAT_IDS.length} MET · {friends} FRIENDS</div>
        <div className="catgrid">
          {CAT_IDS.map((id) => {
            const st = meta.dex?.[id];
            const c = CATS[id];
            return (
              <div key={id} className={`catcard dexcard ${st ?? "unseen"}`}>
                {st ? <CatPhoto id={id} size={48} /> : <div className="dex-unknown">?</div>}
                <span className="cname">{st ? c.name : "???"}</span>
                <span className="ctype">
                  {st === "befriended" ? `${FAMILY_ICONS[c.family]} ${c.tagline}` : st === "seen" ? "seen in battle" : "not yet met"}
                </span>
              </div>
            );
          })}
        </div>
        <button className="bigbtn small" onClick={() => { setScreen("title"); play("select"); }}>BACK</button>
      </div>
    );
  } else if (screen === "select") {
    inner = (
      <div className="select-screen">
        <div className="select-title">{mode === "quick" ? "CHOOSE YOUR CAT" : "CHOOSE YOUR CHAMPION"}</div>
        <div className="catgrid">
          {CAT_IDS.map((id) => {
            const c = CATS[id];
            const start = mode === "world" ? startWorld : mode === "rogue" ? startRogue : mode === "tower" ? startTower : startQuickBattle;
            return (
              <button key={id} className="catcard" onClick={() => start(id)}>
                <CatPhoto id={id} size={48} />
                <span className="cname">{c.name}</span>
                <span className="ctype">{FAMILY_ICONS[c.family]}{c.family} · {c.type}</span>
              </button>
            );
          })}
        </div>
        <button className="bigbtn small" onClick={() => { setShowChart(true); play("select"); }}>📊 TYPE CHART</button>
        {showChart && (
          <div className="confirm-overlay" onClick={() => setShowChart(false)}>
            <div className="confirm-card">
              <div className="confirm-text" style={{ textAlign: "left", lineHeight: 2.4 }}>
                {Object.entries(FAMILY_BEATS).map(([fam, beats]) => (
                  <div key={fam}>
                    {FAMILY_ICONS[fam]} {fam} <span style={{ color: "#8a5a2a" }}>beats</span> {FAMILY_ICONS[beats]} {beats}
                  </div>
                ))}
                <div style={{ color: "#8a8c74", fontSize: 7, marginTop: 6 }}>
                  Strong hits deal 1.4x damage. Weak hits deal 0.75x.
                </div>
              </div>
              <button className="bigbtn small" onClick={() => setShowChart(false)}>GOT IT</button>
            </div>
          </div>
        )}
      </div>
    );
  } else if (screen === "tower") {
    inner = (
      <div className="map-screen">
        <div className="zone-banner">
          <div className="zone-name">🗼 ENDLESS OHIO · FLOOR {tower.floor}</div>
          <div className="zone-flavor">Best: floor {meta.towerBest ?? 0} · Grandma heals every 3 floors</div>
        </div>
        <div className="map-floors" style={{ alignItems: "center" }}>
          <div className="spinwrap"><CatPhoto id={tower.catId} size={72} /></div>
        </div>
        <div className="runbar">
          <CatPhoto id={tower.catId} size={34} />
          <div className="rb-info">
            <div className="rb-name">{CATS[tower.catId].name} · LV.{tower.level}</div>
            <div className="rb-hp">HP {tower.hp}/{tower.maxHp} · SNACKS ×{tower.healsLeft}</div>
          </div>
        </div>
        <button className="bigbtn" style={{ marginTop: 8 }} onClick={() => { play("select"); startTowerBattle(); }}>
          ⚔️ CLIMB TO FLOOR {tower.floor}
        </button>
        <button className="bigbtn small" style={{ marginTop: 8 }} onClick={() => { setTower(null); setScreen("title"); play("select"); }}>
          RETIRE
        </button>
      </div>
    );
  } else if (screen === "map") {
    const zone = ZONES[run.zone];
    inner = (
      <div className="map-screen">
        <div className="zone-banner">
          <div className="zone-name">ZONE {run.zone + 1}: {zone.name}</div>
          <div className="zone-flavor">{zone.flavor}</div>
        </div>
        <div className="map-floors">
          {run.map.map((floor, fi) => (
            <div key={fi} className="floor-row">
              {floor.map((type, ni) => (
                <button
                  key={ni}
                  className={`nodebtn ${fi < run.floor ? "done" : ""} ${fi === run.floor ? "current" : ""}`}
                  disabled={fi !== run.floor}
                  onClick={() => chooseNode(type)}
                >
                  <span className="nicon">{NODE_ICONS[type]}</span>
                  {NODE_LABELS[type]}
                </button>
              ))}
            </div>
          ))}
        </div>
        <div className="runbar">
          <CatPhoto id={run.catId} size={34} />
          <div className="rb-info">
            <div className="rb-name">{CATS[run.catId].name} · LV.{run.level}</div>
            <div className="rb-hp">HP {run.hp}/{run.maxHp} · SNACKS ×{run.healsLeft} · ¢{run.coins ?? 0}</div>
            <div className="rb-hp">{Object.keys(ITEMS).filter((id) => (run.bag?.[id] ?? 0) > 0).map((id) => `${ITEMS[id].icon}×${run.bag[id]}`).join(" ") || "bag empty"}</div>
          </div>
          <button className="gearbtn" onClick={() => { setScreen("gear"); play("select"); }}>🎽 GEAR</button>
        </div>
      </div>
    );
  } else if (screen === "world") {
    const area = AREAS[world.area];
    const pal = area.palette;
    const tileStyle = (t) => {
      if (t === "#") return { background: pal.wall };
      if (t === "g") return { background: pal.grass };
      if (t === "C") return { background: pal.accent };
      return { background: pal.floor };
    };
    const onSwipeStart = (e) => {
      e.preventDefault(); // stop text-selection/native drag from eating the pointerup
      e.currentTarget.setPointerCapture?.(e.pointerId);
      swipeStart.current = { x: e.clientX, y: e.clientY };
    };
    const onSwipeEnd = (e) => {
      const s = swipeStart.current;
      swipeStart.current = null;
      if (!s) return;
      const dx = e.clientX - s.x;
      const dy = e.clientY - s.y;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 20) return;
      if (Math.abs(dx) > Math.abs(dy)) tryMove(Math.sign(dx), 0);
      else tryMove(0, Math.sign(dy));
    };
    inner = (
      <div className="world-screen">
        <div className="world-header">
          <span>{area.name}</span>
          <span>¢{world.coins}</span>
        </div>
        <div className="tilegrid" onPointerDown={onSwipeStart} onPointerUp={onSwipeEnd}>
          {area.map.flatMap((row, y) =>
            [...row].map((t, x) => {
              const isPlayer = world.x === x && world.y === y;
              const picked = world.picked.includes(`${world.area}:${x},${y}`);
              const npcHere = (NPCS[world.area] ?? []).find((n) => n.x === x && n.y === y);
              const trHere = (TRAINERS[world.area] ?? []).find((n) => n.x === x && n.y === y);
              return (
                <div key={`${x}-${y}`} className="tile" style={tileStyle(t)}>
                  {isPlayer ? (
                    <CatPhoto id={world.catId} size={22} style={{ borderRadius: 3 }} />
                  ) : npcHere ? (
                    <span className="tile-emoji">{npcHere.emoji}</span>
                  ) : trHere ? (
                    <span className="tile-emoji" style={(world.beaten ?? []).includes(trHere.id) ? { opacity: 0.45 } : undefined}>{trHere.emoji}</span>
                  ) : t === "C" ? (
                    <span className="tile-emoji">🏥</span>
                  ) : t === "B" ? (
                    <span className="tile-emoji">👑</span>
                  ) : t === "i" && !picked ? (
                    <span className="tile-emoji">✨</span>
                  ) : null}
                </div>
              );
            })
          )}
        </div>
        <div className="world-footer">
          <div className="world-stats">
            {CATS[world.catId].name} LV.{world.level} · HP {world.hp}/{world.maxHp}{world.bench?.length ? ` · 👥+${world.bench.length}` : ""}<br />
            {Object.keys(ITEMS).filter((id) => (world.bag[id] ?? 0) > 0).map((id) => `${ITEMS[id].icon}×${world.bag[id]}`).join(" ") || "bag empty"}
          </div>
          <button className="gearbtn" onClick={() => { setScreen("gear"); play("select"); }}>🎽 GEAR</button>
          <div className="world-hint">SWIPE OR<br />ARROWS<br />TO MOVE</div>
        </div>
        {toast && <div className="toast">{toast}</div>}
        {npcDialog && (() => {
          const q = npcDialog.quest;
          const qdone = (world.quests ?? {})[npcDialog.id];
          const have = q ? world.bag[q.item] ?? 0 : 0;
          const canGive = q && !qdone && have >= q.count;
          const text = !q
            ? npcDialog.hello
            : qdone
              ? q.thanks
              : `${npcDialog.hello} ${q.ask} (${ITEMS[q.item].icon} ${have}/${q.count})`;
          return (
            <div className="confirm-overlay">
              <div className="confirm-card">
                <div className="confirm-text">
                  {npcDialog.emoji} {npcDialog.name}
                  <br /><br />
                  {canGive ? q.done : text}
                </div>
                <div className="confirm-btns">
                  {canGive && (
                    <button className="bigbtn small" onClick={completeQuest}>
                      GIVE {q.count} {ITEMS[q.item].icon}
                    </button>
                  )}
                  <button className="bigbtn small" onClick={() => { setNpcDialog(null); play("select"); }}>BYE</button>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    );
  } else if (screen === "center") {
    inner = (
      <div className="center-screen">
        <div className="center-title">{mode === "world" ? "🏥 CATEMON CENTER" : "🛒 MEME MART"}</div>
        <div className="center-coins">COINS: ¢{adv.coins}</div>
        {mode === "world" && (
          <button className="movebtn" onClick={centerHeal}>
            FREE HEAL
            <small>Full HP + restock snacks</small>
          </button>
        )}
        <div className="shop-section">ITEMS</div>
        {Object.values(ITEMS).map((item) => (
          <div key={item.id} className="shop-item">
            <span>{item.icon}</span>
            <div className="si-info">
              <div className="si-name">{item.name} — ¢{item.price}</div>
              <div className="si-desc">{item.desc} (have ×{adv.bag[item.id] ?? 0})</div>
            </div>
            <button disabled={adv.coins < item.price} onClick={() => buyItem(item.id)}>BUY</button>
          </div>
        ))}
        <div className="shop-section">GEAR (equip from the map screen)</div>
        {Object.values(EQUIPMENT).map((eq) => {
          const owned = adv.gear.owned.includes(eq.id);
          return (
            <div key={eq.id} className="shop-item">
              <span>{eq.icon}</span>
              <div className="si-info">
                <div className="si-name">{eq.name} — {owned ? "OWNED" : `¢${eq.price}`}</div>
                <div className="si-desc">{eq.desc} · {eq.slot} slot</div>
              </div>
              <button disabled={owned || adv.coins < eq.price} onClick={() => buyEquip(eq.id)}>{owned ? "✓" : "BUY"}</button>
            </div>
          );
        })}
        <button className="bigbtn small" style={{ marginTop: 8 }} onClick={() => { setScreen(advScreen); play("select"); }}>
          LEAVE
        </button>
        {toast && <div className="toast">{toast}</div>}
      </div>
    );
  } else if (screen === "gear") {
    inner = (
      <div className="center-screen">
        <div className="center-title">🎽 GEAR</div>
        {["collar", "charm"].map((slot) => {
          const equippedId = adv.gear[slot];
          const options = adv.gear.owned.filter((id) => EQUIPMENT[id].slot === slot);
          return (
            <div key={slot}>
              <div className="shop-section">{slot.toUpperCase()} — {equippedId ? `${EQUIPMENT[equippedId].icon} ${EQUIPMENT[equippedId].name}` : "empty"}</div>
              {options.length === 0 && <div className="gear-none">nothing owned for this slot yet</div>}
              {options.map((id) => {
                const eq = EQUIPMENT[id];
                const isOn = equippedId === id;
                return (
                  <div key={id} className="shop-item">
                    <span>{eq.icon}</span>
                    <div className="si-info">
                      <div className="si-name">{eq.name}</div>
                      <div className="si-desc">{eq.desc}</div>
                    </div>
                    <button onClick={() => setGearSlot(slot, isOn ? null : id)}>{isOn ? "REMOVE" : "EQUIP"}</button>
                  </div>
                );
              })}
            </div>
          );
        })}
        <button className="bigbtn small" style={{ marginTop: "auto" }} onClick={() => { setScreen(advScreen); play("select"); }}>
          BACK
        </button>
      </div>
    );
  } else if (screen === "event") {
    inner = (
      <div className="event-screen">
        <div className="event-card">
          <div className="event-title">{currentEvent.title}</div>
          <div className="event-text">{currentEvent.text}</div>
          <div className="event-choices">
            {currentEvent.choices.map((ch) => (
              <button key={ch.label} className="movebtn" onClick={() => pickEventChoice(ch)}>
                {ch.label}
                <small>{ch.desc}</small>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  } else if (screen === "notice") {
    inner = (
      <div className="event-screen">
        <div className="event-card">
          <div className="event-text">{notice.text}</div>
          <div className="event-choices">
            <button className="movebtn" onClick={() => { play("select"); setScreen(notice.goto); }}>CONTINUE</button>
          </div>
        </div>
        {toast && <div className="toast">{toast}</div>}
      </div>
    );
  } else if (screen === "victory") {
    const champ = mode === "world" ? world : run;
    inner = (
      <div className="over-screen">
        <div className="spinwrap"><CatPhoto id={champ.catId} size={90} /></div>
        <div className="over-title">MEME CAT<br />CHAMPION!<br />
          <span style={{ fontSize: 9, color: "#a8acc4" }}>
            {CATS[champ.catId].name} conquered the meme universe at LV.{champ.level}!
          </span>
        </div>
        <button className="bigbtn" onClick={() => { setRun(null); setWorld(null); setScreen("title"); play("select"); }}>TITLE</button>
        {toast && <div className="toast">{toast}</div>}
      </div>
    );
  } else if (screen === "over") {
    const won = outcome === "win";
    const rogue = mode === "rogue";
    inner = (
      <div className="over-screen">
        <CatPhoto id={won ? playerF.base.id : enemyF.base.id} size={80} />
        <div className="over-title">
          {won ? "YOU WIN!" : rogue ? "RUN OVER..." : mode === "tower" ? "THE TOWER WINS..." : "YOU LOST..."}
          <br />
          <span style={{ fontSize: 9, color: "#a8acc4" }}>
            {won
              ? `${playerF.name} is victorious!`
              : rogue
                ? `Defeated in ${ZONES[run.zone].name} at LV.${run.level}.`
                : mode === "tower"
                  ? `${CATS[tower.catId].name} cleared ${tower.floor - 1} floor${tower.floor - 1 === 1 ? "" : "s"} of ENDLESS OHIO!`
                  : `${enemyF.name} was too powerful.`}
          </span>
        </div>
        <button
          className="bigbtn"
          onClick={() => {
            if (rogue) setRun(null);
            if (mode === "tower") setTower(null);
            setScreen(rogue || mode === "tower" ? "title" : "select");
            play("select");
          }}
        >
          {rogue || mode === "tower" ? "TRY AGAIN" : "REMATCH"}
        </button>
        {toast && <div className="toast">{toast}</div>}
      </div>
    );
  } else {
    // battle
    const showMoves = phase === "command";
    const forcedSwitch = phase === "switch";
    const showLv = mode !== "quick";
    const bagItems = Object.keys(adv?.bag ?? {}).filter((id) => (adv.bag[id] ?? 0) > 0);
    const bench = mode === "world" ? world?.bench ?? [] : [];
    const canBefriend = mode === "world" && !battleIsBoss.current;
    inner = (
      <>
        <div className="arena">
          <div className="platform plat-enemy" />
          <div className="platform plat-player" />
          <InfoBox f={enemyF} showNum={false} align="enemy" showLv={showLv} />
          <InfoBox f={playerF} showNum={true} align="player" showLv={showLv} />
          <div className={`slot-enemy ${anim.enemy ?? ""} ${fainting === "enemy" ? "fainted-anim" : ""}`}>
            <CatPhoto id={enemyF.base.id} size={78} />
            {floats.enemy && <div key={floats.enemy.id} className={`dmgfloat ${floats.enemy.kind}`}>{floats.enemy.text}</div>}
          </div>
          <div className={`slot-player ${anim.player ?? ""} ${fainting === "player" ? "fainted-anim" : ""}`}>
            <CatPhoto id={playerF.base.id} size={100} flip />
            {floats.player && <div key={floats.player.id} className={`dmgfloat ${floats.player.kind}`}>{floats.player.text}</div>}
          </div>
          {unoCard && (
            <div className="uno-overlay">
              <div className="uno-card"><div className="uno-inner">⇄</div></div>
            </div>
          )}
          {moveOverlay?.type === "six" && (
            <div className="fx-overlay"><span className="big-num">6</span></div>
          )}
          {moveOverlay?.type === "seven" && (
            <div className="fx-overlay"><span className="big-num">7</span></div>
          )}
          {moveOverlay?.type === "sixseven" && (
            <div className="fx-overlay">
              <div className={`laser laser-a ${moveOverlay.from === "enemy" ? "from-enemy" : "from-player"}`} />
              <div className={`laser laser-b ${moveOverlay.from === "enemy" ? "from-enemy" : "from-player"}`} />
              <span className="big-num sixseven">6&nbsp;7</span>
            </div>
          )}
          {moveOverlay?.type === "blackhole" && (
            <div className="fx-overlay blackhole-bg">
              <div className="blackhole" />
            </div>
          )}
          {toast && <div className="toast">{toast}</div>}
          {battleFlash && <div className="battle-swirl" />}
        </div>
        <div className="textbox" onClick={!showMoves && !forcedSwitch ? onAdvance : undefined} role={!showMoves && !forcedSwitch ? "button" : undefined}>
          {forcedSwitch || (showMoves && showCats) ? (
            <>
              <div className="msg" style={{ marginBottom: 8 }}>{forcedSwitch ? "Choose your next cat!" : "TEAM"}</div>
              <div className="movegrid">
                {bench.map((m, i) => (
                  <button key={i} className="movebtn" disabled={m.hp <= 0} onClick={() => performSwitch(i, forcedSwitch)}>
                    {CATS[m.catId].name} · LV.{m.level}
                    <small>{m.hp <= 0 ? "fainted" : `HP ${m.hp}/${memberMaxHp(m)}`}</small>
                  </button>
                ))}
              </div>
              {!forcedSwitch && (
                <div className="battle-actions">
                  <button className="actionbtn" onClick={() => setShowCats(false)}>◀ BACK</button>
                </div>
              )}
            </>
          ) : showMoves ? (
            showBag ? (
              <>
                <div className="msg" style={{ marginBottom: 8 }}>BAG</div>
                <div className="movegrid">
                  {bagItems.length ? bagItems.map((id) => (
                    <button key={id} className="movebtn" onClick={() => useItem(id)}>
                      {ITEMS[id].icon} {ITEMS[id].name} ×{adv.bag[id]}
                      <small>{ITEMS[id].desc}</small>
                    </button>
                  )) : <div className="msg" style={{ fontSize: 8 }}>The bag is empty...</div>}
                </div>
                <div className="battle-actions">
                  <button className="actionbtn" onClick={() => setShowBag(false)}>◀ BACK</button>
                </div>
              </>
            ) : (
              <>
                <div className="msg" style={{ marginBottom: 8 }}>What will {playerF.name} do?</div>
                <div className="movegrid">
                  {playerF.moves.map((m) => (
                    <button key={m.key} className="movebtn" onClick={() => pickMove(m)}>
                      {m.name}
                      <small>{m.desc}{m.fx.heal && !m.item ? ` (${playerF.healsLeft} left)` : ""}</small>
                    </button>
                  ))}
                </div>
                <div className="battle-actions">
                  {(mode === "world" || mode === "rogue") && <button className="actionbtn" onClick={() => setShowBag(true)}>🎒 BAG</button>}
                  {bench.length > 0 && <button className="actionbtn" onClick={() => { setShowBag(false); setShowCats(true); }}>👥 CATS</button>}
                  {canBefriend && <button className="actionbtn" onClick={tryBefriend}>💖 BEFRIEND</button>}
                  {(mode === "world" || mode === "rogue") && <button className="actionbtn" onClick={fleeBattle}>🏃 RUN</button>}
                </div>
              </>
            )
          ) : (
            <>
              <div className="msg">{current?.text}</div>
              <div className="continue">▼</div>
            </>
          )}
        </div>
      </>
    );
  }

  return (
    <div className="cb-root">
      {css}
      <div className="cb-shell">
        <div className="cb-shell-top">
          <span className="cb-brand">CATÉMON v3.0</span>
          {screen !== "title" && <button className="cb-menu" onClick={menuButton}>MENU</button>}
          <button className="cb-mute" onClick={() => setMusicOn((m) => !m)}>{musicOn ? "♪ ON" : "♪ OFF"}</button>
          <button className="cb-mute" onClick={() => setMuted((m) => !m)}>{muted ? "SOUND: OFF" : "SOUND: ON"}</button>
        </div>
        <div className="screen">
          {inner}
          {confirm && (
            <div className="confirm-overlay">
              <div className="confirm-card">
                <div className="confirm-text">{confirm.text}</div>
                <div className="confirm-btns">
                  <button className="bigbtn small" onClick={() => { const y = confirm.onYes; setConfirm(null); y(); }}>YES</button>
                  <button className="bigbtn small alt" onClick={() => { setConfirm(null); play("select"); }}>NO</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
