import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const outputDirectory = fileURLToPath(new URL('../public/audio/', import.meta.url));
const sampleRate = 22_050;
const durationSeconds = 8;

interface ToneDefinition {
  filename: string;
  primary: number;
  secondary: number;
  pulse: number;
}

const tones: ToneDefinition[] = [
  { filename: 'cold-lab-signal.wav', primary: 220, secondary: 329.63, pulse: 0.18 },
  { filename: 'night-terminal-loop.wav', primary: 196, secondary: 293.66, pulse: 0.12 },
];

function createWave({ primary, secondary, pulse }: ToneDefinition): Buffer {
  const sampleCount = sampleRate * durationSeconds;
  const dataLength = sampleCount * 2;
  const buffer = Buffer.alloc(44 + dataLength);

  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataLength, 4);
  buffer.write('WAVEfmt ', 8);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataLength, 40);

  for (let index = 0; index < sampleCount; index += 1) {
    const time = index / sampleRate;
    const fade = Math.min(1, time / 0.18, (durationSeconds - time) / 0.28);
    const modulation = 0.72 + 0.28 * Math.sin(2 * Math.PI * pulse * time);
    const sample =
      (Math.sin(2 * Math.PI * primary * time) * 0.58 +
        Math.sin(2 * Math.PI * secondary * time) * 0.24) *
      modulation *
      Math.max(0, fade) *
      0.13;
    buffer.writeInt16LE(Math.round(sample * 32_767), 44 + index * 2);
  }

  return buffer;
}

await mkdir(outputDirectory, { recursive: true });
await Promise.all(
  tones.map((tone) => writeFile(`${outputDirectory}${tone.filename}`, createWave(tone))),
);

console.log(`已生成 ${tones.length} 个可替换的 PonyLab 开发占位音频。`);
