const { NxAppWebpackPlugin } = require('@nx/webpack/app-plugin');
const { join } = require('path');

module.exports = {
  output: {
    path: join(__dirname, '../../dist/apps/api'),
    clean: true,
    ...(process.env.NODE_ENV !== 'production' && {
      devtoolModuleFilenameTemplate: '[absolute-resource-path]',
    }),
  },
  externals: {
    'better-sqlite3': 'commonjs better-sqlite3',
  },
  plugins: [
    new NxAppWebpackPlugin({
      target: 'node',
      // Bundle the ESM-only runtime into this CommonJS server; keep other packages external.
      externalDependencies: Object.keys(
        require('../../package.json').dependencies,
      ).filter((name) => name !== '@five/voice-runtime'),
      compiler: 'tsc',
      main: './src/main.ts',
      tsConfig: './tsconfig.app.json',
      assets: ['./src/assets'],
      optimization: false,
      outputHashing: 'none',
      generatePackageJson: true,
      sourceMap: true,
    }),
  ],
};
