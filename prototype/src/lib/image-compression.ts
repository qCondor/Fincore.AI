/**
 * Client-side image compression for Fincore scan uploads.
 *
 * PURPOSE: Reduces image payload before sending to Bedrock vision API.
 * Camera captures can be 5-10MB; this brings them down to 100-500KB.
 *
 * HOW IT WORKS:
 * 1. Load image into memory via Image element
 * 2. Resize to max 1024x1024 while maintaining aspect ratio
 * 3. Re-encode as JPEG at 85% quality
 * 4. Return data URL ready for base64 extraction
 *
 * TYPICAL RESULTS:
 * - iPhone photo (4032x3024, 5MB) -> 1024x768, 150KB (33x compression)
 * - Screenshot (1170x2532, 2MB) -> 473x1024, 80KB (25x compression)
 *
 * USAGE:
 *   const result = await compressImage(cameraDataUrl, {
 *     maxWidth: 1024,
 *     maxHeight: 1024,
 *     quality: 0.85,
 *   });
 *   const base64 = result.dataUrl.split(',')[1];
 */

export interface CompressionOptions {
  maxWidth?: number;      // Default: 1024px
  maxHeight?: number;     // Default: 1024px
  quality?: number;       // JPEG quality 0-1, default: 0.85
  mimeType?: string;      // Default: 'image/jpeg'
}

export interface CompressionResult {
  dataUrl: string;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  width: number;
  height: number;
}

export async function compressImage(
  dataUrl: string,
  options: CompressionOptions = {}
): Promise<CompressionResult> {
  const {
    maxWidth = 1024,
    maxHeight = 1024,
    quality = 0.85,
    mimeType = 'image/jpeg'
  } = options;

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      // Calculate new dimensions maintaining aspect ratio
      let { width, height } = img;

      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      // Create canvas and draw resized image
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      // Use better quality interpolation
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      // Convert to compressed format
      const compressedDataUrl = canvas.toDataURL(mimeType, quality);

      // Calculate sizes (base64 to bytes approximation)
      const originalSize = Math.round((dataUrl.length - 22) * 0.75);
      const compressedSize = Math.round((compressedDataUrl.length - 22) * 0.75);

      resolve({
        dataUrl: compressedDataUrl,
        originalSize,
        compressedSize,
        compressionRatio: originalSize / compressedSize,
        width,
        height
      });
    };

    img.onerror = () => reject(new Error('Failed to load image for compression'));
    img.src = dataUrl;
  });
}
