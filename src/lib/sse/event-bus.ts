import { EventEmitter } from "events";

export type SseEvent = {
  type: string;
  payload: unknown;
};

const eventBus = new EventEmitter();
eventBus.setMaxListeners(100);

export function emitTableEvent(qrId: string | null | undefined, event: SseEvent) {
  if (!qrId) return;
  eventBus.emit(`table:${qrId}`, event);
}

export function onTableEvent(
  qrId: string,
  handler: (event: SseEvent) => void
) {
  const channel = `table:${qrId}`;
  eventBus.on(channel, handler);
  return () => eventBus.off(channel, handler);
}
