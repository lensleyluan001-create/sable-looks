import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Role } from "@/lib/access";
import { emptyThreads, type BotId } from "@/lib/bot-roster";
import type { ChatTurn, CustomerDraft } from "@/lib/bots";
import { EMPTY_DRAFT } from "@/lib/bots";
import type { MemoryNote } from "@/lib/memory";
import {
  DEFAULT_COPY,
  DEFAULT_DELIVERY,
  DEFAULT_FEATURED,
  type HouseCopy,
} from "@/lib/copy";
import type { Invoice, InvoiceStatus, Lead, Source, Stage } from "@/lib/floor";
import { nextInvoiceNumber } from "@/lib/floor";
import type { DeliveryKind, DeliveryRates } from "@/lib/money";
import { deliveryFee } from "@/lib/money";
import type { AssignedBy, SellerId } from "@/lib/people";
import { isSeller } from "@/lib/people";

export type Enquiry = {
  id: string;
  sku: string;
  look: string;
  size: string;
  qty: number;
  name: string;
  phone: string;
  note: string;
  delivery: DeliveryKind;
  deliveryFee: number;
  at: string;
};

type LeadDraft = {
  name: string;
  phone: string;
  sku: string;
  look: string;
  size: string;
  qty: number;
  source: Source;
  note: string;
  address?: string;
  delivery?: DeliveryKind;
  deliveryFee?: number;
  owner?: SellerId | null;
  assignedBy?: AssignedBy | null;
  orderId?: string | null;
  nextAction?: string;
  nextActionAt?: string;
  status?: Stage;
};

type InvoiceDraft = {
  leadId?: string | null;
  name: string;
  phone: string;
  address: string;
  sku: string;
  look: string;
  size: string;
  qty: number;
  unitPrice: number;
  delivery: DeliveryKind;
  deliveryFee: number;
  note: string;
  owner?: SellerId | null;
};

type State = {
  hydrated: boolean;
  saved: string[];
  enquiries: Enquiry[];
  leads: Lead[];
  invoices: Invoice[];
  deskRole: Role;
  deskToken: string;
  prices: Record<string, number | null>;
  looks: Record<string, string>;
  noteBodies: Record<string, string>;
  customNotes: MemoryNote[];
  copy: HouseCopy;
  featured: number[];
  delivery: DeliveryRates;
  botThreads: Record<BotId, ChatTurn[]>;
  houseDraft: CustomerDraft;
  toggleSaved: (sku: string) => void;
  addEnquiry: (e: Omit<Enquiry, "id" | "at">) => void;
  addLead: (e: LeadDraft) => Lead;
  updateLead: (id: string, patch: Partial<Lead>) => void;
  moveLead: (id: string, status: Stage) => void;
  upsertLeadFromOrder: (lead: Lead) => void;
  addInvoice: (e: InvoiceDraft) => Invoice;
  updateInvoice: (id: string, patch: Partial<Invoice>) => void;
  setInvoiceStatus: (id: string, status: InvoiceStatus) => void;
  setDesk: (role: Role, token: string) => void;
  clearDesk: () => void;
  setPrice: (sku: string, price: number | null) => void;
  clearPrice: (sku: string) => void;
  setLook: (sku: string, look: string) => void;
  setNoteBody: (slug: string, body: string) => void;
  addNote: (note: MemoryNote) => void;
  setCopy: (partial: Partial<HouseCopy>) => void;
  setFeatured: (ns: number[]) => void;
  setDelivery: (partial: Partial<DeliveryRates>) => void;
  resetOverrides: () => void;
  setHydrated: () => void;
  appendBotTurns: (id: BotId, turns: ChatTurn[]) => void;
  setHouseDraft: (draft: CustomerDraft) => void;
};

function hydrateLead(l: Lead): Lead {
  return {
    ...l,
    address: l.address ?? "",
    delivery: l.delivery ?? "collect",
    deliveryFee: l.deliveryFee ?? 0,
    owner: isSeller(l.owner) ? l.owner : null,
    assignedBy: l.assignedBy ?? null,
    orderId: l.orderId ?? null,
  };
}

function hydrateInvoice(n: Invoice): Invoice {
  return {
    ...n,
    owner: isSeller(n.owner) ? n.owner : null,
  };
}

export const useSable = create<State>()(
  persist(
    (set, get) => ({
      hydrated: false,
      saved: [],
      enquiries: [],
      leads: [],
      invoices: [],
      deskRole: "customer",
      deskToken: "",
      prices: {},
      looks: {},
      noteBodies: {},
      customNotes: [],
      copy: DEFAULT_COPY,
      featured: DEFAULT_FEATURED,
      delivery: DEFAULT_DELIVERY,
      botThreads: emptyThreads(),
      houseDraft: EMPTY_DRAFT,
      toggleSaved: (sku) =>
        set((s) => ({
          saved: s.saved.includes(sku)
            ? s.saved.filter((x) => x !== sku)
            : [...s.saved, sku],
        })),
      addEnquiry: (e) =>
        set((s) => ({
          enquiries: [
            {
              ...e,
              id: crypto.randomUUID(),
              at: new Date().toISOString(),
            },
            ...s.enquiries,
          ],
        })),
      addLead: (e) => {
        const now = new Date().toISOString();
        const rates = get().delivery;
        const kind = e.delivery ?? "collect";
        const lead: Lead = {
          name: e.name,
          phone: e.phone,
          sku: e.sku,
          look: e.look,
          size: e.size,
          qty: e.qty,
          source: e.source,
          note: e.note,
          id: crypto.randomUUID(),
          status: e.status ?? "new",
          address: e.address ?? "",
          delivery: kind,
          deliveryFee: e.deliveryFee ?? deliveryFee(kind, rates),
          owner: e.owner ?? null,
          assignedBy: e.assignedBy ?? null,
          orderId: e.orderId ?? null,
          nextAction:
            e.nextAction ??
            (e.source === "website" ? "Confirm pair, then WhatsApp" : "Send first WhatsApp"),
          nextActionAt: e.nextActionAt ?? now,
          at: now,
          updatedAt: now,
        };
        set((s) => ({ leads: [lead, ...s.leads] }));
        return lead;
      },
      updateLead: (id, patch) =>
        set((s) => ({
          leads: s.leads.map((l) =>
            l.id === id ? { ...l, ...patch, updatedAt: new Date().toISOString() } : l,
          ),
        })),
      moveLead: (id, status) => get().updateLead(id, { status }),
      upsertLeadFromOrder: (lead) =>
        set((s) => {
          if (s.leads.some((l) => l.orderId && l.orderId === lead.orderId)) {
            return {
              leads: s.leads.map((l) =>
                l.orderId === lead.orderId
                  ? {
                      ...l,
                      owner: lead.owner,
                      assignedBy: lead.assignedBy,
                      name: lead.name || l.name,
                      phone: lead.phone || l.phone,
                      size: lead.size || l.size,
                      qty: lead.qty || l.qty,
                      updatedAt: new Date().toISOString(),
                    }
                  : l,
              ),
            };
          }
          return { leads: [lead, ...s.leads] };
        }),
      addInvoice: (e) => {
        const invoice: Invoice = {
          ...e,
          id: crypto.randomUUID(),
          number: nextInvoiceNumber(get().invoices),
          leadId: e.leadId ?? null,
          owner: e.owner ?? null,
          at: new Date().toISOString(),
          status: "open",
        };
        set((s) => ({ invoices: [invoice, ...s.invoices] }));
        return invoice;
      },
      updateInvoice: (id, patch) =>
        set((s) => ({
          invoices: s.invoices.map((n) => (n.id === id ? { ...n, ...patch } : n)),
        })),
      setInvoiceStatus: (id, status) => get().updateInvoice(id, { status }),
      setDesk: (deskRole, deskToken) => set({ deskRole, deskToken }),
      clearDesk: () => set({ deskRole: "customer", deskToken: "" }),
      setPrice: (sku, price) =>
        set((s) => ({ prices: { ...s.prices, [sku]: price } })),
      clearPrice: (sku) =>
        set((s) => {
          const prices = { ...s.prices };
          delete prices[sku];
          return { prices };
        }),
      setLook: (sku, look) => set((s) => ({ looks: { ...s.looks, [sku]: look } })),
      setNoteBody: (slug, body) =>
        set((s) => ({ noteBodies: { ...s.noteBodies, [slug]: body } })),
      addNote: (note) => set((s) => ({ customNotes: [...s.customNotes, note] })),
      setCopy: (partial) => set((s) => ({ copy: { ...s.copy, ...partial } })),
      setFeatured: (ns) => set({ featured: ns.slice(0, 6) }),
      setDelivery: (partial) =>
        set((s) => ({ delivery: { ...s.delivery, ...partial } })),
      resetOverrides: () =>
        set({
          prices: {},
          looks: {},
          noteBodies: {},
          copy: DEFAULT_COPY,
          featured: DEFAULT_FEATURED,
          delivery: DEFAULT_DELIVERY,
        }),
      setHydrated: () => set({ hydrated: true }),
      appendBotTurns: (id, turns) =>
        set((s) => ({
          botThreads: {
            ...s.botThreads,
            [id]: [...(s.botThreads[id] ?? []), ...turns],
          },
        })),
      setHouseDraft: (houseDraft) => set({ houseDraft }),
    }),
    {
      name: "sable-memory-v1",
      partialize: (s) => ({
        saved: s.saved,
        enquiries: s.enquiries,
        leads: s.leads,
        invoices: s.invoices,
        deskRole: s.deskRole,
        deskToken: s.deskToken,
        prices: s.prices,
        looks: s.looks,
        noteBodies: s.noteBodies,
        customNotes: s.customNotes,
        copy: s.copy,
        featured: s.featured,
        delivery: s.delivery,
        botThreads: s.botThreads,
        houseDraft: s.houseDraft,
      }),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<State>;
        return {
          ...current,
          ...p,
          leads: Array.isArray(p.leads) ? p.leads.map(hydrateLead) : [],
          invoices: Array.isArray(p.invoices) ? p.invoices.map(hydrateInvoice) : [],
          enquiries: Array.isArray(p.enquiries)
            ? p.enquiries.map((e) => ({
                ...e,
                delivery: e.delivery ?? "collect",
                deliveryFee: e.deliveryFee ?? 0,
              }))
            : [],
          copy: { ...DEFAULT_COPY, ...p.copy },
          delivery: { ...DEFAULT_DELIVERY, ...p.delivery },
          featured:
            p.featured && p.featured.length > 0 ? p.featured : DEFAULT_FEATURED,
          deskToken: p.deskToken ?? "",
          deskRole: p.deskToken ? (p.deskRole ?? "customer") : "customer",
          botThreads: {
            ...emptyThreads(),
            ...(p.botThreads ?? {}),
            house: p.botThreads?.house?.length ? p.botThreads.house : emptyThreads().house,
            bench: p.botThreads?.bench?.length ? p.botThreads.bench : emptyThreads().bench,
            desk: p.botThreads?.desk?.length ? p.botThreads.desk : emptyThreads().desk,
          },
          houseDraft: p.houseDraft ?? EMPTY_DRAFT,
          hydrated: false,
        };
      },
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    },
  ),
);

if (typeof window !== "undefined") {
  const finish = () => useSable.setState({ hydrated: true });
  if (useSable.persist.hasHydrated()) finish();
  useSable.persist.onFinishHydration(finish);
  window.setTimeout(() => {
    if (!useSable.getState().hydrated) finish();
  }, 1500);
}
