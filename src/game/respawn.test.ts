import test from 'node:test';
import assert from 'node:assert/strict';
import {World3D} from './scene/world3d';
test('two physical obstacle impacts freeze the world and request exactly one respawn',()=>{
 const events:string[]=[];
 const w:any=Object.create(World3D.prototype);
 Object.assign(w,{tutorialMode:false,isPaused:false,activePowerUp:'shield',powerUpTimeLeft:3,shieldMesh:null,bumpCount:0,playerGroup:{rotation:{z:0}},callbacks:{onObstacleHit:(shielded:boolean)=>events.push(shielded?'shield':'hit'),onRespawn:()=>events.push('respawn')}});
 w.handleObstacleHit();assert.equal(w.bumpCount,1);assert.equal(w.isPaused,false);
 w.handleObstacleHit();assert.equal(w.bumpCount,2);assert.equal(w.isPaused,true);assert.equal(w.playerGroup.rotation.z,Math.PI/2);
 w.handleObstacleHit();assert.deepEqual(events,['shield','hit','respawn']);
});
