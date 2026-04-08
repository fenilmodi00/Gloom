import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
} from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
  LinearTransition,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

import { THEME, BLUR } from '@/constants/Colors';
import { Typography, Fonts } from '@/constants/Typography';

// ─── Types ──────────────────────────────────────────────────────────────────────

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastConfig {
  type:      ToastType;
  title?:    string;
  message:   string;
  duration?: number;
}

interface ToastInstance extends ToastConfig {
  id: number;
}

interface ToastContextType {
  showToast: (config: ToastConfig) => void;
}

// ─── Global imperative bridge ────────────────────────────────────────────────────
// Allows showToast() calls from outside React (api.ts, interceptors, etc.)

type ToastHandler = (config: ToastConfig) => void;
let _registeredHandler: ToastHandler | null = null;

function registerHandler(fn: ToastHandler) { _registeredHandler = fn; }
function unregisterHandler()               { _registeredHandler = null; }

/** Call from anywhere — no hook, no prop drilling */
export function showToast(config: ToastConfig) {
  if (_registeredHandler) {
    _registeredHandler(config);
  } else {
    console.warn('[Gloom/Toast] showToast called before <ToastProvider> mounted.');
  }
}

// ─── Constants ───────────────────────────────────────────────────────────────────

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const TOAST_WIDTH             = SCREEN_WIDTH - 40;
const SWIPE_DISMISS_THRESHOLD = SCREEN_WIDTH * 0.28;
const DEFAULT_DURATION        = 3500;
const ANIMATE_IN_MS           = 380;
const ANIMATE_OUT_MS          = 280;
const MAX_TOASTS              = 3;

const ACCENT: Record<ToastType, string> = {
  success: THEME.stateSuccess,
  error:   THEME.stateError,
  warning: THEME.stateWarning,
  info:    THEME.stateInfo,
};

const ICON: Record<ToastType, string> = {
  success: '✓',
  error:   '✕',
  warning: '⚠',
  info:    'ℹ',
};

// ─── Context ─────────────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextType | null>(null);

// ─── ToastItem ───────────────────────────────────────────────────────────────────

interface ToastItemProps {
  toast:     ToastInstance;
  onDismiss: (id: number) => void;
}

const ToastItem = React.memo(function ToastItem({ toast, onDismiss }: ToastItemProps) {
  const accentColor = ACCENT[toast.type];

  // ── Shared values ──────────────────────────────────────────────────────────────
  const translateX = useSharedValue(SCREEN_WIDTH);  // enters from right
  const translateY = useSharedValue(-8);
  const opacity    = useSharedValue(0);
  const isExiting  = useSharedValue(false);

  // ── Dismiss (worklet — safe to call from gesture or JS timer) ──────────────────
  const handleDismiss = useCallback(
    () => onDismiss(toast.id),
    [onDismiss, toast.id],
  );

  const animateOut = useCallback(() => {
    'worklet';
    if (isExiting.value) return;
    isExiting.value = true;

    translateX.value = withTiming(SCREEN_WIDTH, { duration: ANIMATE_OUT_MS });
    opacity.value    = withTiming(
      0,
      { duration: ANIMATE_OUT_MS },
      (done) => { if (done) runOnJS(handleDismiss)(); },
    );
  }, [handleDismiss]);

  // ── Mount animation ────────────────────────────────────────────────────────────
  useEffect(() => {
    translateX.value = withSpring(0, { damping: 20, stiffness: 200 });
    translateY.value = withSpring(0, { damping: 20, stiffness: 200 });
    opacity.value    = withTiming(1, { duration: ANIMATE_IN_MS });
  }, []);

  // ── Auto-dismiss ───────────────────────────────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(animateOut, toast.duration ?? DEFAULT_DURATION);
    return () => clearTimeout(t);
  }, [animateOut, toast.duration]);

  // ── Gesture ────────────────────────────────────────────────────────────────────
  const pan = Gesture.Pan()
    .activeOffsetX(12)
    .failOffsetY([-8, 8])
    .onUpdate(({ translationX }) => {
      translateX.value = translationX > 0
        ? translationX
        : translationX * 0.15;       // rubber-band resistance
    })
    .onEnd(({ translationX, velocityX }) => {
      if (translationX > SWIPE_DISMISS_THRESHOLD || velocityX > 900) {
        animateOut();
      } else {
        translateX.value = withSpring(0, { damping: 20, stiffness: 220 });
      }
    });

  // ── Animated style ─────────────────────────────────────────────────────────────
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
  }));

  // ── Render ─────────────────────────────────────────────────────────────────────
  return (
    <GestureDetector gesture={pan}>
      <Animated.View
        layout={LinearTransition.springify().damping(18)}
        className="rounded-2xl shadow-lg shadow-textPrimary/10"
        style={[
          { width: TOAST_WIDTH, elevation: 6 },
          animatedStyle
        ]}
      >
        <BlurView
          intensity={BLUR.card}           // 6 — subtle, not frosted-glass heavy
          tint="light"
          className="flex-row items-center rounded-2xl overflow-hidden border border-[#D4C8B8]/45 bg-[#FDFAF6]/80 py-3 pr-4"
        >
          {/* Status accent bar */}
          <View className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl" style={{ backgroundColor: accentColor }} />

          {/* Icon badge */}
          <View className="w-[30px] h-[30px] rounded-[9px] items-center justify-center ml-4 mr-2.5 shrink-0" style={{ backgroundColor: `${accentColor}22` }}>
            <Text className="font-product text-base" style={{ color: accentColor }}>
              {ICON[toast.type]}
            </Text>
          </View>

          {/* Text */}
          <View className="flex-1 justify-center py-px">
            {toast.title ? (
              <Text className="font-ui text-[13px] font-semibold text-textPrimary leading-4 mb-px" numberOfLines={1}>
                {toast.title}
              </Text>
            ) : null}
            <Text className="font-body text-[13px] text-textSecondary leading-[18px]" numberOfLines={2}>
              {toast.message}
            </Text>
          </View>
        </BlurView>
      </Animated.View>
    </GestureDetector>
  );
});

// ─── Provider ─────────────────────────────────────────────────────────────────────

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastInstance[]>([]);
  const nextId = useRef(0);

  const showToastInternal = useCallback((config: ToastConfig) => {
    setToasts((prev) => {
      const trimmed = prev.length >= MAX_TOASTS ? prev.slice(1) : prev;
      return [...trimmed, { ...config, id: nextId.current++ }];
    });
  }, []);

  // Register the global bridge when provider mounts
  useEffect(() => {
    registerHandler(showToastInternal);
    return () => unregisterHandler();
  }, [showToastInternal]);

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast: showToastInternal }}>
      {children}
      <View className="absolute top-14 left-0 right-0 z-[9999] items-center gap-2" pointerEvents="box-none">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={dismissToast} />
        ))}
      </View>
    </ToastContext.Provider>
  );
}

// ─── Hook ──────────────────────────────────────────────────────────────────────────

export function useToast(): ToastContextType {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within <ToastProvider>');
  return ctx;
}

// ─── Styles ────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    position:   'absolute',
    top:        56,
    left:       0,
    right:      0,
    zIndex:     9999,
    alignItems: 'center',
    gap:        8,
  },
  wrapper: {
    width:        TOAST_WIDTH,
    borderRadius: 16,
    // Luxury floating shadow
    shadowColor:   THEME.textPrimary,
    shadowOffset:  { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius:  16,
    elevation:     6,
  },
  blur: {
    flexDirection: 'row',
    alignItems:    'center',
    borderRadius:  16,
    overflow:      'hidden',           // required for BlurView radius
    borderWidth:   1,
    borderColor:   'rgba(212, 200, 184, 0.45)',   // THEME.chipIdleBorder @ 45%
    backgroundColor: 'rgba(253, 250, 246, 0.82)', // THEME.bgSurface @ 82%
    paddingVertical:   13,
    paddingRight:      16,
  },
  accentBar: {
    position: 'absolute',
    left:     0,
    top:      0,
    bottom:   0,
    width:    4,
    borderTopLeftRadius:    16,
    borderBottomLeftRadius: 16,
  },
  iconBadge: {
    width:          30,
    height:         30,
    borderRadius:   9,
    alignItems:     'center',
    justifyContent: 'center',
    marginLeft:     16,       // clears the 4px accent bar + breathing room
    marginRight:    10,
    flexShrink:     0,
  },
  iconText: {
    fontFamily: Fonts.ui,
    fontSize:   12,
    fontWeight: '700',
  },
  textBlock: {
    flex: 1,
    gap:  2,
  },
  title: {
    ...Typography.uiLabelMedium,
    color:         THEME.textPrimary,
    textTransform: 'none',
    letterSpacing:  0.2,
  },
  message: {
    ...Typography.bodySmall,
    color: THEME.textSecondary,
  },
});
