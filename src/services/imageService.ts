import sharp from 'sharp';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export interface ImageVariants {
  original: string;
  full: string;
  medium: string;
  thumb: string;
}

const VARIANTS = [
  { name: 'thumb', width: 400, quality: 75 },
  { name: 'medium', width: 800, quality: 80 },
  { name: 'full', width: 1400, quality: 85 },
] as const;

/**
 * Process an uploaded image buffer, generating optimized WebP variants.
 * Returns URLs for each variant.
 */
export async function processImage(
  buffer: Buffer,
  type: string,
  baseFilename: string
): Promise<ImageVariants> {
  const uploadDir = path.join(process.cwd(), 'uploads', type);
  await mkdir(uploadDir, { recursive: true });

  // Save original (compressed but not resized)
  const originalPath = path.join(uploadDir, `${baseFilename}.webp`);
  await sharp(buffer)
    .webp({ quality: 90 })
    .toFile(originalPath);

  const original = `/uploads/${type}/${baseFilename}.webp`;

  // Generate variants
  const variantUrls: Record<string, string> = {};
  for (const variant of VARIANTS) {
    const variantFilename = `${baseFilename}_${variant.name}.webp`;
    const variantPath = path.join(uploadDir, variantFilename);

    await sharp(buffer)
      .resize(variant.width, undefined, {
        withoutEnlargement: true,
        fit: 'inside',
      })
      .webp({ quality: variant.quality })
      .toFile(variantPath);

    variantUrls[variant.name] = `/uploads/${type}/${variantFilename}`;
  }

  return {
    original,
    full: variantUrls.full,
    medium: variantUrls.medium,
    thumb: variantUrls.thumb,
  };
}
