"""Engine-independent logic and package validation. Requires lupa; not a Studio test."""
from pathlib import Path
import xml.etree.ElementTree as ET
import wave
from lupa import LuaRuntime
ROOT=Path(__file__).resolve().parents[1]
lua=LuaRuntime(unpack_returned_tuples=True)
for p in (ROOT/'src').rglob('*.lua'):
    lua.execute('assert(load(...))',p.read_text())
r=lua.execute((ROOT/'src/Shared/Rules.lua').read_text())
c=lua.execute((ROOT/'src/Shared/Config.lua').read_text())
def running():
    s=r.new();r.respawn(s);return s
cases=0
def check(condition):
    global cases
    assert condition
    cases+=1
s=running();check(r.hit(s,1));check(s.hits==1 and s.mode=='running');check(not r.hit(s,1));check(r.hit(s,2) and s.mode=='dead')
s.supplies=4;s.insight=True;s.knowledge=12;r.respawn(s)
check(s.distance==0 and s.hits==0 and s.supplies==4 and s.insight and s.knowledge==12)
check(r.collect(s,10) and not r.collect(s,10) and s.supplies==5)
for _ in range(5):r.input(s,'left',c)
check(s.lane==-1);check(not r.input(s,'teleport',c))
r.input(s,'jump',c);check(not r.input(s,'slide',c));s.jump=c.JumpDuration/2;check(abs(r.height(s,c)-c.JumpHeight)<.001)
s.mode='paused';d=s.distance;r.step(s,.05,c,lua.table(),lua.table());check(s.distance==d and not r.input(s,'jump',c))
s.mode='story';check(not r.answer(s,2));check(r.answer(s,1) and s.knowledge==12);s.mode='story';r.answer(s,1);check(s.knowledge==12)
s=running();s.distance=179;r.step(s,.05,c,lua.table(),lua.table());check(s.mode=='story')
s=running();s.storySeen=True;s.insight=True;s.supplies=8;s.distance=899;r.step(s,.05,c,lua.table(),lua.table());check(s.mode=='complete' and s.wins==1)
r.step(s,.05,c,lua.table(),lua.table());check(s.wins==1)
s=running();s.storySeen=True;s.distance=899;r.step(s,.05,c,lua.table(),lua.table());check(s.mode=='return')
s=running();r.step(s,100,c,lua.table(),lua.table());check(s.distance<=c.Speed*.05)
s=running();s.distance=48;s.jump=c.JumpDuration/2
obs=lua.table_from([lua.table_from({'id':1,'d':50,'lane':0,'kind':'jump'})])
r.step(s,.05,c,obs,lua.table());check(s.hits==0)
s=running();s.distance=48;r.step(s,.05,c,obs,lua.table());check(s.hits==1)
s=running();s.x=7;s.lane=1;s.distance=48;r.step(s,.05,c,obs,lua.table());check(s.hits==0)
xml=ET.parse(ROOT/'SapiensForest.rbxlx')
check(len(xml.findall('.//ProtectedString'))==5)
for source in xml.findall('.//ProtectedString'):lua.execute('assert(load(...))',source.text)
for p in (ROOT/'assets').glob('*.wav'):
    with wave.open(str(p)) as wav:check(wav.getframerate()==22050 and wav.getnframes()>0)
print(f'{cases} assertions passed; 5 scripts parse; place XML and WAVs validated. Roblox engine execution NOT tested.')
