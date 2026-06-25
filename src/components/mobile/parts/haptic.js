// Light haptic tick. Android Chrome honors it; iOS Safari ignores the
// Vibration API (the visual spring/pulse cues carry the feel there).
export function haptic(pattern) {
  try {
    if (navigator.vibrate) navigator.vibrate(pattern);
  } catch {
    /* unsupported */
  }
}
