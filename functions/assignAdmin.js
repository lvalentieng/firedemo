const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// Leggi l'email da variabile d'ambiente o da argomento CLI
const email = process.env.ADMIN_EMAIL || process.argv[2];

if (!email) {
  console.error('Specifica l\'email: node assignAdmin.js <email>');
  process.exit(1);
}

admin.auth().getUserByEmail(email)
  .then((user) => {
    return admin.auth().setCustomUserClaims(user.uid, { role: 'admin' });
  })
  .then(() => {
    console.log(`Admin role assigned successfully to ${email}`);
    process.exit();
  })
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });