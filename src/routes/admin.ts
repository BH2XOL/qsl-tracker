import type { Bindings } from "../types";
import { esc, cselect, cselectInitJS, themeInitScript, themeToggleScript, themeSVG } from "../lib/html";
import { styles } from "../styles";

export async function adminHandler(
  _request: Request,
  env: Bindings
): Promise<Response> {
  return new Response(renderAdmin(env.CALLSIGN), {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

function renderAdmin(callsign: string): string {
  return `<!DOCTYPE html>
<html lang="zh">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(callsign)} · QSL 管理</title>
  ${themeInitScript}
  <style>${styles}
    .card {
      background:var(--card-bg); border:1px solid var(--card-border);
      border-radius:var(--radius); padding:1.25rem; margin-bottom:1rem;
      box-shadow:var(--card-shadow);
      backdrop-filter:blur(16px); -webkit-backdrop-filter:blur(16px);
      transition: background-color 0.4s, border-color 0.4s, box-shadow 0.4s;
    }
    .card-title {
      font-size:0.95rem; font-weight:600; color:var(--text-heading);
      margin-bottom:1rem; padding-bottom:0.6rem; border-bottom:1px solid var(--divider);
    }
    .form-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(160px,1fr)); gap:0.75rem; }
    .form-field { display:flex; flex-direction:column; gap:0.2rem; min-width:0; }
    .form-field label { font-size:0.72rem; color:var(--muted); font-weight:500; letter-spacing:0.04em; }
    .form-field input {
      height:2.35rem; padding:0 0.65rem; font-size:0.82rem; width:100%;
      background:var(--input-bg); border:1px solid var(--input-border); border-radius:8px;
      color:var(--text); font-family:inherit;
      transition: border-color 0.25s, box-shadow 0.25s; outline:none;
    }
    .form-field input:focus {
      border-color:var(--accent-border); box-shadow:0 0 0 2px var(--accent-soft);
    }
    .form-field textarea {
      min-height:4.5rem; padding:0.55rem 0.65rem; font-size:0.82rem; width:100%;
      background:var(--input-bg); border:1px solid var(--input-border); border-radius:8px;
      color:var(--text); font-family:inherit; resize:vertical;
      transition: border-color 0.25s, box-shadow 0.25s; outline:none;
    }
    .form-field textarea:focus {
      border-color:var(--accent-border); box-shadow:0 0 0 2px var(--accent-soft);
    }
    .upload-zone { border:2px dashed var(--input-border); border-radius:var(--radius); padding:2rem; text-align:center; cursor:pointer; transition: border-color 0.25s, background-color 0.25s; }
    .upload-zone:hover { border-color:var(--accent-border); background:var(--accent-soft); }
    .upload-zone p { color:var(--muted); font-size:0.85rem; }
    .upload-zone p strong { color:var(--accent); }
    .toast { position:fixed; bottom:1.5rem; right:1.5rem; z-index:999; padding:0.75rem 1.25rem; border-radius:8px; font-size:0.85rem; font-weight:500; box-shadow:var(--card-shadow); animation:toast-in 0.3s ease; }
    .toast-ok { background:rgba(45,164,78,0.14); color:var(--success); border:1px solid var(--success); }
    .toast-err { background:var(--danger-soft); color:var(--danger); border:1px solid var(--danger); }
    @keyframes toast-in { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
    .callsign-cell { font-weight:600; color:var(--text-heading); }
    .checkbox { width:1rem; height:1rem; accent-color:var(--accent); cursor:pointer; }
    @media (max-width:640px) { .form-grid { grid-template-columns:repeat(1,1fr); } }
  </style>
</head>
<body>
  <header class="header">
    <div class="header-inner">
      <a href="/admin" class="logo">${esc(callsign)}</a>
      <nav class="nav">
        <a href="/">QSL</a>
        <a href="/admin" class="active">管理</a>
        <button class="theme-btn" id="theme-btn" aria-label="切换主题">
          ${themeSVG}
        </button>
      </nav>
    </div>
  </header>
  <main class="main">
    <h1 class="page-title">QSL 卡片管理</h1>

    <div class="card">
      <div class="card-title" style="display:flex;align-items:center;justify-content:space-between;">
        <span>CSV 导入</span>
        <a href="/admin/api/export" class="btn btn-sm btn-success" style="text-decoration:none;">导出 CSV</a>
      </div>
      <div class="upload-zone" id="uploadZone" onclick="document.getElementById('fileInput').click()">
        <p>拖拽 <strong>.csv</strong> 文件或<strong>点击选择</strong></p>
        <p style="font-size:0.72rem;margin-top:0.25rem;">格式: 呼号,日期,UTC,频率,模式,发件状态,发件方式,发件日期,收件状态,收件日期,备注</p>
      </div>
      <input type="file" id="fileInput" accept=".csv" style="display:none" onchange="handleFile(this)">
      <div id="uploadResult" style="margin-top:0.75rem;font-size:0.82rem;color:var(--muted);display:none;"></div>
    </div>

    <div class="card">
      <div class="card-title">添加 QSL 卡片</div>
      <div class="form-grid">
        <div class="form-field"><label>呼号 *</label><input type="text" id="addCall" style="text-transform:uppercase;" maxlength="10"></div>
        <div class="form-field"><label>日期 *</label><input type="date" id="addDate"></div>
        <div class="form-field"><label>UTC 时间 *</label><input type="time" id="addTime" value="12:00"></div>
        <div class="form-field"><label>频率 (MHz)</label><input type="text" id="addFreq" placeholder="14.270"></div>
        <div class="form-field"><label>模式</label><input type="text" id="addMode" placeholder="SSB / FT8 / CW"></div>
        <div class="form-field"><label>发件方式</label>${cselect("addMethod", [{label:"—",value:""},{label:"卡片局",value:"卡片局"},{label:"直邮",value:"直邮"},{label:"电子",value:"电子"},{label:"眼球QSO",value:"眼球QSO"}])}</div>
        <div class="form-field"><label>备注</label><textarea id="addNote"></textarea></div>
      </div>
      <button class="btn btn-primary" style="margin-top:1rem;" onclick="addCard()">添加卡片</button>
    </div>

    <div class="card">
      <div class="card-title" style="display:flex;align-items:center;justify-content:space-between;">
        <span>卡片列表</span>
        <button class="btn btn-sm btn-danger" onclick="batchDelete()">批量删除</button>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr><th style="width:32px;"><input type="checkbox" class="checkbox" id="selectAll" onclick="toggleAll()"></th><th>呼号</th><th>日期</th><th>UTC</th><th>频率</th><th>模式</th><th>发件</th><th>收件</th><th>操作</th></tr>
          </thead>
          <tbody id="cardTable"><tr><td colspan="9" style="text-align:center;color:var(--muted);">加载中…</td></tr></tbody>
        </table>
      </div>
      <div id="cardPager" style="display:flex;align-items:center;justify-content:space-between;padding:0.8rem 1rem;border-top:1px solid var(--divider);"></div>
    </div>

    <div class="card" id="editCard" style="display:none;">
      <div class="card-title">编辑卡片</div>
      <input type="hidden" id="editId">
      <div class="form-grid">
        <div class="form-field"><label>呼号</label><input type="text" id="editCall" style="text-transform:uppercase;" maxlength="10"></div>
        <div class="form-field"><label>日期</label><input type="date" id="editDate"></div>
        <div class="form-field"><label>UTC 时间</label><input type="time" id="editTime"></div>
        <div class="form-field"><label>频率</label><input type="text" id="editFreq"></div>
        <div class="form-field"><label>模式</label><input type="text" id="editMode"></div>
        <div class="form-field"><label>发件状态</label>${cselect("editSentStat", [{label:"待寄",value:"待寄"},{label:"已寄出",value:"已寄出"}])}</div>
        <div class="form-field"><label>发件方式</label>${cselect("editSentMtd", [{label:"—",value:""},{label:"卡片局",value:"卡片局"},{label:"直邮",value:"直邮"},{label:"电子",value:"电子"}])}</div>
        <div class="form-field"><label>发件日期</label><input type="date" id="editSentDate"></div>
        <div class="form-field"><label>收件状态</label>${cselect("editRcvdStat", [{label:"待收",value:"待收"},{label:"已收到",value:"已收到"}])}</div>
        <div class="form-field"><label>收件日期</label><input type="date" id="editRcvdDate"></div>
        <div class="form-field"><label>备注</label><textarea id="editNote"></textarea></div>
      </div>
      <button class="btn btn-success" style="margin-top:1rem;" onclick="saveEdit()">保存修改</button>
      <button class="btn" style="margin-top:1rem;margin-left:0.5rem;background:var(--btn-bg);color:var(--text);" onclick="document.getElementById('editCard').style.display='none'">取消</button>
    </div>
  </main>
  <script>
    ${cselectInitJS}
    var uploadZone = document.getElementById('uploadZone');
    uploadZone.addEventListener('dragover',function(e){e.preventDefault();});
    uploadZone.addEventListener('drop',function(e){e.preventDefault();handleFile(e.dataTransfer.files[0]);});
    async function handleFile(f) {
      var file = f.files ? f.files[0] : f; if (!file) return;
      if (!file.name.endsWith('.csv')) { toast('请选择 .csv 文件', true); return; }
      var text = await file.text();
      var resp = await fetch('/admin/api/import', { method:'POST', body:text });
      var data = await resp.json();
      document.getElementById('uploadResult').style.display='block';
      document.getElementById('uploadResult').textContent = '新增 '+data.inserted+' 条 · 跳过 '+data.skipped+' 条 · 错误 '+data.errors+' 行';
      toast('导入完成 · 新增 '+data.inserted+' 条');
      if (data.inserted > 0) goPage(1);
    }

    function toast(m,e) {
      var t=document.createElement('div'); t.className='toast toast-'+(e?'err':'ok'); t.textContent=m;
      document.body.appendChild(t); setTimeout(function(){t.remove()},2500);
    }

    async function addCard() {
      var call = document.getElementById('addCall').value.trim().toUpperCase();
      var date = document.getElementById('addDate').value;
      var time = document.getElementById('addTime').value;
      if (!call || !date || !time) { toast('呼号、日期、时间为必填项', true); return; }
      var body = {
        call, date, time,
        freq: document.getElementById('addFreq').value.trim(),
        mode: document.getElementById('addMode').value.trim(),
        sent_status: '待寄',
        sent_method: document.getElementById('addMethod').value,
        sent_date: '',
        rcvd_status: '待收',
        rcvd_date: '',
        note: document.getElementById('addNote').value.trim()
      };
      var resp = await fetch('/admin/api/add', { method:'POST', headers:{'X-Requested-With':'XMLHttpRequest'}, body:JSON.stringify(body) });
      var data = await resp.json();
      if (data.ok) { toast('已添加 ' + call); goPage(1); clearAddForm(); }
      else toast(data.error || '添加失败', true);
    }

    function clearAddForm() {
      document.getElementById('addCall').value = '';
      document.getElementById('addFreq').value = '';
      document.getElementById('addMode').value = '';
      cselectSet('addMethod', '');
      document.getElementById('addNote').value = '';
    }

    function editCard(id) {
      var card = _cardCache[id];
      if (!card) return;
      document.getElementById('editId').value = card.id;
      document.getElementById('editCall').value = card.call;
      document.getElementById('editDate').value = card.date;
      document.getElementById('editTime').value = card.time;
      document.getElementById('editFreq').value = card.freq;
      document.getElementById('editMode').value = card.mode;
      cselectSet('editSentStat', card.sent_status);
      cselectSet('editSentMtd', card.sent_method);
      document.getElementById('editSentDate').value = card.sent_date;
      cselectSet('editRcvdStat', card.rcvd_status);
      document.getElementById('editRcvdDate').value = card.rcvd_date;
      document.getElementById('editNote').value = card.note;
      document.getElementById('editCard').style.display = 'block';
      document.getElementById('editCard').scrollIntoView({ behavior: 'smooth' });
    }

    async function saveEdit() {
      var id = parseInt(document.getElementById('editId').value);
      var body = {
        call: document.getElementById('editCall').value.trim().toUpperCase(),
        date: document.getElementById('editDate').value,
        time: document.getElementById('editTime').value,
        freq: document.getElementById('editFreq').value.trim(),
        mode: document.getElementById('editMode').value.trim(),
        sent_status: document.getElementById('editSentStat').value,
        sent_method: document.getElementById('editSentMtd').value,
        sent_date: document.getElementById('editSentDate').value,
        rcvd_status: document.getElementById('editRcvdStat').value,
        rcvd_date: document.getElementById('editRcvdDate').value,
        note: document.getElementById('editNote').value.trim()
      };
      var resp = await fetch('/admin/api/update/' + id, { method:'POST', headers:{'X-Requested-With':'XMLHttpRequest'}, body:JSON.stringify(body) });
      var data = await resp.json();
      if (data.ok) { toast('已更新'); document.getElementById('editCard').style.display='none'; goPage(1); }
      else toast(data.error || '更新失败', true);
    }

    async function deleteOne(id) {
      if (!confirm('删除此卡片？不可撤销。')) return;
      await fetch('/admin/api/delete', { method:'POST', headers:{'X-Requested-With':'XMLHttpRequest'}, body:JSON.stringify({ids:[id]}) });
      toast('已删除'); goPage(1);
    }

    async function batchDelete() {
      var checks = document.querySelectorAll('.select-row:checked');
      if (!checks.length) { toast('请勾选记录', true); return; }
      if (!confirm('删除选中的 ' + checks.length + ' 条？不可撤销。')) return;
      var ids = Array.from(checks).map(function(c){ return parseInt(c.value); });
      await fetch('/admin/api/delete', { method:'POST', headers:{'X-Requested-With':'XMLHttpRequest'}, body:JSON.stringify({ids:ids}) });
      toast('已批量删除 ' + ids.length + ' 条'); goPage(1);
    }

    function toggleAll() {
      var checked = document.getElementById('selectAll').checked;
      document.querySelectorAll('.select-row').forEach(function(c){ c.checked = checked; });
    }

    var _page = 1, _totalPages = 1, _cardCache = {};
    function renderPager() {
      var p = document.getElementById('cardPager');
      if (!p || _totalPages <= 1) { if (p) p.innerHTML = ''; return; }
      var prev = _page > 1 ? '<button class="page-btn" onclick="goPage('+(_page-1)+')">← 上一页</button>' : '<button class="page-btn" disabled>← 上一页</button>';
      var next = _page < _totalPages ? '<button class="page-btn" onclick="goPage('+(_page+1)+')">下一页 →</button>' : '<button class="page-btn" disabled>下一页 →</button>';
      p.innerHTML = prev + '<span class="page-info">第 '+_page+' / '+_totalPages+' 页</span>' + next;
    }
    function goPage(n) { _page = n; loadList(); }
    async function loadList() {
      var resp = await fetch('/admin/api/list?page='+_page);
      var data = await resp.json();
      _totalPages = Math.max(1, Math.ceil((data.total||0) / (data.pageSize||50)));
      _cardCache = {};
      document.getElementById('cardTable').innerHTML = data.cards.map(function(c){
        _cardCache[c.id] = c;
        var sentClass = c.sent_status === '已寄出' ? 'status-sent' : 'status-pending';
        var rcvdClass = c.rcvd_status === '已收到' ? 'status-rcvd' : 'status-pending';
        return '<tr><td><input type="checkbox" class="checkbox select-row" value="'+c.id+'"></td>'+
               '<td class="callsign-cell">'+esc(c.call)+'</td>'+
               '<td>'+esc(c.date)+'</td><td>'+esc(c.time)+'</td><td>'+esc(c.freq)+'</td><td>'+esc(c.mode)+'</td>'+
               '<td><span class="status-badge '+sentClass+'">'+esc(c.sent_status)+'</span></td>'+
               '<td><span class="status-badge '+rcvdClass+'">'+esc(c.rcvd_status)+'</span></td>'+
               '<td><button class="btn btn-sm btn-primary" onclick="editCard('+c.id+')" style="margin-right:0.25rem;">编辑</button>'+
               '<button class="btn btn-sm btn-danger" onclick="deleteOne('+c.id+')">删除</button></td></tr>';
      }).join('');
      renderPager();
    }
    function esc(s){ return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

    ${themeToggleScript}
    loadList();
  </script>
</body>
</html>`;
}
