export type StackflowStatus = { depth: number; last: "대기" | "push" | "pop" };

const initialStatus: StackflowStatus = { depth: 1, last: "대기" };
let status: StackflowStatus = initialStatus;
const listeners = new Set<() => void>();

export function getStackflowStatus(): StackflowStatus {
  return status;
}

export function setStackflowStatus(next: StackflowStatus): void {
  status = next;
  listeners.forEach((listener) => listener());
}

export function resetStackflowStatus(): void {
  setStackflowStatus(initialStatus);
}

export function subscribeStackflowStatus(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
