// Metro config for React Native with NativeWind v4 and Expo
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

// Get the default Expo config
const config = getDefaultConfig(__dirname);

// Add additional resolver extensions for TypeScript and other file types
config.resolver.sourceExts = [
  ...config.resolver.sourceExts,
  'ts',
  'tsx',
  'js',
  'jsx',
  'json',
  'mjs',
];

// Export the config with NativeWind integration
module.exports = withNativeWind(config, {
  input: './global.css', // Path to your global CSS file
});
