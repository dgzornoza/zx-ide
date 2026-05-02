import { onBeforeUnmount, ref, watch } from "vue";

const ANIMATION_FPS = 8;

export function useSpriteAnimation(frameCount: () => number) {
  const currentFrameIndex = ref(0);
  const isPlaying = ref(false);
  let intervalId: ReturnType<typeof setInterval> | null = null;

  const play = () => {
    if (isPlaying.value || frameCount() <= 1) return;
    isPlaying.value = true;
    intervalId = setInterval(() => {
      currentFrameIndex.value = (currentFrameIndex.value + 1) % frameCount();
    }, 1000 / ANIMATION_FPS);
  };

  const stop = () => {
    isPlaying.value = false;
    if (intervalId !== null) {
      clearInterval(intervalId);
      intervalId = null;
    }
  };

  watch(frameCount, (len) => {
    if (currentFrameIndex.value >= len) {
      currentFrameIndex.value = Math.max(0, len - 1);
    }
    if (len <= 1) stop();
  });

  onBeforeUnmount(() => stop());

  return { currentFrameIndex, isPlaying, play, stop };
}
