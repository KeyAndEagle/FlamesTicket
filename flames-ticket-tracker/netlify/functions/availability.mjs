import { readFile } from 'node:fs/promises';
const ROOT='https://bookings.guildfordspectrum.co.uk/guildfordspectrum/api/v3';
const pattern=/^[A-Z0-9]{15,60}$/;
const headers={'content-type':'application/json; charset=utf-8','cache-control':'public, max-age=60, s-maxage=300'};
export default async () => {
  let fixtures;
  try { fixtures=JSON.parse(await readFile(new URL('../../fixtures.json',import.meta.url),'utf8')); }
  catch { return new Response(JSON.stringify({error:'Fixture configuration missing'}),{status:500,headers}); }
  const now=Date.now();
  const upcoming=fixtures.filter(f=>Date.parse(f.date)>now).sort((a,b)=>Date.parse(a.date)-Date.parse(b.date));
  const games=await Promise.all(upcoming.map(async f=>{
    const areas=await Promise.all((f.areas||[]).map(async a=>{
      if(!pattern.test(f.instanceId)||!pattern.test(a.id))return {name:a.name,error:'Invalid identifier'};
      const url=`${ROOT}/instances/${f.instanceId}/status/areas/${a.id}?includeChildPlans=true&%24expand=bands`;
      try {
        const res=await fetch(url,{headers:{accept:'application/json'},signal:AbortSignal.timeout(9000)});
        if(!res.ok)throw Error(`Upstream HTTP ${res.status}`);
        const data=await res.json();
        if(!Number.isInteger(data.available)||data.available<0)throw Error('Missing valid available count');
        return {name:data.name||a.name,available:data.available,capacity:Number.isInteger(data.capacity)?data.capacity:null};
      } catch(e){return {name:a.name,error:String(e.message||e)};}
    }));
    const allSuccessful=areas.length>0&&areas.every(a=>Number.isInteger(a.available));
    const total=allSuccessful?areas.reduce((s,a)=>s+a.available,0):null;
    return {id:f.id,opponent:f.opponent,date:f.date,bookingUrl:f.bookingUrl,areasComplete:f.areasComplete===true,areas,trackedAreas:areas.length,trackedAvailable:total,remaining:f.areasComplete===true?total:null,complete:f.areasComplete===true&&allSuccessful};
  }));
  return new Response(JSON.stringify({updatedAt:new Date().toISOString(),games}),{headers});
};
export const config={path:'/api/availability'};
