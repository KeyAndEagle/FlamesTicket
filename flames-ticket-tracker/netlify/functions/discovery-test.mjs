const BASE =
  'https://bookings.guildfordspectrum.co.uk/guildfordspectrum/api/v3';

const INSTANCE_ID =
  '877601ACBVBBDDKMJRCLSKCVJDVGLDSKP';

export default async () => {
  try {
    const response = await fetch(
      `${BASE}/instances/${INSTANCE_ID}/status?includeChildPlans=true`,
      {
        headers: {
          Accept: 'application/json'
        },
        signal: AbortSignal.timeout(15000)
      }
    );

    const raw = await response.text();

    if (!response.ok) {
      return new Response(
        JSON.stringify({
          success: false,
          status: response.status,
          error: raw.slice(0, 1000)
        }, null, 2),
        {
          headers: {
            'content-type': 'application/json'
          }
        }
      );
    }

    const data = JSON.parse(raw);

    return new Response(
      JSON.stringify({
        success: true,
        fixture: 'Guildford Flames v Coventry Blaze',
        date: '2026-11-22',
        response: data
      }, null, 2),
      {
        headers: {
          'content-type': 'application/json',
          'cache-control': 'no-store'
        }
      }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: String(error.message || error)
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
  path: '/api/discovery-test'
};
