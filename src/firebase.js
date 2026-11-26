import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// Public Firebase web config for project "tidora-4daca". These values only identify the
// project to Google; they are not secrets. Access is controlled by Firebase Authentication.
const firebaseConfig = {
  apiKey: 'AIzaSyB3O8551uulAsukzdTKzhHaxl_fY4fqA1U',
  authDomain: 'tidora-4daca.firebaseapp.com',
  projectId: 'tidora-4daca',
  storageBucket: 'tidora-4daca.firebasestorage.app',
  messagingSenderId: '886869984905',
  appId: '1:886869984905:web:37e56b04e1a83f45096858',
};

export const app = initializeApp(firebaseConfig);

// getAuth keeps the session in IndexedDB (local persistence), so login survives a refresh.
export const auth = getAuth(app);
