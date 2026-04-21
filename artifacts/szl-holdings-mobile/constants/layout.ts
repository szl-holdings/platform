/**
 * The fixed height of the BottomTabBar component (in logical pixels).
 *
 * The tab bar renders two rows of content (workspace tabs + utility row) and
 * does not use a safe-area inset on Android (insets.bottom === 0 there).
 * Adding this constant to the bottom padding of every shell-level scroll view
 * ensures the last list item is never obscured by the bar on any platform.
 */
export const TAB_BAR_HEIGHT = 84;
