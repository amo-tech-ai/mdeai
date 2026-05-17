const STORAGE_KEY = "mdeai:v2-ticket-orders";
const MAX_STORED_ORDERS = 20;

export interface StoredTicketOrder {
  orderId: string;
  accessToken: string;
  eventId: string;
  eventName?: string;
  shortId?: string;
  createdAt: string;
}

function isBrowser() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function isStoredTicketOrder(value: unknown): value is StoredTicketOrder {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.orderId === "string" &&
    typeof item.accessToken === "string" &&
    typeof item.eventId === "string" &&
    typeof item.createdAt === "string"
  );
}

export function readStoredTicketOrders(): StoredTicketOrder[] {
  if (!isBrowser()) return [];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isStoredTicketOrder);
  } catch {
    return [];
  }
}

export function writeStoredTicketOrders(orders: StoredTicketOrder[]) {
  if (!isBrowser()) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(orders.slice(0, MAX_STORED_ORDERS)));
}

export function upsertStoredTicketOrder(order: StoredTicketOrder) {
  const existing = readStoredTicketOrders().filter((item) => item.orderId !== order.orderId);
  writeStoredTicketOrders([order, ...existing]);
}

export function findStoredTicketOrder(orderId: string): StoredTicketOrder | undefined {
  return readStoredTicketOrders().find((order) => order.orderId === orderId);
}

export function storedTicketOrderFromSearchParams(
  params: URLSearchParams,
): StoredTicketOrder | null {
  const orderId = params.get("order");
  const accessToken = params.get("token");
  const eventId = params.get("event") || "unknown";
  if (!orderId || !accessToken) return null;

  return {
    orderId,
    accessToken,
    eventId,
    createdAt: new Date().toISOString(),
  };
}

