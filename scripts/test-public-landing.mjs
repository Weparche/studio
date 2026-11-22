import assert from 'node:assert/strict';
import studio from '../src/server/public-landing.js';

const req = (path, method='GET') => studio.fetch(new Request('https://studio.nepar.hr'+path,{method}));
const response = await req('/');
assert.equal(response.status,200);
assert.match(response.headers.get('content-type') ?? '',/text\/html/);
assert.match(response.headers.get('content-security-policy') ?? '',/default-src 'none'/);
assert.match(response.headers.get('content-security-policy') ?? '',/frame-ancestors 'none'/);
const html=await response.text();
assert.ok(html.length>20000,'Full responsive landing is built');
for(const part of [
  'Tvoja ideja.','Tvoj <em>video.</em>','Odaberi predložak','Djed Božićnjak','Sveti Nikola','Nuki video',
  'NEPAR Studio Pro','Kako radi?','Pogledaj <span style="color:var(--gold)">stvarne primjere',
  'Jednostavne cijene','100 kredita','200 kredita','U pripremi','mobile-bottom',
  'https://kids.nepar.hr/personaliziraj?gift=djed-bozicnjak',
  'https://kids.nepar.hr/personaliziraj?gift=sveti-nikola',
  'https://kids.nepar.hr/personaliziraj?gift=video',
]) assert.ok(html.includes(part),'Missing public UI '+part);
assert.match(html,/@media \(max-width:760px\)/);
assert.match(html,/@media \(max-width:360px\)/);
assert.match(html,/prefers-reduced-motion:reduce/);
assert.match(html,/aria-label="Brza mobilna navigacija"/);
assert.match(html,/Kreditni paketi koje pripremamo/);
assert.ok(!html.includes('id="private-api"'));
for(const path of ['/api/me','/api/generations','/media/generation/123','/settings']) {
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
assert.deepEqual(await health.json(),{ok:true,app:'nepar-studio-public',version:'2026.11.22'});
for(const path of ['/robots.txt','/sitemap.xml','/favicon.svg']) assert.equal((await req(path)).status,200);
console.log('PASS: responsive public landing, real checkout links, disabled unreleased pricing, security headers, SEO, no internal endpoints');
