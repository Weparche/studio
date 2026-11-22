import assert from 'node:assert/strict';
import studio from '../src/server/public-landing.js';

const req=(path,method='GET')=>studio.fetch(new Request('https://studio.nepar.hr'+path,{method}));
const response=await req('/');
assert.equal(response.status,200);
assert.match(response.headers.get('content-type')??'',/text\/html/);
assert.match(response.headers.get('content-security-policy')??'',/default-src 'none'/);
assert.match(response.headers.get('content-security-policy')??'',/frame-ancestors 'none'/);
assert.match(response.headers.get('content-security-policy')??'',/script-src 'self'/);
const html=await response.text();
assert.ok(html.length>30000,'Full responsive landing must be built');
for(const part of [
  'Zamisli video.','Stvori ga.','Kako želiš započeti?','id="izradi"',
  'role="tablist"','role="tabpanel"','data-studio-mode="template"','data-studio-mode="free"',
  'data-template="santa"','data-template="nikola"','data-template="nuki"',
  'Odaberi predložak','Djed Božićnjak','Sveti Nikola','Nuki video',
  'studio-categories','Video iz predloška','Oživi fotografiju','Reklamni video',
  'NEPAR Studio Pro','Kako radi?','Za ideje koje zaslužuju biti viđene.',
  'Jednostavne cijene','100 kredita','200 kredita','U pripremi','mobile-bottom',
  'https://kids.nepar.hr/personaliziraj?gift=djed-bozicnjak',
  'https://kids.nepar.hr/personaliziraj?gift=sveti-nikola',
  'https://kids.nepar.hr/personaliziraj?gift=video'
])assert.ok(html.includes(part),'Missing public UI: '+part);
assert.match(html,/@media\(max-width:760px\)/);
assert.match(html,/@media\(max-width:360px\)/);
assert.match(html,/prefers-reduced-motion:reduce/);
assert.match(html,/aria-label="Brza mobilna navigacija"/);
assert.match(html,/Još nisu dostupni|još nisu dostupni/);
assert.match(html,/Napredna generacija iz vlastite ideje još je u pripremi/);
assert.ok(!html.includes('id="private-api"'));
assert.ok(!html.includes('src="https://kids.nepar.hr/assets/'),'All images must be self-hosted');
const script=await req('/studio.js');
assert.equal(script.status,200);
assert.match(script.headers.get('content-type')??'',/application\/javascript/);
const js=await script.text();
assert.match(js,/data-studio-mode/);
assert.match(js,/data-template/);
assert.match(js,/mailto:nepar@nepar.hr/);
for(const name of ['santa','nikola','nuki','nukipromo']){
  const res=await req('/img/'+name+'.webp');
  assert.equal(res.status,200);
  assert.equal(res.headers.get('content-type'),'image/webp');
  const bytes=new Uint8Array(await res.arrayBuffer());
  assert.ok(bytes.byteLength>10000,'Image missing '+name);
  assert.equal(String.fromCharCode(...bytes.slice(0,4)),'RIFF');
}
for(const path of ['/api/me','/api/generations','/media/generation/123','/settings']){
  const result=await req(path);
  assert.equal(result.status,404,'Old internal endpoint must be closed: '+path);
}
const method=await req('/','POST');
assert.equal(method.status,405);
assert.equal(method.headers.get('allow'),'GET, HEAD');
const head=await req('/','HEAD');
assert.equal(head.status,200);
assert.equal(await head.text(),'');
const health=await req('/healthz');
assert.equal(health.status,200);
assert.deepEqual(await health.json(),{ok:true,app:'nepar-studio-public',version:'2026.11.23'});
for(const path of ['/robots.txt','/sitemap.xml','/favicon.svg'])assert.equal((await req(path)).status,200);
console.log('PASS: responsive public landing v2, template chooser, Pro request, safe links, security headers, SEO, closed private endpoints');
