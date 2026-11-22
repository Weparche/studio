import santaImage from './public-asset-santa.js';
import nikolaImage from './public-asset-nikola.js';
import nukiImage from './public-asset-nuki.js';
import nukiPromoImage from './public-asset-nukipromo.js';
import songImage from './public-asset-song.js';
const IMAGES = Object.freeze({'/img/santa.webp':santaImage,'/img/nikola.webp':nikolaImage,'/img/nuki.webp':nukiImage,'/img/nukipromo.webp':nukiPromoImage,'/img/song.webp':songImage});
/**
 * NEPAR Studio public landing (studio.nepar.hr).
 * This Worker intentionally exposes no former Series Studio API, D1, R2 or credentials.
 * The former private app remains recoverable in Git history and Cloudflare deployments.
 * All commerce links open existing live NEPAR Kids product flows.
 */
const PAGE = String.raw`<!doctype html>
<html lang="hr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#0b0a12">
<title>NEPAR Studio — Tvoja ideja. Tvoj video.</title>
<meta name="description" content="NEPAR Studio — AI kreativni studio na hrvatskom. Odaberi Djeda Božićnjaka, Svetog Nikolu, Nukija ili istraži nove video mogućnosti.">
<link rel="canonical" href="https://studio.nepar.hr/">
<meta property="og:type" content="website">
<meta property="og:title" content="NEPAR Studio — Tvoja ideja. Tvoj video.">
<meta property="og:description" content="Odaberi predložak, personaliziraj poruku i stvori originalan video. Studio Pro uskoro.">
<meta property="og:url" content="https://studio.nepar.hr/">
<meta property="og:image" content="https://kids.nepar.hr/assets/holidays/og-djed-bozicnjak.jpg">
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<link rel="preconnect" href="https://kids.nepar.hr" crossorigin>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
:root{--bg:#070e1f;--panel:#111e36;--line:rgba(218,227,255,.17);--text:#f7f9ff;--muted:#b9c4de;--gold:#ffca24;--ink:#071329;--shadow:0 14px 38px #0006}
*{box-sizing:border-box}html{scroll-behavior:smooth;scroll-padding-top:82px}body{margin:0;background:radial-gradient(ellipse at 10% 12%,#173056 0%,transparent 40%),radial-gradient(ellipse at 95% 10%,#23315c 0%,transparent 37%),#050b18;color:var(--text);font:500 14px/1.55 Manrope,system-ui,-apple-system,sans-serif;overflow-x:hidden}a{color:inherit}button,input{font:inherit}img{max-width:100%;display:block}a:focus-visible,summary:focus-visible{outline:3px solid var(--gold);outline-offset:3px}a:hover{text-decoration:none}.visually-hidden{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}.skip{position:absolute;top:-100px;left:10px;background:#fff;color:#000;padding:10px;z-index:100}.skip:focus{top:10px}
.site{max-width:1490px;min-height:100vh;margin:12px auto 20px;padding:0 clamp(16px,3.1vw,54px) 22px;border:1px solid #48556f;border-radius:34px;box-shadow:inset 0 0 0 2px #ffffff08,0 10px 60px #0009;background:radial-gradient(ellipse at 75% 15%,#20375966 0%,transparent 35%),linear-gradient(160deg,#070f21,#080e1d 54%,#070d1b);overflow:hidden}
.header{height:74px;display:flex;align-items:center;gap:22px;position:relative;z-index:10}.brand{display:flex;align-items:center;gap:9px;font-weight:900;font-size:22px;letter-spacing:-.7px;text-decoration:none;white-space:nowrap}.brand strong{color:var(--gold)}.brandmark{width:36px;height:36px;border-radius:9px;display:grid;place-items:center;background:linear-gradient(135deg,#fca600,#ffd849 55%,#ff9f00);box-shadow:0 0 16px #ffc83666}.brandmark svg{width:25px;height:25px}.nav-links{margin:auto;display:flex;align-items:center;gap:clamp(13px,2vw,32px)}.nav-links a{font-size:13px;font-weight:800;text-decoration:none;border-bottom:2px solid transparent;padding:16px 0}.nav-links a:hover,.nav-links a:focus-visible{border-color:var(--gold)}.head-actions{display:flex;align-items:center;gap:10px}.btn{border-radius:30px;display:inline-flex;align-items:center;justify-content:center;gap:9px;padding:12px 19px;min-height:44px;font-weight:900;text-decoration:none;white-space:nowrap;border:1px solid transparent;transition:transform .17s ease,background .17s ease}.btn:hover{transform:translateY(-2px)}.btn-gold{background:linear-gradient(180deg,#ffe275,#ffc000);color:#0b1830;box-shadow:0 8px 24px #ffc40028}.btn-outline{color:#fff;border:1px solid #9baaca;background:#15203991}.btn-outline:hover{background:#1d2f50}.head-actions .btn{font-size:12px;padding:10px 17px}.mobile-menu{display:none}
.hero{position:relative;display:grid;grid-template-columns:minmax(300px,.88fr) minmax(460px,1.12fr);gap:10px;align-items:center;min-height:380px;padding:25px 0 25px;isolation:isolate}.hero:before{content:"";position:absolute;inset:0 -54px auto -54px;height:100%;z-index:-2;background:radial-gradient(ellipse at 69% 38%,#f49b4d1a 0%,transparent 40%),radial-gradient(ellipse at 93% 6%,#3c5eaa2f,transparent 51%)}.hero-copy{position:relative;z-index:3;padding:5px 0 0 18px}.eyebrow{display:inline-flex;align-items:center;gap:7px;background:#1b2946da;border:1px solid #ffffff24;padding:7px 13px;border-radius:30px;color:#e9eeff;font-size:11px;font-weight:900;box-shadow:0 5px 16px #0004}.eyebrow b{color:var(--gold)}.hero h1{font-size:clamp(44px,5.05vw,79px);line-height:1.03;letter-spacing:-.06em;margin:13px 0 18px;font-weight:900}.hero h1 em{font-style:normal;color:var(--gold)}.hero-copy>p{font-size:clamp(14px,1.25vw,17px);line-height:1.63;max-width:455px;color:#e5ebfa;margin:0}.hero-actions{display:flex;gap:12px;flex-wrap:wrap;margin:20px 0}.hero-actions .btn{font-size:13px}.trust{display:flex;align-items:center;flex-wrap:wrap;gap:10px 22px;color:#dce4f6;font-size:11px;font-weight:800}.trust span{display:flex;align-items:center;gap:7px;line-height:1.25}.trust .ic{font-size:19px}.hero-art{position:relative;align-self:stretch;min-height:346px;overflow:visible}.sky{position:absolute;inset:8px -25px 0 0;background:radial-gradient(ellipse at 55% 80%,#e48c3360,transparent 41%),radial-gradient(ellipse at 50% 30%,#41609b55 0%,transparent 59%);filter:blur(3px)}.snow{position:absolute;inset:0;opacity:.8;background-image:radial-gradient(#fff 1.3px,transparent 1.6px),radial-gradient(#a6c6ff 1px,transparent 1.3px);background-size:73px 73px,101px 101px;background-position:11px 28px,35px 16px;mask-image:linear-gradient(90deg,transparent,#000 20%)}.hero-person{position:absolute;bottom:1px;width:38%;height:90%;object-fit:cover;object-position:center top;border:2px solid #ffffff40;border-radius:46% 46% 16% 16%;box-shadow:0 13px 50px #000b;mask-image:linear-gradient(to bottom,#000 84%,transparent)}.person-santa{left:2%;bottom:1%;height:91%;transform:rotate(-3deg);z-index:1;box-shadow:0 8px 39px #aa423d66}.person-nuki{left:29%;width:46%;height:80%;bottom:-8px;z-index:3;transform:rotate(1deg);object-position:center center;border-radius:47% 47% 25% 25%;box-shadow:0 8px 48px #d78c4a70}.person-nikola{right:0;bottom:0;height:92%;transform:rotate(3deg);z-index:2;box-shadow:0 8px 39px #8d552e70}.art-glow{position:absolute;left:16%;right:12%;bottom:0;height:66px;background:#ffc26a50;filter:blur(37px);z-index:4;pointer-events:none}.hero-note{position:absolute;right:5%;bottom:5%;z-index:5;border:1px solid #ffffff88;background:#051328cc;color:#fff;border-radius:99px;padding:6px 12px;font-size:10px;font-weight:900;letter-spacing:.1em}
.section-head{display:flex;align-items:flex-end;justify-content:space-between;gap:16px;margin:7px 0 13px}.section-head h2{font-size:23px;line-height:1.2;letter-spacing:-.03em;margin:0}.section-head p{font-size:12px;color:#c2cbe0;margin:0}.templates{scroll-margin-top:82px}.template-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:16px}.template{position:relative;display:block;min-width:0;height:220px;border:1px solid #ffffff46;border-radius:21px;overflow:hidden;text-decoration:none;background:#243555;box-shadow:0 9px 18px #0005;transition:transform .16s ease,box-shadow .16s ease}.template:hover,.template:focus-visible{transform:translateY(-4px);box-shadow:0 18px 30px #0009}.template img{width:100%;height:100%;object-fit:cover;object-position:50% 27%;transition:transform .25s ease}.template:hover img{transform:scale(1.045)}.template:before{content:"";position:absolute;inset:20% 0 0;z-index:1;background:linear-gradient(0deg,#130912 0%,#1b0a1299 43%,transparent 100%)}.template-nikola:before{background:linear-gradient(0deg,#23140a 0%,#291c1799 42%,transparent)}.template-nuki:before{background:linear-gradient(0deg,#12260a 0%,#223b0caa 43%,transparent)}.template-pro{background:radial-gradient(circle at 50% 35%,#7744ed,#2c165a 64%,#110f2a);border-color:#8d58e5}.template-pro:before{background:linear-gradient(0deg,#110a31 0%,transparent 100%)}.template-pro .clapper{position:absolute;top:24px;left:50%;transform:translateX(-50%);font-size:94px;filter:drop-shadow(0 10px 22px #0008)}.tag{position:absolute;z-index:3;top:9px;left:10px;display:inline-flex;gap:5px;align-items:center;padding:3px 9px;background:#020610cf;border-radius:99px;color:#fff;font-size:11px;font-weight:850}.card-content{position:absolute;z-index:3;inset:auto 12px 12px;display:grid;gap:3px;padding-right:44px}.card-content strong{font-size:18px;letter-spacing:-.025em;line-height:1.17}.card-content small{font-size:11px;color:#e7eaf6;line-height:1.4}.circle-arrow{position:absolute;right:12px;bottom:14px;z-index:4;width:37px;height:37px;display:grid;place-items:center;border-radius:50%;font-size:23px;font-weight:800;background:#f6d35f;color:#102039;box-shadow:0 5px 13px #0004}.template-santa .circle-arrow{background:#e95659;color:white}.template-nuki .circle-arrow{background:#b4df7a}.template-pro .circle-arrow{background:#ebe2ff}.availability{font-size:9px;color:#e8c9ff;font-style:normal}
.steps{margin:18px 0 14px;padding:14px 18px;border-radius:19px;display:grid;grid-template-columns:1.2fr repeat(3,1fr);gap:16px;align-items:center;color:#101b34;background:linear-gradient(100deg,#f1f2ff,#dadff2,#f6f3ff);box-shadow:0 0 0 1px #ffffff8c,0 5px 22px #bbc9f72d}.steps-intro strong{display:block;font-size:19px;line-height:1.05;letter-spacing:-.03em}.steps-intro small{display:block;font-size:11px;max-width:150px;margin-top:4px}.step{display:flex;align-items:center;gap:9px}.step-icon{width:42px;height:42px;flex:0 0 42px;display:grid;place-items:center;border-radius:50%;background:white;font-size:22px}.step-copy{display:block}.step-copy b{display:block;font-size:11px}.step-copy small{display:block;font-size:10px;line-height:1.35}.step-copy i{color:#4d4297;font-style:normal}
.lower{display:grid;grid-template-columns:1.16fr .84fr;gap:15px;margin-top:14px}.panel{background:linear-gradient(150deg,#15223c,#0b1529);border:1px solid #2e405c;border-radius:21px;padding:17px;min-width:0}.panel h2{font-size:19px;margin:0 0 4px;line-height:1.25;letter-spacing:-.03em}.panel p{font-size:12px;color:#bbc8e0;margin:0 0 9px}.examples{display:grid;grid-template-columns:minmax(140px,.85fr) 1fr;gap:17px;align-items:center}.example-shot{position:relative;min-width:0;aspect-ratio:1.56;overflow:hidden;border-radius:15px;display:block;box-shadow:0 8px 20px #0007}.example-shot img{width:100%;height:100%;object-fit:cover}.play{display:grid;place-items:center;position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);background:#02091acb;color:#fff;border:2px solid #fff9;border-radius:50%;width:56px;height:56px;font-size:25px}.mini-examples{display:flex;gap:7px;margin-top:10px}.mini-examples a{width:61px;height:47px;border:1px solid #ffffff47;display:block;overflow:hidden;border-radius:8px}.mini-examples img{width:100%;height:100%;object-fit:cover}.mini-examples a:hover{border-color:var(--gold)}.pricing{scroll-margin-top:80px}.price-grid{display:grid;grid-template-columns:1fr 1fr;gap:11px;margin-top:10px}.price{position:relative;text-align:center;border-radius:14px;background:#f0f1ff;color:#0b1530;padding:12px 11px;display:flex;flex-direction:column;justify-content:space-between;gap:3px;min-height:153px}.price.popular{background:linear-gradient(160deg,#ffe699,#ffc033)}.price-label{display:block;font-size:10px;font-weight:850}.price strong{display:block;font-size:29px;letter-spacing:-.06em;line-height:1.1}.price small{font-size:10px}.price .pill{display:block;margin-top:6px;border:1px solid #2d3550;background:#fff0;border-radius:20px;padding:7px;text-decoration:none;font-size:10px;font-weight:900}.popular .pill{background:#10172d;color:#fff}.price-flag{position:absolute;right:10px;top:-12px;border-radius:20px;background:#be59db;color:white;font-size:9px;padding:4px 10px}.price-availability{font-size:10px;color:#d0dcf4;margin-top:8px}.price-availability a{color:#fff;text-underline-offset:3px}
.features{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px;margin:15px 0 3px;border-top:1px solid #ffffff1c;padding:16px 0 3px}.features span{display:flex;gap:9px;align-items:center;justify-content:center;color:#dde5f7;font-size:10px;line-height:1.3}.features b{font-size:21px;font-weight:500}.more{border-top:1px solid #22324b;margin-top:20px;padding:18px 0 0;display:grid;grid-template-columns:1fr 1fr;gap:18px;align-items:start}.more h2{font-size:18px;margin:0 0 5px}.more p{font-size:12px;color:#bac5da;margin:0 0 7px}.more a{color:#ffd34b;font-weight:850}.faq details{border-bottom:1px solid #ffffff20;padding:7px 0}.faq summary{font-size:12px;font-weight:850;cursor:pointer;list-style-position:inside}.faq details p{padding:5px 11px;margin:0;font-size:11px}.foot{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:12px;margin-top:19px;border-top:1px solid #ffffff21;padding-top:14px;color:#b8c5dd;font-size:11px}.foot a{color:#e9efff;margin-left:12px}
.mobile-bottom{display:none}
@media (min-width:1500px){.hero{min-height:399px}.template{height:236px}}
@media (max-width:1120px){.site{margin:0;border-radius:0;padding:0 23px 20px}.nav-links{gap:12px}.head-actions .btn-outline{display:none}.hero{grid-template-columns:.98fr 1.02fr}.hero h1{font-size:57px}.hero-art{min-height:315px}.template{height:199px}.card-content strong{font-size:16px}.steps{gap:7px}.step-icon{width:36px;height:36px;flex-basis:36px}}
@media (max-width:760px){body{background:#050d1f}.site{padding:0 14px 90px;border:0;border-radius:0;min-height:100vh}.header{height:68px;justify-content:space-between}.brand{font-size:19px}.brandmark{width:30px;height:30px}.head-actions,.nav-links{display:none}.mobile-menu{display:block;position:relative}.mobile-menu summary{list-style:none;border:1px solid #53627c;background:#12213b;color:white;border-radius:12px;width:40px;height:40px;display:grid;place-items:center;font-size:21px;cursor:pointer}.mobile-menu summary::-webkit-details-marker{display:none}.mobile-menu[open] nav{position:absolute;right:0;top:45px;width:min(240px,90vw);display:grid;gap:0;border:1px solid #50617b;background:#0d1a30;border-radius:15px;padding:7px;box-shadow:var(--shadow)}.mobile-menu nav a{text-decoration:none;display:block;padding:11px 15px;font-weight:800;border-radius:8px}.mobile-menu nav a:hover{background:#1e2f4b}
.hero{display:flex;flex-direction:column;gap:2px;text-align:center;min-height:auto;padding:16px 0 0}.hero-copy{padding:0}.eyebrow{font-size:10px}.hero h1{font-size:clamp(34px,8.9vw,46px);line-height:1.07;margin:11px 0 12px}.hero-copy>p{max-width:440px;font-size:12.5px;line-height:1.55;margin:auto}.hero-actions{justify-content:center;margin:17px auto 8px}.hero-actions .btn{font-size:12px;min-height:46px;padding:11px 22px}.hero-actions .btn-outline{display:none}.hero-art{width:100%;max-width:430px;margin:auto;min-height:206px;height:206px}.hero-person{height:90%;width:35%;bottom:-1px}.person-santa{left:5%}.person-nuki{width:41%;left:29%;height:81%;bottom:-1px}.person-nikola{right:4%}.hero-note{display:none}.trust{display:none}.section-head{margin:8px 0 12px}.section-head h2{font-size:19px}.section-head p{display:none}.template-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.template{height:174px;border-radius:16px}.template img{object-position:50% 25%}.template-pro .clapper{font-size:66px}.tag{top:7px;left:7px;font-size:9px;padding:3px 7px}.card-content{inset:auto 9px 10px;gap:2px;padding-right:32px}.card-content strong{font-size:14px}.card-content small{font-size:10px}.circle-arrow{height:30px;width:30px;right:8px;bottom:9px;font-size:19px}.steps{display:none}.lower{display:flex;flex-direction:column;gap:10px}.examples{grid-template-columns:minmax(120px,.8fr) 1fr;gap:10px}.panel{padding:13px;border-radius:16px}.panel h2{font-size:17px}.panel p{font-size:11px}.mini-examples a{width:52px;height:39px}.price-grid{gap:9px}.features{grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;margin:14px 0 0;padding:10px 0}.features span{background:#101c34;border-radius:12px;padding:9px 6px;font-size:9px;min-height:61px;justify-content:center}.features span:nth-child(n+4){display:none}.features b{font-size:19px}.more{grid-template-columns:1fr}.mobile-bottom{display:grid;position:fixed;bottom:0;left:0;right:0;z-index:50;grid-template-columns:repeat(5,minmax(0,1fr));gap:1px;background:#091225f5;border-top:1px solid #334866;padding:8px max(5px,env(safe-area-inset-right)) calc(7px + env(safe-area-inset-bottom));backdrop-filter:blur(14px)}.mobile-bottom a{display:flex;align-items:center;flex-direction:column;justify-content:center;gap:1px;min-height:47px;border-radius:13px;text-align:center;color:#bac5dc;font-size:9px;font-weight:850;text-decoration:none}.mobile-bottom a span{font-size:21px;line-height:1.15}.mobile-bottom a.active{color:var(--gold);background:#1c2c48}.mobile-bottom a.create{color:#091429}.mobile-bottom a.create span{background:linear-gradient(#ffe58b,#ffbd00);border-radius:50%;width:42px;height:42px;display:grid;place-items:center;color:#061226;font-size:23px;margin-top:-11px;box-shadow:0 5px 22px #ffc42265}.foot{padding-bottom:10px}}
@media (max-width:360px){.site{padding-inline:10px}.hero-art{height:174px;min-height:174px}.template{height:160px}.hero-actions .btn{min-height:44px}.example-shot{aspect-ratio:1.17}.mini-examples{gap:4px}.mini-examples a{width:42px}.card-content strong{font-size:13px}.card-content small{font-size:9px}}
@media (prefers-reduced-motion:reduce){html{scroll-behavior:auto}.btn,.template,.template img{transition:none}.btn:hover,.template:hover{transform:none}}

/* NEPAR Studio public 2.0 — layout, accessibility and responsive polish */
:root{--bg:#0b0a12;--panel:#171620;--line:#34313e;--text:#f7f5ff;--muted:#aea9bc;--gold:#b79aff;--ink:#171121;--shadow:0 22px 64px #0008}
html{scroll-padding-top:100px}body{background:#090810;color:var(--text);font-family:Manrope,system-ui,-apple-system,sans-serif;font-size:14px}
body:before{content:"";position:fixed;inset:0;z-index:-1;pointer-events:none;background:radial-gradient(ellipse at 17% 0%,#41296055,transparent 40%),radial-gradient(ellipse at 90% 35%,#623a3a27,transparent 45%)}
.site{max-width:1440px;margin:0 auto;min-height:100vh;border:0;border-radius:0;padding:0 clamp(22px,5vw,74px) 26px;box-shadow:none;background:transparent;overflow:visible}
.header{height:88px;border-bottom:1px solid #302b3b;gap:28px}.brand{font-size:19px;font-weight:900;letter-spacing:-.035em}.brand strong{color:#bca5fc;text-transform:uppercase;letter-spacing:-.04em}.brandmark{background:#ede5ff;box-shadow:0 0 27px #8b65ec20;border-radius:11px;width:38px;height:38px}.brandmark svg path:first-child{fill:#1d1331}.brandmark svg path:nth-child(2){fill:#b390ff}
.nav-links{gap:clamp(15px,2.2vw,33px)}.nav-links a{font-size:12px;color:#c9c5d4;font-weight:700}.nav-links a:hover,.nav-links a:focus-visible{border-color:#bca5fc;color:white}
.btn{border-radius:12px;min-height:45px;font-weight:800}.btn-gold{background:#b99cff;box-shadow:0 6px 26px #a07bff35;color:#180e30}.btn-gold:hover{background:#ccb8ff}.btn-outline{border-color:#50465d;background:#1a1723;color:#f5f0ff}.head-actions .btn{font-size:12px}.site a:focus-visible,.site button:focus-visible,.site textarea:focus-visible{outline:3px solid #d6c3ff;outline-offset:4px}
.hero{display:grid;grid-template-columns:minmax(0,1.05fr) minmax(0,.95fr);gap:clamp(22px,4vw,64px);min-height:0;padding:64px 0 48px;align-items:center;isolation:isolate}
.hero:before{background:radial-gradient(ellipse at 60% 35%,#b99cff13,transparent 61%)}
.hero-copy{padding:0}.eyebrow{background:#291f3d;border:1px solid #5c4779;padding:8px 13px;color:#d9c8ff;font-size:10px;letter-spacing:.07em;text-transform:uppercase}.eyebrow b{color:#ffbf86}.hero h1{font-size:clamp(46px,5.4vw,80px);line-height:1.03;margin:20px 0 15px;letter-spacing:-.062em;font-weight:900}.hero h1 em{color:#c3aaff;font-style:normal}
.hero-copy>p{max-width:550px;color:#cbc5d5;font-size:15px;line-height:1.7;margin:0 0 22px}.hero-copy .hero-lead{font-size:16px}.hero-actions{margin:0}.trust{display:flex;gap:14px;color:#aaa4bc;font-size:11px;margin-top:17px}.trust span{display:flex;gap:5px;align-items:center}.trust .ic{color:#c2a5ff;font-size:15px}
.studio-entry{padding:17px;background:#191621;border:1px solid #4a3c56;border-radius:20px;box-shadow:0 18px 60px #0704107a;max-width:540px}.studio-entry h2{font-size:15px;letter-spacing:-.015em;margin:0 0 10px}
.studio-tabs{display:flex;gap:5px;background:#0e0c14;border-radius:11px;padding:5px;margin-bottom:12px}.studio-tab{flex:1;background:transparent;border:0;color:#b7b0c7;padding:10px 8px;border-radius:8px;cursor:pointer;font-size:12px;font-weight:850}.studio-tab[aria-selected="true"]{background:#3c2a58;color:#fff;box-shadow:inset 0 0 0 1px #76599f}
.studio-panel[hidden]{display:none!important}.studio-picker{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin-bottom:13px}.studio-choice{border:1px solid #3e364a;background:#23202c;border-radius:12px;padding:8px 7px;display:flex;align-items:center;gap:7px;cursor:pointer;text-align:left;color:#e9e4ef;font-weight:750;font-size:11px;min-width:0}.studio-choice img{width:30px;height:34px;border-radius:6px;object-fit:cover}.studio-choice[aria-pressed="true"]{border-color:#c3aaff;background:#37284c;box-shadow:0 0 0 1px #ad8cff77}.studio-choice:hover{background:#393044}
.studio-cta{width:100%;display:flex;align-items:center;justify-content:center;gap:8px;padding:13px;border-radius:11px;background:#bca0ff;color:#1a0e2c;text-decoration:none;font-size:13px;font-weight:900;min-height:47px}.studio-cta:hover{background:#d1bcff}.studio-note{display:flex;align-items:center;justify-content:space-between;gap:8px;margin:10px 2px 0;color:#afa7c0;font-size:10px}.studio-note strong{color:#e5d5ff}.studio-request{width:100%;min-height:82px;resize:vertical;background:#0e0b15;border:1px solid #5c5167;border-radius:11px;color:white;padding:12px;line-height:1.5;margin:0 0 12px;font:inherit}.studio-request::placeholder{color:#8c829e}.studio-request-help{color:#ada5bb;font-size:11px;margin:0 0 12px;line-height:1.5}
.hero-visual{min-height:516px;position:relative;isolation:isolate}.hero-visual:before{content:"";position:absolute;inset:12% 7% 4%;border-radius:50%;background:#9468e844;filter:blur(74px);z-index:-1}.visual-card{position:absolute;overflow:hidden;border-radius:22px;border:3px solid #30273e;box-shadow:0 25px 60px #000a;background:#2b2439}.visual-card img{width:100%;height:100%;object-fit:cover}.visual-card:after{content:"";position:absolute;inset:55% 0 0;background:linear-gradient(transparent,#090811db)}.visual-card span{position:absolute;z-index:1;left:14px;bottom:14px;color:#fff;font-size:13px;font-weight:900}.visual-main{left:7%;top:0;width:55%;height:74%;transform:rotate(-5deg);z-index:2}.visual-right{right:1%;top:17%;width:45%;height:64%;transform:rotate(7deg);z-index:3}.visual-small{left:20%;bottom:0;width:48%;height:42%;transform:rotate(-1deg);z-index:4}.visual-chip{position:absolute;top:2%;right:0;border:1px solid #a088cb7b;background:#22182bea;border-radius:50px;padding:9px 14px;color:#e5d4ff;font-size:11px;font-weight:850;z-index:5}.visual-bottom{position:absolute;bottom:1%;right:0;border-radius:50px;background:#ffc693;color:#24120a;padding:8px 13px;font-size:10px;font-weight:850;z-index:5}
.section-head{margin:8px 0 19px;align-items:center}.section-head h2{font-size:clamp(22px,2.5vw,30px);color:#f6f2ff}.section-head p{color:#bdb6c9;font-size:12px}
.templates{scroll-margin-top:100px}.template-grid{gap:16px}.template{height:290px;border-color:#42374d;border-radius:19px;background:#1e1625}.template:before{background:linear-gradient(0deg,#0b0719 0%,#0b0719bc 32%,transparent 73%)}.template-nikola:before,.template-nuki:before{background:linear-gradient(0deg,#0b0719 0%,#0b0719bc 32%,transparent 73%)}.template-pro{background:radial-gradient(circle at 54% 34%,#7651ab,#32233f 55%,#171020)}.template-pro .clapper{filter:drop-shadow(0 10px 22px #180628);font-size:80px;top:60px}.tag{top:12px;left:12px;font-size:10px;background:#17131ad9;padding:5px 10px}.card-content{inset:auto 16px 17px;padding-right:30px}.card-content strong{font-size:19px}.card-content small{color:#d8ccdf;font-size:11px}.circle-arrow{background:#bea5fc!important;color:#180e29!important;height:33px;width:33px;font-size:19px;right:13px;bottom:16px}.template-pro .availability{display:inline-block;margin-top:5px;color:#e5c7ff;font-style:normal}
.studio-categories{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin:20px 0 38px}.studio-category{display:flex;gap:13px;align-items:center;border:1px solid #3b3447;background:#19151f;border-radius:16px;padding:17px;text-decoration:none;min-width:0}.studio-category:hover{border-color:#a78dcf;background:#241c30}.category-icon{width:43px;height:43px;border-radius:12px;display:grid;place-items:center;background:#3e2e57;color:#dbc5ff;font-size:22px;flex:0 0 auto}.studio-category b{display:block;font-size:13px;line-height:1.25}.studio-category small{display:block;color:#a9a1b5;font-size:10px;line-height:1.4;margin-top:4px}
.steps{grid-template-columns:1.1fr repeat(3,1fr);border:1px solid #45354e;background:#211a2d;color:#fbf8ff;box-shadow:none;padding:22px 25px;gap:13px;margin:34px 0}.steps-intro strong{font-size:24px}.steps-intro small{color:#c9bfd2;font-size:11px}.step-icon{background:#3b2c54;color:#d6bfff}.step-copy b{font-size:12px}.step-copy small{font-size:10px;color:#b9b2c2}.step-copy i{color:#d9c4ff}
.lower{gap:18px;margin-top:20px}.panel{border:1px solid #383141;background:#19151f;padding:22px;border-radius:18px}.panel h2{font-size:21px}.panel p{font-size:12px;color:#bcb3c7}.example-shot{border-radius:14px}.play{background:#251936d9;border-color:#c8aaff}.mini-examples a{border-color:#5b4b6b}.pricing{background:#201927}.price-grid{gap:11px}.price{background:#292335;border:1px solid #594a6a;color:#f6f0ff;min-height:154px}.price.popular{background:#3d2a5c;border-color:#b59bea}.price strong{font-size:32px}.price .pill{border-color:#6b5e7f;color:#b7aac7}.popular .pill{background:#bca0ff;color:#160c25;border:0}.price-flag{background:#ffa966;color:#241109;font-weight:850}.price-availability{color:#c6bdd2}.price-availability a{color:#e4cdff}
.audience{padding:46px 0 20px}.audience h2{font-size:clamp(24px,3vw,34px);margin:0 0 8px;letter-spacing:-.035em}.audience>p{color:#aaa4b8;margin:0 0 20px}.audience-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}.audience-card{background:#19151e;border:1px solid #3c3148;border-radius:18px;padding:24px;min-height:155px}.audience-card>span{color:#c7aaff;font-size:24px}.audience-card h3{margin:8px 0;font-size:16px}.audience-card p{color:#aca3b9;font-size:12px;margin:0;line-height:1.65}
.features{border-top-color:#3b3345;margin-top:27px}.features span{font-size:11px;color:#c8c0d4}.more{border-top-color:#3b3345;margin-top:28px;padding-top:24px}.more h2{font-size:22px}.more p{color:#bcb3cb;line-height:1.7}.more a{color:#cbb0ff}.faq details{border-color:#42384c;padding:13px 0}.faq summary{font-size:13px}.faq details p{font-size:12px}.foot{border-color:#3e344a}.foot a{color:#e0d2f3}.mobile-bottom{display:none}
@media(max-width:1120px){.site{margin:0;padding:0 24px 25px}.hero{grid-template-columns:1.03fr .97fr;gap:20px;padding:46px 0}.hero h1{font-size:clamp(41px,5vw,62px)}.hero-visual{min-height:440px}.template{height:250px}}
@media(max-width:760px){.site{padding:0 15px 82px}.header{height:61px;border-bottom-color:#33283d}.brand{font-size:17px}.brandmark{width:32px;height:32px}.mobile-menu summary{border-color:#5a466f;background:#21172c;font-size:19px}.mobile-menu[open] nav{background:#1a1523;border-color:#534260}
.hero{display:block;padding:27px 0 22px;text-align:left}.hero-copy{padding:0}.eyebrow{font-size:9px;padding:6px 10px}.hero h1{font-size:clamp(34px,9.2vw,47px);line-height:1.08;margin:13px 0 9px}.hero-copy>p{font-size:12px;line-height:1.52;margin:0 0 15px}.hero-lead{font-size:12px!important}.studio-entry{max-width:none;border-radius:17px;padding:12px}.studio-entry h2{font-size:13px;margin-bottom:8px}.studio-tabs{margin-bottom:10px}.studio-tab{padding:9px;font-size:11px}.studio-picker{gap:6px;margin-bottom:11px}.studio-choice{font-size:9px;flex-direction:column;align-items:center;gap:4px;padding:6px 4px;line-height:1.2;text-align:center;min-height:68px}.studio-choice img{width:37px;height:36px;border-radius:7px}.studio-cta{min-height:44px;font-size:12px}.studio-note{font-size:9px;margin-top:8px}.hero-visual{display:none}.trust{display:none}
.section-head{margin:16px 0 12px}.section-head h2{font-size:20px}.section-head p{display:none}.template-grid{gap:10px}.template{height:208px;border-radius:14px}.card-content{inset:auto 10px 11px;padding-right:23px}.card-content strong{font-size:14px}.card-content small{font-size:9px}.tag{font-size:9px;top:8px;left:8px}.circle-arrow{width:27px;height:27px;bottom:10px;right:8px}.template-pro .clapper{font-size:62px;top:35px}
.studio-categories{grid-template-columns:1fr;gap:8px;margin:18px 0 20px}.studio-category{padding:11px;border-radius:13px;gap:11px}.category-icon{width:38px;height:38px;font-size:20px}.studio-category small{margin-top:2px}
.steps{display:grid;grid-template-columns:1fr;gap:13px;margin:20px 0;padding:17px}.steps-intro strong{font-size:20px}.steps-intro small{max-width:none}.step{gap:11px}.step-icon{width:38px;height:38px;flex-basis:38px;font-size:19px}
.lower{margin-top:14px}.panel{padding:15px}.panel h2{font-size:19px}.price strong{font-size:26px}
.audience{padding:26px 0 10px}.audience h2{font-size:24px}.audience-grid{grid-template-columns:1fr;gap:9px}.audience-card{padding:16px;min-height:0}.audience-card>span{font-size:20px}.audience-card h3{font-size:14px;margin:4px 0}.audience-card p{font-size:11px}
.features{grid-template-columns:repeat(3,minmax(0,1fr));margin-top:15px}.features span{background:#211a2c}.more{grid-template-columns:1fr}.mobile-bottom{display:grid;grid-template-columns:1fr 1.45fr 1fr;background:#15101deb;border-color:#554265;gap:7px;padding:8px 13px calc(8px + env(safe-area-inset-bottom))}.mobile-bottom a{color:#d4c8df;font-size:10px;min-height:42px;gap:3px}.mobile-bottom a.active{background:transparent;color:#d5c0ff}.mobile-bottom a.create{background:#b99aff;border-radius:11px;color:#1c1030;font-size:12px;font-weight:900}.mobile-bottom a.create span{display:none}
}
@media(max-width:360px){.site{padding-inline:10px}.hero{padding-top:18px}.hero h1{font-size:33px}.template{height:177px}.studio-entry{padding:9px}.studio-choice img{width:34px;height:30px}.card-content strong{font-size:13px}}
@media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}.btn,.template,.template img{transition:none}}


/* Selected 10/10 NEPAR Studio concept — launch UI */
:root{--gold:#ae68f5}
body{background:radial-gradient(ellipse at 48% -12%,#241430 0%,transparent 52%),#090914;color:#fff}
.site{max-width:1536px;padding:0 clamp(22px,4.4vw,70px) 25px}
.header{height:69px;border-bottom:none}.brand{font-size:22px}.brand strong{color:#bd72ff}.brandmark{background:#b968f7;width:38px;height:38px;box-shadow:0 0 21px #a45aff4d}.brandmark svg path:first-child{fill:#20112d}.brandmark svg path:nth-child(2){fill:white}.header .nav-links a{color:#f6f3fc;font-size:13px}.nav-links{gap:clamp(18px,2.4vw,36px)}
.head-actions .btn-gold,.btn-gold{background:#ae60f6;color:#12091c;box-shadow:0 6px 22px #9634eb40}.head-actions .btn-outline{background:transparent;border-color:#9955c7}
.hero{grid-template-columns:minmax(0,.44fr) minmax(0,.56fr);gap:12px;padding:22px 0 12px;min-height:460px;align-items:center}
.hero:before{background:radial-gradient(ellipse at 76% 37%,#9337e51a 0%,transparent 55%)}
.hero-copy{padding:6px 0;z-index:4}
.eyebrow{border:0;background:transparent;padding:0;text-transform:uppercase;letter-spacing:0;font-size:12px;font-weight:800;color:#e1d9ec;box-shadow:none}
.eyebrow b{color:#ffb928;font-size:20px}
.hero h1{font-size:clamp(38px,3.7vw,57px);line-height:1.07;letter-spacing:-.05em;margin:11px 0 14px;max-width:650px}
.hero h1 em{color:#b667fa}.hero-copy>p{color:#c8c0d1;font-size:15px;line-height:1.55;margin:0 0 15px;max-width:535px}
.studio-entry{border-radius:21px;background:#1b192abf;border:1px solid #383146;padding:14px 15px 12px;box-shadow:0 12px 40px #0006}
.studio-tabs{background:transparent;margin:0 0 11px;padding:0;gap:8px}.studio-tab{background:#11101d;color:#eee6fa;min-height:42px;border:1px solid #272539;border-radius:12px;font-size:12px;padding:9px 8px}
.studio-tab[aria-selected="true"]{background:linear-gradient(135deg,#e6caff,#ba7bf7);border-color:transparent;color:#160e1b;box-shadow:0 0 18px #b26cf55c}
.studio-search-wrap{display:flex;align-items:center;gap:10px;border:1px solid #41394e;border-radius:12px;background:#292538;padding:0 14px;margin:0 0 11px;min-height:43px;color:#c897ff}
.studio-search-wrap input{border:0;outline:0;background:transparent;color:#fdfaff;width:100%;min-width:0;font:inherit;font-size:12px;padding:12px 0}.studio-search-wrap input::placeholder{color:#b3a9bd}.studio-search-wrap input::-webkit-search-cancel-button{filter:invert(1)}
.studio-picker{display:flex;gap:6px;margin-bottom:9px}.studio-choice{padding:5px 9px;min-height:26px;background:#262136;border:1px solid #463653;border-radius:99px;min-width:0;display:block;font-size:10px;line-height:1.15;color:#c6b9d4;white-space:nowrap}.studio-choice[aria-pressed="true"]{color:#e7cbff;background:#4b3165;border-color:#a86dd7;box-shadow:none}
.studio-cta{background:linear-gradient(90deg,#a451ee,#c072fd);min-height:44px;border-radius:12px;color:#160822;font-size:13px}.studio-cta:hover{background:#c887ff}
.studio-note{color:#b4a8c1;font-size:9px;margin-top:8px;gap:8px}.trust{margin-top:12px;gap:14px;flex-wrap:wrap;color:#f1eaf7;font-size:11px}.trust span{white-space:nowrap}.trust .ic{font-size:17px;color:#d39aff}
.hero-showcase{height:450px;min-width:0;position:relative;isolation:isolate;align-self:stretch;overflow:hidden}
.showcase-glow{position:absolute;inset:5% 0 0;background:radial-gradient(ellipse at 60% 64%,#f4a83a55 0%,transparent 50%),radial-gradient(ellipse at 58% 35%,#5a2e715e 0%,transparent 65%);filter:blur(16px);z-index:0}
.showcase-figure{position:absolute;overflow:hidden;border-radius:23px 23px 50px 50px;box-shadow:0 12px 42px #120719aa;transform:translateZ(0)}
.showcase-figure img{width:100%;height:100%;object-fit:cover;object-position:50% 22%;display:block}
.figure-santa{z-index:1;left:4%;top:5%;width:39%;height:79%;transform:rotate(-5deg);-webkit-mask-image:linear-gradient(#000 0%,#000 78%,transparent 100%);mask-image:linear-gradient(#000 0%,#000 78%,transparent 100%)}
.figure-nikola{z-index:2;right:1%;top:6%;width:38%;height:83%;transform:rotate(4deg);-webkit-mask-image:linear-gradient(#000 0%,#000 78%,transparent 100%);mask-image:linear-gradient(#000 0%,#000 78%,transparent 100%)}
.figure-nuki{z-index:3;left:30%;bottom:0;width:45%;height:82%;transform:rotate(-1deg);border-radius:44% 44% 34% 34%;box-shadow:0 0 55px #cc8c4e66;-webkit-mask-image:radial-gradient(ellipse at 50% 44%,#000 44%,#000 61%,transparent 84%);mask-image:radial-gradient(ellipse at 50% 44%,#000 44%,#000 61%,transparent 84%)}
.figure-nuki img{object-position:50% 32%}.showcase-clapper{position:absolute;right:15%;bottom:4%;z-index:5;display:grid;place-items:center;background:#7f3bc3;color:#fff;border:3px solid #f0be69;box-shadow:0 0 28px #e6a34d99;transform:rotate(-10deg);width:74px;height:62px;border-radius:15px;font-size:30px}
.studio-capabilities{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin:5px 0 24px}
.capability{display:flex;align-items:center;gap:11px;padding:14px 11px;min-height:94px;background:linear-gradient(115deg,#232032,#191923);border:1px solid #3c304d;border-radius:16px;text-decoration:none;min-width:0;transition:border-color .15s,transform .15s}
.capability:hover,.capability:focus-visible{transform:translateY(-2px);border-color:#bd79fa}.capability-active{border-color:#b662fa;box-shadow:0 0 14px #a749ef5a}.capability-pro{border-color:#745223;background:linear-gradient(120deg,#32221f,#211b27)}
.cap-icon{width:42px;height:42px;border-radius:12px;flex:0 0 42px;background:linear-gradient(135deg,#62348b,#3e2457);color:#e4b5ff;font-size:24px;display:grid;place-items:center}
.cap-icon-teal{color:#8af4ec;background:#14434a}.cap-icon-gold{color:#ffd089;background:#583a23}
.cap-copy{display:block;min-width:0;flex:1}.cap-copy strong{display:block;color:#fff;font-size:13px;line-height:1.2}.cap-copy small{display:block;color:#bfb9c9;font-size:10px;margin-top:5px;line-height:1.4}.cap-arrow{color:#e9d5fa;border-radius:50%;padding:3px 8px;background:#ffffff11;font-size:18px}.soon-label{display:inline-block;vertical-align:middle;font-style:normal;font-size:9px;font-weight:850;color:#211204;background:#ffc252;border-radius:99px;padding:3px 6px}
.templates{scroll-margin-top:85px}.section-head{margin:0 0 14px}.section-head h2{font-size:27px}.section-head p{display:block;color:#c8bece;font-size:13px;margin:2px 0 0}.all-templates{color:#c77dff;text-decoration:none;font-size:12px;font-weight:800;white-space:nowrap}
.template-grid{gap:13px}.template{display:block;height:auto!important;min-height:0;border:0!important;border-radius:0;background:transparent!important;overflow:visible;box-shadow:none!important;text-decoration:none;transform:none!important}
.template:before{display:none}.template:hover,.template:focus-visible{box-shadow:none!important;transform:none!important}
.template-visual{display:block;position:relative;overflow:hidden;height:172px;border-radius:14px;background:#2d2037;border:1px solid #493457}
.template-visual img{width:100%;height:100%;object-fit:cover;object-position:50% 23%;transform:none;transition:transform .25s}.template:hover .template-visual img{transform:scale(1.04)}
.template-visual:after{content:"";position:absolute;inset:55% 0 0;background:linear-gradient(transparent,#0d081489)}
.template-play{display:grid;position:absolute;left:12px;bottom:11px;z-index:2;place-items:center;background:#120c20a6;border:2px solid #fff;box-shadow:0 4px 18px #0008;color:white;font-size:15px;width:39px;height:39px;border-radius:50%}
.template-duration{position:absolute;right:8px;bottom:9px;z-index:2;color:white;font-size:11px;font-weight:800;background:#120e1dbd;padding:3px 8px;border-radius:10px}
.template-card-copy{display:block;padding:10px 3px 0}.template-card-copy strong{display:block;color:#fff;font-size:15px;line-height:1.24}.template-card-copy small{display:block;color:#c0b5c9;font-size:11px;line-height:1.45;margin-top:4px}
.studio-categories{display:none}.template-pro .clapper{display:none}
@media(max-width:1180px){.hero{grid-template-columns:.50fr .50fr}.hero h1{font-size:clamp(35px,4.2vw,52px)}.hero-showcase{height:406px}.capability{padding:11px 8px;gap:8px}.cap-icon{width:34px;height:34px;flex-basis:34px;font-size:19px}.cap-copy strong{font-size:12px}.cap-copy small{font-size:9px}.cap-arrow{display:none}.template-visual{height:157px}}
@media(max-width:760px){
.site{padding:0 14px 82px}.header{height:59px}.brand{font-size:18px}.hero{display:block;padding:20px 0 10px;min-height:0}.hero-copy{padding:0}.eyebrow{font-size:10px}.hero h1{font-size:clamp(31px,8.6vw,43px);line-height:1.1;margin:10px 0}.hero-copy>p{font-size:12px;line-height:1.52;margin:0 0 12px}.studio-entry{padding:11px 12px}.studio-tab{min-height:39px}.studio-search-wrap{min-height:40px}.studio-search-wrap input{font-size:11px;padding:10px 0}.studio-picker{gap:5px}.studio-choice{font-size:9px;padding:5px 7px}.studio-cta{min-height:43px}.studio-note{font-size:9px}.studio-note span:last-child{max-width:48%;text-align:right}.trust{gap:8px;margin-top:10px;font-size:10px}.trust span{white-space:normal}.hero-showcase{display:none}
.studio-capabilities{grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin:12px 0 23px}.capability{min-height:80px;padding:10px 9px;border-radius:13px;gap:8px}.cap-icon{width:36px;height:36px;flex-basis:36px}.cap-copy strong{font-size:11px}.cap-copy small{font-size:9px;line-height:1.26}
.section-head{margin:0 0 11px}.section-head h2{font-size:21px}.section-head p{font-size:11px}.all-templates{font-size:10px}.template-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:11px}.template-visual{height:125px;border-radius:12px}.template-play{width:30px;height:30px;font-size:12px;left:8px;bottom:8px}.template-duration{font-size:9px;padding:3px 6px}.template-card-copy{padding-top:7px}.template-card-copy strong{font-size:12px}.template-card-copy small{font-size:10px;margin-top:2px}.mobile-bottom{background:#15101deb}.mobile-bottom a.create{background:#ad5cf3;color:#110a18}
}
@media(max-width:365px){.hero h1{font-size:31px}.studio-choice{font-size:8px}.trust{font-size:9px}.capability{padding:8px 7px}.cap-icon{width:30px;height:30px;flex-basis:30px}.template-visual{height:112px}}
@media(prefers-reduced-motion:reduce){.capability,.template-visual img{transition:none}.capability:hover,.template:hover .template-visual img{transform:none}}

</style>
<script src="/studio.js" defer></script>
</head>
<body>
<a class="skip" href="#main">Preskoči na sadržaj</a>
<div class="site" id="top">
<header class="header">
<a class="brand" href="#top" aria-label="NEPAR Studio — Početna"><span class="brandmark"><svg viewBox="0 0 32 32" fill="none" aria-hidden="true"><path d="M5 5L27 16 5 27V5Z" fill="#0D2042"/><path d="M8 8L21 16 8 24V8Z" fill="#FFD83D"/><path d="M6 7L15 11V21L6 25V7Z" fill="#F9A300"/></svg></span><span>NEPAR <strong>Studio</strong></span></a>
<nav class="nav-links" aria-label="Glavna navigacija"><a href="#predlosci">Predlošci</a><a href="#predlosci">Istraži</a><a href="#kako-radi">Kako radi</a><a href="#cijene">Cijene</a><a href="#faq">FAQ</a></nav>
<div class="head-actions"><a class="btn btn-outline" href="https://kids.nepar.hr/">NEPAR Kids</a><a class="btn btn-gold" href="#izradi">✦ Započni stvarati</a></div>
<details class="mobile-menu"><summary aria-label="Otvori izbornik">☰</summary><nav aria-label="Mobilni izbornik"><a href="#predlosci">Predlošci</a><a href="#primjeri">Primjeri</a><a href="#kako-radi">Kako radi</a><a href="#cijene">Cijene</a><a href="#faq">Pomoć</a><a href="https://kids.nepar.hr/">NEPAR Kids</a></nav></details>
</header>
<main id="main">
<section class="hero" aria-labelledby="hero-title">
<div class="hero-copy">
<span class="eyebrow"><b>✦</b> TVOJ AI VIDEO STUDIO</span>
<h1 id="hero-title">Zamisli video.<br>Stvori ga s <em>NEPAR Studijem.</em></h1>
<p class="hero-lead">Personalizirani videi za djecu, obitelj, posebne prigode i tvoj posao — bez kamere i bez montaže.</p>
<div class="studio-entry" id="izradi" aria-label="Započni izradu videa">
<div class="studio-tabs" role="tablist" aria-label="Način izrade">
<button class="studio-tab" role="tab" id="tab-template" aria-controls="panel-template" aria-selected="true" tabindex="0" type="button" data-studio-mode="template">▦ Iz predloška</button>
<button class="studio-tab" role="tab" id="tab-free" aria-controls="panel-free" aria-selected="false" tabindex="-1" type="button" data-studio-mode="free">✦ Od nule <span class="visually-hidden">(uskoro)</span></button>
</div>
<div class="studio-panel" id="panel-template" role="tabpanel" aria-labelledby="tab-template">
<label for="studio-template-search" class="visually-hidden">Pretraži predložak: Djed, Nikola ili Nuki</label>
<div class="studio-search-wrap"><span aria-hidden="true">✦</span><input id="studio-template-search" type="search" autocomplete="off" placeholder="Npr. Djed Božićnjak čestita Ani rođendan..."></div>
<div class="studio-picker" role="group" aria-label="Odaberi video">
<button class="studio-choice" type="button" data-template="santa" aria-pressed="true">Djed Božićnjak</button>
<button class="studio-choice" type="button" data-template="nikola" aria-pressed="false">Sveti Nikola</button>
<button class="studio-choice" type="button" data-template="nuki" aria-pressed="false">Nuki video</button>
</div>
<a class="studio-cta" id="studio-create" href="https://kids.nepar.hr/personaliziraj?gift=djed-bozicnjak">Započni stvarati <span aria-hidden="true">→</span></a>
<div class="studio-note"><span id="studio-selected" aria-live="polite">Odabrano: Djed Božićnjak</span><span>Poruku upisuješ u sljedećem koraku</span></div>
</div>
<div class="studio-panel" id="panel-free" role="tabpanel" aria-labelledby="tab-free" hidden>
<label for="studio-idea" class="visually-hidden">Opiši svoju ideju</label><textarea id="studio-idea" class="studio-request" maxlength="1200" placeholder="Opiši video koji želiš napraviti..."></textarea>
<p class="studio-request-help">Generiranje od nule još nije dostupno. Ideju možeš poslati i zatražiti rani pristup — bez naplate.</p>
<a class="studio-cta" id="studio-request-link" href="mailto:nepar@nepar.hr?subject=Rani%20pristup%20NEPAR%20Studio%20Pro">Zatraži rani pristup <span aria-hidden="true">→</span></a>
</div>
</div>
<div class="trust"><span><span class="ic" aria-hidden="true">⚡</span> Brzo i jednostavno</span><span><span class="ic" aria-hidden="true">♢</span> Sigurno i privatno</span><span><span class="ic" aria-hidden="true">♡</span> Na hrvatskom jeziku</span></div>
</div>
<div class="hero-showcase" aria-label="Djed Božićnjak, Nuki i Sveti Nikola">
<div class="showcase-glow"></div>
<div class="showcase-figure figure-santa"><img src="/img/santa.webp" alt="Djed Božićnjak u čarobnoj radionici" fetchpriority="high" width="450" height="580"></div>
<div class="showcase-figure figure-nikola"><img src="/img/nikola.webp" alt="Sveti Nikola u blagdanskom ambijentu" fetchpriority="high" width="450" height="580"></div>
<div class="showcase-figure figure-nuki"><img src="/img/nukipromo.webp" alt="Nuki, zlatnosmeđi pas i junak NEPAR Kidsa" fetchpriority="high" width="450" height="580"></div>
<div class="showcase-clapper" aria-hidden="true">▶</div>
</div>
</section>
<section class="studio-capabilities" aria-label="Mogućnosti NEPAR Studija">
<a href="#predlosci" class="capability capability-active"><span class="cap-icon">▣</span><span class="cap-copy"><strong>Video iz predloška</strong><small>Djed Božićnjak, Sveti Nikola i Nuki</small></span><span class="cap-arrow" aria-hidden="true">→</span></a>
<a href="#pro" class="capability"><span class="cap-icon cap-icon-teal">▧</span><span class="cap-copy"><strong>Oživi fotografiju</strong><small>Pretvori fotografiju u živ video · Uskoro</small></span><span class="cap-arrow" aria-hidden="true">→</span></a>
<a href="#za-koga" class="capability"><span class="cap-icon">▤</span><span class="cap-copy"><strong>AI video za posao</strong><small>Reklame i promotivni sadržaj · Uskoro</small></span><span class="cap-arrow" aria-hidden="true">→</span></a>
<a href="#pro" class="capability capability-pro"><span class="cap-icon cap-icon-gold">✦</span><span class="cap-copy"><strong>Studio Pro <em class="soon-label">Uskoro</em></strong><small>Napredni promptovi i kontrola</small></span><span class="cap-arrow" aria-hidden="true">→</span></a>
</section>
<section class="templates" id="predlosci" aria-labelledby="templates-title">
<div class="section-head"><div><h2 id="templates-title">Popularni predlošci</h2><p>Gotovi video predlošci koje možeš odmah personalizirati.</p></div><a class="all-templates" href="https://kids.nepar.hr/#pokloni">Svi predlošci <span aria-hidden="true">→</span></a></div>
<div class="template-grid">
<a class="template template-santa" href="https://kids.nepar.hr/personaliziraj?gift=djed-bozicnjak" aria-label="Izradi video Djeda Božićnjaka">
<span class="template-visual"><img loading="lazy" src="/img/santa.webp" alt="Djed Božićnjak" width="480" height="350"><span class="template-play" aria-hidden="true">▶</span><span class="template-duration">15 sek</span></span>
<span class="template-card-copy"><strong>Djed Božićnjak</strong><small>Personalizirana videoporuka za dijete</small></span></a>
<a class="template template-nikola" href="https://kids.nepar.hr/personaliziraj?gift=sveti-nikola" aria-label="Izradi video Svetog Nikole">
<span class="template-visual"><img loading="lazy" src="/img/nikola.webp" alt="Sveti Nikola" width="480" height="350"><span class="template-play" aria-hidden="true">▶</span><span class="template-duration">15 sek</span></span>
<span class="template-card-copy"><strong>Sveti Nikola</strong><small>Video čestitka s osobnom porukom</small></span></a>
<a class="template template-nuki" href="https://kids.nepar.hr/personaliziraj?gift=video" aria-label="Izradi Nuki video">
<span class="template-visual"><img loading="lazy" src="/img/nuki.webp" alt="Nuki, veseli zlatnosmeđi pas" width="480" height="350"><span class="template-play" aria-hidden="true">▶</span><span class="template-duration">Nuki</span></span>
<span class="template-card-copy"><strong>Nuki video</strong><small>Zabavna, personalizirana avantura</small></span></a>
<a class="template template-song" href="https://kids.nepar.hr/#pokloni" aria-label="Odaberi rođendansku pjesmu na NEPAR Kids">
<span class="template-visual"><img loading="lazy" src="/img/song.webp" alt="Ilustracija rođendanske pjesme" width="480" height="350"><span class="template-play" aria-hidden="true">♫</span><span class="template-duration">oko 2 min</span></span>
<span class="template-card-copy"><strong>Rođendanska pjesma</strong><small>Pjesma s imenom tvojeg djeteta</small></span></a>
</div></section>
<section class="steps" id="kako-radi" aria-label="Kako radi NEPAR Studio">
<div class="steps-intro"><strong>Kako radi?</strong><small>Od ideje do gotovog sadržaja u samo 3 koraka.</small></div>
<div class="step"><span class="step-icon" aria-hidden="true">▦</span><span class="step-copy"><b>1. Odaberi predložak</b><small>Djed, Nikola, Nuki ili Pro</small></span></div>
<div class="step"><span class="step-icon" aria-hidden="true">✎</span><span class="step-copy"><b>2. Personaliziraj</b><small>Unesi ime, ideju ili poruku</small></span></div>
<div class="step"><span class="step-icon" aria-hidden="true">↓</span><span class="step-copy"><b>3. Preuzmi video</b><small>Gotov sadržaj stiže nakon izrade</small></span></div>
</section>
<section class="lower" aria-label="Primjeri i cijene">
<div class="panel examples" id="primjeri">
<a class="example-shot" href="https://www.youtube.com/watch?v=q8IxwgI6xPQ" target="_blank" rel="noopener noreferrer" aria-label="Pogledaj Nuki video na YouTubeu"><img loading="lazy" src="/img/nuki.webp" alt="Isječak iz pjesmice Nuki, daj donesi Kuki!"><span class="play" aria-hidden="true">▶</span></a>
<div><h2>Pogledaj <span style="color:var(--gold)">stvarne primjere</span></h2><p>Provjeri gotove videe prije nego što naručiš vlastiti. Nuki je na YouTubeu, a blagdanske poruke imaju video primjere.</p>
<div class="mini-examples">
<a href="https://kids.nepar.hr/djed-bozicnjak" aria-label="Pogledaj primjer Djeda Božićnjaka"><img src="/img/santa.webp" alt="Djed Božićnjak" loading="lazy"></a>
<a href="https://kids.nepar.hr/sveti-nikola" aria-label="Pogledaj primjer Svetog Nikole"><img src="/img/nikola.webp" alt="Sveti Nikola" loading="lazy"></a>
<a href="https://www.youtube.com/watch?v=q8IxwgI6xPQ" target="_blank" rel="noopener noreferrer" aria-label="Pogledaj Nuki na YouTubeu"><img src="/img/nuki.webp" alt="Nuki" loading="lazy"></a>
<a href="#pro" aria-label="Informacije o Studio Pro" style="display:grid;place-items:center;background:#4b2a88;text-decoration:none;color:white;font-size:20px">▶</a>
</div></div>
</div>
<div class="panel pricing" id="cijene"><h2>Jednostavne cijene</h2><p>Predloženi paketi za budući Studio Pro — još nisu dostupni.</p>
<div class="price-grid">
<div class="price"><span class="price-label">100 kredita</span><strong>9,90 €</strong><small>Predloženi paket · još nije u prodaji</small><span class="pill">U pripremi</span></div>
<div class="price popular"><span class="price-flag">Bolja vrijednost</span><span class="price-label">200 kredita</span><strong>14,90 €</strong><small>Predloženi paket · još nije u prodaji</small><span class="pill">U pripremi</span></div>
</div><p class="price-availability">Ovi paketi još nisu dostupni za kupnju. <a href="https://kids.nepar.hr/#pokloni">Dostupne personalizirane poklone kupi na NEPAR Kidsu.</a></p>
</div></section>
<div class="features" aria-label="Mogućnosti studija"><span><b>▣</b> Videi prilagođeni<br>za mobitel</span><span><b>♫</b> Personalizirani<br>govor i glazba</span><span><b>✧</b> Gotovi predlošci<br>za brz početak</span><span><b>∞</b> Napredne ideje<br>u Pro verziji</span><span><b>♢</b> Sigurna naplata<br>kod narudžbe</span></div>
<section class="audience" id="za-koga" aria-labelledby="audience-title"><h2 id="audience-title">Za ideje koje zaslužuju biti viđene.</h2><p>Od personaliziranog poklona do sadržaja za društvene mreže.</p><div class="audience-grid"><article class="audience-card"><span aria-hidden="true">♡</span><h3>Za obitelji</h3><p>Personalizirane poruke Djeda Božićnjaka i Svetog Nikole te Nuki avanture. Dostupno putem NEPAR Kidsa.</p></article><article class="audience-card"><span aria-hidden="true">◎</span><h3>Za kreatore</h3><p>Inspiracija za kratke videe, kreativne scene i sadržaj za društvene mreže. Napredni alati dolaze uskoro.</p></article><article class="audience-card"><span aria-hidden="true">◈</span><h3>Za poduzetnike</h3><p>Ideje za videooglase, predstavljanje proizvoda i brendirani sadržaj. Studio Pro je u pripremi.</p></article></div></section>
<section class="more"><div id="pro"><h2>NEPAR Studio Pro</h2><p>Pripremamo napredni editor za višescenske projekte, generiranje slika i videooglase. Ova je mogućnost još u razvoju i nije javno dostupna.</p><a href="mailto:nepar@nepar.hr?subject=NEPAR%20Studio%20Pro">Zatraži informacije o pristupu</a></div>
<div class="faq" id="faq"><h2>Česta pitanja</h2>
<details><summary>Mogu li prije kupnje vidjeti primjer?</summary><p>Da. Poveznice na primjer Djeda i Nikole vode na NEPAR Kids, a Nuki ima javni video na YouTubeu.</p></details>
<details><summary>Kako se plaća?</summary><p>Trenutačno su dostupne pojedinačne narudžbe preko NEPAR Kids trgovine. Studijski paketi kredita još se pripremaju.</p></details>
<details><summary>Moram li učitati fotografiju djeteta?</summary><p>Ne. Za postojeće personalizirane blagdanske poruke nije potrebna fotografija djeteta.</p></details>
<details><summary>Kada je video gotov?</summary><p>Rok isporuke ovisi o proizvodu i prikazan je tijekom narudžbe na NEPAR Kidsu. Nije riječ o trenutačnoj automatskoj isporuci za sve predloške.</p></details>
</div></section>
</main>
<footer class="foot"><span>© 2026 NEPAR Studio · Digitalna rješenja NEPAR</span><span><a href="https://kids.nepar.hr/privatnost">Privatnost</a><a href="https://kids.nepar.hr/uvjeti">Uvjeti</a><a href="mailto:nepar@nepar.hr">Kontakt</a></span></footer>
</div>
<nav class="mobile-bottom" aria-label="Brza mobilna navigacija"><a class="active" href="#top"><span aria-hidden="true">⌂</span>Početna</a><a class="create" href="#izradi">Započni stvarati</a><a href="#predlosci"><span aria-hidden="true">▦</span>Predlošci</a></nav>
</body></html>`;
const STUDIO_JS = String.raw`const templates = {
  santa:{name:"Djed Božićnjak",url:"https://kids.nepar.hr/personaliziraj?gift=djed-bozicnjak"},
  nikola:{name:"Sveti Nikola",url:"https://kids.nepar.hr/personaliziraj?gift=sveti-nikola"},
  nuki:{name:"Nuki video",url:"https://kids.nepar.hr/personaliziraj?gift=video"}
};
const tabs=Array.from(document.querySelectorAll("[data-studio-mode]"));
const panels={template:document.getElementById("panel-template"),free:document.getElementById("panel-free")};
for(const tab of tabs){
  tab.addEventListener("click",()=>{
    const mode=tab.dataset.studioMode;
    for(const other of tabs){other.setAttribute("aria-selected",String(other===tab));other.tabIndex=other===tab?0:-1;}
    panels.template.hidden=mode!=="template";panels.free.hidden=mode!=="free";
  });
  tab.addEventListener("keydown",e=>{
    if(e.key!=="ArrowLeft"&&e.key!=="ArrowRight")return;
    e.preventDefault();
    const next=tabs[(tabs.indexOf(tab)+(e.key==="ArrowRight"?1:tabs.length-1))%tabs.length];
    next.focus();next.click();
  });
}
function chooseTemplate(key){
  const value=templates[key];
  if(!value)return;
  for(const choice of document.querySelectorAll("[data-template]")){
    choice.setAttribute("aria-pressed",String(choice.dataset.template===key));
  }
  document.getElementById("studio-create").href=value.url;
  document.getElementById("studio-selected").textContent="Odabrano: "+value.name;
}
for(const choice of document.querySelectorAll("[data-template]")){
  choice.addEventListener("click",()=>chooseTemplate(choice.dataset.template));
}
const search=document.getElementById("studio-template-search");
if(search)search.addEventListener("input",()=>{
  const text=search.value.toLocaleLowerCase("hr");
  if(/nikol|krampus/.test(text))chooseTemplate("nikola");
  else if(/nuki|pas|kuki/.test(text))chooseTemplate("nuki");
  else if(/djed|božić|bozic|santa/.test(text))chooseTemplate("santa");
});
const idea=document.getElementById("studio-idea");
const email=document.getElementById("studio-request-link");
if(idea&&email)idea.addEventListener("input",()=>{
  const subject="Rani pristup NEPAR Studio Pro";
  const body=idea.value.trim()?"Pozdrav, zanima me rani pristup NEPAR Studio Pro.\n\nMoja ideja:\n"+idea.value.trim():"Pozdrav, zanima me rani pristup NEPAR Studio Pro.";
  email.href="mailto:nepar@nepar.hr?subject="+encodeURIComponent(subject)+"&body="+encodeURIComponent(body);
});
`;
const FAVICON = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="16" fill="#071326"/><path d="M12 11L55 32 12 53V11Z" fill="#ffcb23"/><path d="M20 20L42 32 20 44V20Z" fill="#09182e"/></svg>';
const H = {
  'content-security-policy': "default-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'; object-src 'none'; script-src 'self'; style-src 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data:; connect-src 'none'; media-src https://kids.nepar.hr; upgrade-insecure-requests",
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'strict-origin-when-cross-origin',
  'x-frame-options': 'DENY',
  'permissions-policy': 'camera=(), microphone=(), geolocation=()',
};
export default {
  async fetch(request) {
    const url = new URL(request.url);
    if (request.method !== 'GET' && request.method !== 'HEAD') return new Response('Method Not Allowed',{status:405,headers:{allow:'GET, HEAD',...H}});
    const path = url.pathname;
    let body, type, status=200, cache='public, max-age=120';
    if (Object.prototype.hasOwnProperty.call(IMAGES,path)) { const b64=IMAGES[path]; const imageBytes=Uint8Array.from(atob(b64),c=>c.charCodeAt(0)); return new Response(request.method==='HEAD'?null:imageBytes,{status:200,headers:{...H,'content-type':'image/webp','cache-control':'public, max-age=604800'}}); }
    if (path === '/' || path === '/index.html') { body=PAGE;type='text/html; charset=utf-8'; }
    else if (path === '/studio.js') { body=STUDIO_JS;type='application/javascript; charset=utf-8';cache='public, max-age=300'; }
    else if (path === '/favicon.svg') {body=FAVICON;type='image/svg+xml';cache='public, max-age=86400';}
    else if (path === '/robots.txt') {body='User-agent: *\nAllow: /\nSitemap: https://studio.nepar.hr/sitemap.xml\n';type='text/plain; charset=utf-8';}
    else if (path === '/sitemap.xml') {body='<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://studio.nepar.hr/</loc></url></urlset>';type='application/xml; charset=utf-8';}
    else if (path === '/healthz') {body=JSON.stringify({ok:true,app:'nepar-studio-public',version:'2026.11.23-visual'});type='application/json';cache='no-store';}
    else {status=404;body='Stranica nije pronađena.';type='text/plain; charset=utf-8';cache='no-store';}
    return new Response(request.method === 'HEAD' ? null : body,{status,headers:{...H,'content-type':type,'cache-control':cache}});
  }
};