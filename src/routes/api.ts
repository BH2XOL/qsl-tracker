import type { Bindings } from "../types";
import { queryCards, insertCard, updateCard, deleteCard, deleteCards, countCards } from "../lib/db";

export async function apiAddHandler(request: Request, env: Bindings): Promise<Response> {
  const body = (await request.json()) as Record<string, string>;
  const call = (body.call || "").trim().toUpperCase();
  const date = body.date?.trim();
  const time = body.time?.trim();

  if (!call || !date || !time) {
    return Response.json({ ok: false, error: "呼号、日期、时间为必填项" }, { status: 400 });
  }

  await insertCard(env.DB, {
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

  return Response.json({ ok: true });
}

export async function apiUpdateHandler(request: Request, env: Bindings, id: number): Promise<Response> {
  const body = (await request.json()) as Record<string, string>;
  const fields: Record<string, string> = {};

  if (body.call !== undefined) fields.call = body.call.trim().toUpperCase();
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
