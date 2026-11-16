import test from "node:test";
import assert from "node:assert/strict";
import { parseSave } from "./save";
import { newCampaign } from "./campaign";
test("save schema rejects invented IDs, invalid tutorial steps and nonfinite resources", () => {
  for (const mutate of [
    (s: any) => (s.techIds = ["invented"]),
    (s: any) => (s.tutorialStep = 7),
    (s: any) => (s.stats.currentLane = 99),
    (s: any) => (s.resources.population = null),
  ]) {
    const c = newCampaign();
    mutate(c);
    assert.equal(
      parseSave(
        JSON.stringify({
          version: 1,
          savedAt: new Date().toISOString(),
          campaign: c,
        }),
      ),
      null,
    );
  }
});
