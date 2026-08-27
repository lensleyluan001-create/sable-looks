import { createServerFn } from "@tanstack/react-start";
import type { PlaceOrderInput } from "@/lib/orders";

export const placeOrder = createServerFn({ method: "POST" })
  .validator((d: PlaceOrderInput) => d)
  .handler(async ({ data }) => {
    const { parsePlaceInput, insertHouseOrder } = await import("@/lib/orders.server");
    return insertHouseOrder(parsePlaceInput(data));
  });

export const listHouseOrders = createServerFn({ method: "POST" })
  .validator((d: { token: string }) => ({ token: String(d?.token ?? "") }))
  .handler(async ({ data }) => {
    const { fetchHouseOrders } = await import("@/lib/orders.server");
    return fetchHouseOrders(data.token);
  });

export const assignHouseOrder = createServerFn({ method: "POST" })
  .validator((d: { token: string; id: string; seller: string }) => ({
    token: String(d?.token ?? ""),
    id: String(d?.id ?? ""),
    seller: String(d?.seller ?? ""),
  }))
  .handler(async ({ data }) => {
    const { setHouseOrderSeller } = await import("@/lib/orders.server");
    return setHouseOrderSeller(data.token, data.id, data.seller);
  });

export const housePickOrder = createServerFn({ method: "POST" })
  .validator((d: { token: string; id: string }) => ({
    token: String(d?.token ?? ""),
    id: String(d?.id ?? ""),
  }))
  .handler(async ({ data }) => {
    const { autoPickHouseOrder } = await import("@/lib/orders.server");
    return autoPickHouseOrder(data.token, data.id);
  });

export const markHousePaid = createServerFn({ method: "POST" })
  .validator((d: { token: string; id: string; paid?: boolean }) => ({
    token: String(d?.token ?? ""),
    id: String(d?.id ?? ""),
    paid: d?.paid !== false,
  }))
  .handler(async ({ data }) => {
    const { markHouseOrderPaid } = await import("@/lib/orders.server");
    return markHouseOrderPaid(data.token, data.id, data.paid);
  });
