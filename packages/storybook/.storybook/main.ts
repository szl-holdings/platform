import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  stories: ['../stories/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-essentials', '@storybook/addon-a11y', '@storybook/addon-themes'],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  core: {
    // Optional telemetry metadata includes wall-clock timestamps and is not
    // needed to render the static stories. Keep the actual build deterministic.
    disableProjectJson: true,
  },
  docs: {
    autodocs: 'tag',
  },
};

export default config;
