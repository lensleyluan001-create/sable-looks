import type { Lead } from "@/lib/floor";
import type { DeliveryKind } from "@/lib/money";
import type { AssignedBy, SellerId } from "@/lib/people";

export type OrderStatus = "new" | "assigned" | "confirmed" | "closed" | "lost";

export type HouseOrder = {
  id: string;
  sku: string;
  look: string;
  size: string;
  qty: number;
  name: string;
  phone: string;
  address: string;
  note: string;
  delivery: DeliveryKind;
  deliveryFee: number;
  unitPrice: number;
  assignedTo: SellerId | null;
  assignedBy: AssignedBy | null;
  assignedAt: string | null;
  status: OrderStatus;
  paid: boolean;
  paidAt: string | null;
  createdAt: string;
};

export type PlaceOrderInput = {
  sku: string;
  size: string;
  qty: number;
  name: string;
  phone: string;
  address: string;
  note: string;
  delivery: DeliveryKind;
  deliveryFee: number;
};

export function leadFromOrder(order: HouseOrder): Lead {
  const now = new Date().toISOString();
  const status =
    order.status === "lost" ? "lost" : order.status === "closed" ? "closed" : "new";
  return {
    id: crypto.randomUUID(),
    name: order.name,
    phone: order.phone,
    sku: order.sku,
    look: order.look,
    size: order.size,
    qty: order.qty,
    source: "website",
    status,
    note: order.note,
    address: order.address,
    delivery: order.delivery,
    deliveryFee: order.deliveryFee,
    owner: order.assignedTo,
    assignedBy: order.assignedBy,
    orderId: order.id,
    nextAction: order.paid ? "Paid. Pair confirmed." : "Confirm pair, then EFT. Paid before confirmed.",
    nextActionAt: now,
    at: order.createdAt,
    updatedAt: now,
  };
}

export function minutesUntilAuto(createdAt: string, windowMin: number) {
  const due = new Date(createdAt).getTime() + windowMin * 60_000;
  return Math.max(0, Math.ceil((due - Date.now()) / 60_000));
}
