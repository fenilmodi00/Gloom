import { ImageUploadSchema } from '../lib/schemas/wardrobe';

describe('ImageUploadSchema', () => {
  it('should accept valid JPEG image', () => {
    const validImage = { uri: 'file:///path/to/image.jpg', name: 'image.jpg', type: 'image/jpeg', size: 1024 * 1024 };
    const result = ImageUploadSchema.safeParse(validImage);
    expect(result.success).toBe(true);
  });

  it('should accept valid PNG image', () => {
    const validImage = { uri: 'file:///path/to/image.png', name: 'image.png', type: 'image/png', size: 1024 * 1024 };
    const result = ImageUploadSchema.safeParse(validImage);
    expect(result.success).toBe(true);
  });

  it('should reject non-image file (PDF)', () => {
    const invalidFile = { uri: 'file:///path/to/doc.pdf', name: 'doc.pdf', type: 'application/pdf', size: 1024 };
    const result = ImageUploadSchema.safeParse(invalidFile);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues[0].message).toContain('Invalid file type');
  });

  it('should reject file larger than 10MB', () => {
    const largeFile = { uri: 'file:///path/to/huge.jpg', name: 'huge.jpg', type: 'image/jpeg', size: 11 * 1024 * 1024 };
    const result = ImageUploadSchema.safeParse(largeFile);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues[0].message).toContain('File too large');
  });

  it('should reject missing URI', () => {
    const noUri = { name: 'image.jpg', type: 'image/jpeg', size: 1024 };
    const result = ImageUploadSchema.safeParse(noUri);
    expect(result.success).toBe(false);
  });
});