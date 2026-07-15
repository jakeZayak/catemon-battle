import { useState, useRef, useEffect, useCallback } from "react";

/* ============================================================
   CATÉMON — meme cat battle
   ============================================================ */

/* ---------- cat photos ---------- */

// prefix with Vite's base URL so paths work at "/" in dev and "/catemon-battle/" on Pages
const asset = (p) => import.meta.env.BASE_URL + p;

const CAT_IMAGES = {
  huh:    asset("cat_imgs/huh-cat.gif"),
  maxwell: asset("cat_imgs/maxwell-cat-spinning.gif"),
  oiia:   asset("cat_imgs/oiia-cat.gif"),
  quaso:  asset("cat_imgs/quaso_cat.webp"),
  banana: asset("cat_imgs/banana-cat.gif"),
};

// objectPosition to crop each photo nicely in a square container
const CAT_CROP = {
  huh:    "center 0%",    // anchor top → clips the "HUH" text at the bottom
  maxwell: "60% center",  // shift right to center on the cat body
  oiia:   "center center",
  quaso:  "20% 30%",      // zoom into the face, crop out wall/floor background
  banana: "center 30%",   // tall portrait — favor the face
};

// oiia GIF has a solid black background — match the wrapper so it looks clean
const CAT_WRAP_BG = { oiia: "#111" };

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
      <img
        src={CAT_IMAGES[id]}
        alt={id}
        style={{ objectPosition: CAT_CROP[id] }}
      />
    </div>
  );
}

/* ---------- cat data ---------- */

const CATS = {
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

const CAT_IDS = ["huh", "maxwell", "oiia", "quaso", "banana"];

/* ---------- battle math ---------- */

const stageMul = (s) => (s >= 0 ? (2 + s) / 2 : 2 / (2 - s));

function calcDamage(attacker, defender, power, rng) {
  const atk = attacker.base.stats.atk * stageMul(attacker.atkStage);
  const def = defender.base.stats.def * stageMul(defender.defStage);
  const variance = 0.85 + rng() * 0.15;
  const crit = rng() < 1 / 16;
  let dmg = ((power * (atk / def)) / 2.1) * variance * (crit ? 1.5 : 1);
  return { dmg: Math.max(1, Math.round(dmg)), crit };
}

function newFighter(catId) {
  const base = CATS[catId];
  return {
    base,
    hp: base.stats.hp,
    maxHp: base.stats.hp,
    atkStage: 0,
    defStage: 0,
    confusedTurns: 0,
    healsLeft: 2,
  };
}

function useMove(state, userKey, foeKey, move, rng) {
  const events = [];
  const snap = () => ({
    player: { ...state.player },
    enemy: { ...state.enemy },
  });
  const user = () => state[userKey];
  const foe = () => state[foeKey];

  if (user().confusedTurns > 0) {
    state[userKey] = { ...user(), confusedTurns: user().confusedTurns - 1 };
    if (state[userKey].confusedTurns === 0) {
      events.push({ text: `${user().base.name} snapped out of confusion!`, snapshot: snap() });
    } else {
      events.push({ text: `${user().base.name} is confused...`, snapshot: snap() });
      if (rng() < 0.4) {
        const self = Math.max(1, Math.round(8 + rng() * 8));
        state[userKey] = { ...user(), hp: Math.max(0, user().hp - self) };
        events.push({ text: `It hurt itself in confusion! (${self} dmg)`, snapshot: snap(), sfx: "hit" });
        return { events, fainted: state[userKey].hp <= 0 ? userKey : foe().hp <= 0 ? foeKey : null };
      }
    }
  }

  events.push({ text: `${user().base.name} used ${move.name}!`, snapshot: snap(), sfx: `cat:${user().base.id}` });

  if (rng() * 100 > move.acc) {
    events.push({ text: `But it missed!`, snapshot: snap() });
    return { events, fainted: null };
  }

  if (move.power > 0) {
    const hits = move.fx.multi ? 2 + Math.floor(rng() * 3) : 1;
    let total = 0;
    let anyCrit = false;
    for (let i = 0; i < hits; i++) {
      if (foe().hp <= 0) break;
      const { dmg, crit } = calcDamage(user(), foe(), move.power, rng);
      anyCrit = anyCrit || crit;
      total += dmg;
      state[foeKey] = { ...foe(), hp: Math.max(0, foe().hp - dmg) };
    }
    if (move.fx.multi) {
      events.push({ text: `Hit ${hits} time${hits > 1 ? "s" : ""}! (${total} dmg)`, snapshot: snap(), sfx: "hit", shake: foeKey });
    } else {
      events.push({
        text: `${anyCrit ? "Critical hit! " : ""}It dealt ${total} damage!`,
        snapshot: snap(),
        sfx: "hit",
        shake: foeKey,
      });
    }
    if (move.fx.recoil && total > 0 && user().hp > 0) {
      const rec = Math.max(1, Math.round(total * move.fx.recoil));
      state[userKey] = { ...user(), hp: Math.max(0, user().hp - rec) };
      events.push({ text: `${user().base.name} took ${rec} recoil damage!`, snapshot: snap(), sfx: "hit", shake: userKey });
    }
  }

  const fx = move.fx;
  if (fx.confuse && foe().hp > 0 && rng() < fx.confuse) {
    if (foe().confusedTurns > 0) {
      if (fx.confuse === 1.0) events.push({ text: `${foe().base.name} is already confused!`, snapshot: snap() });
    } else {
      state[foeKey] = { ...foe(), confusedTurns: 2 + Math.floor(rng() * 3) };
      events.push({ text: `${foe().base.name} became confused!`, snapshot: snap(), sfx: "status" });
    }
  }
  if (fx.foeAtkDown && foe().hp > 0 && rng() < fx.foeAtkDown) {
    if (foe().atkStage > -2) {
      state[foeKey] = { ...foe(), atkStage: foe().atkStage - 1 };
      events.push({ text: `${foe().base.name}'s ATK fell!`, snapshot: snap(), sfx: "status" });
    }
  }
  if (fx.atkUp) {
    if (user().atkStage < 2) {
      state[userKey] = { ...user(), atkStage: user().atkStage + 1 };
      events.push({ text: `${user().base.name}'s ATK rose!`, snapshot: snap(), sfx: "buff" });
    } else {
      events.push({ text: `${user().base.name}'s ATK can't go higher!`, snapshot: snap() });
    }
  }
  if (fx.defUp) {
    if (user().defStage < 2) {
      state[userKey] = { ...user(), defStage: user().defStage + 1 };
      events.push({ text: `${user().base.name}'s DEF rose!`, snapshot: snap(), sfx: "buff" });
    } else {
      events.push({ text: `${user().base.name}'s DEF can't go higher!`, snapshot: snap() });
    }
  }
  if (fx.heal) {
    if (user().healsLeft <= 0) {
      events.push({ text: `But there's nothing left to eat!`, snapshot: snap() });
    } else {
      const amt = Math.round(user().maxHp * fx.heal);
      const healed = Math.min(amt, user().maxHp - user().hp);
      if (healed > 0) {
        state[userKey] = { ...user(), hp: user().hp + healed, healsLeft: user().healsLeft - 1 };
        events.push({ text: `${user().base.name} restored ${healed} HP!`, snapshot: snap(), sfx: "heal" });
      } else {
        events.push({ text: `But its HP is already full!`, snapshot: snap() });
      }
    }
  }

  const fainted = state.enemy.hp <= 0 ? "enemy" : state.player.hp <= 0 ? "player" : null;
  return { events, fainted };
}

function enemyPickMove(enemy, rng) {
  const moves = enemy.base.moves;
  const healMove = moves.find((m) => m.fx.heal);
  if (healMove && enemy.healsLeft > 0 && enemy.hp < enemy.maxHp * 0.35 && rng() < 0.7) return healMove;
  const pool = [];
  for (const m of moves) {
    if (m.fx.heal && enemy.healsLeft <= 0) continue;
    const w = m.power > 0 ? 3 : 1;
    for (let i = 0; i < w; i++) pool.push(m);
  }
  return pool[Math.floor(rng() * pool.length)];
}

function buildRound(playerF, enemyF, playerMove, rng) {
  const state = { player: { ...playerF }, enemy: { ...enemyF } };
  const enemyMove = enemyPickMove(state.enemy, rng);
  const pSpd = state.player.base.stats.spd;
  const eSpd = state.enemy.base.stats.spd;
  const playerFirst = pSpd === eSpd ? rng() < 0.5 : pSpd > eSpd;

  const order = playerFirst
    ? [["player", "enemy", playerMove], ["enemy", "player", enemyMove]]
    : [["enemy", "player", enemyMove], ["player", "enemy", playerMove]];

  const events = [];
  let outcome = null;
  for (const [u, f, mv] of order) {
    if (state[u].hp <= 0) continue;
    const res = useMove(state, u, f, mv, rng);
    events.push(...res.events);
    if (res.fainted) {
      const faintedF = state[res.fainted];
      events.push({
        text: `${faintedF.base.name} fainted!`,
        snapshot: { player: { ...state.player }, enemy: { ...state.enemy } },
        sfx: "faint",
        faint: res.fainted,
      });
      outcome = res.fainted === "enemy" ? "win" : "lose";
      break;
    }
  }
  return { events, outcome };
}

/* ---------- sfx (real audio + chiptune fallback) ---------- */

// each cat has multiple clips — one is picked at random per move
const CAT_SOUNDS = {
  huh:    ["sounds/huh-1.mp3", "sounds/huh-2.mp3", "sounds/huh-3-long.mp3"].map(asset),
  maxwell: ["sounds/Maxwell-1.mp3", "sounds/Maxwell-2.mp3"].map(asset),
  oiia:   ["sounds/oiia-oiia-1.mp3", "sounds/oiia-oiia-2.mp3"].map(asset),
  banana: ["sounds/happy-cat-1.mp3", "sounds/happy-cat-2.mp3"].map(asset),
  quaso:  ["sounds/quaso-1.mp3"].map(asset),
};

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

function InfoBox({ f, showNum, align }) {
  return (
    <div className={`infobox ${align}`}>
      <div className="infobox-top">
        <span className="fighter-name">{f.base.name}</span>
      </div>
      <HpBar hp={f.hp} maxHp={f.maxHp} />
      {showNum && <div className="hp-num">{f.hp}/{f.maxHp}</div>}
      <StatusRow f={f} />
    </div>
  );
}

/* ---------- main app ---------- */

export default function CatemonBattle() {
  const [screen, setScreen] = useState("title");
  const [playerF, setPlayerF] = useState(null);
  const [enemyF, setEnemyF] = useState(null);
  const [queue, setQueue] = useState([]);
  const [current, setCurrent] = useState(null);
  const [phase, setPhase] = useState("intro");
  const [outcome, setOutcome] = useState(null);
  const [shake, setShake] = useState(null);
  const [fainting, setFainting] = useState(null);
  const [muted, setMuted] = useState(false);
  const { play, mutedRef, catAudioRef } = useSfx();
  const rng = Math.random;

  useEffect(() => {
    mutedRef.current = muted;
    if (muted && catAudioRef.current) {
      catAudioRef.current.pause();
      catAudioRef.current.currentTime = 0;
    }
  }, [muted, mutedRef, catAudioRef]);

  const startBattle = (catId) => {
    const p = newFighter(catId);
    const others = CAT_IDS.filter((c) => c !== catId);
    const e = newFighter(others[Math.floor(Math.random() * others.length)]);
    setPlayerF(p);
    setEnemyF(e);
    setOutcome(null);
    setFainting(null);
    setQueue([]);
    setCurrent({ text: `A wild ${e.base.name} appeared!` });
    setPhase("intro");
    setScreen("battle");
    play("start");
  };

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
        setScreen("over");
      } else {
        setPhase("command");
        setCurrent({ text: `What will ${playerF?.base.name ?? "your cat"} do?` });
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
      setCurrent({ text: `What will ${playerF.base.name} do?` });
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

  /* ---------- screens ---------- */

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
      .fighter-name { font-size: 9px; color: #24261e; }
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
        gap: 20px; background: #2a2c3a; }
      .title-logo { font-size: 24px; color: #f6c860; text-shadow: 3px 3px 0 #b05a2a, 6px 6px 0 #14151c; letter-spacing: 2px; }
      .title-sub { font-size: 8px; color: #a8acc4; line-height: 1.9; text-align: center; padding: 0 20px; }
      .spinwrap { animation: spin3d 1.6s linear infinite; }
      @keyframes spin3d { from { transform: rotateY(0deg);} to { transform: rotateY(360deg);} }
      @media (prefers-reduced-motion: reduce) { .spinwrap, .continue { animation: none; } }
      .bigbtn { font-family: inherit; font-size: 11px; padding: 14px 22px; background: #f6c860; color: #34220a;
        border: 3px solid #14151c; border-radius: 8px; box-shadow: 0 4px 0 #b05a2a; cursor: pointer; }
      .bigbtn:active { transform: translateY(3px); box-shadow: 0 1px 0 #b05a2a; }
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
    `}</style>
  );

  let inner;

  if (screen === "title") {
    inner = (
      <div className="title-screen">
        <div className="spinwrap">
          <CatPhoto id="oiia" size={90} />
        </div>
        <div className="title-logo">CATÉMON</div>
        <div className="title-sub">MEME CAT BATTLE<br />HUH · MAXWELL · OIIA · QUASO · BANANA</div>
        <button className="bigbtn" onClick={() => { setScreen("select"); play("select"); }}>PRESS START</button>
      </div>
    );
  } else if (screen === "select") {
    inner = (
      <div className="select-screen">
        <div className="select-title">CHOOSE YOUR CAT</div>
        <div className="catgrid">
          {CAT_IDS.map((id) => {
            const c = CATS[id];
            return (
              <button key={id} className="catcard" onClick={() => startBattle(id)}>
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
  } else if (screen === "over") {
    const won = outcome === "win";
    inner = (
      <div className="over-screen">
        <CatPhoto id={won ? playerF.base.id : enemyF.base.id} size={80} />
        <div className="over-title">
          {won ? "YOU WIN!" : "YOU LOST..."}
          <br />
          <span style={{ fontSize: 9, color: "#a8acc4" }}>
            {won ? `${playerF.base.name} is victorious!` : `${enemyF.base.name} was too powerful.`}
          </span>
        </div>
        <button className="bigbtn" onClick={() => { setScreen("select"); play("select"); }}>REMATCH</button>
      </div>
    );
  } else {
    const showMoves = phase === "command";
    inner = (
      <>
        <div className="arena">
          <div className="platform plat-enemy" />
          <div className="platform plat-player" />
          <InfoBox f={enemyF} showNum={false} align="enemy" />
          <InfoBox f={playerF} showNum={true} align="player" />
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
              <div className="msg" style={{ marginBottom: 8 }}>What will {playerF.base.name} do?</div>
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
          <span className="cb-brand">CATÉMON v1.0</span>
          <button className="cb-mute" onClick={() => setMuted((m) => !m)}>{muted ? "SOUND: OFF" : "SOUND: ON"}</button>
        </div>
        <div className="screen">{inner}</div>
      </div>
    </div>
  );
}
