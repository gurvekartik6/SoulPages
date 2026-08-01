import client from './client';

export async function getOverview() {
  const { data } = await client.get('/stats/overview');
  return data;
}

export async function getMonthly() {
  const { data } = await client.get('/stats/monthly');
  return data;
}

export async function getYearly() {
  const { data } = await client.get('/stats/yearly');
  return data;
}

export async function getGenreStats() {
  const { data } = await client.get('/stats/genre');
  return data;
}

export async function getLeaderboard() {
  const { data } = await client.get('/stats/leaderboard');
  return data;
}

export async function getStreak(days = 90) {
  const { data } = await client.get('/stats/streak', { params: { days } });
  return data;
}

export async function getAchievements() {
  const { data } = await client.get('/stats/achievements');
  return data;
}

export async function getWrapped(year) {
  const { data } = await client.get('/stats/wrapped', { params: year ? { year } : {} });
  return data;
}
