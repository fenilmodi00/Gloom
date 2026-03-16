// Metro config for React Native with NativeWind v4 and Expo
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

// Get the default Expo config
const config = getDefaultConfig(__dirname);

// Export the config with NativeWind integration
module.exports = withNativeWind(config, {
  input: './global.css',
});
