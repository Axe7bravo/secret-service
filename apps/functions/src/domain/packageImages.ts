import { randomUUID } from 'node:crypto';
import { env } from 'node:process';
import { getStorage } from 'firebase-admin/storage';
import { HttpsError } from 'firebase-functions/v2/https';
import { getAdminApp } from '../firebaseAdmin.js';

const maxOriginalBytes = 5 * 1024 * 1024;
const maxOutputBytes = 1024 * 1024;
export const packageIdPattern = /^[A-Za-z0-9_-]{1,64}$/;
export const imageIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

export interface PackageImage {
  id: string;
  path: string;
  generation: string;
}

const imagePath = (packageId: string, id: string) => `package-images/${packageId}/${id}.webp`;
const bucket = () => getStorage(getAdminApp()).bucket(env.PACKAGE_IMAGES_BUCKET?.trim() || undefined);

function detectImageFormat(input: Buffer): 'jpeg' | 'png' | 'webp' | undefined {
  if (input[0] === 0xff && input[1] === 0xd8 && input[2] === 0xff) return 'jpeg';
  if (input.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) {
    // Reject APNG before decoding, including builds that only decode its first frame.
    for (let offset = 8; offset + 12 <= input.length;) {
      const length = input.readUInt32BE(offset);
      const chunk = input.toString('ascii', offset + 4, offset + 8);
      if (chunk === 'acTL' || offset + 12 + length > input.length) return;
      if (chunk === 'IEND') return 'png';
      offset += length + 12;
    }
    return;
  }
  if (input.toString('ascii', 0, 4) === 'RIFF' && input.toString('ascii', 8, 12) === 'WEBP') return 'webp';
}

export function packageImageFor(packageId: string, value: unknown): PackageImage | undefined {
  if (!packageIdPattern.test(packageId) || typeof value !== 'object' || value === null) return;
  const image = value as Partial<PackageImage>;
  if (typeof image.id !== 'string' || !imageIdPattern.test(image.id)
    || image.path !== imagePath(packageId, image.id)
    || typeof image.generation !== 'string' || !/^\d{1,24}$/.test(image.generation)) return;
  return { id: image.id, path: image.path, generation: image.generation };
}

export async function uploadPackageImage(packageId: string, encoded: unknown): Promise<PackageImage> {
  if (typeof encoded !== 'string' || !encoded.length || encoded.length > Math.ceil(maxOriginalBytes / 3) * 4
    || encoded.length % 4 !== 0 || !/^[A-Za-z0-9+/]+={0,2}$/.test(encoded)) {
    throw new HttpsError('invalid-argument', 'Select a JPEG, PNG or WebP image up to 5 MB.');
  }
  const input = Buffer.from(encoded, 'base64');
  if (input.length > maxOriginalBytes) throw new HttpsError('invalid-argument', 'The original image exceeds 5 MB.');
  let output: Buffer;
  const { default: sharp } = await import('sharp');
  try {
    const format = detectImageFormat(input);
    if (!format) throw new Error('Unsupported format');
    const decoder = sharp(input, { limitInputPixels: 20_000_000, failOn: 'warning' });
    const metadata = await decoder.metadata();
    if (metadata.format !== format || (metadata.pages ?? 1) !== 1) {
      throw new Error('Unsupported format');
    }
    output = await decoder.rotate().resize(1200, 900, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 82 }).toBuffer();
  } catch {
    throw new HttpsError('invalid-argument', 'The file must be a readable, still JPEG, PNG or WebP within 20 megapixels.');
  }
  if (output.length > maxOutputBytes) throw new HttpsError('invalid-argument', 'The processed image is too large. Choose a smaller image.');
  const id = randomUUID();
  const path = imagePath(packageId, id);
  const file = bucket().file(path);
  await file.save(output, {
    resumable: false,
    preconditionOpts: { ifGenerationMatch: 0 },
    metadata: { contentType: 'image/webp', cacheControl: 'private, no-store' },
  });
  const [metadata] = await file.getMetadata();
  if (typeof metadata.generation !== 'string') throw new Error('Package image generation is unavailable.');
  return { id, path, generation: metadata.generation };
}

export async function verifyPackageImage(image: PackageImage): Promise<void> {
  const [exists] = await bucket().file(image.path, { generation: image.generation }).exists();
  if (!exists) throw new HttpsError('failed-precondition', 'The saved package image is missing. Upload a replacement before publishing.');
}

export async function readPackageImage(image: PackageImage): Promise<Buffer> {
  const file = bucket().file(image.path, { generation: image.generation });
  const [data] = await file.download({ start: 0, end: maxOutputBytes, validation: false });
  if (data.length > maxOutputBytes) throw new Error('Saved package image exceeds its size limit.');
  return data;
}

export async function retirePackageImage(image: PackageImage): Promise<void> {
  await bucket().file(image.path, { generation: image.generation }).delete({ ignoreNotFound: true });
}

export function publicPackageImageUrl(packageId: string, image: PackageImage): string {
  const project = getAdminApp().options.projectId ?? env.GCLOUD_PROJECT ?? env.GOOGLE_CLOUD_PROJECT;
  if (!project || !/^[a-z][a-z0-9-]+$/.test(project)) throw new Error('Firebase project ID is unavailable.');
  return `https://us-central1-${project}.cloudfunctions.net/getPublicPackageImage?packageId=${encodeURIComponent(packageId)}&imageId=${image.id}`;
}
