export function esc(s: string): string {
  return (s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export interface SelectOption { label: string; value: string; }

export function cselect(id: string, options: SelectOption[], selected?: string): string {
  const sel = selected || options[0]?.value || "";
  const label = options.find(o => o.value === sel)?.label || "";
  const opts = options.map(o =>
    `<button type="button" class="cselect-option${o.value === sel ? " selected" : ""}" data-value="${esc(o.value)}">${esc(o.label)}</button>`
  ).join("");
  return `<div class="cselect" data-id="${esc(id)}">
    <button type="button" class="cselect-trigger">${esc(label)}</button>
    <div class="cselect-menu">${opts}</div>
    <input type="hidden" id="${esc(id)}" value="${esc(sel)}">
  </div>`;
}

export const cselectInitJS = `
document.querySelectorAll('.cselect').forEach(function(cs){
  var trigger=cs.querySelector('.cselect-trigger'), input=cs.querySelector('input[type="hidden"]'),
      menu=cs.querySelector('.cselect-menu');
  trigger.addEventListener('click',function(e){
    e.stopPropagation();
    var wasOpen=cs.classList.contains('open');
    closeAll(); if(wasOpen)return;
    cs.classList.add('open');
    var rect=trigger.getBoundingClientRect();
    menu.style.position='fixed'; menu.style.top=(rect.bottom+4)+'px';
    menu.style.left=rect.left+'px'; menu.style.minWidth=rect.width+'px';
    menu.style.right='auto';
    document.body.appendChild(menu);
    menu.classList.add('open');
  });
  cs.querySelectorAll('.cselect-option').forEach(function(opt){
    opt.addEventListener('click',function(){
      cs.querySelectorAll('.cselect-option').forEach(function(o){o.classList.remove('selected');});
      opt.classList.add('selected');
      trigger.textContent=opt.textContent;
      input.value=opt.dataset.value;
      closeOne(cs,menu);
    });
  });
});
document.addEventListener('click',function(){closeAll();});
window.addEventListener('scroll',function(){closeAll();},true);
window.addEventListener('resize',function(){closeAll();});
function closeOne(cs,menu){cs.classList.remove('open');menu.classList.remove('open');cs.appendChild(menu);}
function closeAll(){
  document.querySelectorAll('.cselect.open').forEach(function(cs){
    var menu=cs.querySelector('.cselect-menu');
    if(menu){menu.classList.remove('open');cs.appendChild(menu);}
    cs.classList.remove('open');
  });
  document.querySelectorAll('.cselect-menu.open').forEach(function(m){
    m.classList.remove('open'); var cs=m.closest('.cselect'); if(cs)cs.appendChild(m);
  });
}
function cselectSet(id,val){
  var cs=document.querySelector('.cselect[data-id="'+id+'"]');
  if(!cs)return;
  cs.querySelector('input[type="hidden"]').value=val;
  var trigger=cs.querySelector('.cselect-trigger');
  cs.querySelectorAll('.cselect-option').forEach(function(o){
    o.classList.remove('selected');
    if(o.dataset.value===val){o.classList.add('selected');trigger.textContent=o.textContent;}
  });
}
`;

export const themeInitScript = `
<script>
  (function() {
    var saved = localStorage.getItem('theme');
    if (saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme:dark)').matches)) {
      document.documentElement.setAttribute('data-theme','dark');
    }
  })();
</script>`;

export const themeToggleScript = `
(function() {
  var html=document.documentElement, btn=document.getElementById('theme-btn');
  if(!btn) return;
  function set(d){ if(d){html.setAttribute('data-theme','dark');localStorage.setItem('theme','dark');}else{html.removeAttribute('data-theme');localStorage.setItem('theme','light');} }
  btn.addEventListener('click',function(e){
    var r=btn.getBoundingClientRect();
    html.style.setProperty('--vt-x',(r.left+r.width/2)+'px');
    html.style.setProperty('--vt-y',(r.top+r.height/2)+'px');
    var isDark=html.getAttribute('data-theme')==='dark';
    if(document.startViewTransition){document.startViewTransition(function(){set(!isDark);});}else{set(!isDark);}
  });
})();`;

export const themeSVG = `
<svg class="icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
  <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
</svg>
<svg class="icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
</svg>`;

export function sentStatusClass(s: string): string {
  return s === '已寄出' ? 'status-sent' : 'status-pending';
}

export function rcvdStatusClass(s: string): string {
  return s === '已收到' ? 'status-rcvd' : 'status-pending';
}
