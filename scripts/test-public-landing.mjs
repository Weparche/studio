import assert from 'node:assert/strict';
import studio from '../src/server/public-landing.js';

const req=(path,method='GET')=>studio.fetch(new Request('https://studio.nepar.hr'+path,{method}));
const home=await req('/');
assert.equal(home.status,200);
assert.match(home.headers.get('content-type')??'',/text\/html/);
assert.match(home.headers.get('content-security-policy')??'',/default-src 'none'/);
assert.match(home.headers.get('content-security-policy')??'',/script-src 'self'/);
assert.match(home.headers.get('content-security-policy')??'',/frame-ancestors 'none'/);
const html=await home.text();
assert.ok(html.length>45000,'Full responsive cinematic landing should be built');
for(const part of [
  'TVOJ AI VIDEO STUDIO','Zamisli video.','Stvori ga s','NEPAR Studijem.',
  'studio-capabilities','Video iz predloška','Oživi fotografiju','AI video za posao','Studio Pro',
  'Popularni predlošci','Rođendanska pjesma','Sveti Nikola','Djed Božićnjak','Nuki video',
  'studio-template-search','data-template="santa"','data-template="nikola"','data-template="nuki"',
  'id="panel-template"','id="panel-free"','role="tablist"',
  'Poruku upisuješ u sljedećem koraku','Uskoro','Kako radi?','Jednostavne cijene',
  '100 kredita','200 kredita','mobile-bottom','prefers-reduced-motion:reduce',
  'https://kids.nepar.hr/personaliziraj?gift=djed-bozicnjak',
  'https://kids.nepar.hr/personaliziraj?gift=sveti-nikola',
  'https://kids.nepar.hr/personaliziraj?gift=video'
])assert.ok(html.includes(part),'Missing UI: '+part);
assert.equal((html.match(/<section class="templates"/g)||[]).length,1);
assert.equal((html.match(/class="template template-/g)||[]).length,4);
assert.equal((html.match(/class="capability /g)||[]).length,4);
assert.match(html,/@media\(max-width:760px\)/);
assert.match(html,/@media\(max-width:365px\)/);
assert.ok(!html.includes('id="private-api"'));
assert.ok(!html.includes('src="https://kids.nepar.hr/assets/'),'Images are self-hosted');
const jsRes=await req('/studio.js');
assert.equal(jsRes.status,200);
assert.match(jsRes.headers.get('content-type')??'',/application\/javascript/);
const js=await jsRes.text();
for(const fragment of ['chooseTemplate','studio-template-search','data-template','mailto:nepar@nepar.hr','toLocaleLowerCase'])assert.ok(js.includes(fragment),'Missing JS: '+fragment);
for(const name of ['santa','nikola','nuki','nukipromo','song']){
  const res=await req('/img/'+name+'.webp');
  assert.equal(res.status,200,'Missing '+name);
  assert.equal(res.headers.get('content-type'),'image/webp');
  const bytes=new Uint8Array(await res.arrayBuffer());
  assert.ok(bytes.byteLength>10000,'Image too small '+name);
  assert.equal(String.fromCharCode(...bytes.slice(0,4)),'RIFF');
}
for(const path of ['/api/me','/api/generations','/media/generation/123','/settings']){
  assert.equal((await req(path)).status,404,'No internal route '+path);
}
const bad=await req('/','POST');
assert.equal(bad.status,405);
assert.equal(bad.headers.get('allow'),'GET, HEAD');
const head=await req('/','HEAD');assert.equal(head.status,200);assert.equal(await head.text(),'');
const health=await req('/healthz');
assert.deepEqual(await health.json(),{ok:true,app:'nepar-studio-public',version:'2026.11.23-visual'});
for(const path of ['/robots.txt','/sitemap.xml','/favicon.svg'])assert.equal((await req(path)).status,200);
console.log('PASS: cinematic desktop/mobile landing, 4 features and products, interactive selection, self-hosted media and safe links');
