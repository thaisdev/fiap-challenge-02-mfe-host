import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

const USERS_COLLECTION = 'users';

function getFirestoreServiceAccount() {
  const { FIRESTORE_PROJECT_ID, FIRESTORE_CLIENT_EMAIL, FIRESTORE_PRIVATE_KEY } = process.env;

  if (FIRESTORE_PROJECT_ID && FIRESTORE_CLIENT_EMAIL && FIRESTORE_PRIVATE_KEY) {
    return {
      projectId: FIRESTORE_PROJECT_ID,
      clientEmail: FIRESTORE_CLIENT_EMAIL,
      privateKey: FIRESTORE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    };
  }

  return null;
}

export function getFirestoreClient(): Firestore | null {
  const serviceAccount = getFirestoreServiceAccount();

  if (!serviceAccount) {
    return null;
  }

  if (!getApps().length) {
    initializeApp({ credential: cert(serviceAccount), projectId: serviceAccount.projectId });
  }

  return getFirestore();
}

export function getUsersCollection() {
  const firestore = getFirestoreClient();
  if (!firestore) {
    return null;
  }

  return firestore.collection(USERS_COLLECTION);
}
