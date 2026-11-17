const BASE =
  'https://bookings.guildfordspectrum.co.uk/guildfordspectrum/api/v3';

const headers = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'public, max-age=60, s-maxage=300'
};

// Only include Guildford Flames home fixtures
function isFlamesGame(event) {
  const name = String(event.name || '').trim();

  return /^Guildford Flames v\s+/i.test(name);
}

// Extract opponent from event name
function getOpponent(name) {
  return name
    .replace(/^Guildford Flames v\s+/i, '')
    .replace(/\.$/, '')
    .trim();
}

// Fetch JSON from Spektrix
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

// Retrieve all performances for an event
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
        eventId: event.id,
        opponent: getOpponent(event.name),
        date: instance.start,
        isOnSale: instance.isOnSale,
        cancelled: instance.cancelled
      }));

  } catch (error) {
    console.error(
      `Could not retrieve instances for ${event.name}:`,
      error.message
    );

    return [];
  }
}

// Retrieve remaining tickets
async function getAvailability(game) {
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
      isOnSale: game.isOnSale
    };

  } catch (error) {
    return {
      id: game.id,
      opponent: game.opponent,
      date: game.date,
      remaining: null,
      capacity: null,
      complete: false,
      isOnSale: game.isOnSale,
      error: String(error.message || error)
    };
  }
}

// Main Netlify function
export default async () => {
  try {

    // STEP 1: Retrieve all Spektrix events
    const events = await fetchJSON(`${BASE}/events`);

    if (!Array.isArray(events)) {
      throw new Error('Unexpected events response');
    }

    // STEP 2: Identify Flames home fixtures
    const flamesEvents = events.filter(isFlamesGame);

    // STEP 3: Retrieve performances for every fixture
    const instanceResults = await Promise.all(
      flamesEvents.map(getEventInstances)
    );

    // STEP 4: Combine all upcoming performances
    const upcomingGames = instanceResults
      .flat()
      .sort(
        (a, b) =>
          Date.parse(a.date) - Date.parse(b.date)
      );

    // STEP 5: Check ticket availability
    const games = await Promise.all(
      upcomingGames.map(getAvailability)
    );

    // STEP 6: Return results to dashboard
    return new Response(
      JSON.stringify({
        updatedAt: new Date().toISOString(),
        version: 3,
        totalEvents: events.length,
        flamesEventsFound: flamesEvents.length,
        upcomingGamesFound: upcomingGames.length,
        games
      }, null, 2),
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
      }, null, 2),
      {
        status: 500,
        headers: {
          'content-type': 'application/json'
        }
      }
    );

  }
};

export const config = {
  path: '/api/availability-v3'
};
