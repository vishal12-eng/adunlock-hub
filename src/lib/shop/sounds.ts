// Sound effects for shop and rewards - NO EXTERNAL DEPENDENCIES

const SOUND_PREFS_KEY = 'adnexus_sound_prefs';

interface SoundPreferences {
  enabled: boolean;
  volume: number;
}

function getSoundPrefs(): SoundPreferences {
  try {
    const stored = localStorage.getItem(SOUND_PREFS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {}
  return { enabled: true, volume: 0.5 };
}

export function setSoundEnabled(enabled: boolean): void {
  const prefs = getSoundPrefs();
  prefs.enabled = enabled;
  localStorage.setItem(SOUND_PREFS_KEY, JSON.stringify(prefs));
}

export function isSoundEnabled(): boolean {
  return getSoundPrefs().enabled;
}

export function setSoundVolume(volume: number): void {
  const prefs = getSoundPrefs();
  prefs.volume = Math.max(0, Math.min(1, volume));
  localStorage.setItem(SOUND_PREFS_KEY, JSON.stringify(prefs));
}

// Create audio context lazily
let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (!audioContext && typeof AudioContext !== 'undefined') {
    audioContext = new AudioContext();
  }
  return audioContext;
}

// Play a tone using Web Audio API
function playTone(frequency: number, duration: number, type: OscillatorType = 'sine'): void {
  const prefs = getSoundPrefs();
  if (!prefs.enabled) return;
  
  const ctx = getAudioContext();
  if (!ctx) return;
  
  try {
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
    
    gainNode.gain.setValueAtTime(prefs.volume * 0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);
  } catch {
    // Silently fail if audio is not available
  }
}

// Play multiple tones in sequence
function playMelody(notes: { freq: number; dur: number }[], gap = 0.1): void {
  const prefs = getSoundPrefs();
  if (!prefs.enabled) return;
  
  const ctx = getAudioContext();
  if (!ctx) return;
  
  let startTime = ctx.currentTime;
  
  notes.forEach((note) => {
    try {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(note.freq, startTime);
      
      gainNode.gain.setValueAtTime(prefs.volume * 0.3, startTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + note.dur);
      
      oscillator.start(startTime);
      oscillator.stop(startTime + note.dur);
      
      startTime += note.dur + gap;
    } catch {
      // Silently fail
    }
  });
}

// Sound effects
export function playCoinSound(): void {
  playMelody([
    { freq: 880, dur: 0.05 },
    { freq: 1100, dur: 0.08 },
  ], 0.02);
}

export function playCardSound(): void {
  playMelody([
    { freq: 523, dur: 0.08 },
    { freq: 659, dur: 0.08 },
    { freq: 784, dur: 0.12 },
  ], 0.03);
}

export function playSuccessSound(): void {
  playMelody([
    { freq: 523, dur: 0.1 },
    { freq: 659, dur: 0.1 },
    { freq: 784, dur: 0.1 },
    { freq: 1047, dur: 0.2 },
  ], 0.05);
}

export function playPurchaseSound(): void {
  playMelody([
    { freq: 400, dur: 0.05 },
    { freq: 600, dur: 0.08 },
    { freq: 800, dur: 0.1 },
    { freq: 1000, dur: 0.15 },
  ], 0.03);
}

export function playDailyRewardSound(): void {
  playMelody([
    { freq: 440, dur: 0.1 },
    { freq: 554, dur: 0.1 },
    { freq: 659, dur: 0.1 },
    { freq: 880, dur: 0.2 },
    { freq: 1047, dur: 0.3 },
  ], 0.05);
}

export function playErrorSound(): void {
  playTone(200, 0.3, 'sawtooth');
}

export function playClickSound(): void {
  playTone(600, 0.05, 'sine');
}
