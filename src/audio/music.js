// Pawed Racer soundtrack (ARCHITECTURE.md section 5). Every name in defs.MUSIC is an audio-kit tracker song (plain data, bars of 16 sixteenths).
// Driving chiptune with cheese-circus swagger: pulse leads, bouncy/driving triangle bass, arps and drums. One theme per biome; duel_pete is menacing.
// The same data drives live WebAudio (live-music.js) and offline PCM (tools/music-wav.mjs). Single style: `style` args are accepted and ignored.
import { MUSIC, TRACKS } from '../core/defs.js';
import { describeSong, renderSong, pcmStats } from '../kits/audio-kit/index.js';

export const MUSIC_NAMES = MUSIC;
export const MUSIC_STYLES = Object.freeze(['retro']);
/** Track id -> looping race song. */
export const MUSIC_FOR = Object.freeze(Object.fromEntries(TRACKS.map((t) => [t.id, 'race_' + t.id])));

// ---- helpers: chords -> note names ---------------------------------------------------------------------------------
const PC = { C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11 };
const NN = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const name = (m) => NN[m % 12] + (Math.floor(m / 12) - 1);
/** 'Am' | 'F' | 'E' -> chord tones (midi numbers) at a given base octave. */
function chord(sym, base = 60) {
  const minor = sym.endsWith('m'), r = PC[minor ? sym.slice(0, -1) : sym];
  return { root: base + r, third: base + r + (minor ? 3 : 4), fifth: base + r + 7, minor };
}
const rep = (s, n) => Array.from({ length: n }, () => s);
const R = (n, len) => `${name(n)}:${len}`;
// bass patterns (16 steps)
const BASS = {
  bounce: (c) => `${R(c.root - 24, 3)} .:1 ${R(c.fifth - 24, 3)} .:1 ${R(c.root - 24, 3)} .:1 ${R(c.fifth - 24, 3)} .:1`,
  walk: (c) => `${R(c.root - 24, 4)} ${R(c.fifth - 24, 4)} ${R(c.root - 24, 4)} ${R(c.third - 24, 4)}`,
  drive: (c) => `${R(c.root - 24, 2)} ${R(c.root - 12, 2)} `.repeat(4).trim(),
  pulse: (c) => `${R(c.root - 24, 3)} ${R(c.root - 24, 1)} .:2 ${R(c.root - 24, 2)} ${R(c.fifth - 24, 2)} .:2 ${R(c.root - 24, 2)} ${R(c.root - 12, 2)}`,
  waltz: (c) => `${R(c.root - 24, 3)} .:3 ${R(c.fifth - 24, 3)} .:3 ${R(c.fifth - 24, 3)} .:1`,   // oom-pah-pah in groups of 3 (waltz-ish)
  whole: (c) => R(c.root - 24, 16),
};
// arpeggio patterns (16 steps)
const ARP = {
  up: (c) => `${R(c.root, 2)} ${R(c.third, 2)} ${R(c.fifth, 2)} ${R(c.third, 2)} `.repeat(2).trim(),
  stab: (c) => `.:2 ${R(c.third, 2)} .:2 ${R(c.fifth, 2)} .:2 ${R(c.third, 2)} .:2 ${R(c.fifth, 2)}`,
  trip: (c) => `${R(c.root, 3)} ${R(c.third, 3)} ${R(c.fifth, 3)} ${R(c.third, 3)} ${R(c.fifth, 3)} ${R(c.root, 1)}`,   // rolling 3-feel
  roll: (c) => `${R(c.root, 3)} ${R(c.fifth, 3)} ${R(c.third + 12, 3)} ${R(c.fifth, 3)} ${R(c.third, 3)} ${R(c.root, 1)}`,
  sparse: (c) => `${R(c.root, 3)} .:3 ${R(c.fifth, 3)} .:3 ${R(c.third + 12, 3)} .:1`,
};
const pad = (c, which, oct = -12) => R(c[which] + oct, 16);
const bars = (chords, f, base) => chords.map((s) => f(chord(s, base)));

/** Retro song: lead (hand-written bars) + arp + bass + drums. */
function retro({ bpm, chords, lead, arp = 'up', bass = 'bounce', drums, loop = true, vel = {}, duty = 0.25, arpDuty = 0.125 }) {
  const song = { bpm, bars: lead.length, loop, channels: {
    lead: { wave: 'pulse', duty, vel: vel.lead ?? 0.28, gate: 0.75, sus: 0.35, pat: lead },
    bass: { wave: 'tri', vel: vel.bass ?? 0.38, gate: 0.85, sus: 0.8, pat: bars(chords, BASS[bass], 60) },
  } };
  if (arp) song.channels.harm = { wave: 'pulse', duty: arpDuty, vel: vel.arp ?? 0.1, gate: 0.5, sus: 0.2, pat: bars(chords, ARP[arp], 60) };
  if (drums) song.drums = { vel: vel.drums ?? 0.9, pat: drums };
  return song;
}


// drum grids (16 chars: k s h t, K = kick+hat, S = snare+hat)
const D_FOUR = rep('K.h.S.h.K.h.S.h.', 7).concat(['K.h.S.h.K.ttSsss']);
const D_DUSK = rep('K...h...S...h.h.', 7).concat(['K...h...S.t.t.s.']);
const D_NIGHT = rep('K.h.K.hhS.h.K.h.', 3).concat(['K.h.K.hhS.h.KttK']).concat(rep('K.h.K.hhS.h.K.h.', 3)).concat(['K.hhK.hhS.sSS.sS']);
const D_OOM = rep('K.h.S.h.K.h.S.hh', 7).concat(['K.h.S.h.KhtSsSsS']);   // circus oom-pah
const D_SHOP = rep('K...h...K...h.h.', 7).concat(['K...h...K.t.t.s.']);
const D_FANFARE = rep('K.h.S.h.K.h.S.h.', 3).concat(['K.h.S.h.K.ttSsss']);

export const SONGS = Object.freeze({
  // C major 128: ringmaster swagger, oom-pah bass
  title: retro({ bpm: 128, chords: ['C', 'F', 'G', 'C', 'Am', 'F', 'G', 'C'], bass: 'bounce', arp: 'stab', drums: D_OOM, lead: [
    'C5:2 E5:2 G5:2 E5:2 C6:4 G5:2 E5:2', 'A5:2 F5:2 C5:2 F5:2 A5:4 C6:4', 'B5:2 D6:2 G6:4 F6:2 D6:2 B5:4', 'C6:6 G5:2 E5:2 G5:2 C5:4',
    'A5:2 C6:2 E6:4 D6:2 C6:2 A5:4', 'F5:2 A5:2 C6:2 A5:2 F6:4 C6:4', 'G5:2 B5:2 D6:2 G6:2 F6:2 D6:2 B5:2 G5:2', 'C6:4 E6:4 G6:4 C7:4'] }),
  // F major 108: cheesemonger's shop, light and bouncy
  shop: retro({ bpm: 108, chords: ['F', 'Dm', 'Bb', 'C', 'F', 'Am', 'Bb', 'C'], bass: 'walk', arp: 'up', drums: D_SHOP, duty: 0.5, vel: { lead: 0.24, drums: 0.7 }, lead: [
    'A5:4 C6:2 A5:2 F5:4 A5:4', 'D5:4 F5:2 A5:2 D6:4 A5:4', 'Bb5:4 D6:2 Bb5:2 F5:4 D5:4', 'C6:4 E6:2 C6:2 G5:8',
    'A5:2 C6:2 F6:4 E6:2 C6:2 A5:4', 'C6:2 E6:2 A6:4 G6:2 E6:2 C6:4', 'D6:4 Bb5:4 F5:4 D5:4', 'C5:2 E5:2 G5:2 C6:2 E6:8'] }),
  // C major 112: podium fanfare (sting, 4 bars)
  podium: retro({ bpm: 112, loop: false, chords: ['C', 'F', 'G', 'C'], bass: 'bounce', arp: 'up', drums: D_FANFARE, lead: [
    'G5:2 G5:2 G5:2 C6:6 .:4', 'A5:2 A5:2 A5:2 F6:6 .:4', 'B5:2 D6:2 G6:4 F6:2 D6:2 B5:2 G5:2', 'C6:2 E6:2 G6:2 C7:10'] }),
  // G major 140, Brie Beach Run: sunny surf
  race_brie: retro({ bpm: 140, chords: ['G', 'D', 'C', 'G', 'G', 'D', 'C', 'D'], bass: 'bounce', arp: 'up', drums: D_FOUR, lead: [
    'G5:2 B5:2 D6:2 B5:2 G5:2 B5:2 D6:4', 'A5:2 C#6:2 D6:2 A5:2 F#5:4 A5:4', 'G5:2 C6:2 E6:4 D6:2 C6:2 G5:4', 'B5:4 D6:4 G6:8',
    'G6:2 F#6:2 E6:2 D6:2 B5:4 G5:4', 'F#5:2 A5:2 D6:4 C#6:2 A5:2 F#5:4', 'E5:2 G5:2 C6:2 E6:2 G6:4 E6:4', 'D6:4 C#6:2 D6:2 A5:4 F#5:2 A5:2'] }),
  // D major 144, Cheddar Canyon: syncopated esses
  race_cheddar: retro({ bpm: 144, chords: ['D', 'G', 'A', 'D', 'Bm', 'G', 'A', 'A'], bass: 'pulse', arp: 'stab', drums: D_FOUR, lead: [
    'D6:2 .:2 D6:2 F#6:2 A6:4 F#6:4', 'G5:2 B5:2 D6:2 G6:2 F#6:4 D6:4', 'E6:2 .:2 E6:2 C#6:2 A5:4 E5:4', 'D6:4 A5:2 F#5:2 D5:8',
    'B5:2 D6:2 F#6:4 E6:2 D6:2 B5:4', 'G5:2 B5:2 D6:4 B5:2 G5:2 D5:4', 'A5:2 C#6:2 E6:2 A6:2 G6:2 E6:2 C#6:2 A5:2', 'A5:4 C#6:4 E6:4 .:4'] }),
  // E minor 132, Swiss Hole Tunnels: hollow, echoing
  race_swiss: retro({ bpm: 132, chords: ['Em', 'Em', 'C', 'D', 'Em', 'Am', 'B', 'B'], bass: 'drive', arp: 'stab', drums: D_DUSK, duty: 0.5, arpDuty: 0.25, lead: [
    'E5:3 .:1 E5:2 G5:2 B5:4 G5:2 E5:2', 'E5:3 .:1 E5:2 G5:2 A5:4 F#5:2 E5:2', 'C6:4 B5:2 G5:2 E5:4 G5:4', 'D6:4 C6:2 A5:2 F#5:4 A5:4',
    'B5:2 E6:2 G6:4 F#6:2 E6:2 B5:4', 'A5:2 C6:2 E6:4 C6:2 A5:2 E5:4', 'B5:2 D#6:2 F#6:4 D#6:2 B5:2 F#5:4', 'B5:8 A#5:2 B5:2 .:4'] }),
  // A minor 148, Fondue Falls: heat and lava, relentless
  race_fondue: retro({ bpm: 148, chords: ['Am', 'Am', 'F', 'E', 'Am', 'G', 'F', 'E'], bass: 'drive', arp: 'stab', drums: D_NIGHT, duty: 0.5, vel: { lead: 0.27 }, lead: [
    'A5:2 A5:2 C6:2 E6:2 A6:4 E6:4', 'A5:2 A5:2 C6:2 E6:2 G6:2 E6:2 C6:4', 'F5:2 A5:2 C6:4 F6:2 E6:2 C6:4', 'E6:2 D#6:2 E6:2 B5:2 G#5:4 B5:4',
    'C6:2 E6:2 A6:2 E6:2 C6:2 E6:2 A6:4', 'D6:2 G6:2 B6:4 A6:2 G6:2 D6:4', 'A5:2 C6:2 F6:4 E6:2 C6:2 A5:4', 'G#5:4 B5:4 E6:4 .:4'] }),
  // D minor 118, Blue Cheese Bog: murky, sparse, spooky
  race_blue: retro({ bpm: 118, chords: ['Dm', 'Bb', 'Gm', 'A', 'Dm', 'Bb', 'A', 'A'], bass: 'walk', arp: 'up', drums: D_DUSK, duty: 0.5, arpDuty: 0.25, vel: { lead: 0.25 }, lead: [
    'D5:4 F5:4 A5:4 D6:4', 'D6:6 Bb5:2 F5:4 D5:4', 'G5:4 Bb5:4 D6:2 C6:2 Bb5:4', 'C#6:4 E6:4 A5:4 .:4',
    'F5:2 A5:2 D6:4 C6:2 A5:2 F5:4', 'D6:4 F6:4 D6:4 Bb5:4', 'E6:4 C#6:2 A5:2 E5:4 A5:4', 'A5:8 G#5:2 A5:2 .:4'] }),
  // B minor 150, Parmesan Peaks: sharp, grating, icy
  race_parmesan: retro({ bpm: 150, chords: ['Bm', 'Bm', 'G', 'A', 'Bm', 'G', 'F#', 'F#'], bass: 'drive', arp: 'up', drums: D_FOUR, arpDuty: 0.125, lead: [
    'B5:2 B5:2 D6:2 F#6:2 B6:4 F#6:4', 'B5:2 D6:2 F#6:2 D6:2 B5:2 D6:2 F#6:4', 'G5:2 B5:2 D6:2 G6:2 F#6:4 D6:4', 'A5:2 C#6:2 E6:2 A6:2 G#6:2 E6:2 C#6:4',
    'D6:2 F#6:2 B6:4 A6:2 F#6:2 D6:4', 'B5:2 D6:2 G6:4 D6:2 B5:2 G5:4', 'A#5:2 C#6:2 F#6:4 C#6:2 A#5:2 F#5:4', 'F#5:4 A#5:4 C#6:4 .:4'] }),
  // C minor 124, Camembert Caverns: dripping, echoey, tight
  race_camembert: retro({ bpm: 124, chords: ['Cm', 'Ab', 'Eb', 'Bb', 'Cm', 'Fm', 'G', 'G'], bass: 'walk', arp: 'stab', drums: D_DUSK, duty: 0.5, arpDuty: 0.25, lead: [
    'C5:4 Eb5:4 G5:4 C6:4', 'Ab5:6 Eb5:2 C5:4 Eb5:4', 'G5:4 Bb5:4 Eb6:4 D6:4', 'D6:4 F6:4 Bb5:4 .:4',
    'C6:2 Eb6:2 G6:4 F6:2 Eb6:2 C6:4', 'F5:2 Ab5:2 C6:4 Ab5:2 F5:2 C5:4', 'G5:2 B5:2 D6:4 B5:2 G5:2 D5:4', 'B5:4 D6:4 G6:4 .:4'] }),
  // D major 152, Gouda Eve Classic: grand arena finale
  race_gouda: retro({ bpm: 152, chords: ['D', 'A', 'Bm', 'G', 'D', 'A', 'G', 'A'], bass: 'bounce', arp: 'up', drums: D_FOUR, vel: { lead: 0.3 }, lead: [
    'F#5:2 A5:2 D6:4 F#6:4 A6:4', 'E6:4 C#6:4 A5:4 E5:4', 'D6:2 F#6:2 B6:4 A6:2 F#6:2 D6:4', 'B5:2 D6:2 G6:4 F#6:2 D6:2 B5:4',
    'A5:2 D6:2 F#6:2 A6:2 D7:8', 'C#7:4 A6:4 E6:4 C#6:4', 'B6:2 G6:2 D6:2 G6:2 B6:4 D7:4', 'E7:4 C#7:2 A6:2 E6:4 .:4'] }),
  // D minor 156, duel with Perring Parkway Pete: menacing tritone stabs
  duel_pete: retro({ bpm: 156, chords: ['Dm', 'Dm', 'Bb', 'A', 'Dm', 'Dm', 'Gm', 'A'], bass: 'drive', arp: 'stab', drums: D_NIGHT, duty: 0.5, arpDuty: 0.25, vel: { lead: 0.28, bass: 0.42 }, lead: [
    'D5:2 .:2 D5:2 F5:2 Ab5:2 .:2 A5:2 .:2', 'D5:2 .:2 D5:2 F5:2 E5:2 F5:2 D5:4', 'Bb5:4 A5:2 G5:2 F5:4 D5:4', 'C#6:2 E6:2 A5:2 E5:2 C#6:2 E6:2 A5:4',
    'D6:2 .:2 D6:2 F6:2 Ab6:2 .:2 A6:2 .:2', 'F6:2 E6:2 D6:2 C6:2 Bb5:4 A5:4', 'G5:2 Bb5:2 D6:4 C6:2 Bb5:2 G5:4', 'A5:2 C#6:2 E6:2 G6:2 A6:2 G6:2 E6:2 C#6:2'] }),
});

export const SONG_SETS = Object.freeze({ retro: SONGS });
/** Song data by name (the style argument is accepted and ignored: one soundtrack). */
export function songFor(trackName) {
  const s = SONGS[trackName];
  if (!s) throw new Error('unknown music track: ' + trackName);
  return s;
}
/** Race song for a track id; unknown -> race_brie. */
export const trackForRace = (id) => MUSIC_FOR[id] ?? 'race_brie';

// ---- describe / render / analysis ----------------------------------------------------------------------------------
export const describeMusic = (trackName) => describeSong(songFor(trackName));
/** Offline PCM (Float32Array mono). `seconds` defaults to one pass (loops) or one pass plus tail (stings). */
export const renderMusic = (trackName, sr = 44100, seconds) => renderSong(songFor(trackName), sr, seconds);
export const musicStats = (pcm) => pcmStats(pcm);

/** Spectral centroid (Hz) over up to 2^16 samples from the middle of the buffer (Hann window, radix-2 FFT). */
export function spectralCentroid(pcm, sr = 44100) {
  let n = 1; while (n * 2 <= Math.min(pcm.length, 65536)) n *= 2;
  const off = Math.max(0, (pcm.length - n) >> 1), re = new Float64Array(n), im = new Float64Array(n);
  for (let i = 0; i < n; i++) re[i] = pcm[off + i] * (0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (n - 1)));
  for (let i = 1, j = 0; i < n; i++) { let b = n >> 1; for (; j & b; b >>= 1) j ^= b; j ^= b; if (i < j) { [re[i], re[j]] = [re[j], re[i]]; } }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = (-2 * Math.PI) / len, wr = Math.cos(ang), wi = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let cr = 1, ci = 0;
      for (let k = 0; k < len / 2; k++) {
        const a = i + k, b = a + len / 2, tr = re[b] * cr - im[b] * ci, ti = re[b] * ci + im[b] * cr;
        re[b] = re[a] - tr; im[b] = im[a] - ti; re[a] += tr; im[a] += ti;
        const t = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = t;
      }
    }
  }
  let num = 0, den = 0;
  for (let k = 1; k < n / 2; k++) { const m = Math.hypot(re[k], im[k]); num += m * ((k * sr) / n); den += m; }
  return den > 0 ? num / den : 0;
}
