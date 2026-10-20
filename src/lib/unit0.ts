// src/lib/unit0.ts — منطق الوحدة صفر: 4 يوم أول + JIT (§9) | test-unit0-jit
import type { Unit0Card, Unit0Deck, Unit0Trigger } from "../../content/schemas/index.js";
import { Unit0Deck as Unit0DeckSchema } from "../../content/schemas/index.js";
import deckJson from "../../content/unit0/unit0-cards.json";

export function loadUnit0Deck(): Unit0Deck {
  return Unit0DeckSchema.parse(deckJson);
}

export const DAY_ONE_TRIGGER: Unit0Trigger = "day-one";

export function dayOneCards(deck: Unit0Deck): Unit0Card[] {
  return deck.cards.filter((c) => c.trigger === DAY_ONE_TRIGGER).sort((a, b) => a.order - b.order);
}

export function jitCards(deck: Unit0Deck): Unit0Card[] {
  return deck.cards.filter((c) => c.trigger !== DAY_ONE_TRIGGER).sort((a, b) => a.order - b.order);
}

/**
 * بطاقة اليوم الأول تظهر في موضعها (اليوم الأول) عند حدث "day-one".
 * بطاقة JIT تظهر عند أول وقوع لمحفّزها فعلياً ولم تُعرض من قبل (Just-In-Time — لا دفعة واحدة).
 */
export function shouldShowCard(card: Unit0Card, shownIds: string[], event: Unit0Trigger): boolean {
  if (shownIds.includes(card.id)) return false;
  return card.trigger === event;
}

/** البطاقات المستحقة للظهور عند حدث ما (بترتيبها) */
/** N-049 (D233): الإجابة تحتاج حرفاً ألمانياً خاصاً (ä ö ü Ä Ö Ü ß) — تُكتب بلوحة الهاتف/الحاسوب أو بأزرارنا */
const SPECIAL_CHAR_RE = /[äöüÄÖÜß]/u;
export function answerNeedsSpecialChar(answer: string, accept: readonly string[] = []): boolean {
  return SPECIAL_CHAR_RE.test(answer) || accept.some((a) => SPECIAL_CHAR_RE.test(a));
}

export function cardsForEvent(deck: Unit0Deck, shownIds: string[], event: Unit0Trigger): Unit0Card[] {
  return deck.cards.filter((c) => shouldShowCard(c, shownIds, event)).sort((a, b) => a.order - b.order);
}
