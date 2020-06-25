import * as firebase from 'firebase/app';
import 'firebase/database';

const app = firebase.initializeApp({
  apiKey: 'AIzaSyB1kR0Nv_gr7PRYrlRM5B3FTf_GCasvOxs',
  authDomain: 'little-printer.firebaseapp.com',
  databaseURL: 'https://little-printer.firebaseio.com',
  projectId: 'little-printer',
  storageBucket: 'little-printer.appspot.com',
  messagingSenderId: '869929008471',
  appId: '1:869929008471:web:21795422c6eca735469212',
});

export function getData(): any {
  return app
    .database()
    .ref('data')
    .once('value')
    .then((snapshot) => snapshot.val());
}

export function getInfo(cb: (infoVal: any) => void): any {
  const infoRef = app.database().ref('info');

  infoRef.child('online').onDisconnect().set(false);
  infoRef.child('online').set(true);

  infoRef.on('value', (snapshot) => {
    cb(snapshot.val());
  });
}

export const cleanupDb = (): Promise<any> => app.delete();
