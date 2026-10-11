export interface SceneDetails {
  title: string;
  filePath: string;
}

const p = (n: number) => `src/components/video/video_scenes/Scene${n}.tsx`;
export const SCENE_DETAILS: Record<string, SceneDetails> = {
  hook: { title: 'Enter code', filePath: p(1) },
  hunt: { title: 'Tab hunt', filePath: p(2) },
  iphone: { title: 'iPhone', filePath: p(3) },
  chrome: { title: 'Chrome pill', filePath: p(4) },
  popup: { title: 'Popup', filePath: p(5) },
  finale: { title: 'CodeSafe', filePath: p(6) },
};
