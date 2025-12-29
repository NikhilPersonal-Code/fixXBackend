import admin from 'firebase-admin';

try {
  admin.initializeApp({
    credential: admin.credential.cert(
      JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_SECRET as string),
    ),
  });
} catch (error) {
  console.log('Firebase already initialized or error:', error);
}

export default admin;
