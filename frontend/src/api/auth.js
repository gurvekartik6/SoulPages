import client from './client';

export async function register(payload) {
  const { data } = await client.post('/auth/register', payload);
  return data;
}

export async function login(payload) {
  const { data } = await client.post('/auth/login', payload);
  return data;
}

export async function fetchMe() {
  const { data } = await client.get('/auth/me');
  return data;
}

export async function updateProfile(payload) {
  const { data } = await client.put('/auth/me', payload);
  return data;
}

export async function changePassword(payload) {
  const { data } = await client.put('/auth/password', payload);
  return data;
}

export async function logout() {
  const { data } = await client.post('/auth/logout');
  return data;
}
