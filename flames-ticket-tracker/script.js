const el=id=>document.getElementById(id);
const fmt=d=>new Intl.DateTimeFormat('en-GB',{weekday:'short',day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit',timeZone:'Europe/London'}).format(new Date(d));
async function refresh(){el('refresh').disabled=true;try{
 const res=await fetch('/api/availability',{cache:'no-store'});if(!res.ok)throw Error(`Dashboard API HTTP ${res.status}`);
 const data=await res.json();el('gameCount').textContent=data.games.length;
 el('soldOut').textContent=data.games.filter(g=>g.complete&&g.remaining===0).length;
 el('lowCount').textContent=data.games.filter(g=>g.complete&&g.remaining>0&&g.remaining<50).length;
 el('updated').textContent='Last checked: '+fmt(data.updatedAt);
 el('games').replaceChildren();if(!data.games.length)el('games').textContent='No upcoming fixtures configured.';
 for(const g of data.games){const card=document.createElement('article');card.className='card';
 const left=document.createElement('div');const date=document.createElement('p');date.textContent=fmt(g.date);const title=document.createElement('h3');title.textContent='Guildford Flames v '+g.opponent;
 const badge=document.createElement('span');badge.className='pill '+(g.complete?(g.remaining===0?'sold':g.remaining<50?'warn':'ok'):'');badge.textContent=g.complete?(g.remaining===0?'SOLD OUT':g.remaining<50?'LOW AVAILABILITY':'AVAILABLE'):'PARTIAL DATA';
 left.append(date,title,badge);const right=document.createElement('div');right.className='right';const count=document.createElement('div');count.className='count';count.textContent=g.complete?`${g.remaining} left`:'Total unknown';const detail=document.createElement('small');
 detail.textContent=g.areas.some(a=>a.error)?'Live data unavailable for one or more areas':g.complete?`${g.trackedAreas} areas checked`:`${g.trackedAvailable??'—'} available in ${g.trackedAreas} tracked area(s) only`;
 const link=document.createElement('a');link.className='link';link.href=g.bookingUrl;link.target='_blank';link.rel='noopener noreferrer';link.textContent='View tickets ↗';right.append(count,detail,link);card.append(left,right);el('games').append(card);
 }
 }catch(e){el('updated').textContent='Update failed: '+e.message+' — try again shortly.';}finally{el('refresh').disabled=false;}}
el('refresh').addEventListener('click',refresh);refresh();setInterval(refresh,300000);
