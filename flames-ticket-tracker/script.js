// Guildford Flames Ticket Tracker
// Version 3 - Automatic Fixture Discovery

const el = id => document.getElementById(id);

// Format dates in UK time
const fmt = d => new Intl.DateTimeFormat('en-GB', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'Europe/London'
}).format(new Date(d));


// Determine ticket status
function getStatus(game) {

  if (game.status === 'coming-soon' || game.isOnSale === false) {
    return {
      label: 'COMING SOON',
      count: 'Not yet on sale',
      className: 'soon'
    };
  }

  if (
    game.status === 'unavailable' ||
    game.complete === false ||
    game.remaining === null ||
    !Number.isFinite(game.remaining)
  ) {
    return {
      label: 'DATA UNAVAILABLE',
      count: 'Availability unknown',
      className: 'warn'
    };
  }

  if (game.status === 'sold-out' || game.remaining === 0) {
    return {
      label: 'SOLD OUT',
      count: '0 left',
      className: 'sold'
    };
  }

  if (game.remaining < 50) {
    return {
      label: 'LOW AVAILABILITY',
      count: `${game.remaining} left`,
      className: 'warn'
    };
  }

  return {
    label: 'AVAILABLE',
    count: `${game.remaining} left`,
    className: 'ok'
  };
}


// Refresh dashboard
async function refresh() {

  el('refresh').disabled = true;

  try {

    const res = await fetch('/api/availability', {
      cache: 'no-store'
    });

    if (!res.ok) {
      throw new Error(`Dashboard API HTTP ${res.status}`);
    }

    const data = await res.json();

    if (!Array.isArray(data.games)) {
      throw new Error('Invalid dashboard response');
    }

    // Update dashboard statistics
    el('gameCount').textContent = data.games.length;

    el('soldOut').textContent = data.games.filter(
      game => getStatus(game).label === 'SOLD OUT'
    ).length;

    el('lowCount').textContent = data.games.filter(
      game => getStatus(game).label === 'LOW AVAILABILITY'
    ).length;

    el('updated').textContent =
      'Last checked: ' + fmt(data.updatedAt);

    // Clear existing fixtures
    el('games').replaceChildren();

    if (!data.games.length) {
      el('games').textContent =
        'No upcoming home fixtures currently available.';
      return;
    }

    // Sort fixtures chronologically
    const games = [...data.games].sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    );

    // Create fixture cards
    for (const game of games) {

      const status = getStatus(game);

      const card = document.createElement('article');
      card.className = 'card';

      // LEFT SIDE
      const left = document.createElement('div');

      const date = document.createElement('p');
      date.textContent = fmt(game.date);

      const title = document.createElement('h3');
      title.textContent =
        'Guildford Flames v ' + game.opponent;

      const badge = document.createElement('span');
      badge.className = 'pill ' + status.className;
      badge.textContent = status.label;

      left.append(date, title, badge);

      // RIGHT SIDE
      const right = document.createElement('div');
      right.className = 'right';

      const count = document.createElement('div');
      count.className = 'count';
      count.textContent = status.count;

      const detail = document.createElement('small');

      if (status.label === 'COMING SOON') {

        detail.textContent =
          'Tickets not yet on sale';

      } else if (status.label === 'DATA UNAVAILABLE') {

        detail.textContent =
          'Live availability check unavailable';

      } else {

        detail.textContent =
          'Public instance availability' +
          (
            Number.isFinite(game.capacity)
              ? ' · capacity ' + game.capacity
              : ''
          );

      }

      right.append(count, detail);

      card.append(left, right);

      el('games').append(card);
    }

  } catch (error) {

    el('updated').textContent =
      'Update failed: ' + error.message +
      ' — try again shortly.';

    console.error('Ticket Tracker:', error);

  } finally {

    el('refresh').disabled = false;

  }
}


// Manual refresh button
el('refresh').addEventListener('click', refresh);

// Initial load
refresh();

// Automatic refresh every five minutes
setInterval(refresh, 300000);
