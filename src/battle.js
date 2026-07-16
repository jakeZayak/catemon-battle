import { CATS, familyMul } from "./cats.js";

/* ---------- battle math ---------- */

const stageMul = (s) => (s >= 0 ? (2 + s) / 2 : 2 / (2 - s));

// +6% to all stats per level above 1
export const levelMul = (level) => 1 + 0.06 * (level - 1);

function calcDamage(attacker, defender, power, rng) {
  const atk = attacker.stats.atk * stageMul(attacker.atkStage);
  const def = defender.stats.def * stageMul(defender.defStage);
  const variance = 0.85 + rng() * 0.15;
  const crit = rng() < 1 / 16;
  const eff = familyMul(attacker.base.family, defender.base.family);
  let dmg = ((power * (atk / def)) / 2.1) * variance * (crit ? 1.5 : 1) * eff;
  return { dmg: Math.max(1, Math.round(dmg)), crit, eff };
}

/* opts: { level, bonuses: {hp,atk,def,spd}, hp, healsLeft, name, extraMoves, statScale } — all
   optional. Quick Battle passes nothing and gets a plain level-1 fighter.
   statScale < 1 handicaps enemies so the player always has a slight edge. */
export function newFighter(catId, opts = {}) {
  const base = CATS[catId];
  const level = opts.level ?? 1;
  const bonuses = opts.bonuses ?? {};
  const mul = levelMul(level) * (opts.statScale ?? 1);
  const stats = {
    hp: Math.round(base.stats.hp * mul) + (bonuses.hp ?? 0),
    atk: Math.round(base.stats.atk * mul) + (bonuses.atk ?? 0),
    def: Math.round(base.stats.def * mul) + (bonuses.def ?? 0),
    spd: Math.round(base.stats.spd * mul) + (bonuses.spd ?? 0),
  };
  return {
    base,
    level,
    stats,
    name: opts.name ?? base.name,
    moves: [...base.moves, ...(opts.extraMoves ?? [])],
    hp: Math.min(opts.hp ?? stats.hp, stats.hp),
    maxHp: stats.hp,
    atkStage: 0,
    defStage: 0,
    spdStage: 0,
    confusedTurns: 0,
    reflect: false,
    healsLeft: opts.healsLeft ?? 2,
  };
}

function useMove(state, userKey, foeKey, move, rng) {
  const events = [];
  const snap = () => ({
    player: { ...state.player },
    enemy: { ...state.enemy },
  });
  const user = () => state[userKey];

  // Items never fumble to confusion — kinder for younger players
  if (user().confusedTurns > 0 && !move.item) {
    state[userKey] = { ...user(), confusedTurns: user().confusedTurns - 1 };
    if (state[userKey].confusedTurns === 0) {
      events.push({ text: `${user().name} snapped out of confusion!`, snapshot: snap() });
    } else {
      events.push({ text: `${user().name} is confused...`, snapshot: snap() });
      if (rng() < 0.25) {
        const self = Math.max(1, Math.round(6 + rng() * 6));
        state[userKey] = { ...user(), hp: Math.max(0, user().hp - self) };
        events.push({ text: `It hurt itself in confusion! (${self} dmg)`, snapshot: snap(), sfx: "hit", shake: userKey });
        return { events, fainted: state[userKey].hp <= 0 ? userKey : state[foeKey].hp <= 0 ? foeKey : null };
      }
    }
  }

  events.push({
    text: move.item ? `${user().name} used a ${move.name}!` : `${user().name} used ${move.name}!`,
    snapshot: snap(),
    sfx: move.sound ?? (move.item ? "select" : `cat:${user().base.id}`),
    spin: move.fx.heliSpin ? userKey : undefined,
    lunge: move.power > 0 && !move.fx.heliSpin && !move.fx.overlay ? userKey : undefined,
    overlay: move.fx.overlay,
    overlayFrom: move.fx.overlay ? userKey : undefined,
  });

  if (rng() * 100 > move.acc) {
    events.push({ text: `But it missed!`, snapshot: snap() });
    return { events, fainted: null };
  }

  // UNO REVERSE: raise the shield and wait
  if (move.fx.reverse) {
    state[userKey] = { ...user(), reflect: true };
    events.push({ text: `${user().name} holds up the card...`, snapshot: snap(), sfx: "status", uno: userKey });
    return { events, fainted: null };
  }

  // If the defender has UNO REVERSE up, the move targets its own user
  // (items are self-targeted and can't be bounced)
  let tgt = foeKey;
  if (state[foeKey].reflect && userKey !== foeKey && !move.item) {
    state[foeKey] = { ...state[foeKey], reflect: false };
    events.push({ text: `UNO REVERSE! The move bounces back!`, snapshot: snap(), sfx: "status", uno: foeKey });
    tgt = userKey;
  }
  const foe = () => state[tgt];

  if (move.power > 0) {
    const hits = move.fx.multi ? 2 + Math.floor(rng() * 3) : 1;
    let total = 0;
    let anyCrit = false;
    let eff = 1;
    for (let i = 0; i < hits; i++) {
      if (foe().hp <= 0) break;
      const res = calcDamage(user(), foe(), move.power, rng);
      anyCrit = anyCrit || res.crit;
      eff = res.eff;
      total += res.dmg;
      state[tgt] = { ...foe(), hp: Math.max(0, foe().hp - res.dmg) };
    }
    if (move.fx.multi) {
      events.push({ text: `Hit ${hits} time${hits > 1 ? "s" : ""}! (${total} dmg)`, snapshot: snap(), sfx: "hit", shake: tgt });
    } else {
      events.push({
        text: `${anyCrit ? "Critical hit! " : ""}It dealt ${total} damage!`,
        snapshot: snap(),
        sfx: "hit",
        shake: tgt,
      });
    }
    if (eff > 1) events.push({ text: `It's super effective!`, snapshot: snap(), sfx: "buff" });
    else if (eff < 1) events.push({ text: `It's not very effective...`, snapshot: snap() });
    if (move.fx.recoil && total > 0 && user().hp > 0 && tgt !== userKey) {
      const rec = Math.max(1, Math.round(total * move.fx.recoil));
      state[userKey] = { ...user(), hp: Math.max(0, user().hp - rec) };
      events.push({ text: `${user().name} took ${rec} recoil damage!`, snapshot: snap(), sfx: "hit", shake: userKey });
    }
  }

  const fx = move.fx;
  if (fx.confuse && foe().hp > 0 && rng() < fx.confuse) {
    if (foe().confusedTurns > 0) {
      if (fx.confuse === 1.0) events.push({ text: `${foe().name} is already confused!`, snapshot: snap() });
    } else {
      state[tgt] = { ...foe(), confusedTurns: 1 + Math.floor(rng() * 2) };
      events.push({ text: `${foe().name} became confused!`, snapshot: snap(), sfx: "status", wobble: tgt });
    }
  }
  if (fx.foeAtkDown && foe().hp > 0 && rng() < fx.foeAtkDown) {
    if (foe().atkStage > -2) {
      state[tgt] = { ...foe(), atkStage: foe().atkStage - 1 };
      events.push({ text: `${foe().name}'s ATK fell!`, snapshot: snap(), sfx: "status", debuff: tgt });
    }
  }
  if (fx.atkUp) {
    if (user().atkStage < 2) {
      state[userKey] = { ...user(), atkStage: user().atkStage + 1 };
      events.push({ text: `${user().name}'s ATK rose!`, snapshot: snap(), sfx: "buff", buffAnim: userKey });
    } else {
      events.push({ text: `${user().name}'s ATK can't go higher!`, snapshot: snap() });
    }
  }
  if (fx.defUp) {
    if (user().defStage < 2) {
      state[userKey] = { ...user(), defStage: user().defStage + 1 };
      events.push({ text: `${user().name}'s DEF rose!`, snapshot: snap(), sfx: "buff", buffAnim: userKey });
    } else {
      events.push({ text: `${user().name}'s DEF can't go higher!`, snapshot: snap() });
    }
  }
  if (fx.spdUp) {
    if (user().spdStage < 2) {
      state[userKey] = { ...user(), spdStage: user().spdStage + 1 };
      events.push({ text: `${user().name}'s SPD rose!`, snapshot: snap(), sfx: "buff", buffAnim: userKey });
    } else {
      events.push({ text: `${user().name}'s SPD can't go higher!`, snapshot: snap() });
    }
  }
  if (fx.cureConfuse && user().confusedTurns > 0) {
    state[userKey] = { ...user(), confusedTurns: 0 };
    events.push({ text: `${user().name} snapped out of confusion!`, snapshot: snap(), sfx: "status", healAnim: userKey });
  }
  if (fx.heal) {
    if (!move.item && user().healsLeft <= 0) {
      events.push({ text: `But there's nothing left to eat!`, snapshot: snap() });
    } else {
      const amt = Math.round(user().maxHp * fx.heal);
      const healed = Math.min(amt, user().maxHp - user().hp);
      if (healed > 0) {
        state[userKey] = {
          ...user(),
          hp: user().hp + healed,
          healsLeft: move.item ? user().healsLeft : user().healsLeft - 1,
        };
        events.push({ text: `${user().name} restored ${healed} HP!`, snapshot: snap(), sfx: "heal", healAnim: userKey });
      } else {
        events.push({ text: `But its HP is already full!`, snapshot: snap() });
      }
    }
  }

  const fainted = state.enemy.hp <= 0 ? "enemy" : state.player.hp <= 0 ? "player" : null;
  return { events, fainted };
}

function enemyPickMove(enemy, rng) {
  const moves = enemy.moves;
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

export function buildRound(playerF, enemyF, playerMove, rng) {
  const state = {
    player: { ...playerF, reflect: false },
    enemy: { ...enemyF, reflect: false },
  };
  const enemyMove = enemyPickMove(state.enemy, rng);

  // priority tiers: items (2) beat priority moves like UNO REVERSE (1) beat normal (0)
  const prio = (m) => (m.item ? 2 : m.fx.priority ? 1 : 0);
  const pPrio = prio(playerMove);
  const ePrio = prio(enemyMove);
  let playerFirst;
  if (pPrio !== ePrio) playerFirst = pPrio > ePrio;
  else {
    const pSpd = state.player.stats.spd * stageMul(state.player.spdStage);
    const eSpd = state.enemy.stats.spd * stageMul(state.enemy.spdStage);
    playerFirst = pSpd === eSpd ? rng() < 0.5 : pSpd > eSpd;
  }

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
        text: `${faintedF.name} fainted!`,
        snapshot: { player: { ...state.player }, enemy: { ...state.enemy } },
        sfx: res.fainted === "player" ? "lose" : "faint",
        faint: res.fainted,
      });
      outcome = res.fainted === "enemy" ? "win" : "lose";
      break;
    }
  }
  return { events, outcome };
}
