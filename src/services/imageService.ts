/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Compresses an image file to a desired max width/height and quality
 * and returns a promise resolving to a base64 string.
 */
export function compressImage(
  file: File,
  maxWidth: number,
  maxHeightOrQuality: number,
  optionalQuality?: number
): Promise<string> {
  const maxHeight = optionalQuality !== undefined ? maxHeightOrQuality : maxWidth;
  const quality = optionalQuality !== undefined ? optionalQuality : maxHeightOrQuality;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        // Calculate aspect ratio
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Failed to get 2D context"));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        // Export to high performance JPEG format
        const dataUrl = canvas.toDataURL("image/jpeg", quality);
        resolve(dataUrl);
      };
      img.onerror = (err) => reject(err);
      img.src = e.target?.result as string;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

/**
 * Service to handle image compression, thumbnail generation, and uploading.
 */
export const imageService = {
  /**
   * Compresses an image file, creates a thumbnail, and uploads both to the server.
   */
  async uploadImage(file: File): Promise<{ url: string; thumbnailUrl: string }> {
    try {
      // 1. Compress main image (1024px limit, 0.8 quality)
      const compressedImageBase64 = await compressImage(file, 1024, 1024, 0.8);

      // 2. Generate small thumbnail (150px limit, 0.7 quality)
      const thumbnailBase64 = await compressImage(file, 150, 150, 0.7);

      // 3. Upload to server
      const response = await fetch("/api/upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image: compressedImageBase64,
          thumbnail: thumbnailBase64,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to upload image to server");
      }

      const data = await response.json();
      return {
        url: data.url,
        thumbnailUrl: data.thumbnailUrl || data.url,
      };
    } catch (error) {
      console.error("Error in imageService.uploadImage:", error);
      throw error;
    }
  },

  compressImage,
};
