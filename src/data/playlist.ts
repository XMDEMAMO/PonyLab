import placeholderCover from '../assets/placeholders/default-cover.jpg';
import type { MusicTrack } from '../types/music';
import { sitePaths } from '../utils/paths';

export const musicPlaylist = [
  {
    id: 'cold-lab-signal',
    title: 'Cold Lab Signal',
    artist: 'PonyLab Generated Tone',
    cover: placeholderCover,
    coverAlt: '',
    src: sitePaths.asset('audio/cold-lab-signal.wav'),
    licenseNote: 'PonyLab 自行生成的开发占位音频，可自由替换。',
  },
  {
    id: 'night-terminal-loop',
    title: 'Night Terminal Loop',
    artist: 'PonyLab Generated Tone',
    cover: placeholderCover,
    coverAlt: '',
    src: sitePaths.asset('audio/night-terminal-loop.wav'),
    licenseNote: 'PonyLab 自行生成的开发占位音频，可自由替换。',
  },
] as const satisfies readonly MusicTrack[];
