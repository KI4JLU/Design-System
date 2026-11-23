import type { StorybookConfig } from '@storybook/react-vite';
import remarkGfm from 'remark-gfm';

const config: StorybookConfig = {
  stories: [
    "../src/**/*.mdx",
    "../src/**/*.stories.@(ts|tsx)"
  ],
  addons: [
    "@storybook/addon-a11y",
    {
      // GitHub-flavoured Markdown in the MDX pages: without it a Markdown
      // table („Slots & Props", „When to use it") renders as raw text with pipes.
      name: "@storybook/addon-docs",
      options: { mdxPluginOptions: { mdxCompileOptions: { remarkPlugins: [remarkGfm] } } },
    },
    "@storybook/addon-vitest"
  ],
  framework: "@storybook/react-vite"
};
export default config;
