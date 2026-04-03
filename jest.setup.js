// Jest setup file for Gloom

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => { };
  return Reanimated;
});

// Mock expo-blur
jest.mock('expo-blur', () => ({
  BlurView: 'BlurView',
}));

// Mock expo-image
jest.mock('expo-image', () => ({
  Image: 'Image',
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock Toast component
jest.mock('./components/shared/Toast', () => ({
  showToast: jest.fn(),
  useToast: jest.fn(() => ({ showToast: jest.fn() })),
  ToastProvider: ({ children }) => children,
}));

// Add comprehensive mocks for window and __DEV__
global.window = {
    localStorage: {
        setItem: jest.fn(),
        getItem: jest.fn(() => {}),
        removeItem: jest.fn(),
        clear: jest.fn(),
        length: 0,
    },
};
global.__DEV__ = true; // Simulate development mode
