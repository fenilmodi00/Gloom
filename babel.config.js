module.exports = function (api) {
  api.cache(true);
  
  // Check if running in test mode
  const isTest = process.env.NODE_ENV === 'test';
  
  if (isTest) {
    return {
      presets: ['babel-preset-expo'],
    };
  }
  
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // NativeWind v4 does NOT use babel plugin - configured via metro.config.js
      // 'nativewind/babel', // Removed - incompatible with Metro in v4
      'react-native-reanimated/plugin',
    ],
  };
};
