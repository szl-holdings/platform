const React = require('react');

// Generic stub for any `expo-*` module imported by component code under test.
// Provides the named exports we actually rely on; everything else falls back
// to undefined which is fine for tests that don't exercise the real APIs.
module.exports = {
  // expo-linear-gradient
  LinearGradient: ({ children, ...props }) =>
    React.createElement('LinearGradient', props, children),
  // expo-blur
  BlurView: ({ children, ...props }) => React.createElement('BlurView', props, children),
};
