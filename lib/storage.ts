import { createMMKV, type MMKV } from 'react-native-mmkv';

// Create MMKV instance for general storage
export const storage: MMKV = createMMKV({ id: 'styleai-storage' });

// Create a separate MMKV instance for sensitive data (encrypted)
export const secureStorage: MMKV = createMMKV({
  id: 'styleai-secure',
  encryptionKey: 'styleai-encryption-key', // TODO: Replace with key from expo-secure-store on first launch
});

// Zustand-compatible storage adapter for MMKV
export const zustandMMKVStorage = {
  getItem: (key: string): string | null => {
    const value = storage.getString(key);
    return value ?? null;
  },
  setItem: (key: string, value: string): void => {
    storage.set(key, value);
  },
  removeItem: (key: string): void => {
    storage.remove(key);
  },
};
