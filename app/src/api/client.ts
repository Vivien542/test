import Constants from 'expo-constants';
import { Platform } from 'react-native';

export type User = {
  id: string;
  name: string;
  createdAt: string;
};

export type Session = {
  token: string;
  user: User;
};

/** Erreur renvoyée par l'API, avec un message déjà lisible par l'utilisateur. */
export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

const DEFAULT_PORT = 3000;

/**
 * Adresse de l'API.
 * 1. EXPO_PUBLIC_API_URL si elle est définie (cas d'un vrai déploiement) ;
 * 2. sinon l'IP de la machine qui sert le bundle Metro, ce qui marche depuis un
 *    téléphone sur le même réseau sans configuration ;
 * 3. sinon localhost.
 */
export const API_URL = resolveApiUrl();

function resolveApiUrl(): string {
  const configured = process.env.EXPO_PUBLIC_API_URL;
  if (configured) return configured.replace(/\/$/, '');

  const hostUri = Constants.expoConfig?.hostUri ?? Constants.expoGoConfig?.debuggerHost;
  const host = hostUri?.split(':')[0];
  if (host && host !== 'localhost' && host !== '127.0.0.1') {
    return `http://${host}:${DEFAULT_PORT}`;
  }

  // L'émulateur Android ne voit pas le localhost de la machine hôte.
  if (Platform.OS === 'android') return `http://10.0.2.2:${DEFAULT_PORT}`;
  return `http://localhost:${DEFAULT_PORT}`;
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH';
  body?: unknown;
  token?: string;
  signal?: AbortSignal;
};

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, token, signal } = options;

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers: {
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      signal,
    });
  } catch {
    throw new ApiError(`Serveur injoignable (${API_URL}).`, 0);
  }

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      payload && typeof payload.error === 'string' ? payload.error : 'Une erreur est survenue.';
    throw new ApiError(message, response.status);
  }

  return payload as T;
}

export function signUp(name: string, signal?: AbortSignal): Promise<Session> {
  return request<Session>('/api/users', { method: 'POST', body: { name }, signal });
}

export async function fetchUsers(signal?: AbortSignal): Promise<User[]> {
  const { users } = await request<{ users: User[] }>('/api/users', { signal });
  return users;
}

export async function fetchMe(token: string, signal?: AbortSignal): Promise<User> {
  const { user } = await request<{ user: User }>('/api/me', { token, signal });
  return user;
}

export async function renameMe(token: string, name: string, signal?: AbortSignal): Promise<User> {
  const { user } = await request<{ user: User }>('/api/me', {
    method: 'PATCH',
    body: { name },
    token,
    signal,
  });
  return user;
}
