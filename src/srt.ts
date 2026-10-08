export type Cue = {index: number; startFrame: number; endFrame: number; text: string};

const toFrames = (h: string, m: string, s: string, ms: string, fps: number) =>
  Math.round(((Number(h) * 60 + Number(m)) * 60 + Number(s) + Number(ms) / 1000) * fps);

export function parseSrt(raw: string, fps: number): Cue[] {
  const cues: Cue[] = [];
  for (const block of raw.replace(/\r/g, "").split(/\n\s*\n/)) {
    const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
    const timeIdx = lines.findIndex((l) => l.includes("-->"));
    if (timeIdx < 0) continue;
    const m = /(\d+):(\d+):(\d+)[,.](\d+)\s*-->\s*(\d+):(\d+):(\d+)[,.](\d+)/.exec(lines[timeIdx]);
    if (!m) continue;
    cues.push({
      index: Number(lines[timeIdx - 1]) || cues.length + 1,
      startFrame: toFrames(m[1], m[2], m[3], m[4], fps),
      endFrame: toFrames(m[5], m[6], m[7], m[8], fps),
      text: lines.slice(timeIdx + 1).join(" "),
    });
  }
  return cues;
}
