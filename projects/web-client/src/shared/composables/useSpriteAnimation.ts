import { onBeforeUnmount, ref, watch } from 'vue';

const ANIMATION_FPS = 8;

export function useSpriteAnimation(frameCount: () => number) {
  const currentFrameIndex = ref(0);
  const isPlaying = ref(false);
  let intervalId: ReturnType<typeof setInterval> | undefined;

  const play = () => {
    if (isPlaying.value || frameCount() <= 1) return;
    isPlaying.value = true;
    intervalId = setInterval(() => {
      currentFrameIndex.value = (currentFrameIndex.value + 1) % frameCount();
    }, 1000 / ANIMATION_FPS);
  };

  const stop = () => {
    isPlaying.value = false;
    if (intervalId !== undefined) {
      clearInterval(intervalId);
      intervalId = undefined;
    }
  };

  watch(frameCount, (newFrameCount) => {
    if (currentFrameIndex.value >= newFrameCount) {
      currentFrameIndex.value = Math.max(0, newFrameCount - 1);
    }
    if (newFrameCount <= 1) stop();
  });

  onBeforeUnmount(() => stop());

  return { currentFrameIndex, isPlaying, play, stop };
}
