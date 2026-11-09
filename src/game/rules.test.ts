import test from 'node:test';
import assert from 'node:assert/strict';
import {
  INITIAL_RESOURCES,
  calculateDunbarFriction,
  calculateTurnConsumption,
  applyDilemmaEffects,
  canUnlockTech,
  deductTechCost,
  checkVictoryCondition,
  checkDefeatCondition,
  DISCOVERY_TECHS,
  executeHuntMegafauna,
  consecrateImaginedOrder,
  INITIAL_IMAGINED_ORDERS,
  handleBumpCollision,
  getLandscapeEvents,
  applyEventResourcePerks,
} from './rules';

test('Dunbar friction logic: 0 when below limit, positive when above', () => {
  assert.equal(calculateDunbarFriction(100, 150, 20), 0);
  assert.equal(calculateDunbarFriction(150, 150, 20), 0);
  // Above 150 without enough myth power incurs friction
  const frictionLowMyth = calculateDunbarFriction(200, 150, 0);
  assert.ok(frictionLowMyth > 0, 'Excess population should generate friction');
  // High myth power dampens friction
  const frictionHighMyth = calculateDunbarFriction(200, 150, 100);
  assert.ok(frictionHighMyth < frictionLowMyth, 'Myth power should reduce social friction');
});

test('Turn consumption: normal growth on surplus, loss on famine', () => {
  const normalRes = { ...INITIAL_RESOURCES, calories: 500 };
  const turnResult = calculateTurnConsumption(normalRes);
  assert.equal(turnResult.isFamine, false);
  assert.ok(turnResult.consumedCalories > 0);
  assert.ok(turnResult.populationDelta >= 0);

  const starveRes = { ...INITIAL_RESOURCES, calories: 0 };
  const starveResult = calculateTurnConsumption(starveRes);
  assert.equal(starveResult.isFamine, true);
  assert.ok(starveResult.populationDelta < 0, 'Starvation should reduce population');
});

test('applyDilemmaEffects correctly modifies resources and respects floors', () => {
  const updated = applyDilemmaEffects(INITIAL_RESOURCES, {
    population: 20,
    mythPower: 30,
    calories: -50,
  });
  assert.equal(updated.population, INITIAL_RESOURCES.population + 20);
  assert.equal(updated.mythPower, INITIAL_RESOURCES.mythPower + 30);
  assert.equal(updated.calories, INITIAL_RESOURCES.calories - 50);

  // Negative floor check
  const drained = applyDilemmaEffects(INITIAL_RESOURCES, {
    calories: -9999,
  });
  assert.equal(drained.calories, 0);
});

test('Technology unlocking requirements and cost deduction', () => {
  const tech = DISCOVERY_TECHS.find(t => t.id === 'shared_fiction')!;
  const poorRes = { ...INITIAL_RESOURCES, knowledge: 5, mythPower: 5 };
  assert.equal(canUnlockTech(tech, poorRes), false);

  const richRes = { ...INITIAL_RESOURCES, knowledge: 100, mythPower: 100 };
  assert.equal(canUnlockTech(tech, richRes), true);

  const afterDeduct = deductTechCost(tech, richRes);
  assert.equal(afterDeduct.knowledge, 100 - tech.cost.knowledge);
  assert.equal(afterDeduct.mythPower, 100 - (tech.cost.mythPower || 0));
});

test('Victory and defeat conditions', () => {
  assert.equal(checkVictoryCondition([], INITIAL_RESOURCES), false);
  assert.equal(checkVictoryCondition(['scientific_method'], {
    ...INITIAL_RESOURCES,
    population: 350,
    knowledge: 320
  }), true);

  assert.equal(checkDefeatCondition(INITIAL_RESOURCES), false);
  assert.equal(checkDefeatCondition({
    ...INITIAL_RESOURCES,
    population: 2,
    calories: 10
  }), true);
});

test('Megafauna hunt logic: yields calories, decrements count, triggers extinction', () => {
  const initialMegafauna = { count: 1, maxCount: 4, isExtinct: false, extinctionReflected: false };
  const res = { ...INITIAL_RESOURCES, flintAndStone: 50 };

  const huntResult = executeHuntMegafauna(initialMegafauna, res);
  assert.equal(huntResult.success, true);
  assert.equal(huntResult.newMegafauna.count, 0);
  assert.equal(huntResult.newMegafauna.isExtinct, true);
  assert.ok(huntResult.newResources.calories > res.calories);

  // Subsequent hunt on extinct herd fails
  const failedHunt = executeHuntMegafauna(huntResult.newMegafauna, huntResult.newResources);
  assert.equal(failedHunt.success, false);
  assert.ok(failedHunt.message.includes('extinct'));
});

test('Consecrating an imagined order applies Dunbar bonuses and checks costs', () => {
  const poorRes = { ...INITIAL_RESOURCES, mythPower: 5 };
  const failResult = consecrateImaginedOrder(INITIAL_IMAGINED_ORDERS, 'order_lion_man', poorRes);
  assert.equal(failResult.success, false);

  const richRes = { ...INITIAL_RESOURCES, mythPower: 100, dunbarLimit: 150 };
  const successResult = consecrateImaginedOrder(INITIAL_IMAGINED_ORDERS, 'order_lion_man', richRes);
  assert.equal(successResult.success, true);
  assert.equal(successResult.newResources.mythPower, 100 - 40);
  assert.equal(successResult.newResources.dunbarLimit, 150 + 120);
});

test('Bump collision logic: first bump warns, second bump triggers respawn', () => {
  // First bump: increases count to 1, does not respawn
  const firstBump = handleBumpCollision(0, false);
  assert.equal(firstBump.bumped, true);
  assert.equal(firstBump.newBumps, 1);
  assert.equal(firstBump.shouldRespawn, false);

  // Second bump: triggers respawn and resets bumps to 0
  const secondBump = handleBumpCollision(1, false);
  assert.equal(secondBump.bumped, true);
  assert.equal(secondBump.newBumps, 0);
  assert.equal(secondBump.shouldRespawn, true);

  // Invulnerability ignores bump
  const invulnBump = handleBumpCollision(1, true);
  assert.equal(invulnBump.bumped, false);
  assert.equal(invulnBump.newBumps, 1);
  assert.equal(invulnBump.shouldRespawn, false);
});

test('Location-specific dynamic events and perk multipliers', () => {
  const meadowEvents = getLandscapeEvents('river_meadow');
  assert.ok(meadowEvents.some(e => e.type === 'seasonal_rainfall'));
  assert.ok(meadowEvents.some(e => e.type === 'gazelle_migration'));

  const mountainEvents = getLandscapeEvents('mountain_pass');
  assert.ok(mountainEvents.some(e => e.type === 'mammoth_migration'));

  const rainEvent = meadowEvents.find(e => e.type === 'seasonal_rainfall')!;
  rainEvent.active = true;
  const boosted = applyEventResourcePerks(rainEvent, {
    calories: 50,
    knowledge: 20,
    amberMultiplier: 1.0,
  });
  assert.equal(boosted.calories, 100); // 2.0x multiplier
  assert.equal(boosted.knowledge, 30); // 1.5x multiplier
});

