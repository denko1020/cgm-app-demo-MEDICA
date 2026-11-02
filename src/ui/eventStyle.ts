import type { MaterialCommunityIcons } from '@expo/vector-icons';

import type { UserEventKind } from '@/core/types';

import { colors } from './theme';

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

/** One colour per event kind, shared by the Home buttons, the chart markers and the Readings list. */
export const EVENT_COLOR: Record<UserEventKind, string> = {
  exercise: colors.green,
  meal: colors.orange,
  sleep: colors.indigo,
  medication: colors.violet,
};
