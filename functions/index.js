const functions = require('firebase-functions');
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');
const emptyData = {categories: [], notes: []};

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://notedown.firebaseio.com'
});
let db = admin.firestore();

exports.addCategory = functions.https.onCall((input, context) => {
    return new Promise((resolve, reject) => {
        if (input.name === undefined) {
            resolve({success: false, error: 'Field \'name\' must be set'});
            return;
        }

        let uidDoc = db.collection('users').doc(context.auth.uid);
        uidDoc.get().then(snapshot => {
            let data = snapshot.data() || {categories: []};
            let id = uuidv4();
            data.categories = data.categories || [];
            data.categories.push({id: id, name: input.name});
            uidDoc.set(data)
                .then(() => resolve({success: true, id: id}))
                .catch(rej => {
                    console.error(rej);
                    resolve({success: false, error: rej.toString()});
                });
        }).catch(rej => {
            console.error(rej);
            resolve({success: false, error: rej.toString()});
        });
    });
});

exports.getCategories = functions.https.onCall((input, context) => {
    return new Promise((resolve, reject) => {
        let uidDoc = db.collection('users').doc(context.auth.uid);
        uidDoc.get().then(snapshot => {
            let data = snapshot.data() || emptyData;
            resolve({success: true, categories: data.categories || []});
        }).catch(rej => {
            console.error(rej);
            resolve({success: false, error: rej.toString(), categories: []});
        });
    });
});

exports.editNote = functions.https.onCall((input, context) => {
    return new Promise((resolve, reject) => {
        let uid = context.auth.uid;
        let notesCollection = db.collection('users').doc(uid).collection('notes');
        let creating = input.id === undefined;
        let editingId = input.id || uuidv4();
        let categoryId = input.category;
        let newTitle = input.title;
        let newContent = input.content;

        let editingDocument = notesCollection.doc(editingId);
        editingDocument.get().then(snapshot => {
            let data = snapshot.data() || {};
            if (newTitle !== undefined) data.title = newTitle;
            if (newContent !== undefined) data.content = newContent;
            if (creating || categoryId !== undefined) data.categoryId = categoryId || '';

            editingDocument.set(data)
                .then(() => resolve({success: true, id: editingId}))
                .catch(rej => {
                    console.error(rej);
                    resolve({success: false, error: rej.toString()});
                });
        }).catch(rej => {
            console.error(rej);
            resolve({success: false, error: rej.toString()});
        });
    });
});

function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        let r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}