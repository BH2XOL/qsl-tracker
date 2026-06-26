import type { Bindings } from "../types";
import { queryCards, insertCard, updateCard, deleteCard, deleteCards, countCards, exportAllCards } from "../lib/db";

export async function apiImportHandler(request: Request, env: Bindings): Promise<Response> {
  const text = await request.text();
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) {
    return Response.json({ inserted: 0, skipped: 0, errors: 0 });
  }

  let inserted = 0, skipped = 0, errors = 0;
  const VALID_SENT = ["待寄", "已寄出"];
  const VALID_RCVD = ["待收", "已收到"];
  const VALID_METHOD = ["", "卡片局", "直邮", "电子", "眼球QSO"];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",");
    const call = (cols[0] || "").trim().toUpperCase();
    if (!call || call.length > 10) { errors++; continue; }
    const date = (cols[1] || "").trim();
    const time = (cols[2] || "").trim();
    if (!date || !time) { errors++; continue; }
    const freq = (cols[3] || "").trim();
    const mode = (cols[4] || "").trim();
    const sent_status = VALID_SENT.includes(cols[5] || "") ? (cols[5] || "").trim() : "待寄";
    const sent_method = VALID_METHOD.includes(cols[6] || "") ? (cols[6] || "").trim() : "";
    const sent_date = (cols[7] || "").trim();
    const rcvd_status = VALID_RCVD.includes(cols[8] || "") ? (cols[8] || "").trim() : "待收";
    const rcvd_date = (cols[9] || "").trim();
    const note = cols.slice(10).join(",").replace(/^"|"$/g, "").trim();

    try {
      const result = await insertCard(env.DB, { call, date, time, freq, mode, sent_status, sent_method, sent_date, rcvd_status, rcvd_date, note });
      if (result) { inserted++; } else { skipped++; }
    } catch {
      errors++;
    }
  }

  return Response.json({ inserted, skipped, errors });
}

export async function apiAddHandler(request: Request, env: Bindings): Promise<Response> {
  const body = (await request.json()) as Record<string, string>;
  const call = (body.call || "").trim().toUpperCase();
  const date = body.date?.trim();
  const time = body.time?.trim();

  if (!call || !date || !time) {
    return Response.json({ ok: false, error: "呼号、日期、时间为必填项" }, { status: 400 });
  }
  if (call.length > 10) {
    return Response.json({ ok: false, error: "呼号不能超过10位" }, { status: 400 });
  }

  const result = await insertCard(env.DB, {
    call,
    date,
    time,
    freq: body.freq || "",
    mode: body.mode || "",
    sent_status: body.sent_status || "待寄",
    sent_method: body.sent_method || "",
    sent_date: body.sent_date || "",
    rcvd_status: body.rcvd_status || "待收",
    rcvd_date: body.rcvd_date || "",
    note: body.note || "",
  });

  if (!result) return Response.json({ ok: false, error: "该卡片已存在" }, { status: 409 });
  return Response.json({ ok: true });
}

export async function apiUpdateHandler(request: Request, env: Bindings, id: number): Promise<Response> {
  const body = (await request.json()) as Record<string, string>;
  const fields: Record<string, string> = {};

  if (body.call !== undefined) {
    const c = body.call.trim().toUpperCase();
    if (c.length > 10) return Response.json({ ok: false, error: "呼号不能超过10位" }, { status: 400 });
    fields.call = c;
  }
  if (body.date !== undefined) fields.date = body.date.trim();
  if (body.time !== undefined) fields.time = body.time.trim();
  if (body.freq !== undefined) fields.freq = body.freq.trim();
  if (body.mode !== undefined) fields.mode = body.mode.trim();
  if (body.sent_status !== undefined) fields.sent_status = body.sent_status;
  if (body.sent_method !== undefined) fields.sent_method = body.sent_method;
  if (body.sent_date !== undefined) fields.sent_date = body.sent_date;
  if (body.rcvd_status !== undefined) fields.rcvd_status = body.rcvd_status;
  if (body.rcvd_date !== undefined) fields.rcvd_date = body.rcvd_date;
  if (body.note !== undefined) fields.note = body.note;

  await updateCard(env.DB, id, fields);
  return Response.json({ ok: true });
}

export async function apiDeleteHandler(request: Request, env: Bindings): Promise<Response> {
  const body = (await request.json()) as { ids: number[] };
  if (!body.ids?.length) {
    return Response.json({ ok: false, error: "未提供 ID" }, { status: 400 });
  }
  if (body.ids.length === 1) {
    await deleteCard(env.DB, body.ids[0]);
  } else {
    await deleteCards(env.DB, body.ids);
  }
  return Response.json({ ok: true });
}

export async function apiListHandler(request: Request, env: Bindings): Promise<Response> {
  const url = new URL(request.url);
  const PAGE_SIZE = 50;
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1") || 1);
  const call = url.searchParams.get("call") || undefined;
  const sent = url.searchParams.get("sent") || undefined;
  const rcvd = url.searchParams.get("rcvd") || undefined;
  const filters = { call, sent_status: sent, rcvd_status: rcvd };

  const [total, cards] = await Promise.all([
    countCards(env.DB, filters),
    queryCards(env.DB, filters, PAGE_SIZE, (page - 1) * PAGE_SIZE),
  ]);

  return Response.json({ cards, total: total?.cnt ?? 0, page, pageSize: PAGE_SIZE });
}

export async function apiExportHandler(_request: Request, env: Bindings): Promise<Response> {
  const cards = await exportAllCards(env.DB);
  const headers = ["呼号", "日期", "UTC", "频率", "模式", "发件状态", "发件方式", "发件日期", "收件状态", "收件日期", "备注"];
  const csv = cards.map(c => [
    c.call, c.date, c.time, c.freq, c.mode,
    c.sent_status, c.sent_method, c.sent_date,
    c.rcvd_status, c.rcvd_date,
    `"'${(c.note || "").replace(/"/g, '""')}"`,
  ].join(","));
  const content = "\uFEFF" + headers.join(",") + "\n" + csv.join("\n");
  return new Response(content, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=qsl_cards.csv",
    },
  });
}
