// Run: NODE_PATH=/path/to/node_modules node tests/layout.cjs
// Requires Playwright with Chromium/WebKit installed. Static preview at TEST_URL.
const {chromium,webkit}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const sizes=[[320,568],[375,667],[390,844],[393,852],[430,932]];
async function scan(p){return p.evaluate(()=>{
 const problems=[],vw=document.documentElement.clientWidth;
 // Ignore only non-rendered nodes (hidden/closed dialog); no decorative exemptions.
 for(const e of document.querySelectorAll('*')){if(!e.getClientRects().length)continue;const r=e.getBoundingClientRect();if(!r.width&&!r.height)continue;if(r.left < -1 || r.right>vw+1)problems.push({element:e.tagName,cls:e.className,field:e.dataset.field,left:r.left,right:r.right,vw})}
 for(const e of document.querySelectorAll('main input,main textarea,main select')){const card=e.closest('.panel,.exercise');if(!card||!e.getClientRects().length)continue;const r=e.getBoundingClientRect(),c=card.getBoundingClientRect(),s=getComputedStyle(card),left=c.left+parseFloat(s.borderLeftWidth)+parseFloat(s.paddingLeft),right=c.right-parseFloat(s.borderRightWidth)-parseFloat(s.paddingRight);if(r.left<left-1||r.right>right+1)problems.push({field:e.dataset.field,left:r.left,right:r.right,cardContentLeft:left,cardContentRight:right});if(e.tagName==='INPUT'&&Math.abs(r.height-52)>1)problems.push({field:e.dataset.field,height:r.height});}
 for(const label of document.querySelectorAll('.form-field')){const input=label.querySelector('input');if(!input)continue;const range=document.createRange();range.selectNodeContents(label.firstChild);if(range.getBoundingClientRect().bottom+5>input.getBoundingClientRect().top)problems.push({label:label.textContent,overlap:true})}
 return problems;
})}
async function aboveNav(p,locator){await locator.evaluate(e=>e.scrollIntoView({block:'end'}));await p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));const a=await locator.boundingBox(),n=await p.locator('nav').boundingBox();assert(a.y+a.height<=n.y-8,`Occlusion: ${JSON.stringify({a,n})}`)}
(async()=>{const results=[];for(const [name,engine] of [['chromium',chromium],['webkit',webkit]]){const b=await engine.launch();for(const mode of ['browser-toolbar','standalone-safe-area']){const ctx=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'}),p=await ctx.newPage();const errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto(process.env.TEST_URL||'http://127.0.0.1:8765');await p.locator('[data-field=gym]').fill('测试健身房・成増');
// Geometry simulation only: does not emulate actual iOS chrome or install a PWA.
if(mode==='standalone-safe-area')await p.addStyleTag({content:'nav { padding-bottom:42px !important; }'});
for(const [width,height]of sizes){await p.setViewportSize({width,height:height-(mode==='browser-toolbar'?80:0)});await p.locator('[data-view=training]').click();await p.locator('.exercise').evaluateAll(es=>es.forEach(e=>e.open=true));
// Disable outer clipping: overflow must be fixed at its source.
await p.addStyleTag({content:'html,body{overflow-x:visible!important}'});
assert.deepEqual(await scan(p),[]);for(const selector of ['.set > .row','[data-set="0.0"]','[data-set="4.1"]','[data-exercise="4"]','#finish'])await aboveNav(p,p.locator(selector).first());
await p.locator('[data-view=sleep]').click();assert.deepEqual(await scan(p),[]);await aboveNav(p,p.locator('[data-field="sleep.notes"]'));for(const key of ['bed','asleep','wake','caffeine'])assert.equal(await p.locator(`[data-field="sleep.${key}"]`).inputValue(),'');
await p.locator('[data-field="sleep.asleep"]').fill('18:04');assert.equal(await p.locator('[data-field="sleep.asleep"]').inputValue(),'18:04');await p.locator('[data-field="sleep.asleep"]').fill('');
if(width===390&&mode==='standalone-safe-area'){await p.evaluate(()=>scrollTo(0,0));if(process.env.SCREENSHOT_DIR)await p.screenshot({path:`${process.env.SCREENSHOT_DIR}/${name}-root-sleep.png`})}
await p.locator('[data-view=history]').click();assert.deepEqual(await scan(p),[]);await aboveNav(p,p.locator('.history-item').last());results.push({engine:name,mode,viewport:`${width}x${height}`,overflow:0,cardBounds:'PASS',height52:'PASS',occlusion:'PASS'});
}assert.deepEqual(errors,[]);await ctx.close()}await b.close()}console.log(JSON.stringify(results,null,2));if(process.env.RESULT_PATH)fs.writeFileSync(process.env.RESULT_PATH,JSON.stringify(results,null,2))})().catch(e=>{console.error(e);process.exit(1)});
