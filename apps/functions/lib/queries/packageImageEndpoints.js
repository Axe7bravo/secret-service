import { HttpsError, onCall, onRequest } from 'firebase-functions/v2/https';
import { requireAdmin } from '../auth/requireAdmin.js';
import { getAdminFirestore } from '../firebaseAdmin.js';
import { imageIdPattern, packageIdPattern, packageImageFor, readPackageImage } from '../domain/packageImages.js';
async function currentPackage(packageId) {
    return (await getAdminFirestore().collection('packages').doc(packageId).get()).data();
}
export const getAdminPackageImage = onCall({ maxInstances: 5 }, async (request) => {
    requireAdmin(request);
    const packageId = request.data?.packageId;
    if (typeof packageId !== 'string' || !packageIdPattern.test(packageId)) {
        throw new HttpsError('invalid-argument', 'Invalid package ID.');
    }
    const image = packageImageFor(packageId, (await currentPackage(packageId))?.image);
    if (!image)
        throw new HttpsError('not-found', 'Package image not found.');
    try {
        return { base64: (await readPackageImage(image)).toString('base64') };
    }
    catch {
        throw new HttpsError('unavailable', 'The saved package image could not be read.');
    }
});
export const getPublicPackageImage = onRequest({ region: 'us-central1', maxInstances: 10 }, async (request, response) => {
    response.set({ 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
    if (request.method !== 'GET') {
        response.status(405).set('Allow', 'GET').end();
        return;
    }
    const { packageId, imageId } = request.query;
    if (typeof packageId !== 'string' || !packageIdPattern.test(packageId)
        || typeof imageId !== 'string' || !imageIdPattern.test(imageId)) {
        response.status(404).end();
        return;
    }
    try {
        const record = await currentPackage(packageId);
        const image = packageImageFor(packageId, record?.image);
        if (record?.active !== true || record.packageId !== packageId || record.currency !== 'ZAR'
            || !Number.isSafeInteger(record.priceMinor) || record.priceMinor <= 0 || !image || image.id !== imageId) {
            response.status(404).end();
            return;
        }
        response.type('image/webp').send(await readPackageImage(image));
    }
    catch {
        response.status(503).end();
    }
});
