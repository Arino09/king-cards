let n = 0;

export function nextCardId(): string {
  n += 1;
  return `卡-${n}`;
}

export function resetIdCounter(): void {
  n = 0;
}
