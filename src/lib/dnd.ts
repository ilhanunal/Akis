import { KeyboardSensor, MouseSensor, TouchSensor, useSensor, useSensors, type KeyboardCoordinateGetter } from '@dnd-kit/core'

/**
 * Drag sensors shared by the boards and the calendar.
 * Mouse and touch are kept apart on purpose: a pointer sensor would treat a finger moving a few
 * pixels as a drag and swallow the scroll. On touch a card only lifts after a short press, so
 * swiping across cards scrolls the page and the columns as usual.
 */
export function useDragSensors(coordinateGetter?: KeyboardCoordinateGetter) {
  return useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 8 } }),
    useSensor(KeyboardSensor, coordinateGetter ? { coordinateGetter } : {}),
  )
}

/** A short buzz when a press turns into a drag, so the hand knows the card is lifted (Android). */
export function liftFeedback() {
  try {
    navigator.vibrate?.(12)
  } catch {
    /* not supported */
  }
}
