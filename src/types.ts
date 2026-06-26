export interface QSLCard {
  id: number;
  call: string;
  date: string;
  time: string;
  freq: string;
  mode: string;
  sent_status: string;
  sent_method: string;
  sent_date: string;
  rcvd_status: string;
  rcvd_date: string;
  note: string;
  created_at: string;
}

export type Bindings = {
  DB: D1Database;
  CALLSIGN: string;
  ADMIN_EMAIL: string;
};
