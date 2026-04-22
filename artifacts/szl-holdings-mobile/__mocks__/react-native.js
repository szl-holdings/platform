const React = require('react');

function makeStub(displayName) {
  const Comp = (props) => React.createElement(displayName, props, props.children);
  Comp.displayName = displayName;
  return Comp;
}

module.exports = {
  Platform: { OS: 'ios', select: (obj) => obj.ios ?? obj.default },
  Alert: { alert: jest.fn() },
  AppState: {
    addEventListener: jest.fn(() => ({ remove: jest.fn() })),
    currentState: 'active',
  },
  StyleSheet: {
    create: (styles) => styles,
    flatten: (style) => style,
    absoluteFillObject: {},
    hairlineWidth: 1,
  },
  View: makeStub('View'),
  Text: makeStub('Text'),
  Pressable: makeStub('Pressable'),
  TouchableOpacity: makeStub('TouchableOpacity'),
  ScrollView: makeStub('ScrollView'),
  ActivityIndicator: makeStub('ActivityIndicator'),
  Image: makeStub('Image'),
  TextInput: makeStub('TextInput'),
  SafeAreaView: makeStub('SafeAreaView'),
};
