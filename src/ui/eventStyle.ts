import type { MaterialCommunityIcons } from '@expo/vector-icons';

import type { UserEventKind } from '@/core/types';

import type { Colors } from './theme';

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

/**
 * The four event icons from the design — a runner, a fork and knife, a sleeping
 * moon and a capsule. They come from MaterialCommunityIcons because Ionicons
 * has no pill or sleep glyph.
 */
export const EVENT_ICON: Record<UserEventKind, IconName> = {
  exercise: 'run',
  meal: 'silverware-fork-knife',
  sleep: 'sleep',
  medication: 'pill',
};

/**
 * One colour per event kind, shared by the chart markers and the Readings list.
 * These are marker fills, so they take the guide's status fills rather than the
 * darker inks text has to use.
 */
export function eventColors(c: Colors): Record<UserEventKind, string> {
  return {
    exercise: c.greenFill,
    meal: c.orangeFill,
    sleep: c.etcFill,
    medication: c.primaryHover,
  };
}
