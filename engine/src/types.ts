// TypeScript mirror of schema/visual-plan.schema.json.
// Keep the two in sync: the schema is what Claude validates against, these
// types are what the renderer reads.

export type Sec = number;
export type Color = string;
export type FontName =
  | "Anton"
  | "Bebas Neue"
  | "Oswald"
  | "Playfair Display"
  | "DM Serif Display"
  | "Inter"
  | "Montserrat"
  | "Space Grotesk"
  | "JetBrains Mono"
  | "Permanent Marker"
  | "Caveat";
export type FontRole = "display" | "body" | "accent" | "mono";
export type Ease = "linear" | "in" | "out" | "in_out" | "snap" | "smooth";
export type Grade =
  | "none"
  | "natural"
  | "cinematic"
  | "teal_orange"
  | "noir"
  | "warm_film"
  | "cold"
  | "bleach"
  | "vintage"
  | "vivid"
  | "muted"
  | "night"
  | "sepia"
  | "matrix"
  | "duotone";
export type Blend =
  | "normal"
  | "screen"
  | "multiply"
  | "overlay"
  | "soft-light"
  | "lighten"
  | "darken"
  | "color-dodge"
  | "difference";
export type Position =
  | "center"
  | "top"
  | "bottom"
  | "left"
  | "right"
  | "top_left"
  | "top_right"
  | "bottom_left"
  | "bottom_right"
  | "lower_third";

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}
export interface Point {
  x: number;
  y: number;
}
export interface Transform {
  x?: number;
  y?: number;
  scale?: number;
  rotate?: number;
}

export type AnimType =
  | "none"
  | "fade"
  | "pop"
  | "slide_up"
  | "slide_down"
  | "slide_left"
  | "slide_right"
  | "scale_up"
  | "scale_down"
  | "blur"
  | "wipe_right"
  | "wipe_up"
  | "draw";
export interface Anim {
  type: AnimType;
  duration?: Sec;
}

export type CameraMove =
  | "static"
  | "push_in"
  | "pull_out"
  | "pan_left"
  | "pan_right"
  | "tilt_up"
  | "tilt_down"
  | "drift"
  | "handheld"
  | "crash_zoom"
  | "rotate_cw"
  | "rotate_ccw"
  | "dolly_zoom"
  | "custom";
export interface Camera {
  move: CameraMove;
  intensity?: number;
  ease?: Ease;
  target?: Point;
  shake?: number;
  from?: Transform;
  to?: Transform;
}

export type TransitionType =
  | "cut"
  | "crossfade"
  | "dip_black"
  | "dip_white"
  | "flash"
  | "whip_left"
  | "whip_right"
  | "whip_up"
  | "whip_down"
  | "slide_left"
  | "slide_right"
  | "slide_up"
  | "zoom_through"
  | "zoom_out"
  | "wipe_left"
  | "wipe_right"
  | "iris"
  | "glitch"
  | "blur"
  | "film_burn";
export interface Transition {
  type: TransitionType;
  duration?: Sec;
  color?: Color;
}

export interface Asset {
  kind: string;
  description?: string;
  query?: string;
  alternates?: string[];
  prompt?: string;
  status?: string;
  [key: string]: unknown;
}

export type SfxCue =
  | "whoosh"
  | "whoosh_long"
  | "swish"
  | "impact"
  | "boom"
  | "riser"
  | "click"
  | "pop"
  | "glitch"
  | "ding"
  | "typing"
  | "shutter"
  | "tick"
  | "heartbeat"
  | "drone";
export interface Sfx {
  cue?: SfxCue;
  cue_word?: string;
  src?: string;
  at?: Sec;
  volume?: number;
}

export interface Post {
  effect: "chromatic" | "glitch" | "blur" | "bloom" | "desaturate" | "pulse";
  intensity?: number;
  start?: Sec;
  end?: Sec;
  times?: Sec[];
}

// Fields added by scripts/prepare.mjs before rendering. Never written by hand.
export interface Prepared {
  _missing?: boolean; // src not on disk -> render a placeholder
  _isVideo?: boolean;
  _duration?: Sec; // source media duration (video)
}

export interface LayerBase {
  id?: string;
  cue_word?: string;
  start?: Sec;
  end?: Sec;
  lock?: "world" | "screen";
  enter?: Anim;
  exit?: Anim;
  opacity?: number;
  blend?: Blend;
  box?: Box;
  notes?: string;
}

export interface MediaProps extends Prepared {
  src?: string;
  asset?: Asset;
  fit?: "cover" | "contain" | "blur_fill";
  focus?: Point;
  grade?: Grade;
  camera?: Camera;
  blur?: number;
  darken?: number;
  mirror?: boolean;
}

export interface VideoLayer extends LayerBase, MediaProps {
  type: "video";
  trim?: Sec;
  speed?: number;
  freeze_at?: Sec;
  volume?: number;
}
export interface ImageLayer extends LayerBase, MediaProps {
  type: "image";
}
export interface ParallaxPlane extends Prepared {
  depth: number;
  src?: string;
  asset?: Asset;
  fit?: "cover" | "contain";
  focus?: Point;
  box?: Box;
  grade?: Grade;
  blur?: number;
  text?: string;
  font?: FontRole;
  color?: Color;
  size?: number;
}
export interface ParallaxLayer extends LayerBase {
  type: "parallax";
  camera?: Camera;
  planes: ParallaxPlane[];
}
export interface BackgroundLayer extends LayerBase {
  type: "background";
  style?: "solid" | "linear" | "radial" | "mesh" | "grid" | "paper" | "dots" | "noise";
  colors?: Color[];
  angle?: number;
  animated?: boolean;
}
export type TextStyle =
  | "title"
  | "slam"
  | "kinetic"
  | "typewriter"
  | "reveal"
  | "lower_third"
  | "label"
  | "quote"
  | "stamp"
  | "marker"
  | "outline"
  | "chapter";
export interface TextLayer extends LayerBase {
  type: "text";
  text: string;
  subtitle?: string;
  style?: TextStyle;
  position?: Position;
  size?: number;
  font?: FontRole;
  color?: Color;
  highlight?: string[];
  highlight_color?: Color;
  align?: "left" | "center" | "right";
  uppercase?: boolean;
  backdrop?: "none" | "box" | "blur" | "shadow";
  rotate?: number;
  word_times?: Sec[];
}
export interface CounterLayer extends LayerBase {
  type: "counter";
  from?: number;
  to: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  label?: string;
  count_duration?: Sec;
  position?: Position;
  size?: number;
  color?: Color;
  separator?: boolean;
}
export type AnnotationShape =
  | "circle"
  | "box"
  | "underline"
  | "arrow"
  | "cross"
  | "pin"
  | "route"
  | "bracket"
  | "spotlight"
  | "highlight";
export interface AnnotationLayer extends LayerBase {
  type: "annotation";
  shape: AnnotationShape;
  at?: Point;
  radius?: number;
  points?: Point[];
  color?: Color;
  stroke?: number;
  label?: string;
  draw_duration?: Sec;
  dashed?: boolean;
  hand_drawn?: boolean;
}
export interface CardLayer extends LayerBase, MediaProps {
  type: "card";
  frame?: "polaroid" | "paper" | "torn" | "phone" | "browser" | "tv" | "plain" | "rounded";
  is_video?: boolean;
  trim?: Sec;
  rotate?: number;
  tilt?: number;
  caption?: string;
  shadow?: boolean;
}
export interface SplitPanel extends Prepared {
  src?: string;
  asset?: Asset;
  is_video?: boolean;
  trim?: Sec;
  label?: string;
  grade?: Grade;
  focus?: Point;
  camera?: Camera;
}
export interface SplitLayer extends LayerBase {
  type: "split";
  layout?: "two_vertical" | "two_horizontal" | "three_vertical" | "grid_4" | "pip";
  gap?: number;
  gap_color?: Color;
  stagger?: Sec;
  panels: SplitPanel[];
}
export interface BarsLayer extends LayerBase {
  type: "bars";
  title?: string;
  unit?: string;
  orientation?: "vertical" | "horizontal";
  highlight?: number;
  data: { label: string; value: number; color?: Color }[];
}
export interface TimelineLayer extends LayerBase {
  type: "timeline";
  highlight?: number;
  items: { label: string; date?: string }[];
}
export type FxEffect =
  | "grain"
  | "vignette"
  | "light_leak"
  | "letterbox"
  | "flash"
  | "scanlines"
  | "vhs"
  | "dust"
  | "film_burn"
  | "particles"
  | "tint"
  | "viewfinder"
  | "rec"
  | "scrim";
export interface FxLayer extends LayerBase {
  type: "fx";
  effect: FxEffect;
  intensity?: number;
  color?: Color;
  kind?: "bokeh" | "embers" | "dust" | "snow";
  side?: "bottom" | "top" | "left" | "right" | "full" | "center";
  seed?: number;
}
export interface CustomLayer extends LayerBase {
  type: "custom";
  component: string;
  props?: Record<string, unknown>;
}

export type Layer =
  | VideoLayer
  | ImageLayer
  | ParallaxLayer
  | BackgroundLayer
  | TextLayer
  | CounterLayer
  | AnnotationLayer
  | CardLayer
  | SplitLayer
  | BarsLayer
  | TimelineLayer
  | FxLayer
  | CustomLayer;

export interface Shot {
  id: string;
  section?: string;
  start: Sec;
  end: Sec;
  script?: string;
  hold?: Sec;
  beat?: {
    role?: string;
    emotion?: string;
    energy?: number;
    info_type?: string;
    key_terms?: string[];
  };
  intent: string;
  strategy?: string;
  hero?: boolean;
  camera?: Camera;
  grade?: Grade;
  background?: Color;
  layers: Layer[];
  post?: Post[];
  transition_in?: Transition;
  sfx?: Sfx[];
  texture?: "inherit" | "none";
  notes?: string;
}

export interface Palette {
  bg: Color;
  fg: Color;
  accent: Color;
  accent2?: Color;
  muted?: Color;
}

export interface Treatment {
  logline?: string;
  concept: string;
  why?: string;
  palette: Palette;
  fonts: { display: FontName; body: FontName; accent?: FontName; mono?: FontName };
  grade?: Grade;
  texture?: ("grain" | "vignette" | "dust" | "scanlines" | "light_leak" | "letterbox")[];
  texture_intensity?: number;
  ai_image_style?: string;
  motifs?: { name: string; description: string; meaning?: string }[];
  rules?: string[];
}

export interface Word {
  word: string;
  start: Sec;
  end: Sec;
}

export interface Captions {
  enabled?: boolean;
  style?: "pop" | "karaoke" | "minimal";
  position?: "bottom" | "center" | "top";
  max_words?: number;
  src?: string;
  font?: FontRole;
  uppercase?: boolean;
  hide_during?: string[];
  _words?: Word[]; // inlined by prepare
}

export interface MusicTrack {
  src: string;
  start?: Sec;
  end?: Sec;
  offset?: Sec;
  volume?: number;
  fade_in?: Sec;
  fade_out?: Sec;
  duck?: number;
  _missing?: boolean;
}

export interface AudioConfig {
  voiceover?: { src: string; volume?: number; offset?: Sec; _missing?: boolean; _duration?: Sec };
  music?: MusicTrack[];
  sfx_volume?: number;
}

export interface VisualPlan {
  version: "1.0";
  meta: {
    title: string;
    slug?: string;
    fps?: number;
    width?: number;
    height?: number;
    duration?: Sec;
    timing?: "estimated" | "voiceover";
    [key: string]: unknown;
  };
  treatment: Treatment;
  sections?: { id: string; title: string; role?: string; energy?: number }[];
  shots: Shot[];
  global_layers?: Layer[];
  captions?: Captions;
  audio?: AudioConfig;
  // Render-time switches injected by scripts (not part of the authored plan).
  _render?: {
    animatic?: boolean; // show shot ids / intent banner for review
    speechSpans?: [Sec, Sec][]; // merged voice activity, used for music ducking
  };
}
