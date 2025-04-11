const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = [
  // Main process
  {
    mode: process.env.NODE_ENV || 'development',
    entry: './src/main.ts',
    target: 'electron-main',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'main.js',
    },
    node: {
      __dirname: false,
    },
    resolve: {
      extensions: ['.ts', '.js'],
    },
    module: {
      rules: [
        {
          test: /\.ts$/,
          include: /src/,
          use: [{ loader: 'ts-loader' }],
        },
      ],
    },
    // Disable minification for main process to avoid Terser errors
    optimization: {
      minimize: false
    }
  },
  // Preload process
  {
    mode: process.env.NODE_ENV || 'development',
    entry: './src/preload.ts',
    target: 'electron-preload',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'preload.js',
    },
    node: {
      __dirname: false,
    },
    resolve: {
      extensions: ['.ts', '.js'],
    },
    module: {
      rules: [
        {
          test: /\.ts$/,
          include: /src/,
          use: [{ loader: 'ts-loader' }],
        },
      ],
    },
  },
  // Renderer process
  {
    mode: process.env.NODE_ENV || 'development',
    entry: './src/renderer.tsx',
    target: 'electron-renderer',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'renderer.js',
    },
    node: {
      __dirname: false,
    },
    resolve: {
      extensions: ['.ts', '.tsx', '.js', '.jsx'],
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          include: /src/,
          use: [{ loader: 'ts-loader' }],
        },
        {
          test: /\.css$/,
          use: [
            MiniCssExtractPlugin.loader,
            'css-loader',
            'postcss-loader',
          ],
        },
        {
          test: /\.(png|svg|jpg|jpeg|gif)$/i,
          type: 'asset/resource',
        },
        {
          test: /\.(woff|woff2|eot|ttf|otf)$/i,
          type: 'asset/resource',
        },
      ],
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: './src/index.html',
        filename: 'index.html',
        inject: true,
        minify: {
          collapseWhitespace: true,
          removeComments: true,
          removeRedundantAttributes: true,
          removeScriptTypeAttributes: true,
          removeStyleLinkTypeAttributes: true,
          useShortDoctype: true
        }
      }),
      new MiniCssExtractPlugin({
        filename: 'styles.css',
      }),
    ],
  },
]; 