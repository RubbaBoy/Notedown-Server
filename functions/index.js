const functions = require('firebase-functions');
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://notedown.firebaseio.com'
});
let db = admin.firestore();

exports.addCategory = functions.https.onCall((input, context) => {
    const uid = context.auth.uid;
    const name = context.auth.token.name || null;

    let uidDoc = db.collection('users').doc(uid);

    return new Promise((resolve, reject) => {
        uidDoc.get().then(snapshot => {
            let data = snapshot.data();
            console.log(data);
            if (data === undefined) {
                data = {categories: []};
            }
            data.categories = data.categories || [];
            data.categories.push({id: uuidv4(), name: input.name});
            uidDoc.set(data)
                .then(() => resolve({message: `Hello ${name}! Your data is ${input.id} and ${input.name}`}))
                .catch(rej => {
                    console.error(rej);
                    reject({message: 'Error!', error: rej.toString()});
                });
        }).catch(rej => {
            console.error(rej);
            reject({message: 'Error!', error: rej.toString()});
        });
    });
});

exports.getCategories = functions.https.onCall((input, context) => {
    const uid = context.auth.uid;

    return new Promise((resolve, reject) => {
        let uidDoc = db.collection('users').doc(uid);
        uidDoc.get().then(snapshot => {
            let data = snapshot.data();
            let cat = data !== undefined ? (data.categories || []) : [];
            resolve({categories: cat});
        }).catch(rej => {
            console.error(rej);
            reject({categories: [], error: rej.toString()});
        });
    });
});

function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        let r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}