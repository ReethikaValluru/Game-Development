import test from "node:test";
import assert from "node:assert/strict";
import {
  campaignReducer as reduce,
  newCampaign,
  objectives,
  CHAPTERS,
  ERAS,
} from "./campaign";
import { HISTORICAL_DILEMMAS } from "./rules";
import { loadCheckpoint, saveCheckpoint, parseSave, SAVE_KEY } from "./save";

test("decisions and technologies cannot be farmed or overspent", () => {
  let s = newCampaign();
  const d = HISTORICAL_DILEMMAS.find((d) => d.era === "cognitive")!;
  s = reduce(s, { type: "decision", id: d.id, choice: d.choices[0].id });
  assert.equal(
    reduce(s, { type: "decision", id: d.id, choice: d.choices[1].id }),
    s,
  );
  assert.equal(
    reduce(newCampaign(), { type: "research", id: "shared_fiction" }).resources
      .knowledge,
    15,
  );
  s = { ...s, resources: { ...s.resources, knowledge: 100, mythPower: 100 } };
  s = reduce(s, { type: "research", id: "shared_fiction" });
  const paid = s.resources.knowledge;
  s = reduce(s, { type: "research", id: "shared_fiction" });
  assert.equal(s.resources.knowledge, paid);
  assert.equal(reduce(s, { type: "research", id: "scientific_method" }), s);
});
test("seasons advance on active time only and early manual requests give no reward", () => {
  let s = newCampaign();
  assert.equal(reduce(s, { type: "season" }), s);
  for (let i = 0; i < 60; i++)
    s = reduce(s, { type: "tick", dt: 1, distance: i, snapshot: {} });
  assert.equal(s.season, 2);
  assert.equal(s.elapsed, 60);
  assert.ok(s.resources.calories < 400);
});
test("each chapter is completable in five active minutes by a deterministic path", () => {
  for (const era of ERAS) {
    let s = newCampaign(era);
    for (const d of HISTORICAL_DILEMMAS.filter((d) => d.era === era).slice(
      0,
      2,
    ))
      s = reduce(s, { type: "decision", id: d.id, choice: d.choices[0].id });
    for (let i = 0; i < 300; i++) {
      if (i % 3 === 0)
        s = reduce(s, {
          type: "pickup",
          kind: i % 2 === 0 ? "ivory" : "amber",
        });
      if (i % 9 === 0) s = reduce(s, { type: "pickup", kind: "berries" });
      s = reduce(s, { type: "research", id: CHAPTERS[era].technology });
      s = reduce(s, { type: "tick", dt: 1, distance: i * 12, snapshot: {} });
    }
    assert.ok(
      objectives(s).every((o) => o.done),
      JSON.stringify({ era, objectives: objectives(s) }),
    );
    assert.equal(s.status, "victory");
  }
});
test("tutorial follows lane, jump, slide and collection; combo rewards are capped", () => {
  let s = newCampaign();
  for (const type of ["lane", "jump", "slide"] as const)
    s = reduce(s, { type });
  s = reduce(s, { type: "pickup", kind: "amber" });
  assert.equal(s.tutorialStep, 4);
  s = { ...s, stats: { ...s.stats, comboStreak: 10000 } };
  const before = s.resources.calories;
  s = reduce(s, { type: "pickup", kind: "amber" });
  assert.equal(s.resources.calories - before, 40);
});
test("famine reaches a recoverable game-over screen", () => {
  let s = newCampaign();
  s = { ...s, resources: { ...s.resources, calories: 0, population: 8 } };
  s = reduce(s, { type: "tick", dt: 1, distance: 0, snapshot: {} });
  assert.equal(s.status, "gameover");
  assert.equal(reduce(s, { type: "pickup", kind: "berries" }), s);
  assert.equal(newCampaign().status, "playing");
});
test("checkpoint round-trip restores progress and clears unsafe world transients", () => {
  const data = new Map<string, string>();
  const storage = {
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => {
      data.set(k, v);
    },
    removeItem: (k: string) => {
      data.delete(k);
    },
  };
  const s = newCampaign("agricultural", "mountain_pass");
  s.stats.activePowerUp = "surge";
  s.stats.powerUpTimeLeft = 5;
  s.stats.currentLane = -1;
  s.stats.distanceTraveled = 100;
  assert.equal(saveCheckpoint(storage, s), null);
  const result = loadCheckpoint(storage).checkpoint!;
  assert.equal(result.campaign.era, "agricultural");
  assert.equal(result.campaign.stats.distanceTraveled, 100);
  assert.equal(result.campaign.stats.activePowerUp, null);
  assert.equal(result.campaign.stats.currentLane, 0);
  const raw = JSON.parse(data.get(SAVE_KEY)!);
  raw.version = 99;
  assert.equal(parseSave(JSON.stringify(raw)), null);
  raw.version = 1;
  raw.campaign.resources.calories = -1;
  assert.equal(parseSave(JSON.stringify(raw)), null);
  assert.equal(parseSave("{broken"), null);
});
test("storage failures are surfaced without crashing gameplay", () => {
  const storage = {
    getItem: () => {
      throw Error("blocked");
    },
    setItem: () => {
      throw Error("quota");
    },
    removeItem: () => {},
  };
  assert.ok(loadCheckpoint(storage).error);
  assert.ok(saveCheckpoint(storage, newCampaign()));
});
