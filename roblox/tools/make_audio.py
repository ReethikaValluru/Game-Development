"""Original synthesized audio, no borrowed samples. Requires numpy."""
from pathlib import Path
import numpy as np
import wave
OUT=Path(__file__).resolve().parents[1]/'assets'
OUT.mkdir(exist_ok=True)
RATE=22050
rng=np.random.default_rng(7301)
def write(name,x):
    x=np.tanh(x);peak=max(.01,np.max(np.abs(x)));x=x/peak*.7
    with wave.open(str(OUT/name),'wb') as w:
        w.setnchannels(1);w.setsampwidth(2);w.setframerate(RATE);w.writeframes((x*32767).astype('<i2').tobytes())
def tone(freq,duration,volume,attack=.1):
    t=np.arange(int(duration*RATE))/RATE
    env=np.minimum(1,t/max(.001,attack))*np.exp(-t/(duration*.4))
    env*=np.minimum(1,(duration-t)/.05)
    return volume*np.sin(2*np.pi*freq*t)*env
def drum():
    t=np.arange(int(.8*RATE))/RATE
    phase=2*np.pi*(38*t+55*.045*(1-np.exp(-t/.045)))
    return .7*np.sin(phase)*np.exp(-t*7)+rng.normal(0,.025,len(t))*np.exp(-t*35)
length=32;mix=np.zeros(length*RATE)
def add(x,start):
    pos=int(start*RATE)
    for i in range(0,len(x),len(mix)):
        chunk=x[i:i+len(mix)];ids=(np.arange(len(chunk))+pos+i)%len(mix);mix[ids]+=chunk
# Periodic drone and restrained asymmetric percussion; seamless periodic base.
t=np.arange(len(mix))/RATE
for f,v in [(58.25,.14),(87.375,.07),(116.5,.035)]:mix+=np.sin(2*np.pi*f*t)*v*(.8+.2*np.sin(2*np.pi*t/32))
for beat in range(64):
    if beat%16 in [0,6,8,11,14]:add(drum()*(1 if beat%8==0 else .45),beat*.5)
    if beat%16==4:add(tone(123.47,3,.06,.8),beat*.5)
write('forest-mystery.wav',mix)
write('impact.wav',drum())
write('pickup.wav',tone(146.83,.25,.25,.005)+tone(73.415,.25,.15,.005))
write('discovery.wav',tone(116.54,2,.18,.35)+tone(174.61,2,.09,.4))
print('Created 4 original WAV files')

# Compact Roblox-importable copies for source control. WAVs remain the source export.
import shutil, subprocess
if shutil.which('ffmpeg'):
    for wav in OUT.glob('*.wav'):
        subprocess.run(['ffmpeg','-y','-loglevel','error','-i',str(wav),'-c:a','libvorbis','-q:a','3',str(wav.with_suffix('.ogg'))],check=True)
