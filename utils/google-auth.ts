let GoogleSignin: any = null;
let statusCodes: any = {};

try {
  const GoogleModule = require('@react-native-google-signin/google-signin');
  GoogleSignin = GoogleModule.GoogleSignin;
  statusCodes = GoogleModule.statusCodes;
} catch (e) {
  console.warn('Google Sign-In native module not found. Google login will not work in Expo Go.');
}

import api from './api';

export const configureGoogleSignin = () => {
  if (GoogleSignin) {
    GoogleSignin.configure({
      webClientId: '438419431891-rnaijt4bkmd1gab760ndbuv6frpvsdkq.apps.googleusercontent.com',
      offlineAccess: true,
    });
  }
};

export const signOutGoogle = async () => {
  if (GoogleSignin) {
    try {
      await GoogleSignin.signOut();
    } catch (error) {
      console.error('Google SignOut Error:', error);
    }
  }
};

export const handleGoogleSignIn = async (setAuth: Function, router: any, showAlert: Function, setLoading: Function) => {
  if (!GoogleSignin) {
    showAlert('Google Sign-In is not supported in Expo Go. Please use a Development Build.', 'error');
    return;
  }
  
  try {
    setLoading(true);
    await GoogleSignin.hasPlayServices();
    const userInfo = await GoogleSignin.signIn();
    const idToken = userInfo.data?.idToken;

    if (!idToken) {
      throw new Error('No ID token received from Google');
    }

    // Send to backend
    const response = await api.post('/auth/google-login', { idToken });
    const { user, token } = response.data.data;
    
    setAuth(user, token);
    router.replace('/(tabs)');
    showAlert('Welcome to Terra! 🌱', 'success');
  } catch (error: any) {
    if (error.code === statusCodes.SIGN_IN_CANCELLED) {
      // user cancelled
    } else if (error.code === statusCodes.IN_PROGRESS) {
      // in progress
    } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      showAlert('Google Play Services not available', 'error');
    } else {
      console.error('Google Sign-In Error:', error);
      showAlert('Google authentication failed', 'error');
    }
  } finally {
    setLoading(false);
  }
};
