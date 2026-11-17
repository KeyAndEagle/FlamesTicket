const BASE =
  'https://bookings.guildfordspectrum.co.uk/guildfordspectrum/api/v3';

const headers = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'public, max-age=60, s-maxage=300'
};

// Identify Guildford Flames home fixtures
function isFlamesGame(event) {
  const name = String(event.name || '').trim();

  return /^Guildford Flames v\s+/i.test(name);
}

// Extract the opponent's name
function getOpponent(name) {
  return name
    .replace(/^Guildford Flames v\s+/i, '')
    .replace(/\.$/, '')
    .trim();
}

// Retrieve JSON from Spektrix
async function fetchJSON(url) {
  const response = await fetch(url, {
    headers: {
      Accept: 'application/json'
    },
    signal: AbortSignal.timeout(12000)
  });

  if (!response.ok) {
    throw new Error(`Spektrix HTTP ${response.status}`);
  }

  return response.json();
}

// Retrieve upcoming performances
async function getEventInstances(event) {
  try {
    const instances = await fetchJSON(
      `${BASE}/events/${encodeURIComponent(event.id)}/instances`
    );

    if (!Array.isArray(instances)) {
      return [];
    }

    const now = Date.now();

    return instances
      .filter(instance => {
        const date = Date.parse(instance.start);

        return (
          Number.isFinite(date) &&
          date > now &&
          instance.cancelled !== true
        );
      })
      .map(instance => ({
        id: instance.id,
        opponent: getOpponent(event.name),
        date: instance.start,
        isOnSale: instance.isOnSale === true
      }));

  } catch (error) {
    console.error(
      `Could not retrieve ${event.name}:`,
      error.message
    );

    return [];
  }
}

// Retrieve ticket availability
async function getAvailability(game) {

  // Don't report ticket numbers before general sale
  if (!game.isOnSale) {
    return {
      id: game.id,
      opponent: game.opponent,
      date: game.date,
      remaining: null,
      capacity: null,
      complete: true,
      isOnSale: false,
      status: 'coming-soon'
    };
  }

  try {
    const data = await fetchJSON(
      `${BASE}/instances/${encodeURIComponent(game.id)}/status?includeChildPlans=true`
    );

    if (
      !Number.isInteger(data.available) ||
      data.available < 0
    ) {
      throw new Error('Invalid availability count');
    }

    return {
      id: game.id,
      opponent: game.opponent,
      date: game.date,
      remaining: data.available,
      capacity: data.capacity ?? null,
      complete: true,
      isOnSale: true,
      status: data.available === 0
        ? 'sold-out'
        : 'available'
    };

  } catch (error) {
    return {
      id: game.id,
      opponent: game.opponent,
      date: game.date,
      remaining: null,
      capacity: null,
      complete: false,
      isOnSale: true,
      status: 'unavailable',
      error: String(error.message || error)
    };
  }
}

// Main Netlify function
export default async () => {
  try {

    // STEP 1: Retrieve all events
    const events = await fetchJSON(`${BASE}/events`);

    if (!Array.isArray(events)) {
      throw new Error('Unexpected events response');
    }

    // STEP 2: Find Flames home fixtures
    const flamesEvents = events.filter(isFlamesGame);

    // STEP 3: Retrieve all performances
    const instanceResults = await Promise.all(
      flamesEvents.map(getEventInstances)
    );

    // STEP 4: Combine and sort upcoming games
    const upcomingGames = instanceResults
      .flat()
      .sort(
        (a, b) =>
          Date.parse(a.date) - Date.parse(b.date)
      );

    // STEP 5: Retrieve ticket availability
    const games = await Promise.all(
      upcomingGames.map(getAvailability)
    );

    // STEP 6: Return data to the dashboard
    return new Response(
      JSON.stringify({
        updatedAt: new Date().toISOString(),
        version: 3,
        totalEvents: events.length,
        flamesEventsFound: flamesEvents.length,
        upcomingGamesFound: upcomingGames.length,
        games
      }),
      {
        status: 200,
        headers
      }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        version: 3,
        error: String(error.message || error),
        games: []
      }),
      {
        status: 500,
        headers: {
          'content-type': 'application/json; charset=utf-8',
          'cache-control': 'no-store'
        }
      }
    );
  }
};

export const config = {
  path: '/api/availability'
};
