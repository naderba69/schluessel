// @vitest-environment happy-dom
// tests/minute-conversation.test.tsx — D301 · N-156/4: محادثة الدقيقة F004 (مولر يسأل وأنت تجيب)
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { CoachBlock } from "../src/components/CoachBlock.js";
import { dialoguePairs } from "../src/components/SkillsLab.js";
import {
  BLAME_WORDS,
  COACH_TASK_MAX_SEC,
  COACH_TASK_MIN_SEC,
  MINUTE_CONVERSATION_ASK_AR,
  MINUTE_CONVERSATION_REVEAL_AR,
  MINUTE_CONVERSATION_TITLE_AR,
  MINUTE_CONVERSATION_YOU_AR,
  isValidTask,
  minuteConversation,
} from "../src/lib/coach-engine.js";
import { clipUrlForFile } from "../src/lib/audio-assets.js";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const PAIRS = dialoguePairs();

describe("D301 — محادثة الدقيقة: حوار يومي حتمي من u1", () => {
  it("4 أزواج سؤال/جواب، والتناوب حتمي يعود للأول", () => {
    expect(PAIRS).toHaveLength(4);
    expect(minuteConversation(0, PAIRS)!.pair.q.id).toBe("wer-1");
    expect(minuteConversation(1, PAIRS)!.pair.q.id).toBe("wer-3");
    expect(minuteConversation(4, PAIRS)!.pair.q.id).toBe("wer-1");
  });

  it("قائمة فارغة ← null (لا كسر)", () => {
    expect(minuteConversation(0, [])).toBeNull();
  });

  it("المحادثة مهمة صالحة: 30–180 ثانية + تثبيت فقط، ونصوصها بلا لوم", () => {
    const c = minuteConversation(0, PAIRS)!;
    expect(c.durationSec).toBeGreaterThanOrEqual(COACH_TASK_MIN_SEC);
    expect(c.durationSec).toBeLessThanOrEqual(COACH_TASK_MAX_SEC);
    expect(isValidTask({ id: "f004", kind: "minute-conversation", durationSec: c.durationSec, refsKnownContent: true }).ok).toBe(true);
    const all = `${MINUTE_CONVERSATION_TITLE_AR} ${MINUTE_CONVERSATION_ASK_AR} ${MINUTE_CONVERSATION_REVEAL_AR} ${MINUTE_CONVERSATION_YOU_AR}`;
    for (const w of BLAME_WORDS) expect(all).not.toContain(w);
  });

  it("كل سؤال وجواب له مقطع صوتي ملتزم (لا حوار صامت)", () => {
    for (const p of PAIRS) {
      expect(clipUrlForFile(`audio/scripts/a1-u1-d5-wer-ist-das/${p.q.id}.opus`), p.q.id).toBeTruthy();
      expect(clipUrlForFile(`audio/scripts/a1-u1-d5-wer-ist-das/${p.a.id}.opus`), p.a.id).toBeTruthy();
    }
  });
});

describe("D301 — عرض المحادثة في تبويب المدرب", () => {
  let container: HTMLElement;
  let root: Root | null = null;
  const q = (id: string) => container.querySelector<HTMLElement>(`[data-testid="${id}"]`);

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
  });
  afterEach(async () => {
    if (root) await act(async () => root!.unmount());
    root = null;
    container.remove();
    vi.useRealTimers();
  });

  async function mount(at: Date) {
    vi.useFakeTimers();
    vi.setSystemTime(at);
    root = createRoot(container);
    await act(async () => root!.render(<CoachBlock errors={[]} dueCount={0} hasNewContent={false} />));
  }

  it("يوم عادي: السؤال ظاهر مع زر استماع، والجواب مخفي حتى الكشف", async () => {
    await mount(new Date(2026, 9, 21, 10, 0)); // أربعاء
    const el = q("minute-conversation")!;
    expect(el.textContent).toContain("محادثة الدقيقة");
    expect(el.querySelector('[data-testid="play-audio"]')!.getAttribute("data-audio-id")).toBeTruthy();
    expect(q("convo-answer")).toBeNull();
    await act(async () => (q("convo-reveal") as HTMLElement).click());
    expect(q("convo-answer")!.textContent).toContain("وأنت؟");
    expect(q("convo-answer")!.querySelector('[data-testid="play-audio"]')).not.toBeNull();
  });

  it("الأحد: المدرب صامت — لا محادثة", async () => {
    await mount(new Date(2026, 9, 25, 10, 0)); // أحد
    expect(q("minute-conversation")).toBeNull();
  });
});
