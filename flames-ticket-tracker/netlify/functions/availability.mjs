import { readFile } from 'node:fs/promises';

const ROOT = 'https://bookings.guildfordspectrum.co.uk/guildfordspectrum/api/v3';

const headers = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'public, max-age=60, s-maxage=300'
};

const pattern = /^[A-Z0-9]{15,60}$/;

export default async () => {
  let fixtures;

  try {
    fixtures = JSON.parse(
      await readFile(
        new URL('../../fixtures.json', import.meta.url),
        'utf8'
      )
    );
  } catch {
    return new Response(
      JSON.stringify({ error: 'Fixture configuration missing' }),
      { status: 500, headers }
    );
  }

  const now = Date.now();

  const upcoming = fixtures
    .filter(f => Date.parse(f.date) > now)
    .sort((a, b) => Date.parse(a.date) - Date.parse(b.date));

  const games = await Promise.all(
    upcoming.map(async f => {

      if (!pattern.test(f.instanceId)) {
        return {
          id: f.id,
          opponent: f.opponent,
          date: f.date,
          bookingUrl: f.bookingUrl,
          remaining: null,
          complete: false,
          error: 'Invalid instance ID'
        };
      }

      const url =
        `${ROOT}/instances/${f.instanceId}/status?includeChildPlans=true`;

      try {
        const res = await fetch(url, {
          headers: { accept: 'application/json' },
          signal: AbortSignal.timeout(9000)
        });

        if (!res.ok) {
          throw new Error(`Spektrix HTTP ${res.status}`);
        }

        const data = await res.json();

        if (!Number.isInteger(data.available) || data.available < 0) {
          throw new Error('Invalid availability count');
        }

        return {
          id: f.id,
          opponent: f.opponent,
          date: f.date,
          bookingUrl: f.bookingUrl,
          remaining: data.available,
          capacity: data.capacity,
          complete: true
        };

      } catch (error) {
        return {
          id: f.id,
          opponent: f.opponent,
          date: f.date,
          bookingUrl: f.bookingUrl,
          remaining: null,
          complete: false,
          error: String(error.message || error)
        };
      }
    })
  );

  return new Response(
    JSON.stringify({
      updatedAt: new Date().toISOString(),
      games
    }),
    { headers }
  );
};

export const config = {
  path: '/api/availability'
};
