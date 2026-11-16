// Le titre doré كسّار de la Chkobba : node docs/chkobba/titre.cjs <aref-ruqaa-arabic-700-normal.woff2> (paquet npm @fontsource/aref-ruqaa)
// donne titre-kassar.png, à recadrer et réduire à 900 px de large → jeux/chkobba/img/titre.webp
const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport:{width:1000,height:700}, deviceScaleFactor:1 });
const ext = Array.from({length:18},(_,i)=>`${i*0.5}px ${i*0.9}px 0 hsl(32,70%,${30-i}%)`).join(',');
await p.setContent(`<style>@font-face{font-family:R;src:url(file://${process.argv[2]})}
html,body{margin:0;background:transparent}
.w{position:relative;display:inline-block;padding:40px 60px 60px}
.t{font:700 420px/1.25 R;direction:rtl}
.o{position:absolute;inset:40px 60px 60px;color:#5a3305;-webkit-text-stroke:18px #4a2a04;text-shadow:${ext},0 18px 30px rgba(0,0,0,.5)}
.f{position:relative;background:linear-gradient(175deg,#fff6c8 0%,#ffd75a 28%,#d99a1c 50%,#ffe68a 66%,#b9760f 88%,#ffdf7a 100%);-webkit-background-clip:text;background-clip:text;color:transparent}
</style><div class=w id=w><div class="t o">كسّار</div><div class="t f">كسّار</div></div>`);
await p.waitForTimeout(800); const el = await p.$('#w'); await el.screenshot({ path:'titre-kassar.png', omitBackground:true }); await b.close(); })();
