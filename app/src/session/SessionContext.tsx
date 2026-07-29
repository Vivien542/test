import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { ApiError, fetchMe, renameMe, signUp, type Session, type User } from '../api/client';
import { clearSession, loadSession, saveSession } from './storage';

type SessionState =
  | { status: 'loading'; user: null }
  | { status: 'signedOut'; user: null }
  | { status: 'signedIn'; user: User };

type SessionContextValue = {
  status: SessionState['status'];
  user: User | null;
  token: string | null;
  signUpWithName: (name: string) => Promise<void>;
  rename: (name: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<SessionState>({ status: 'loading', user: null });
  const tokenRef = useRef<string | null>(null);

  const applySession = useCallback(async (session: Session) => {
    tokenRef.current = session.token;
    await saveSession(session);
    setState({ status: 'signedIn', user: session.user });
  }, []);

  // Au démarrage : on relit la session locale, puis on la rafraîchit si le réseau répond.
  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    (async () => {
      const stored = await loadSession();
      if (cancelled) return;

      if (!stored) {
        setState({ status: 'signedOut', user: null });
        return;
      }

      tokenRef.current = stored.token;
      setState({ status: 'signedIn', user: stored.user });

      try {
        const user = await fetchMe(stored.token, controller.signal);
        if (!cancelled) await applySession({ token: stored.token, user });
      } catch (error) {
        // Hors ligne : on garde la session locale. Token rejeté : on repart de zéro.
        if (!cancelled && error instanceof ApiError && error.status === 401) {
          tokenRef.current = null;
          await clearSession();
          setState({ status: 'signedOut', user: null });
        }
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [applySession]);

  const signUpWithName = useCallback(
    async (name: string) => {
      const session = await signUp(name);
      await applySession(session);
    },
    [applySession],
  );

  const rename = useCallback(
    async (name: string) => {
      const token = tokenRef.current;
      if (!token) throw new ApiError('Session introuvable.', 401);
      const user = await renameMe(token, name);
      await applySession({ token, user });
    },
    [applySession],
  );

  const signOut = useCallback(async () => {
    tokenRef.current = null;
    await clearSession();
    setState({ status: 'signedOut', user: null });
  }, []);

  const value = useMemo<SessionContextValue>(
    () => ({
      status: state.status,
      user: state.user,
      token: tokenRef.current,
      signUpWithName,
      rename,
      signOut,
    }),
    [state, signUpWithName, rename, signOut],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const context = useContext(SessionContext);
  if (!context) throw new Error('useSession doit être utilisé dans un SessionProvider.');
  return context;
}
