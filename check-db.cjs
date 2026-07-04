const admin = require('firebase-admin');
const serviceAccount = require('./firebase-applet-config.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function check() {
  const doc = await db.collection('app_data').doc('global_state').get();
  console.log(JSON.stringify(doc.data().weeklySchedule, null, 2));
}

check().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
