// Shared public-safe boundary. Never spread a Firestore document into the result.
export async function loadActivePackages(db) {
    const snapshot = await db.collection('packages').where('active', '==', true)
        .orderBy('displayOrder', 'asc').limit(200).get();
    return snapshot.docs.map(document => {
        const record = document.data();
        if (record.active !== true || record.packageId !== document.id
            || typeof record.code !== 'string' || typeof record.name !== 'string'
            || typeof record.shortDescription !== 'string'
            || (record.description !== undefined && typeof record.description !== 'string')
            || typeof record.priceMinor !== 'number' || !Number.isSafeInteger(record.priceMinor) || record.priceMinor < 0
            || record.currency !== 'ZAR' || typeof record.displayOrder !== 'number'
            || !Number.isSafeInteger(record.displayOrder) || record.displayOrder < 0) {
            throw new Error('Invalid active package catalogue record.');
        }
        return {
            packageId: document.id, code: record.code, name: record.name,
            shortDescription: record.shortDescription,
            description: record.description ?? record.shortDescription,
            priceMinor: record.priceMinor, currency: 'ZAR', displayOrder: record.displayOrder,
        };
    }).sort((a, b) => a.displayOrder - b.displayOrder || (a.packageId < b.packageId ? -1 : a.packageId > b.packageId ? 1 : 0));
}
