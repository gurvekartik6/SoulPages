import client from './client';

export async function getBooks(params = {}) {
  const { data } = await client.get('/books', { params });
  return data;
}

export async function getBook(id) {
  const { data } = await client.get(`/books/${id}`);
  return data;
}

export async function addBook(payload) {
  const { data } = await client.post('/books', payload);
  return data;
}

export async function addBookByIsbn(isbn) {
  const { data } = await client.post(`/books/isbn/${isbn}`);
  return data;
}

export async function updateBook(id, payload) {
  const { data } = await client.put(`/books/${id}`, payload);
  return data;
}

export async function deleteBook(id) {
  await client.delete(`/books/${id}`);
}

export async function updateProgress(id, payload) {
  const { data } = await client.put(`/books/${id}/progress`, payload);
  return data;
}

export async function getBookStats(id) {
  const { data } = await client.get(`/books/${id}/stats`);
  return data;
}

export async function importBooks(books) {
  const { data } = await client.post('/books/import', { books });
  return data;
}

export async function getBookQuotes(bookId) {
  const { data } = await client.get(`/books/${bookId}/quotes`);
  return data;
}

export async function addBookQuote(bookId, payload) {
  const { data } = await client.post(`/books/${bookId}/quotes`, payload);
  return data;
}

export async function deleteBookQuote(bookId, quoteId) {
  await client.delete(`/books/${bookId}/quotes/${quoteId}`);
}
