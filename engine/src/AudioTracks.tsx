import React from "react";
import { Audio, Loop, Sequence, useVideoConfig } from "remotion";
import type { MusicTrack, VisualPlan } from "./types";
import { resolveSrc } from "./lib/media";

function speechGain(abs: number, spans: [number, number][] | undefined, duck: number): number {
  if (!spans || spans.length === 0 || duck >= 1) return 1;
  // Smoothly dip under speech with 0.25s ramps.
  let g = 1;
  for (const [a, b] of spans) {
    if (abs < a - 0.25 || abs > b + 0.4) continue;
    const inR = Math.min(1, Math.max(0, (abs - (a - 0.25)) / 0.25));
    const outR = Math.min(1, Math.max(0, (b + 0.4 - abs) / 0.4));
    const k = Math.min(inR, outR);
    g = Math.min(g, 1 - (1 - duck) * k);
  }
  return g;
}

const MusicTrackView: React.FC<{ track: MusicTrack & { _duration?: number }; total: number; spans?: [number, number][] }> = ({ track, total, spans }) => {
  const { fps } = useVideoConfig();
  const start = track.start ?? 0;
  const end = Math.min(track.end ?? total, total);
  const frames = Math.round((end - start) * fps);
  if (frames <= 0 || track._missing) return null;
  const vol = track.volume ?? 0.25;
  const fi = track.fade_in ?? 1;
  const fo = track.fade_out ?? 1.5;
  const duck = track.duck ?? 0.45;
  const offset = track.offset ?? 0;
  const volume = (f: number) => {
    const local = f / fps;
    const fadeIn = fi > 0 ? Math.min(1, local / fi) : 1;
    const fadeOut = fo > 0 ? Math.min(1, (end - start - local) / fo) : 1;
    return Math.max(0, vol * fadeIn * fadeOut * speechGain(start + local, spans, duck));
  };
  const audio = <Audio src={resolveSrc(track.src)} trimBefore={Math.round(offset * fps)} volume={volume} />;
  const loopLen = track._duration ? Math.round((track._duration - offset) * fps) : 0;
  return (
    <Sequence from={Math.round(start * fps)} durationInFrames={frames} name="music">
      {loopLen > fps && loopLen < frames ? <Loop durationInFrames={loopLen}>{audio}</Loop> : audio}
    </Sequence>
  );
};

export const AudioTracks: React.FC<{ plan: VisualPlan; total: number }> = ({ plan, total }) => {
  const { fps } = useVideoConfig();
  const vo = plan.audio?.voiceover;
  const sfxVol = plan.audio?.sfx_volume ?? 1;
  return (
    <>
      {vo && !vo._missing ? (
        <Sequence from={Math.round((vo.offset ?? 0) * fps)} name="voiceover">
          <Audio src={resolveSrc(vo.src)} volume={vo.volume ?? 1} />
        </Sequence>
      ) : null}
      {(plan.audio?.music ?? []).map((m, i) => (
        <MusicTrackView key={i} track={m} total={total} spans={plan._render?.speechSpans} />
      ))}
      {plan.shots.flatMap((shot) =>
        (shot.sfx ?? []).map((s, i) => {
          const src = s.src;
          if (!src || (s as { _missing?: boolean })._missing) return null;
          const at = Math.max(0, shot.start + (s.at ?? 0));
          return (
            <Sequence key={`${shot.id}-sfx-${i}`} from={Math.round(at * fps)} durationInFrames={Math.round(6 * fps)} name={`sfx:${s.cue ?? "file"}`}>
              <Audio src={resolveSrc(src)} volume={(s.volume ?? 0.6) * sfxVol} />
            </Sequence>
          );
        }),
      )}
    </>
  );
};
