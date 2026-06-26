export function esc(s: string): string {
  return (s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function opt(label: string, value: string, selected?: string): string {
  return `<option value="${esc(value)}"${value === selected ? " selected" : ""}>${esc(label)}</option>`;
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
