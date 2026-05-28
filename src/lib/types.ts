export type Machine = {
  id: string;
  name: string;
  label: string;
  enabled: boolean;
};

export type Reservation = {
  id: string;
  machine_id: string;
  day: number;
  hour: number;
  user_code: string;
  user_id: string;
  week_id: string;
  created_at: string;
};

export type UserProfile = {
  id: string;
  email: string;
  username: string;
  wing: string;
  floor: number;
  door: number;
  user_code: string;
};

export type AccountRequest = {
  id: string;
  email: string;
  status: string;
  created_at: string;
  decided_at?: string | null;
  decided_by?: string | null;
};
