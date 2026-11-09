// Procedural Web Audio API sound generator for Sapiens: Dawn of Humankind
// Zero external audio files or network requests

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private campfireNoiseNode: AudioNode | null = null;

  private musicTimer: ReturnType<typeof setInterval> | null = null;
  private musicBus: GainNode | null = null;
  public setMusic(playing: boolean, era: "cognitive" | "agricultural" | "scientific" = "cognitive") {
    this.stopMusic();
    if (!playing || this.isMuted) return;
    this.initContext();
    const ctx=this.ctx;if(!ctx)return;
    const bus=ctx.createGain();bus.gain.value=.12;bus.connect(ctx.destination);this.musicBus=bus;
    // Slow, minor-modal tension: low drums, breathy texture and evolving drones.
    // No bright arpeggio, coin chirp or bell melody in the background score.
    let beat=0;
    const period=era==='agricultural'?410:era==='scientific'?480:445;
    const root=era==='scientific'?55:era==='agricultural'?65.41:58.27;
    const noise=ctx.createBuffer(1,ctx.sampleRate*2,ctx.sampleRate);
    const samples=noise.getChannelData(0);let brown=0;
    for(let i=0;i<samples.length;i++){brown=(brown+(Math.random()*2-1)*.025)/1.025;samples[i]=brown*4;}
    const texture=(duration:number,level:number,cutoff:number)=>{
      const t=ctx.currentTime,source=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),gain=ctx.createGain();
      source.buffer=noise;source.loop=true;filter.type='lowpass';filter.frequency.value=cutoff;
      gain.gain.setValueAtTime(.001,t);gain.gain.linearRampToValueAtTime(level,t+duration*.25);gain.gain.exponentialRampToValueAtTime(.001,t+duration);
      source.connect(filter);filter.connect(gain);gain.connect(bus);source.start();source.stop(t+duration+.05);
      source.onended=()=>{source.disconnect();filter.disconnect();gain.disconnect();};
    };
    const voice=(hz:number,duration:number,level:number,attack=.15,delay=0,drop=false)=>{
      const t=ctx.currentTime+delay,o=ctx.createOscillator(),g=ctx.createGain();
      o.type='sine';o.frequency.setValueAtTime(hz,t);
      if(drop)o.frequency.exponentialRampToValueAtTime(hz*.42,t+.24);
      else o.frequency.linearRampToValueAtTime(hz*1.008,t+duration);
      g.gain.setValueAtTime(.001,t);g.gain.linearRampToValueAtTime(level,t+attack);g.gain.exponentialRampToValueAtTime(.001,t+duration);
      o.connect(g);g.connect(bus);o.start(t);o.stop(t+duration+.05);o.onended=()=>{o.disconnect();g.disconnect();};
    };
    const tick=()=>{
      if(ctx.state!=='running')return;
      const step=beat%16;
      if(step===0){voice(root,7,.32,1.5);voice(root*1.5,6.5,.12,2);voice(root*2.002,6,.08,1.8);texture(6,.12,480);}
      if([0,6,8,11,14].includes(step)){
        voice(step===0||step===8?92:125,.65,step===0||step===8?.65:.27,.008,0,true);
        texture(.2,.09,320);
      }
      if(step===4||step===13){
        const hz=root*(step===4?2:2.12);
        voice(hz,2.1,.13,.5);voice(hz,1.5,.045,.35,.48);
      }
      beat++;
    };
    tick();this.musicTimer=setInterval(tick,period);
  }

  public stopMusic() {
    if(this.musicTimer)clearInterval(this.musicTimer);this.musicTimer=null;
    this.musicBus?.disconnect();this.musicBus=null;
  }
  constructor() {
    // AudioContext will be initialized on first user gesture
  }

  private initContext() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if(this.isMuted)this.stopMusic();
    if (this.isMuted && this.campfireNoiseNode) {
      try {
        (this.campfireNoiseNode as AudioBufferSourceNode).stop();
      } catch {
        // ignore
      }
      this.campfireNoiseNode = null;
    }
    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  // Soft tribal footstep
  public playStep() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(140 + Math.random() * 40, this.ctx.currentTime);

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(80 + Math.random() * 20, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(30, this.ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.09);
    } catch {
      // Audio fallback
    }
  }

  // Gathering flint or berries
  public playGather() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(170, now);
      osc.frequency.exponentialRampToValueAtTime(90, now + 0.12);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.16);
    } catch {
      // Audio fallback
    }
  }

  // Primitive drum beat for decisions/dilemmas
  public playDrum() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(120, now);
      osc.frequency.exponentialRampToValueAtTime(45, now + 0.35);

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.42);
    } catch {
      // Audio fallback
    }
  }

  // Bone flute chime / Myth chanting chord
  public playMythSound() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const notes = [146.83, 174.61, 220, 164.81]; // E minor pentatonic
      notes.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq * 0.35, now + idx * 0.08);

        gain.gain.setValueAtTime(0, now + idx * 0.08);
        gain.gain.linearRampToValueAtTime(0.12, now + idx * 0.08 + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.8);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.85);
      });
    } catch {
      // Audio fallback
    }
  }

  // Discovery Fanfare
  public playDiscovery() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const freqs = [523.25, 659.25, 783.99, 1046.5]; // C major arpeggio
      freqs.forEach((f, i) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(f * 0.35, now + i * 0.09);

        gain.gain.setValueAtTime(0.18, now + i * 0.09);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.09 + 0.5);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(now + i * 0.09);
        osc.stop(now + i * 0.09 + 0.55);
      });
    } catch {
      // Audio fallback
    }
  }

  // Victory fanfare
  public playVictory() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const progression = [392, 440, 523.25, 659.25, 783.99];
      progression.forEach((f, i) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(f * 0.35, now + i * 0.12);

        gain.gain.setValueAtTime(0.15, now + i * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.9);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(now + i * 0.12);
        osc.stop(now + i * 0.12 + 0.95);
      });
    } catch {
      // Audio fallback
    }
  }

  // Achievement unlock fanfare (triumphant brass & chime)
  public playAchievementFanfare() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      // Stately major chord progression with bell harmonics
      const chords = [
        [523.25, 659.25, 783.99],       // C
        [587.33, 739.99, 880.0],        // D
        [659.25, 830.61, 987.77],       // E
        [1046.5, 1318.51, 1567.98],     // High C (triumphant)
      ];

      chords.forEach((chord, step) => {
        const stepTime = now + step * 0.11;
        chord.forEach((freq) => {
          const osc = this.ctx!.createOscillator();
          const gain = this.ctx!.createGain();

          osc.type = step === 3 ? 'triangle' : 'sine';
          osc.frequency.setValueAtTime(freq * 0.35, stepTime);

          const vol = step === 3 ? 0.22 : 0.14;
          gain.gain.setValueAtTime(vol, stepTime);
          gain.gain.exponentialRampToValueAtTime(0.001, stepTime + (step === 3 ? 1.2 : 0.4));

          osc.connect(gain);
          gain.connect(this.ctx!.destination);

          osc.start(stepTime);
          osc.stop(stepTime + (step === 3 ? 1.3 : 0.45));
        });
      });
    } catch {
      // Audio fallback
    }
  }

  // Temple Run Jump whoosh
  public playJumpSound() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(100, now + 0.18);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.24);
    } catch {
      // Audio fallback
    }
  }

  // Temple Run Slide friction whoosh
  public playSlideSound() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(350, now);
      filter.frequency.linearRampToValueAtTime(120, now + 0.25);

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.linearRampToValueAtTime(60, now + 0.25);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.3);
    } catch {
      // Audio fallback
    }
  }

  // Temple Run Gem/Coin collect chime
  public playGemCollect(multiplier: number = 1) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const baseFreq = 880 + Math.min(6, multiplier) * 110;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(baseFreq, now);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, now + 0.08);

      gain.gain.setValueAtTime(0.16, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.13);
    } catch {}
  }

  // Lane Shift fast swoosh
  public playLaneShift() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(120, now);
      osc.frequency.exponentialRampToValueAtTime(65, now + 0.12);
      gain.gain.setValueAtTime(0.14, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.15);
    } catch {}
  }

  // Obstacle Stumble thud
  public playStumble() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(35, now + 0.28);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.32);
    } catch {}
  }

  // Power-up pickup chime (Prometheus Torch / Totem Shield / Surge)
  public playPowerup() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      [587.33, 739.99, 880, 1174.66].forEach((f, i) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(f * 0.35, now + i * 0.05);
        gain.gain.setValueAtTime(0.18, now + i * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.05 + 0.3);
        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(now + i * 0.05);
        osc.stop(now + i * 0.05 + 0.35);
      });
    } catch {}
  }

  // Beast Growl / Sabertooth roar warning
  public playBeastRoar() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(300, now);
      filter.frequency.linearRampToValueAtTime(150, now + 0.5);
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(75, now);
      osc.frequency.linearRampToValueAtTime(45, now + 0.5);
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.6);
    } catch {}
  }

  // Shield break clink
  public playShieldBreak() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(200, now + 0.2);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.25);
    } catch {}
  }

  // Thunder rumble for seasonal rainfall/storm events
  public playThunder() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(120, now);
      filter.frequency.exponentialRampToValueAtTime(45, now + 1.2);

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(55, now);
      osc.frequency.linearRampToValueAtTime(32, now + 1.2);

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.25);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 1.3);
    } catch {}
  }

  // Seasonal Rain drizzle burst
  public playRainStart() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      [320, 480, 640].forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq * 0.35, now + idx * 0.08);
        gain.gain.setValueAtTime(0.08, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.25);
        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.28);
      });
    } catch {}
  }

  // Majestic Woolly Mammoth trumpet / roar
  public playMammothTrumpet() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(380, now);
      filter.frequency.exponentialRampToValueAtTime(180, now + 0.85);

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(110, now);
      osc.frequency.exponentialRampToValueAtTime(175, now + 0.25);
      osc.frequency.exponentialRampToValueAtTime(70, now + 0.85);

      gain.gain.setValueAtTime(0.38, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.92);
    } catch {}
  }

  // Respawn / Revival Fanfare after second bump
  public playRespawn() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      // Uplifting triadic pentatonic chord
      [261.63, 329.63, 392.0, 523.25].forEach((freq, i) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq * 0.35, now + i * 0.06);
        gain.gain.setValueAtTime(0.18, now + i * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.45);
        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(now + i * 0.06);
        osc.stop(now + i * 0.06 + 0.5);
      });
    } catch {}
  }
}

export const soundEngine = new SoundEngine();

