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
  DISCOVERY_TECHS
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
