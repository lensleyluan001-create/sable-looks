import type { ChatTurn } from "@/lib/bots";

export const BOT_IDS = ["house", "bench", "desk"] as const;
export type BotId = (typeof BOT_IDS)[number];

export function isBotId(id: string): id is BotId {
  return (BOT_IDS as readonly string[]).includes(id);
}

export type BotMeta = {
  id: BotId;
  name: string;
  kicker: string;
  does: string;
  staff: boolean;
  chips: string[];
  placeholder: string;
};

export const BOTS: BotMeta[] = [
  {
    id: "house",
    name: "House",
    kicker: "Customer",
    does: "If you are stuck. Quotes 45xxx, takes the order.",
    staff: false,
    chips: ["45015", "golfers", "UK size", "order"],
    placeholder: "45015 UK8…",
  },
  {
    id: "bench",
    name: "Bench",
    kicker: "Floor",
    does: "Capture, follow up, invoice, chase unpaid.",
    staff: true,
    chips: ["due", "run queue", "capture Thabo 0821234567 45004 UK8"],
    placeholder: "capture Name 08… 45xxx",
  },
  {
    id: "desk",
    name: "Desk",
    kicker: "House files",
    does: "Quotes, WhatsApp lines. Build on admin.",
    staff: false,
    chips: ["45004", "golfers", "WhatsApp for 45008"],
    placeholder: "Ask 45004, golfers…",
  },
];

export const BOT_GREET: Record<BotId, ChatTurn> = {
  house: {
    role: "assistant",
    content:
      "House here. If you are stuck, ask me. Pair, UK size, name, WhatsApp — I send it to the floor. Confirmed when you pay.",
  },
  bench: {
    role: "assistant",
    content: "Bench. Give me a client to capture. I follow up, invoice, and chase unpaid. Paid before confirmed.",
  },
  desk: {
    role: "assistant",
    content: "Desk. Local house files only. I quote listed 45xxx. I do not spend Grok usage.",
  },
};

export function emptyThreads(): Record<BotId, ChatTurn[]> {
  return {
    house: [BOT_GREET.house],
    bench: [BOT_GREET.bench],
    desk: [BOT_GREET.desk],
  };
}

export function lastLine(turns: ChatTurn[] | undefined) {
  const last = turns?.[turns.length - 1];
  if (!last) return "No messages yet.";
  return last.content.split("\n")[0] ?? "";
}
