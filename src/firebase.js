// src/firebase.js — Firebase v10 Modular SDK with Mock Fallback

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const IS_MOCK = firebaseConfig.apiKey === 'MOCK_KEY_123';

// --- Mock Firestore (LocalStorage fallback) ---
class MockFirestore {
  constructor() {
    this.dbName = 'secret-service-mock-db';
  }

  async addDocument(collectionName, data) {
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const dbStore = this._getStore();
    if (!dbStore[collectionName]) {
      dbStore[collectionName] = [];
    }

    const newId = `DISPATCH_${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    const document = {
      id: newId,
      created_at: new Date().toISOString(),
      ...data,
    };

    dbStore[collectionName].push(document);
    this._saveStore(dbStore);

    console.group(`[Firebase Mock] Collection: ${collectionName}`);
    console.log(`Document ID: ${newId}`);
    console.log('Payload:', document);
    console.groupEnd();

    return { id: newId, data: () => document };
  }

  _getStore() {
    const store = localStorage.getItem(this.dbName);
    return store ? JSON.parse(store) : {};
  }

  _saveStore(store) {
    localStorage.setItem(this.dbName, JSON.stringify(store));
  }
}

// --- Exports: db, collection, addDoc ---
let db;
let collection;
let addDoc;

if (IS_MOCK) {
  console.log('[Firebase] Running in MOCK mode (LocalStorage). Swap .env keys for production.');
  const mockInstance = new MockFirestore();
  db = mockInstance;
  collection = (_db, name) => name;
  addDoc = (colPath, data) => mockInstance.addDocument(colPath, data);
} else {
  // Dynamic import of real Firebase SDK — only loaded when real keys are present
  const { initializeApp } = await import('firebase/app');
  const firestore = await import('firebase/firestore');

  const app = initializeApp(firebaseConfig);
  db = firestore.getFirestore(app);
  collection = firestore.collection;
  addDoc = firestore.addDoc;

  console.log('[Firebase] Initialized with project:', firebaseConfig.projectId);
}

export { db, collection, addDoc };
