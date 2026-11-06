import type { ReactElement } from 'react';

/**
 * iOS 26 draws a "scroll edge effect" — a soft blur/fade — along the top edge of
 * every scroll view, which washes out the chips we pin over the content. The
 * iOS build turns that effect off; every other platform has nothing to disable,
 * so this is a pass-through that adds no view to the tree.
 */
export function NoScrollEdgeEffect({ children }: { children: ReactElement }) {
  return children;
}
