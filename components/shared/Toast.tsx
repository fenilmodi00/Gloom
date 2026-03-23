import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastConfig {
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastContextType {
  showToast: (config: ToastConfig) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

const TOAST_COLORS: Record<ToastType, string> = {
  success: '#6A8C69', // stateSuccess
  error: '#B85C4A',   // stateError
  info: '#7A8FAB',    // stateInfo
  warning: '#C9A84C', // stateWarning
};

const TOAST_HEIGHT = 56;
const { width: SCREEN_WIDTH } = Dimensions.get('window');

function ToastItem({ 
  config, 
  onDismiss 
}: { 
  config: ToastConfig; 
  onDismiss: () => void;
}) {
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(1);
  
  const backgroundColor = TOAST_COLORS[config.type];
  const duration = config.duration || 3000;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    opacity: opacity.value,
  }));

  const dismiss = useCallback(() => {
    translateX.value = withTiming(SCREEN_WIDTH, { duration: 300 });
    opacity.value = withTiming(0, { duration: 300 }, () => {
      runOnJS(onDismiss)();
    });
  }, []);

  // Auto dismiss
  React.useEffect(() => {
    const timer = setTimeout(dismiss, duration);
    return () => clearTimeout(timer);
  }, [duration]);

  // Swipe to dismiss
  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      if (event.translationX > 0) {
        translateX.value = event.translationX;
      }
    })
    .onEnd((event) => {
      if (event.translationX > 100) {
        dismiss();
      } else {
        translateX.value = withTiming(0);
      }
    });

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[styles.toast, { backgroundColor }, animatedStyle]}>
        <Text style={styles.toastText}>{config.message}</Text>
      </Animated.View>
    </GestureDetector>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastConfig[]>([]);
  const toastIdRef = useRef(0);

  const showToast = useCallback((config: ToastConfig) => {
    const id = toastIdRef.current++;
    setToasts((prev) => [...prev, { ...config, id }]);
  }, []);

  const dismissToast = useCallback(() => {
    setToasts((prev) => prev.slice(1));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <View style={styles.container} pointerEvents="box-none">
        {toasts.map((toast, index) => (
          <ToastItem
            key={index}
            config={toast}
            onDismiss={dismissToast}
          />
        ))}
      </View>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}

// Convenience function to show toast
export function showToast(config: ToastConfig) {
  // This will be replaced by ToastContext when mounted
  console.log(`[Toast] ${config.type}: ${config.message}`);
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    zIndex: 9999,
    alignItems: 'center',
  },
  toast: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    maxWidth: SCREEN_WIDTH - 32,
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
});
