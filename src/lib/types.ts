export type Machine = "washer1" | "washer2" | "dryer";

export type Reservation = {
  id: string;
  machine: Machine;
  day: number;
  hour: number;
  user_code: string;
  user_id: string;
  week_id: string;
  created_at: string;
};

export type UserProfile = {
  id: string;
  matriculation: string;
  username: string;
  wing: string;
  floor: number;
  door: number;
  user_code: string;
};
