const React = require('react');

module.exports = {
  router: { navigate: jest.fn(), back: jest.fn(), replace: jest.fn() },
  useRouter: () => ({ navigate: jest.fn(), back: jest.fn(), replace: jest.fn() }),
  Redirect: ({ href }) => React.createElement('Redirect', { href }),
  Link: ({ children, ...props }) => React.createElement('Link', props, children),
  Stack: ({ children, ...props }) => React.createElement('Stack', props, children),
  Slot: ({ children }) => React.createElement('Slot', null, children),
};
