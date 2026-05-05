export const RESERVATION_CODE_REGEX = /^(W|O|N)\d{3}$/;
export const WEEK_ID_REGEX = /^\d{4}-W\d{2}$/;
export const MATRICULATION_REGEX = /^\d{5,10}$/;
export const USERNAME_REGEX = /^[A-Za-z0-9 ._\-]{2,24}$/;
export const WING_REGEX = /^(W|O|N)$/;

export function normalizeUserCode(value: string): string {
  return value.trim().toUpperCase();
}

export function buildUserCode(wing: string, floor: number, door: number): string {
  const safeWing = wing.trim().toUpperCase();
  const safeFloor = Number.isFinite(floor) ? Math.max(0, Math.min(9, floor)) : 0;
  const safeDoor = Number.isFinite(door) ? Math.max(0, Math.min(99, door)) : 0;
  return `${safeWing}${safeFloor}${safeDoor.toString().padStart(2, "0")}`;
}

export function isValidFloor(value: number): boolean {
  return Number.isInteger(value) && value >= 0 && value <= 8;
}

export function isValidDoor(value: number): boolean {
  return Number.isInteger(value) && value >= 0 && value <= 99;
}
