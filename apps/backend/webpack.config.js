const { composePlugins, withNx } = require('@nx/webpack');
const path = require('path');
const { DefinePlugin } = require('webpack');
const dotenv = require('dotenv');

// Load environment variables from root .env file
const env = dotenv.config({ path: path.resolve(__dirname, '../../.env') }).parsed || {};

// Convert environment variables to JSON strings
const envKeys = Object.keys(env).reduce((prev, next) => {
  prev[`process.env.${next}`] = JSON.stringify(env[next]);
  return prev;
}, {});

module.exports = composePlugins(withNx(), (config) => {
  // Add DefinePlugin to inject environment variables
  config.plugins = config.plugins || [];
  config.plugins.push(new DefinePlugin(envKeys));

  return {
    ...config,
    watchOptions: {
      poll: 1000, // Check for changes every second
      aggregateTimeout: 300, // Wait 300ms after changes
      ignored: /node_modules/,
    },
    mode: process.env.NODE_ENV || 'development',
    experiments: {
      topLevelAwait: true,
    },
    resolve: {
      ...config.resolve,
      extensionAlias: {
        '.js': ['.ts', '.js'],
        '.mjs': ['.mts', '.mjs']
      }
    },
    module: {
      ...config.module,
      rules: [
        ...(config.module?.rules || []),
        {
          test: /\.m?js/,
          resolve: {
            fullySpecified: false
          }
        }
      ]
    }
  };
});
