import { CATS } from "./cats.js";

/* ---------- battle math ---------- */

const stageMul = (s) => (s >= 0 ? (2 + s) / 2 : 2 / (2 - s));

// +6% to all stats per level above 1
export const levelMul = (level) => 1 + 0.06 * (level - 1);

function calcDamage(attacker, defender, power, rng) {
  const atk = attacker.stats.atk * stageMul(attacker.atkStage);
  const def = defender.stats.def * stageMul(defender.defStage);
  const variance = 0.85 + rng() * 0.15;
  const crit = rng() < 1 / 16;
  let dmg = ((power * (atk / def)) / 2.1) * variance * (crit ? 1.5 : 1);
  return { dmg: Math.max(1, Math.round(dmg)), crit };
}

/* opts: { level, bonuses: {hp,atk,def,spd}, hp, healsLeft, name } — all optional.
   Quick Battle passes nothing and gets a plain level-1 fighter. */
export function newFighter(catId, opts = {}) {
  const base = CATS[catId];
  const level = opts.level ?? 1;
  const bonuses = opts.bonuses ?? {};
  const mul = levelMul(level);
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
    hp: Math.min(opts.hp ?? stats.hp, stats.hp),
    maxHp: stats.hp,
    atkStage: 0,
    defStage: 0,
    confusedTurns: 0,
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
  const foe = () => state[foeKey];

  if (user().confusedTurns > 0) {
    state[userKey] = { ...user(), confusedTurns: user().confusedTurns - 1 };
    if (state[userKey].confusedTurns === 0) {
      events.push({ text: `${user().name} snapped out of confusion!`, snapshot: snap() });
    } else {
      events.push({ text: `${user().name} is confused...`, snapshot: snap() });
      if (rng() < 0.4) {
        const self = Math.max(1, Math.round(8 + rng() * 8));
        state[userKey] = { ...user(), hp: Math.max(0, user().hp - self) };
        events.push({ text: `It hurt itself in confusion! (${self} dmg)`, snapshot: snap(), sfx: "hit" });
        return { events, fainted: state[userKey].hp <= 0 ? userKey : foe().hp <= 0 ? foeKey : null };
      }
    }
  }

  events.push({ text: `${user().name} used ${move.name}!`, snapshot: snap(), sfx: `cat:${user().base.id}` });

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
      events.push({ text: `${user().name} took ${rec} recoil damage!`, snapshot: snap(), sfx: "hit", shake: userKey });
    }
  }

  const fx = move.fx;
  if (fx.confuse && foe().hp > 0 && rng() < fx.confuse) {
    if (foe().confusedTurns > 0) {
      if (fx.confuse === 1.0) events.push({ text: `${foe().name} is already confused!`, snapshot: snap() });
    } else {
      state[foeKey] = { ...foe(), confusedTurns: 2 + Math.floor(rng() * 3) };
      events.push({ text: `${foe().name} became confused!`, snapshot: snap(), sfx: "status" });
    }
  }
  if (fx.foeAtkDown && foe().hp > 0 && rng() < fx.foeAtkDown) {
    if (foe().atkStage > -2) {
      state[foeKey] = { ...foe(), atkStage: foe().atkStage - 1 };
      events.push({ text: `${foe().name}'s ATK fell!`, snapshot: snap(), sfx: "status" });
    }
  }
  if (fx.atkUp) {
    if (user().atkStage < 2) {
      state[userKey] = { ...user(), atkStage: user().atkStage + 1 };
      events.push({ text: `${user().name}'s ATK rose!`, snapshot: snap(), sfx: "buff" });
    } else {
      events.push({ text: `${user().name}'s ATK can't go higher!`, snapshot: snap() });
    }
  }
  if (fx.defUp) {
    if (user().defStage < 2) {
      state[userKey] = { ...user(), defStage: user().defStage + 1 };
      events.push({ text: `${user().name}'s DEF rose!`, snapshot: snap(), sfx: "buff" });
    } else {
      events.push({ text: `${user().name}'s DEF can't go higher!`, snapshot: snap() });
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
        events.push({ text: `${user().name} restored ${healed} HP!`, snapshot: snap(), sfx: "heal" });
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

export function buildRound(playerF, enemyF, playerMove, rng) {
  const state = { player: { ...playerF }, enemy: { ...enemyF } };
  const enemyMove = enemyPickMove(state.enemy, rng);
  const pSpd = state.player.stats.spd;
  const eSpd = state.enemy.stats.spd;
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
        text: `${faintedF.name} fainted!`,
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
