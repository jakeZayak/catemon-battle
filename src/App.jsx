import { useState, useRef, useEffect, useCallback } from "react";
import { CATS, CAT_IDS, CAT_IMAGES, CAT_CROP, CAT_WRAP_BG, CAT_SOUNDS } from "./cats.js";
import { newFighter, buildRound, levelMul } from "./battle.js";

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

/* ---------- adventure data ---------- */

const SAVE_KEY = "catemon-save-v1";

const ZONES = [
  { name: "THE KITCHEN", flavor: "Something smells illegal in here.", bossPrefix: "ALPHA" },
  { name: "THE BACKROOMS", flavor: "Yellow walls. Humming lights. Vibes: off.", bossPrefix: "ALPHA" },
  { name: "OHIO", flavor: "Only the strongest memes survive here.", bossPrefix: "MEME LORD" },
];

const NODE_ICONS = { battle: "😾", event: "❓", rest: "🛏️", boss: "👑" };
const NODE_LABELS = { battle: "FIGHT", event: "???", rest: "THE VET", boss: "BOSS" };

/* 4 floors of 2-3 nodes + a boss floor. Floor 1 is always a fight. */
function genZoneMap(rng = Math.random) {
  const floors = [];
  for (let f = 0; f < 4; f++) {
    const count = rng() < 0.4 ? 3 : 2;
    const nodes = [];
    for (let i = 0; i < count; i++) {
      if (f === 0) { nodes.push("battle"); continue; }
      const r = rng();
      nodes.push(r < 0.55 ? "battle" : r < 0.85 ? "event" : "rest");
    }
    floors.push(nodes);
  }
  floors.push(["boss"]);
  return floors;
}

const wildLevel = (zone, floor) => 1 + zone * 3 + floor;
const bossLevel = (zone) => 7 + zone * 3;

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

function useSfx() {
  const ctxRef = useRef(null);
  const mutedRef = useRef(false);
  const catAudioRef = useRef(null);

  const play = useCallback((kind) => {
    if (mutedRef.current) return;

    // Cat move sounds — random clip from the cat's pool
    if (kind.startsWith("cat:")) {
      const catId = kind.slice(4);
      const pool = CAT_SOUNDS[catId];
      if (pool?.length) {
        if (catAudioRef.current) { catAudioRef.current.pause(); catAudioRef.current.currentTime = 0; }
        const audio = new Audio(pool[Math.floor(Math.random() * pool.length)]);
        catAudioRef.current = audio;
        audio.play().catch(() => {});
        return;
      }
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
    } catch (e) {
      /* audio unavailable */
    }
  }, []);

  return { play, mutedRef, catAudioRef };
}

/* ---------- UI components ---------- */

function HpBar({ hp, maxHp }) {
  const pct = Math.max(0, (hp / maxHp) * 100);
  const color = pct > 50 ? "#4cc45a" : pct > 20 ? "#e8b830" : "#e05038";
  return (
    <div className="hpbar-outer">
      <span className="hp-label">HP</span>
      <div className="hpbar-track">
        <div className="hpbar-fill" style={{ width: `${pct}%`, background: color }} />
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
  if (f.confusedTurns > 0) tags.push("CONFUSED");
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
        {showLv && <span className="fighter-lv">L{f.level}</span>}
      </div>
      <HpBar hp={f.hp} maxHp={f.maxHp} />
      {showNum && <div className="hp-num">{f.hp}/{f.maxHp}</div>}
      <StatusRow f={f} />
    </div>
  );
}

/* ---------- main app ---------- */

export default function CatemonBattle() {
  const [screen, setScreen] = useState("title"); // title|select|map|event|notice|battle|over|victory
  const [mode, setMode] = useState("quick");     // quick | adventure
  const [run, setRun] = useState(null);          // adventure run state
  const [currentEvent, setCurrentEvent] = useState(null);
  const [notice, setNotice] = useState(null);    // { text, goto: "map"|"victory" }
  const [playerF, setPlayerF] = useState(null);
  const [enemyF, setEnemyF] = useState(null);
  const [queue, setQueue] = useState([]);
  const [current, setCurrent] = useState(null);
  const [phase, setPhase] = useState("intro");
  const [outcome, setOutcome] = useState(null);
  const [shake, setShake] = useState(null);
  const [fainting, setFainting] = useState(null);
  const [muted, setMuted] = useState(false);
  const [hasSave, setHasSave] = useState(() => !!localStorage.getItem(SAVE_KEY));
  const advIsBoss = useRef(false);
  const { play, mutedRef, catAudioRef } = useSfx();
  const rng = Math.random;

  useEffect(() => {
    mutedRef.current = muted;
    if (muted && catAudioRef.current) {
      catAudioRef.current.pause();
      catAudioRef.current.currentTime = 0;
    }
  }, [muted, mutedRef, catAudioRef]);

  // auto-save at node boundaries (run only changes between battles);
  // skip end-of-run screens so a finished run never re-saves after clearSave
  useEffect(() => {
    if (run && screen !== "victory" && screen !== "over" && screen !== "title") {
      localStorage.setItem(SAVE_KEY, JSON.stringify(run));
      setHasSave(true);
    }
  }, [run, screen]);

  const clearSave = () => {
    localStorage.removeItem(SAVE_KEY);
    setHasSave(false);
  };

  /* ---------- quick battle ---------- */

  const startBattle = (catId) => {
    const p = newFighter(catId);
    const others = CAT_IDS.filter((c) => c !== catId);
    const e = newFighter(others[Math.floor(Math.random() * others.length)]);
    setPlayerF(p);
    setEnemyF(e);
    setOutcome(null);
    setFainting(null);
    setQueue([]);
    setCurrent({ text: `A wild ${e.name} appeared!` });
    setPhase("intro");
    setScreen("battle");
    play("start");
  };

  /* ---------- adventure ---------- */

  const startAdventure = (catId) => {
    const f = newFighter(catId);
    setRun({
      catId,
      level: 1,
      hp: f.maxHp,
      maxHp: f.maxHp,
      bonuses: {},
      healsLeft: 2,
      zone: 0,
      floor: 0,
      map: genZoneMap(),
    });
    setScreen("map");
    play("start");
  };

  const continueRun = () => {
    try {
      const saved = JSON.parse(localStorage.getItem(SAVE_KEY));
      if (saved?.catId && saved?.map) {
        setRun(saved);
        setMode("adventure");
        setScreen("map");
        play("start");
        return;
      }
    } catch (e) { /* corrupted save */ }
    clearSave();
  };

  const showNotice = (text, goto = "map") => {
    setNotice({ text, goto });
    setScreen("notice");
  };

  const chooseNode = (type) => {
    play("select");
    if (type === "battle" || type === "boss") {
      startAdvBattle(type === "boss");
    } else if (type === "event") {
      setCurrentEvent(EVENTS[Math.floor(Math.random() * EVENTS.length)]);
      setScreen("event");
    } else if (type === "rest") {
      const healed = Math.min(Math.round(run.maxHp * 0.6), run.maxHp - run.hp);
      setRun({ ...run, hp: run.hp + healed, healsLeft: 2, floor: run.floor + 1 });
      showNotice(`The vet was surprisingly gentle. Restored ${healed} HP and restocked snacks!`);
    }
  };

  const pickEventChoice = (choice) => {
    play("select");
    const [newRun, text] = choice.apply(run);
    setRun({ ...newRun, floor: run.floor + 1 });
    showNotice(text);
  };

  const startAdvBattle = (isBoss) => {
    advIsBoss.current = isBoss;
    const p = newFighter(run.catId, {
      level: run.level,
      bonuses: run.bonuses,
      hp: run.hp,
      healsLeft: run.healsLeft,
    });
    const others = CAT_IDS.filter((c) => c !== run.catId);
    const wildId = others[Math.floor(Math.random() * others.length)];
    const zone = ZONES[run.zone];
    const e = isBoss
      ? newFighter(wildId, { level: bossLevel(run.zone), name: `${zone.bossPrefix} ${CATS[wildId].name}` })
      : newFighter(wildId, { level: wildLevel(run.zone, run.floor) });
    setPlayerF(p);
    setEnemyF(e);
    setOutcome(null);
    setFainting(null);
    setQueue([]);
    setCurrent({ text: isBoss ? `${e.name} blocks your path!` : `A wild ${e.name} appeared!` });
    setPhase("intro");
    setScreen("battle");
    play("start");
  };

  const finishAdventureBattle = (won, finalPlayer) => {
    if (!won) {
      clearSave();
      setScreen("over");
      return;
    }
    const lvl = run.level + 1;
    const base = CATS[run.catId];
    const newMaxHp = Math.round(base.stats.hp * levelMul(lvl)) + (run.bonuses.hp ?? 0);
    const hpGain = newMaxHp - run.maxHp; // leveling up heals by the max HP increase
    let r = {
      ...run,
      level: lvl,
      maxHp: newMaxHp,
      hp: Math.min(newMaxHp, finalPlayer.hp + hpGain),
      healsLeft: finalPlayer.healsLeft,
    };
    if (advIsBoss.current) {
      if (run.zone === ZONES.length - 1) {
        clearSave();
        setRun(r);
        setScreen("victory");
        return;
      }
      r = { ...r, zone: run.zone + 1, floor: 0, map: genZoneMap() };
      setRun(r);
      showNotice(`ZONE CLEARED! ${base.name} grew to LV.${lvl}! Next: ${ZONES[r.zone].name}...`);
    } else {
      r = { ...r, floor: run.floor + 1 };
      setRun(r);
      showNotice(`${base.name} grew to LV.${lvl}!`);
    }
  };

  /* ---------- battle event loop ---------- */

  const pickMove = (move) => {
    if (phase !== "command") return;
    const { events, outcome: oc } = buildRound(playerF, enemyF, move, rng);
    setOutcome(oc);
    setQueue(events);
    setCurrent(null);
    setPhase("playing");
    advanceWith(events, oc);
  };

  const advanceWith = (q, oc) => {
    if (!q.length) {
      if (oc) {
        if (mode === "adventure") {
          finishAdventureBattle(oc === "win", playerF);
        } else {
          setScreen("over");
        }
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
      setPlayerF(next.snapshot.player);
      setEnemyF(next.snapshot.enemy);
    }
    if (next.sfx) play(next.sfx);
    if (next.shake) {
      setShake(next.shake);
      setTimeout(() => setShake(null), 350);
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

  useEffect(() => {
    const h = (e) => {
      if (e.key === "Enter" || e.key === " ") {
        if (screen === "battle" && phase !== "command") onAdvance();
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  });

  /* ---------- css ---------- */

  const css = (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
      .cb-root { font-family: 'Press Start 2P', 'Courier New', monospace; -webkit-tap-highlight-color: transparent;
        background: #1a1c22; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 12px; }
      .cb-shell { width: 100%; max-width: 440px; background: #2e3040; border-radius: 18px; padding: 14px 14px 18px;
        box-shadow: 0 8px 0 #14151c, inset 0 2px 0 rgba(255,255,255,0.08); }
      .cb-shell-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
      .cb-brand { color: #8a8ea6; font-size: 8px; letter-spacing: 1px; }
      .cb-mute { background: #1e2028; color: #b8bcd0; border: 2px solid #4a4d62; border-radius: 6px;
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
      .hpbar-fill { height: 100%; border-radius: 3px; transition: width 0.45s steps(12); }
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
      .shaking { animation: shake 0.32s steps(4); }
      @keyframes shake { 25% { transform: translateX(-5px);} 50% { transform: translateX(5px);} 75% { transform: translateX(-3px);} }
      .fainted-anim { animation: faint 0.6s steps(6) forwards; }
      @keyframes faint { to { transform: translateY(30px); opacity: 0; } }
      .title-screen { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center;
        gap: 14px; background: #2a2c3a; }
      .title-logo { font-size: 24px; color: #f6c860; text-shadow: 3px 3px 0 #b05a2a, 6px 6px 0 #14151c; letter-spacing: 2px; }
      .title-sub { font-size: 8px; color: #a8acc4; line-height: 1.9; text-align: center; padding: 0 20px; }
      .spinwrap { animation: spin3d 1.6s linear infinite; }
      @keyframes spin3d { from { transform: rotateY(0deg);} to { transform: rotateY(360deg);} }
      @media (prefers-reduced-motion: reduce) { .spinwrap, .continue { animation: none; } }
      .bigbtn { font-family: inherit; font-size: 11px; padding: 14px 22px; background: #f6c860; color: #34220a;
        border: 3px solid #14151c; border-radius: 8px; box-shadow: 0 4px 0 #b05a2a; cursor: pointer; }
      .bigbtn:active { transform: translateY(3px); box-shadow: 0 1px 0 #b05a2a; }
      .bigbtn.alt { background: #a8c4e8; box-shadow: 0 4px 0 #4a6a9a; }
      .bigbtn.alt:active { box-shadow: 0 1px 0 #4a6a9a; }
      .select-screen { flex: 1; background: #eae6d2; padding: 12px; display: flex; flex-direction: column; }
      .select-title { font-size: 10px; color: #34362a; text-align: center; margin-bottom: 12px; }
      .catgrid { display: flex; flex-wrap: wrap; justify-content: center; align-content: center; gap: 8px; flex: 1; }
      .catcard { background: #fdfbf0; border: 3px solid #3a3c30; border-radius: 8px; padding: 8px 4px;
        flex: 0 1 30%; display: flex; flex-direction: column; align-items: center; gap: 5px; cursor: pointer; }
      .catcard:active { background: #ece8d0; }
      .catcard .cname { font-size: 8px; color: #22241c; }
      .catcard .ctype { font-size: 6px; color: #8a5a2a; background: #f4e2c0; border: 1px solid #c89a5a;
        border-radius: 3px; padding: 2px 4px; }
      .catcard .ctag { font-size: 6px; color: #8a8c74; text-align: center; line-height: 1.6; }
      .over-screen { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center;
        gap: 18px; background: #2a2c3a; padding: 16px; }
      .over-title { font-size: 16px; color: #f6c860; text-shadow: 2px 2px 0 #14151c; text-align: center; line-height: 1.8; }
      .cat-photo-wrap { overflow: hidden; display: inline-block; border-radius: 6px; flex-shrink: 0; }
      .cat-photo-wrap img { width: 100%; height: 100%; object-fit: cover; display: block; }
      /* adventure map */
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
      /* event / notice */
      .event-screen { flex: 1; background: #2a2c3a; padding: 18px; display: flex; flex-direction: column;
        align-items: center; justify-content: center; gap: 16px; }
      .event-card { background: #fdfbf0; border: 4px solid #14151c; border-radius: 10px; padding: 16px;
        width: 100%; max-width: 340px; display: flex; flex-direction: column; gap: 12px; }
      .event-title { font-size: 11px; color: #b05a2a; text-align: center; }
      .event-text { font-size: 8px; color: #22241c; line-height: 1.9; text-align: center; }
      .event-choices { display: flex; flex-direction: column; gap: 8px; }
    `}</style>
  );

  /* ---------- screens ---------- */

  let inner;

  if (screen === "title") {
    inner = (
      <div className="title-screen">
        <div className="spinwrap"><CatPhoto id="oiia" size={80} /></div>
        <div className="title-logo">CATÉMON</div>
        <div className="title-sub">MEME CAT BATTLE<br />HUH · MAXWELL · OIIA · QUASO · BANANA</div>
        <button className="bigbtn" onClick={() => { setMode("adventure"); setScreen("select"); play("select"); }}>ADVENTURE</button>
        <button className="bigbtn alt" onClick={() => { setMode("quick"); setScreen("select"); play("select"); }}>QUICK BATTLE</button>
        {hasSave && <button className="bigbtn alt" onClick={continueRun}>CONTINUE</button>}
      </div>
    );
  } else if (screen === "select") {
    inner = (
      <div className="select-screen">
        <div className="select-title">{mode === "adventure" ? "CHOOSE YOUR CHAMPION" : "CHOOSE YOUR CAT"}</div>
        <div className="catgrid">
          {CAT_IDS.map((id) => {
            const c = CATS[id];
            return (
              <button key={id} className="catcard" onClick={() => (mode === "adventure" ? startAdventure(id) : startBattle(id))}>
                <CatPhoto id={id} size={56} />
                <span className="cname">{c.name}</span>
                <span className="ctype">{c.type}</span>
                <span className="ctag">{c.tagline}</span>
              </button>
            );
          })}
        </div>
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
            <div className="rb-hp">HP {run.hp}/{run.maxHp} · SNACKS ×{run.healsLeft}</div>
          </div>
        </div>
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
      </div>
    );
  } else if (screen === "victory") {
    inner = (
      <div className="over-screen">
        <div className="spinwrap"><CatPhoto id={run.catId} size={90} /></div>
        <div className="over-title">MEME CAT<br />CHAMPION!<br />
          <span style={{ fontSize: 9, color: "#a8acc4" }}>
            {CATS[run.catId].name} conquered Ohio at LV.{run.level}!
          </span>
        </div>
        <button className="bigbtn" onClick={() => { setRun(null); setScreen("title"); play("select"); }}>TITLE</button>
      </div>
    );
  } else if (screen === "over") {
    const won = outcome === "win";
    const adventure = mode === "adventure";
    inner = (
      <div className="over-screen">
        <CatPhoto id={won ? playerF.base.id : enemyF.base.id} size={80} />
        <div className="over-title">
          {won ? "YOU WIN!" : adventure ? "RUN OVER..." : "YOU LOST..."}
          <br />
          <span style={{ fontSize: 9, color: "#a8acc4" }}>
            {won
              ? `${playerF.name} is victorious!`
              : adventure
                ? `Defeated in ${ZONES[run.zone].name} at LV.${run.level}.`
                : `${enemyF.name} was too powerful.`}
          </span>
        </div>
        <button
          className="bigbtn"
          onClick={() => {
            if (adventure) setRun(null);
            setScreen(adventure ? "title" : "select");
            play("select");
          }}
        >
          {adventure ? "TRY AGAIN" : "REMATCH"}
        </button>
      </div>
    );
  } else {
    // battle
    const showMoves = phase === "command";
    const showLv = mode === "adventure";
    inner = (
      <>
        <div className="arena">
          <div className="platform plat-enemy" />
          <div className="platform plat-player" />
          <InfoBox f={enemyF} showNum={false} align="enemy" showLv={showLv} />
          <InfoBox f={playerF} showNum={true} align="player" showLv={showLv} />
          <div className={`slot-enemy ${shake === "enemy" ? "shaking" : ""} ${fainting === "enemy" ? "fainted-anim" : ""}`}>
            <CatPhoto id={enemyF.base.id} size={78} />
          </div>
          <div className={`slot-player ${shake === "player" ? "shaking" : ""} ${fainting === "player" ? "fainted-anim" : ""}`}>
            <CatPhoto id={playerF.base.id} size={100} flip />
          </div>
        </div>
        <div className="textbox" onClick={!showMoves ? onAdvance : undefined} role={!showMoves ? "button" : undefined}>
          {showMoves ? (
            <>
              <div className="msg" style={{ marginBottom: 8 }}>What will {playerF.name} do?</div>
              <div className="movegrid">
                {playerF.base.moves.map((m) => (
                  <button key={m.key} className="movebtn" onClick={() => pickMove(m)}>
                    {m.name}
                    <small>{m.desc}{m.fx.heal ? ` (${playerF.healsLeft} left)` : ""}</small>
                  </button>
                ))}
              </div>
            </>
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
          <span className="cb-brand">CATÉMON v2.0</span>
          <button className="cb-mute" onClick={() => setMuted((m) => !m)}>{muted ? "SOUND: OFF" : "SOUND: ON"}</button>
        </div>
        <div className="screen">{inner}</div>
      </div>
    </div>
  );
}
