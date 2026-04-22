const React = require('react');

module.exports = {
  SafeAreaProvider: ({ children }) =>
    React.createElement('SafeAreaProvider', null, children),
  SafeAreaView: ({ children, ...props }) =>
    React.createElement('SafeAreaView', props, children),
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
};
