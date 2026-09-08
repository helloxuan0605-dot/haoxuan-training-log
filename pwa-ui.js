'use strict';
// UI-only experimental guard plus read-only measurements. No training/storage access.
const pwaStandaloneQuery=matchMedia('(display-mode: standalone)');
function syncPwaEdgeGuard(){
 document.documentElement.classList.toggle('pwa-standalone',pwaStandaloneQuery.matches||navigator.standalone===true);
 refreshPwaDiagnostics();
}
pwaStandaloneQuery.addEventListener('change',syncPwaEdgeGuard);
window.addEventListener('pageshow',syncPwaEdgeGuard);
function pwaViewportInfo(){
 const meta=name=>document.querySelector(`meta[name="${name}"]`)?.getAttribute('content')??'absent';
 const probe=document.createElement('div');
 probe.dataset.pwaSafeAreaProbe='';
 probe.style.cssText='position:absolute;top:0;left:0;visibility:hidden;pointer-events:none;width:0;height:0;padding:env(safe-area-inset-top,0px) 0 env(safe-area-inset-bottom,0px);border:0;';
 document.body.append(probe);
 const probeStyle=getComputedStyle(probe);
 const safeTop=parseFloat(probeStyle.paddingTop)||0,safeBottom=parseFloat(probeStyle.paddingBottom)||0;
 probe.remove();
 const guard=document.querySelector('#pwa-top-edge-guard'),guardStyle=guard?getComputedStyle(guard):null,guardRect=guard?.getBoundingClientRect();
 const nav=document.querySelector('.bottom-nav');
 const guardActive=!!guardStyle&&guardStyle.display!=='none';
 const comfort=parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--bottom-nav-comfort'))||0;
 const navPadding=nav?parseFloat(getComputedStyle(nav).paddingBottom):null;
 return {displayMode:matchMedia('(display-mode: standalone)').matches?'standalone':'browser',navigatorStandalone:navigator.standalone===true,viewport:meta('viewport'),statusBarStyle:meta('apple-mobile-web-app-status-bar-style'),themeColor:meta('theme-color'),safeAreaTop:safeTop,safeAreaBottom:safeBottom,bottomComfort:comfort,bottomPadding:navPadding,guardActive,guardTop:guardActive?guardRect.top:null,guardHeight:guardActive?guardRect.height:null,innerHeight:window.innerHeight,clientHeight:document.documentElement.clientHeight,visualHeight:window.visualViewport?.height??null,visualOffsetTop:window.visualViewport?.offsetTop??null,screenHeight:screen.height};
}
function pwaDiagnosticsValues(){const d=pwaViewportInfo();const px=v=>v===null?'不支持':`${Math.round(v*100)/100} px`;return [
 ['display-mode',d.displayMode],['navigator.standalone',String(d.navigatorStandalone)],['viewport meta',d.viewport],['apple-mobile-web-app-status-bar-style',d.statusBarStyle],['theme-color',d.themeColor],['safe-area-inset-top',px(d.safeAreaTop)],['safe-area-inset-bottom',px(d.safeAreaBottom)],['bottom nav comfort',px(d.bottomComfort)],['bottom nav actual bottom padding',px(d.bottomPadding)],['scroll-edge guard',d.guardActive?'active':'inactive'],['guard rect',d.guardActive?`top ${px(d.guardTop)} / height ${px(d.guardHeight)}`:'inactive'],['window.innerHeight',px(d.innerHeight)],['document.documentElement.clientHeight',px(d.clientHeight)],['visualViewport.height',px(d.visualHeight)],['visualViewport.offsetTop',px(d.visualOffsetTop)],['screen.height',px(d.screenHeight)]
 ].map(([label,value])=>`<dt>${esc(label)}</dt><dd>${esc(value)}</dd>`).join('')}
function pwaDiagnosticsPanel(){return `<section class="panel diagnostics" id="pwa-ui-diagnostics"><h2>iOS / PWA UI Diagnostics</h2><p class="muted">当前页面运行时测量，只读；尺寸变化时自动刷新。</p><dl id="pwa-ui-values">${pwaDiagnosticsValues()}</dl></section>`}
let pwaDiagnosticsFrame;
function refreshPwaDiagnostics(){if(!document.querySelector('#pwa-ui-values'))return;cancelAnimationFrame(pwaDiagnosticsFrame);pwaDiagnosticsFrame=requestAnimationFrame(()=>{const panel=document.querySelector('#pwa-ui-values');if(panel)panel.innerHTML=pwaDiagnosticsValues()})}
window.addEventListener('resize',refreshPwaDiagnostics);
window.addEventListener('pageshow',refreshPwaDiagnostics);
window.visualViewport?.addEventListener('resize',refreshPwaDiagnostics);
window.visualViewport?.addEventListener('scroll',refreshPwaDiagnostics);

syncPwaEdgeGuard();
