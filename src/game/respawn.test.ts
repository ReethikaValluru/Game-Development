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

test('tutorial has the same two-hit rule',()=>{
 let respawns=0;
 const w:any=Object.create(World3D.prototype);
 Object.assign(w,{tutorialMode:true,isPaused:false,activePowerUp:null,bumpCount:0,playerGroup:{rotation:{z:0}},callbacks:{onRespawn:()=>respawns++}});
 w.handleObstacleHit();w.handleObstacleHit();assert.equal(respawns,1);
});
test('chapter scenery creates distinct farm and observatory structures',()=>{
 const w:any=Object.create(World3D.prototype);
 const farm:any={children:[],add(o:any){this.children.push(o);}};
 const science:any={children:[],add(o:any){this.children.push(o);}};
 w.currentEra='agricultural';w.addChapterSettlement(farm);
 w.currentEra='scientific';w.addChapterSettlement(science);
 assert.equal(farm.children.length,6);assert.equal(science.children.length,6);
 assert.ok(farm.children.every((g:any)=>g.children.some((m:any)=>m.isInstancedMesh)));
 assert.ok(science.children.every((g:any)=>!g.children.some((m:any)=>m.isInstancedMesh)));
 assert.ok(science.children.some((g:any)=>g.children.some((m:any)=>m.geometry.type==='TorusGeometry')));
 for(const group of [...farm.children,...science.children])w.releaseObject(group);
});
