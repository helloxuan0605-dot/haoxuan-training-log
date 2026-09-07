'use strict';
// Read-only viewport inspection. Never reads/writes training data or storage.
function pwaViewportInfo(){
 const meta=name=>document.querySelector(`meta[name="${name}"]`)?.getAttribute('content')??'absent';
 const probe=document.createElement('div');
 probe.dataset.pwaSafeAreaProbe='';
 probe.style.cssText='position:absolute;top:0;left:0;visibility:hidden;pointer-events:none;width:0;height:0;padding:env(safe-area-inset-top,0px) 0 0;border:0;';
 document.body.append(probe);
 const safeTop=parseFloat(getComputedStyle(probe).paddingTop)||0;
 probe.remove();
 return {displayMode:matchMedia('(display-mode: standalone)').matches?'standalone':'browser',navigatorStandalone:navigator.standalone===true,viewport:meta('viewport'),statusBarStyle:meta('apple-mobile-web-app-status-bar-style'),themeColor:meta('theme-color'),safeAreaTop:safeTop,innerHeight:window.innerHeight,clientHeight:document.documentElement.clientHeight,visualHeight:window.visualViewport?.height??null,visualOffsetTop:window.visualViewport?.offsetTop??null,screenHeight:screen.height};
}
function pwaDiagnosticsValues(){const d=pwaViewportInfo();const px=v=>v===null?'不支持':`${Math.round(v*100)/100} px`;return [
 ['display-mode',d.displayMode],['navigator.standalone',String(d.navigatorStandalone)],['viewport meta',d.viewport],['apple-mobile-web-app-status-bar-style',d.statusBarStyle],['theme-color',d.themeColor],['safe-area-inset-top',px(d.safeAreaTop)],['window.innerHeight',px(d.innerHeight)],['document.documentElement.clientHeight',px(d.clientHeight)],['visualViewport.height',px(d.visualHeight)],['visualViewport.offsetTop',px(d.visualOffsetTop)],['screen.height',px(d.screenHeight)]
 ].map(([label,value])=>`<dt>${esc(label)}</dt><dd>${esc(value)}</dd>`).join('')}
function pwaDiagnosticsPanel(){return `<section class="panel diagnostics" id="pwa-ui-diagnostics"><h2>iOS / PWA UI Diagnostics</h2><p class="muted">当前页面运行时测量，只读；尺寸变化时自动刷新。</p><dl id="pwa-ui-values">${pwaDiagnosticsValues()}</dl></section>`}
let pwaDiagnosticsFrame;
function refreshPwaDiagnostics(){if(!document.querySelector('#pwa-ui-values'))return;cancelAnimationFrame(pwaDiagnosticsFrame);pwaDiagnosticsFrame=requestAnimationFrame(()=>{const panel=document.querySelector('#pwa-ui-values');if(panel)panel.innerHTML=pwaDiagnosticsValues()})}
window.addEventListener('resize',refreshPwaDiagnostics);
window.addEventListener('pageshow',refreshPwaDiagnostics);
window.visualViewport?.addEventListener('resize',refreshPwaDiagnostics);
window.visualViewport?.addEventListener('scroll',refreshPwaDiagnostics);
