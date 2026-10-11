// Video template library - hook and animation presets

export {
  useVideoPlayer,
  useSceneTimer,
  useVideoAudio,
  VideoPausedContext,
} from './hooks';
export type {
  SceneDurations,
  UseVideoPlayerOptions,
  UseVideoPlayerReturn,
  VideoAudioState,
} from './hooks';


export {
  MediaFrame,
  SafeFrame,
  SceneLayout,
  VideoCanvas,
  VideoText,
  useVideoLayout,
} from './layout';
export type { VideoAspectRatio } from './layout';

export {
  springs,
  easings,
  sceneTransitions,
  elementAnimations,
  charVariants,
  charContainerVariants,
  staggerConfigs,
  containerVariants,
  itemVariants,
  staggerDelay,
  customSpring,
  withDelay,
} from './animations';
