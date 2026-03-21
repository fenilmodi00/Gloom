// Test for model-detail modal screen
import React from 'react';
import { View } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import { useRouter } from 'expo-router';

// Mock expo-router
jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
}));

// Mock modelDetail store
jest.mock('@/lib/store/modelDetail.store', () => ({
  useModelDetailStore: jest.fn(() => ({
    selectedModel: {
      id: 'model-1',
      imageUrl: 'https://example.com/model.jpg',
      name: 'Test Model',
    },
    clothItems: [],
    closeModelDetail: jest.fn(),
  })),
  useSelectedModel: jest.fn(() => ({
    id: 'model-1',
    imageUrl: 'https://example.com/model.jpg',
    name: 'Test Model',
  })),
  useClothItems: jest.fn(() => []),
}));

// Mock expo-haptics
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'Light', Medium: 'Medium' },
  notificationAsync: jest.fn(),
  NotificationFeedbackType: { Success: 'Success', Error: 'Error' },
}));

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => ({
  default: {
    View: 'Animated.View',
    createAnimatedComponent: (c: unknown) => c,
  },
  useSharedValue: jest.fn(() => ({ value: 0 })),
  useAnimatedStyle: jest.fn(() => ({})),
  withSpring: jest.fn((v) => v),
  withTiming: jest.fn((v) => v),
  Easing: { linear: jest.fn() },
}));

// Mock BackHandler
jest.mock('react-native/Libraries/Utilities/BackHandler', () => ({
  __esModule: true,
  default: {
    addEventListener: jest.fn(() => ({ remove: jest.fn() })),
  },
}));

// @expo/vector-icons handled by moduleNameMapper + __mocks__

// Import component after mocks are set up
// eslint-disable-next-line @typescript-eslint/no-require-imports
const ModelDetailScreen = require('@/app/(tabs)/inspo/model-detail').default;

describe('model-detail screen', () => {
  const mockRouter = { replace: jest.fn(), back: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
  });

  it('renders with blur backdrop', () => {
    const { getByTestId } = render(<ModelDetailScreen />);
    expect(getByTestId('blur-backdrop')).toBeTruthy();
  });

  it('close button calls router.replace with inspo path', () => {
    const { getByTestId } = render(<ModelDetailScreen />);
    const closeButton = getByTestId('close-button');
    fireEvent.press(closeButton);
    expect(mockRouter.replace).toHaveBeenCalledWith('/(tabs)/inspo');
  });

  it('displays model image', () => {
    const { getByTestId } = render(<ModelDetailScreen />);
    expect(getByTestId('model-image')).toBeTruthy();
  });
});
