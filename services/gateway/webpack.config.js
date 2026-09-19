const { NxAppWebpackPlugin } = require('@nx/webpack/app-plugin');
const { join } = require('path');
const nodeExternals = require('webpack-node-externals');

module.exports = {
  target: 'node',
  externals: [
    nodeExternals({
      modulesDir: join(__dirname, '../../node_modules'),
    }),
  ],
  resolve: {
    modules: [join(__dirname, '../../node_modules'), 'node_modules'],
    extensions: ['.ts', '.js', '.json'],
  },
  output: {
    path: join(__dirname, '../../dist/services/gateway'),
    clean: true,
    ...(process.env.NODE_ENV !== 'production' && {
      devtoolModuleFilenameTemplate: '[absolute-resource-path]',
    }),
  },
  plugins: [
    new NxAppWebpackPlugin({
      target: 'node',
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
