/* Horizontal swipe detection for screen navigation.
 *
 * Returns touch handlers to spread onto a container. Fires onSwipe("left")
 * for a right-to-left drag and onSwipe("right") for left-to-right. Requires a
 * clearly horizontal gesture (and ignores multi-touch) so it never competes
 * with vertical scrolling or the condition drag-to-set-value gesture. Doesn't
 * preventDefault, so taps and scrolls behave normally. */
import { useRef } from "react";

export function useSwipe(onSwipe, { threshold = 60, ratio = 1.8 } = {}) {
  const start = useRef(null);

  const onTouchStart = (e) => {
    if (e.touches.length !== 1) { start.current = null; return; }
    const t = e.touches[0];
    start.current = { x: t.clientX, y: t.clientY };
  };

  const onTouchEnd = (e) => {
    const s = start.current;
    start.current = null;
    if (!s || e.changedTouches.length !== 1) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - s.x;
    const dy = t.clientY - s.y;
    if (Math.abs(dx) >= threshold && Math.abs(dx) > Math.abs(dy) * ratio) {
      onSwipe(dx < 0 ? "left" : "right");
    }
  };

  return { onTouchStart, onTouchEnd };
}
