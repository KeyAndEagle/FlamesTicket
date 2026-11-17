const URL =
  'https://www.guildfordspectrum.co.uk/ice-hockey-events/';

export default async () => {
  try {
    const response = await fetch(URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        Accept: 'text/html'
      },
      signal: AbortSignal.timeout(10000)
    });

    const html = await response.text();

    const eventIds = [
      ...new Set(
        [...html.matchAll(/EventId=(\d+)/gi)]
          .map(match => match[1])
      )
    ];

    return new Response(
      JSON.stringify({
        success: response.ok,
        status: response.status,
        htmlLength: html.length,
        eventIds,
        sample: html.slice(0, 300)
      }),
      {
        headers: {
          'content-type': 'application/json'
        }
      }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: String(error.message || error)
      }),
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
  path: '/api/discovery-test'
};
