// Test for gemini module exports and error handling

describe('Gemini Module', () => {
  it('should export tagWardrobeItem function', () => {
    const gemini = require('../lib/gemini');
    expect(typeof gemini.tagWardrobeItem).toBe('function');
  });

  it('should export generateOutfitSuggestions function', () => {
    const gemini = require('../lib/gemini');
    expect(typeof gemini.generateOutfitSuggestions).toBe('function');
  });

  it('tagWardrobeItem should reject without API key', async () => {
    // Save original env var
    const originalKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
    // Force undefined by deleting
    delete process.env.EXPO_PUBLIC_GEMINI_API_KEY;
    
    const gemini = require('../lib/gemini');
    
    try {
      await gemini.tagWardrobeItem('base64image');
      throw new Error('Should have thrown an error');
    } catch (error: any) {
      expect(error.message).toContain('EXPO_PUBLIC_GEMINI_API_KEY');
    } finally {
      // Restore
      if (originalKey !== undefined) {
        process.env.EXPO_PUBLIC_GEMINI_API_KEY = originalKey;
      }
    }
  });

  it('generateOutfitSuggestions should reject without API key', async () => {
    const originalKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
    delete process.env.EXPO_PUBLIC_GEMINI_API_KEY;
    
    const gemini = require('../lib/gemini');
    
    try {
      await gemini.generateOutfitSuggestions([]);
      throw new Error('Should have thrown an error');
    } catch (error: any) {
      expect(error.message).toContain('EXPO_PUBLIC_GEMINI_API_KEY');
    } finally {
      if (originalKey !== undefined) {
        process.env.EXPO_PUBLIC_GEMINI_API_KEY = originalKey;
      }
    }
  });
});
