export { firebaseConfigurationError } from './config';
export { getFirebaseApp,getFirebaseAuth } from './client';
export { firebaseAuthService,mapFirebaseAuthError } from './authService';
export { getFirebaseFirestore } from './firestoreClient';
export { FIRESTORE_COLLECTIONS } from './firestore/collections';
export type { AuthClaims,AuthRole,AuthSession,AuthUser,SignUpInput } from './types';
export type { CustomerOperationDocument,CustomerProjectionStatus,InternalOperationStatus,OperationActivityDocument,OperationDocument,OperationInternalDocument } from './firestore/documents';
