import { useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged, signInAnonymously, User } from 'firebase/auth';
import { app } from '../firebase';

type AuthState = {
  ready: boolean;
  user: User | null;
  error?: string;
};

/**
 * Automatically signs the user in anonymously so Firestore rules with request.auth pass.
 * Keeps state for UI gating.
 */
export function useAnonymousAuth(): AuthState {
  const [state, setState] = useState<AuthState>({ ready: false, user: null });
  const auth = getAuth(app);

  useEffect(() => {
    const unsub = onAuthStateChanged(
      auth,
      (user) => {
        if (user) {
          setState({ ready: true, user });
        } else {
          signInAnonymously(auth).catch((err) =>
            setState({ ready: true, user: null, error: err.message })
          );
        }
      },
      (err) => setState({ ready: true, user: null, error: err.message })
    );

    return () => unsub();
  }, [auth]);

  return state;
}
