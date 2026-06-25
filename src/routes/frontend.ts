import { styles } from "../styles";
import type { Bindings, QSLCard } from "../types";
import { esc, cselect, cselectInitJS } from "../lib/html";
import { countCards, queryCards, countBySentStatus, countByRcvdStatus, initSchema } from "../lib/db";

export async function frontendHandler(
  request: Request,
  env: Bindings
): Promise<Response> {
  await initSchema(env.DB);

  const url = new URL(request.url);
  const callF = url.searchParams.get("call") || undefined;
  const sentF = url.searchParams.get("sent") || undefined;
  const rcvdF = url.searchParams.get("rcvd") || undefined;
  const filters = { call: callF, sent_status: sentF, rcvd_status: rcvdF };
  const PAGE_SIZE = 50;
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1") || 1);

  const [total, cards, pendingSent, sentCount, pendingRcvd, rcvdCount] = await Promise.all([
    countCards(env.DB, filters),
    queryCards(env.DB, filters, PAGE_SIZE, (page - 1) * PAGE_SIZE),
    countBySentStatus(env.DB, "待寄"),
    countBySentStatus(env.DB, "已寄出"),
    countByRcvdStatus(env.DB, "待收"),
    countByRcvdStatus(env.DB, "已收到"),
  ]);

  const totalCnt = total?.cnt ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCnt / PAGE_SIZE));
  const callsign = env.CALLSIGN;
  const adminEmail = env.ADMIN_EMAIL;

  return new Response(
    renderPage(cards, totalCnt, totalPages, page, callsign, adminEmail,
      pendingSent?.cnt ?? 0, sentCount?.cnt ?? 0,
      pendingRcvd?.cnt ?? 0, rcvdCount?.cnt ?? 0,
      callF, sentF, rcvdF),
    { headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}

function statusBadge(status: string): string {
  const cls = status === "已寄出" ? "status-sent" : status === "已收到" ? "status-rcvd" : "status-pending";
  return `<span class="status-badge ${cls}">${esc(status)}</span>`;
}

function methodBadge(method: string): string {
  if (!method) return "";
  const label: Record<string, string> = { Bureau: "卡片局", Direct: "直邮", "电子": "电子" };
  return `<span class="method-badge">${esc(label[method] || method)}</span>`;
}

function renderPage(
  cards: QSLCard[], total: number, totalPages: number, page: number,
  callsign: string, adminEmail: string,
  pendingSent: number, sentCount: number,
  pendingRcvd: number, rcvdCount: number,
  callF?: string, sentF?: string, rcvdF?: string
): string {
  const rows = cards.map(c => `
    <tr>
      <td class="callsign"><a href="https://www.qrz.com/db/${esc(c.call)}" target="_blank" rel="noopener">${esc(c.call)}</a></td>
      <td>${esc(c.date)}</td>
      <td>${esc(c.time)}</td>
      <td>${esc(c.freq)}</td>
      <td>${esc(c.mode)}</td>
      <td>${statusBadge(c.sent_status)}${methodBadge(c.sent_method)}</td>
      <td>${esc(c.sent_date || "—")}</td>
      <td>${statusBadge(c.rcvd_status)}</td>
      <td>${esc(c.rcvd_date || "—")}</td>
    </tr>`).join("");

  return `<!DOCTYPE html>
<html lang="zh">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(callsign)} · QSL 卡片追踪</title>
  <meta name="description" content="${esc(callsign)} QSL 卡片收发记录">
  <script>
    (function() {
      var saved = localStorage.getItem('theme');
      if (saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme:dark)').matches)) {
        document.documentElement.setAttribute('data-theme','dark');
      }
    })();
  </script>
  <style>${styles}</style>
</head>
<body>
  <header class="header">
    <div class="header-inner">
      <a href="/" class="logo">${esc(callsign)}</a>
      <nav class="nav">
        <a href="/" class="active">QSL</a>
        <a href="/admin">管理</a>
        <a href="mailto:${esc(adminEmail)}">联系我</a>
        <button class="theme-btn" id="theme-btn" aria-label="切换主题">
          <svg class="icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
            <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
          </svg>
          <svg class="icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
          </svg>
        </button>
      </nav>
    </div>
  </header>

  <main class="main">
    <h1 class="page-title">QSL 卡片追踪</h1>
    <p class="page-subtitle">共 <strong>${total}</strong> 张卡片</p>

    <div class="stat-grid">
      <div class="stat-card"><div class="stat-label">待寄出</div><div class="stat-value">${pendingSent}</div><div class="stat-sub">已寄出 ${sentCount} 张</div></div>
      <div class="stat-card"><div class="stat-label">待接收</div><div class="stat-value">${pendingRcvd}</div><div class="stat-sub">已收到 ${rcvdCount} 张</div></div>
      <div class="stat-card"><div class="stat-label">发卡总计</div><div class="stat-value">${sentCount + pendingSent}</div><div class="stat-sub">卡片局 / 直邮 / 电子</div></div>
      <div class="stat-card"><div class="stat-label">收卡总计</div><div class="stat-value">${rcvdCount + pendingRcvd}</div><div class="stat-sub">QSL 卡片</div></div>
    </div>

    <div class="search-bar">
      <div class="search-field" style="flex:2;min-width:140px;">
        <label>呼号</label>
        <input type="text" placeholder="搜索呼号…" id="callSearch" value="${esc(callF || "")}">
      </div>
      <div class="search-field" style="min-width:100px;">
        <label>发件状态</label>
        ${cselect("sentFilter", [{label:"全部",value:""},{label:"待寄",value:"待寄"},{label:"已寄出",value:"已寄出"}], sentF || "")}
      </div>
      <div class="search-field" style="min-width:100px;">
        <label>收件状态</label>
        ${cselect("rcvdFilter", [{label:"全部",value:""},{label:"待收",value:"待收"},{label:"已收到",value:"已收到"}], rcvdF || "")}
      </div>
      <button class="btn btn-primary" style="align-self:flex-end;" onclick="search()">搜索</button>
    </div>

    <div class="table-wrap">
      <div class="table-header"><h2>卡片记录</h2><span>共 ${total} 条</span></div>
      <div style="overflow-x:auto;">
        <table>
          <thead><tr><th>呼号</th><th>日期</th><th>UTC</th><th>频率</th><th>模式</th><th>发件状态</th><th>发件日期</th><th>收件状态</th><th>收件日期</th></tr></thead>
          <tbody>${rows || '<tr><td colspan="9" style="text-align:center;color:var(--muted);padding:2rem;">暂无记录</td></tr>'}</tbody>
        </table>
      </div>
      ${renderPagination(total, totalPages, page, callF, sentF, rcvdF)}
    </div>
  </main>

  <footer>${esc(callsign)} &copy; ${new Date().getFullYear()}</footer>

  <script>
    ${cselectInitJS}
    function search() {
      var p = new URLSearchParams();
      var c=document.getElementById('callSearch').value.trim();
      var s=document.getElementById('sentFilter').value;
      var r=document.getElementById('rcvdFilter').value;
      if(c) p.set('call',c); if(s) p.set('sent',s); if(r) p.set('rcvd',r);
      window.location.search=p.toString();
    }
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
    })();
  </script>
</body>
</html>`;
}

function renderPagination(total: number, totalPages: number, page: number, callF?: string, sentF?: string, rcvdF?: string): string {
  if (totalPages <= 1) return "";
  const qs = new URLSearchParams();
  if (callF) qs.set("call", callF);
  if (sentF) qs.set("sent", sentF);
  if (rcvdF) qs.set("rcvd", rcvdF);
  const base = qs.size > 0 ? `?${qs.toString()}&` : "?";
  const prev = page > 1 ? `<a href="${base}page=${page - 1}" class="page-btn">← 上一页</a>` : `<button class="page-btn" disabled>← 上一页</button>`;
  const next = page < totalPages ? `<a href="${base}page=${page + 1}" class="page-btn">下一页 →</a>` : `<button class="page-btn" disabled>下一页 →</button>`;
  return `<div class="pagination">${prev}<span class="page-info">第 ${page} / ${totalPages} 页 · ${total} 条</span>${next}</div>`;
}
