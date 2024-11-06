const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: './src/index.ts',
  devtool: 'source-map',
  stats: 'errors-warnings',
  target: 'node',
  module: {
    rules: [
      {
        test: /\.ts?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.(zip|gz)$/,
        use: [
          {
            loader: 'file-loader',
            options: { name: '[name].[ext]', outputPath: 'templates/' },
          },
        ],
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  output: {
    filename: 'zx-ide-cli.js',
    path: path.resolve(__dirname, 'dist'),
  },
  plugins: [
    new CopyWebpackPlugin({
      // copy the templates to the dist folder
      patterns: [
        {
          from: 'templates/*.zip',
        },
      ],
    }),
  ],
};
