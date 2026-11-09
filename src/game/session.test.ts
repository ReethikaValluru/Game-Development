import test from 'node:test';
import assert from 'node:assert/strict';
import { createControls, createRunStats } from './session';
import { World3D } from './scene/world3d';

// Exercise simulation/input methods without constructing a GPU renderer.
function runner() {
  return Object.assign(Object.create(World3D.prototype), {
    isTitleMode: false, isPaused: false, currentLane: 0,
    isJumping: false, isSliding: false, callbacks: {},
    distanceTraveled: 123, playerZ: -123,
  }) as World3D;
}

test('new runs get independent, complete defaults and the selected landscape', () => {
  const oldRun = createRunStats();
  oldRun.score = 900;
  oldRun.bumpCount = 1;
  oldRun.activePowerUp = 'shield';
  const fresh = createRunStats('mountain_pass');
  assert.equal(fresh.score, 0);
  assert.equal(fresh.bumpCount, 0);
  assert.equal(fresh.maxBumps, 2);
  assert.equal(fresh.activePowerUp, null);
  assert.equal(fresh.activeEvent, null);
  assert.equal(fresh.isRespawning, false);
  assert.equal(fresh.landscape, 'mountain_pass');
});

test('clearing controls releases sprint and every queued input', () => {
  const controls = createControls();
  controls.sprint = true;
  controls.jump = true;
  assert.ok(Object.values(createControls()).every(value => value === false));
});

test('pause freezes simulation and blocks keyboard/touch action entry points', () => {
  const world = runner();
  world.setPaused(true);
  world.shiftLane(1);
  world.triggerJump();
  world.triggerSlide();
  world.update(1, { right: true, sprint: true });
  assert.equal(world.getCurrentLane(), 0);
  assert.equal(world.getDistanceTraveled(), 123);
  assert.equal((world as any).isJumping, false);
  assert.equal((world as any).isSliding, false);
  world.setPaused(false);
  world.shiftLane(1);
  assert.equal(world.getCurrentLane(), 1);
});

test('returning from pause/title mode does not implicitly reset world position', () => {
  const world = runner();
  world.setTitleMode(true);
  world.setTitleMode(false);
  assert.equal(world.getDistanceTraveled(), 123);
  assert.equal(world.getPlayerPosition().z, -123);
});
