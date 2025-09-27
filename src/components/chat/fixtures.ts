import type { Chat, Message } from "./types";

// --- Deterministic RNG (no hydration mismatch) ---
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function seeded(seedStr: string) {
  let h = 2166136261;
  for (let i = 0; i < seedStr.length; i++) {
    h ^= seedStr.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return mulberry32(h >>> 0);
}

const NAMES = [
  "Али",
  "Елена",
  "Иван",
  "Сергей",
  "Ольга",
  "Дмитрий",
  "Наталья",
  "Павел",
  "Виктор",
  "Анна",
  "Руслан",
  "Михаил",
  "Юлия",
  "Арман",
];

const LAST_LINES = [
  "Ок, жду! 🚀",
  "Я на месте",
  "Кинул файл",
  "Перезвоню позже",
  "Отлично!",
  "Супер идея",
  "Давай так",
  "Готово",
  "Поехали",
  "Спасибо!",
];
function hhmm(totalMinutes: number) {
  const h = Math.floor(totalMinutes / 60) % 24;
  const m = totalMinutes % 60;
  const pad = (n: number) => (n < 10 ? "0" + n : "" + n);
  return `${pad(h)}:${pad(m)}`;
}

export function makeChats(count = 15): Chat[] {
  const rnd = seeded("chats");
  const chats: Chat[] = [];
  for (let i = 0; i < count; i++) {
    const name =
      NAMES[i % NAMES.length] + (i >= NAMES.length ? " " + (i + 1) : "");
    const id = String(i + 1);
    const last = LAST_LINES[Math.floor(rnd() * LAST_LINES.length)];
    const minutes = 9 * 60 + Math.floor(rnd() * 360); // 09:00..15:00
    chats.push({
      id,
      name,
      lastMessage: last,
      time: hhmm(minutes),
      unread: rnd() > 0.7 ? Math.floor(rnd() * 5) + 1 : 0,
      avatarUrl: `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(
        name
      )}`,
      avatarFallback: name[0],
    });
  }
  return chats;
}

export function makeMessages(chats: Chat[]): Message[] {
  const out: Message[] = [];
  for (const chat of chats) {
    const rnd = seeded("msg-" + chat.id);
    const count = 10 + Math.floor(rnd() * 12); // 10..22 сообщений
    let t = 9 * 60; // старт 09:00, шаг 5-9 минут
    let me = rnd() > 0.5;
    for (let i = 0; i < count; i++) {
      const author = me ? "me" : "them";
      const textPool =
        author === "me"
          ? ["Ок", "Смогусь позже", "Отправил", "Проверю", "Принял", "На связи"]
          : [
              "Ты здесь?",
              "Который час?",
              "Получил?",
              "Когда удобно?",
              "Спасибо!",
              "Все ок",
            ];
      const text = textPool[Math.floor(rnd() * textPool.length)];
      out.push({
        id: `${chat.id}-${i}`,
        chatId: chat.id,
        author,
        text,
        time: hhmm(t),
        status: me ? (rnd() > 0.8 ? "read" : "delivered") : undefined,
      });
      t += 5 + Math.floor(rnd() * 5);
      me = !me;
    }
  }
  return out;
}

export const CHATS = makeChats(15);
export const MESSAGES = makeMessages(CHATS);
