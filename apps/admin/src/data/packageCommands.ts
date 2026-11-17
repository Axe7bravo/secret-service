import { httpsCallable } from 'firebase/functions';
import { getFirebaseFunctions } from '../../../../packages/firebase/src';
import type { AdminPackage,PackageDraft } from '../types/packages';
import { adminWriteMode } from './adminOperationCommands';
import { updateMockPackage } from './packageRepository';
export interface AdminPackageCommands {
  savePackage(input: PackageDraft, image?: File): Promise<void>;
  loadImage(packageId: string): Promise<string>;
}

function readImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error('The image could not be read.'));
    reader.onerror = () => reject(new Error('The image could not be read.'));
    reader.readAsDataURL(file);
  });
}

const firebaseCommands: AdminPackageCommands = {
  async savePackage(input, image) {
    const imageBase64 = image ? (await readImage(image)).split(',')[1] : undefined;
    try {
      await httpsCallable(getFirebaseFunctions(), 'savePackage')({ ...input, ...(imageBase64 ? { imageBase64 } : {}) });
    } catch (error) {
      const code = typeof error === 'object' && error && 'code' in error ? String(error.code) : '';
      if (error instanceof Error && ['functions/failed-precondition', 'functions/invalid-argument', 'functions/aborted'].includes(code)) throw error;
      if (code === 'functions/unauthenticated') throw new Error('Sign in again before continuing.');
      if (code === 'functions/permission-denied') throw new Error('This account cannot manage packages.');
      if (code === 'functions/already-exists') throw new Error('A package with that code already exists.');
      if (code === 'functions/not-found') throw new Error('The package no longer exists.');
      throw new Error('The package could not be saved.');
    }
  },
  async loadImage(packageId) {
    const { data } = await httpsCallable<{ packageId: string }, { base64: string }>(getFirebaseFunctions(), 'getAdminPackageImage')({ packageId });
    return `data:image/webp;base64,${data.base64}`;
  },
};

const mockImages = new Map<string, { id: string; url: string }>();
const mockCommands: AdminPackageCommands = {
  async savePackage(input, file) {
    const packageId = input.packageId ?? input.code;
    const image = file ? { id: crypto.randomUUID(), url: await readImage(file) } : mockImages.get(packageId);
    if (input.active && (!image || input.priceMinor <= 0)) throw new Error('Publishing requires an image and a positive price.');
    if (image) mockImages.set(packageId, image);
    const now = new Date().toISOString();
    const record: AdminPackage = { ...input, packageId, createdAt: now, updatedAt: now, ...(image ? { imageId: image.id } : {}) };
    updateMockPackage(record);
  },
  async loadImage(packageId) {
    const image = mockImages.get(packageId);
    if (!image) throw new Error('No image selected.');
    return image.url;
  },
};
export const adminPackageCommands=adminWriteMode==='firebase'?firebaseCommands:mockCommands;
