# NEPAR Studio — javni landing

**Production:** https://studio.nepar.hr/  
**Repository:** https://github.com/Weparche/studio

Javni, responzivni landing izrađen prema odabranom desktop/mobile vizualu. Iza povijesnog repozitorija ostali su izvorni kod i migracije internog NEPAR Series Studija, ali produkcijski Worker sada koristi isključivo `src/server/public-landing.js`. Ne izvršava stare API-je ni zadatke.

## Obuhvat

- Hero: NEPAR Studio, tri lika, primarni CTA, mobilni prikaz
- Četiri kartice: Djed Božićnjak, Sveti Nikola, Nuki video, Studio Pro (u pripremi)
- Tri koraka, javni primjeri, planirani krediti jasno označeni nedostupnima, FAQ
- Mobilni donji navigation dock
- Trenutno postojeći proizvodi kupuju se putem `kids.nepar.hr`.
- **Krediti 100/200, cijene 9,90/14,90 nisu trenutno aktivne za kupnju**, UI je jasno označen
- Pro Studio još nije javno otvoren; ne povezivati na testni sustav bez dovršene autorizacije

## Development, testing and deployment

```sh
npm ci --legacy-peer-deps
node --check src/server/public-landing.js
node scripts/test-public-landing.mjs
npx wrangler dev
npx wrangler deploy --dry-run
npx wrangler deploy
```

Ne dodavati D1/R2/secrets bindings iz bivšeg internog alata javnom Workeru. Povijesni podaci ostaju netaknuti na Cloudflareu i u Git povijesti.

## Sigurnost i povrat

- Prije stvarne zamjene zabilježiti aktualnu Cloudflare Worker verziju/deployment i sačuvati Git SHA.
- Nova verzija servira samo statički HTML, favikonu, robots.txt, sitemap.xml i healthz.
- Stari `/api/*` i `/media/*` daju 404; nema internih podataka niti API poziva.
- Ako treba rollback, vratiti raniju verziju Workera; database / R2 nisu brisani.
- Worker DNS domena ostaje `studio.nepar.hr` i ne dira se `kids.nepar.hr` ili `studio-test.nepar.hr`.
