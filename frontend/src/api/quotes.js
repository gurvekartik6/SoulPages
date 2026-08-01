import client from './client';

export async function getAllQuotes() {
  const { data } = await client.get('/quotes');
  return data;
}
