import type { Preview } from '@storybook/react';
import React from 'react';
import '@szl-holdings/design-system/tokens/css';
import { DesignSystemProvider } from '@szl-holdings/design-system';

const preview: Preview = {
  parameters: {
    backgrounds: {
      default: 'dark',
      values: [
        { name: 'dark', value: '#060b12' },
        { name: 'light', value: '#f8f9fa' },
        { name: 'surface', value: '#0d1520' },
      ],
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    layout: 'padded',
  },
  globalTypes: {
    theme: {
      name: 'Theme',
      description: 'GI color theme',
      defaultValue: 'dark',
      toolbar: {
        icon: 'circlehollow',
        items: [
          { value: 'dark', title: 'Dark (default)' },
          { value: 'light', title: 'Light' },
        ],
        showName: true,
        dynamicTitle: true,
      },
    },
    density: {
      name: 'Density',
      description: 'Spatial density mode',
      defaultValue: 'comfortable',
      toolbar: {
        icon: 'grid',
        items: [
          { value: 'comfortable', title: 'Comfortable' },
          { value: 'compact', title: 'Compact' },
          { value: 'dense', title: 'Dense' },
        ],
        showName: true,
        dynamicTitle: true,
      },
    },
  },
  decorators: [
    (Story, context) => {
      const theme = context.globals.theme ?? 'dark';
      const density = context.globals.density ?? 'comfortable';
      return (
        <div
          data-theme={theme === 'light' ? 'light' : undefined}
          data-density={density !== 'comfortable' ? density : undefined}
          className={theme === 'light' ? 'gi-light' : ''}
          style={{
            background: theme === 'light' ? 'var(--gi-bg-base)' : 'var(--gi-bg-base)',
            color: 'var(--gi-text-primary)',
            minHeight: '100%',
            padding: '16px',
            fontFamily: 'var(--gi-font-sans)',
          }}
        >
          <DesignSystemProvider
            defaultDensity={density as 'comfortable' | 'compact' | 'dense'}
          >
            <Story />
          </DesignSystemProvider>
        </div>
      );
    },
  ],
};

export default preview;
