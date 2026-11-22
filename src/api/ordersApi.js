import { BACKEND_URL } from "./config";

// Converts backend status words to what our screens display
const STATUS = { placed: "New", new: "New", dispatched: "Dispatched", delivered: "Delivered" };

// Converts one order from backend format to screen format
const fromServer = (o) => ({
  ...o,
  customerId: String(o.userId),
  status: STATUS[String(o.status || "").toLowerCase()] || "New",
  total: Number(o.total ?? o.totalAmount ?? 0),
  items: (o.items || []).map((i) => ({
    ...i,
    id: i.productId ?? i.id,
    price: Number(i.price || 0),
  })),
});

// Reads error message from backend response
async function readError(res, fallback) {
  try {
    const d = await res.json();
    return d.message || fallback;
  } catch {
    return fallback;
  }
}

// GET orders. If customerId given → that customer's orders. If not → ALL orders (owner).
export async function fetchOrders(customerId) {
  const url = customerId
    ? `${BACKEND_URL}/api/orders/user/${customerId}`
    : `${BACKEND_URL}/api/orders/all`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(await readError(res, "Could not load orders"));
  const data = await res.json();
  return Array.isArray(data) ? data.map(fromServer) : [];
}

// POST a new order to the database
export async function createOrder({ userId, address, items }) {
  const res = await fetch(`${BACKEND_URL}/api/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId: Number(userId),
      address,
      items: items.map((i) => ({
        productId: Number(i.id || i.productId),
        quantity: Number(i.quantity),
      })),
    }),
  });
  if (!res.ok) throw new Error(await readError(res, "Order could not be placed"));
  return fromServer(await res.json());
}

// PUT order status (Dispatched / Delivered)
export async function updateOrderStatus(id, status) {
  const res = await fetch(`${BACKEND_URL}/api/orders/${id}/status`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error(await readError(res, "Status could not be updated"));
  return fromServer(await res.json());
}