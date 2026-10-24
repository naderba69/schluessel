// @vitest-environment happy-dom
// tests/on-the-go.test.tsx — D302 · N-156/5: وضع الطريق F006 (تدريب صوتي بلا شاشة)
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { CoachBlock } from "../src/components/CoachBlock.js";
import { alphabetLetters, dialoguePairs, numberLines, timeLines } from "../src/components/SkillsLab.js";
import {
  BLAME_WORDS,
  COACH_TASK_MAX_SEC,
  ON_THE_GO_COUNT,
  ON_THE_GO_REPEAT_AR,
  ON_THE_GO_SAFETY_AR,
  ON_THE_GO_TITLE_AR,
  isValidTask,
  onTheGoQueue,
  playOnTheGo,
  skillOfDay,
} from "../src/lib/coach-engine.js";
import { clipUrl } from "../src/lib/audio-assets.js";
import { setAudioPlayer } from "../src/lib/audio-player.js";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const pools = { letter: alphabetLetters(), number: numberLines(), time: timeLines() };
const PAIRS = dialoguePairs();
const skill0 = skillOfDay(0, pools)!.line;

describe("D302 — قائمة الطريق: مهارة + حواران، تناوب حتمي", () => {
  it("5 مقاطع بالترتيب: مهارة ← سؤال ← جواب ← سؤال ← جواب", () => {
    const q = onTheGoQueue(0, skill0, PAIRS);
    expect(q).toHaveLength(ON_THE_GO_COUNT);
    expect(q[0]!.trackId).toBe(skill0.id);
    expect(q[1]!.trackId).toBe("wer-1");
    expect(q[2]!.trackId).toBe("wer-2");
    expect(q[3]!.trackId).toBe("wer-3");
    expect(q[4]!.trackId).toBe("wer-4");
  });

  it("اليوم التالي ← حواران تاليان (لا جمود)، وبلا حوارات ← المهارة وحدها", () => {
    const q1 = onTheGoQueue(1, skill0, PAIRS);
    expect(q1[1]!.trackId).toBe("wer-3");
    expect(onTheGoQueue(0, skill0, [])).toHaveLength(1);
  });

  it("كل مقطع في قوائم أسبوع كامل له ملف ملتزم (لا صمت في الطريق)", () => {
    for (let d = 0; d < 7; d++) {
      const s = skillOfDay(d, pools)!;
      for (const item of onTheGoQueue(d, s.line, PAIRS)) expect(clipUrl(item.trackId), item.trackId).toBeTruthy();
    }
  });

  it("وضع الطريق مهمة صالحة (≤3 دقائق تفاعل)، ونصوصه بلا لوم", () => {
    // 5 مقاطع × ~5 ثوانٍ + 4 فجوات × 3 ثوانٍ ≈ 37 ثانية — داخل الحد
    expect(isValidTask({ id: "f006", kind: "on-the-go", durationSec: 60, refsKnownContent: true }).ok).toBe(true);
    expect(60).toBeLessThanOrEqual(COACH_TASK_MAX_SEC);
    const all = `${ON_THE_GO_TITLE_AR} ${ON_THE_GO_SAFETY_AR} ${ON_THE_GO_REPEAT_AR}`;
    for (const w of BLAME_WORDS) expect(all).not.toContain(w);
  });
});

describe("D302 — المشغّل المتتابع: ترتيب + تقدم + إلغاء تعاوني", () => {
  it("يعزف بالترتيب ويبلّغ بعد كل مقطع، ويعيد العدد", async () => {
    const played: string[] = [];
    const progress: [number, number][] = [];
    const n = await playOnTheGo(
      { play: async (r) => void played.push(r.trackId!) },
      onTheGoQueue(0, skill0, PAIRS),
      0,
      (p, t) => void progress.push([p, t]),
      () => false,
    );
    expect(n).toBe(5);
    expect(played).toEqual([skill0.id, "wer-1", "wer-2", "wer-3", "wer-4"]);
    expect(progress).toEqual([[1, 5], [2, 5], [3, 5], [4, 5], [5, 5]]);
  });

  it("الإلغاء يوقف بين المقاطع ولا يقطع ما بدأ", async () => {
    const played: string[] = [];
    let cancelled = false;
    const n = await playOnTheGo(
      { play: async (r) => void played.push(r.trackId!) },
      onTheGoQueue(0, skill0, PAIRS),
      0,
      (p) => { if (p >= 2) cancelled = true; },
      () => cancelled,
    );
    expect(n).toBe(2);
    expect(played).toHaveLength(2);
  });
});

describe("D302 — لوحة الطريق في تبويب المدرب", () => {
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
    setAudioPlayer(null);
    vi.useRealTimers();
  });

  async function mount(at: Date) {
    vi.useFakeTimers();
    vi.setSystemTime(at);
    setAudioPlayer({ play: async () => "clip" });
    root = createRoot(container);
    await act(async () => root!.render(<CoachBlock errors={[]} dueCount={0} hasNewContent={false} />));
  }

  it("يوم عادي: اللوحة ظاهرة مع تنبيه الأمان وزر البدء", async () => {
    await mount(new Date(2026, 9, 21, 10, 0)); // أربعاء
    expect(q("on-the-go")!.textContent).toContain("ضع الهاتف في جيبك");
    expect(q("go-start")).not.toBeNull();
  });

  it("الأحد: المدرب صامت — لا لوحة طريق", async () => {
    await mount(new Date(2026, 9, 25, 10, 0)); // أحد
    expect(q("on-the-go")).toBeNull();
  });

  it("بدء ← تقدم حي ← إيقاف ← عودة للخمول", async () => {
    await mount(new Date(2026, 9, 21, 10, 0));
    await act(async () => (q("go-start") as HTMLElement).click());
    expect(q("go-progress")!.textContent).toContain("عُزِف 1 من 5");
    expect(q("go-stop")).not.toBeNull();
    await act(async () => (q("go-stop") as HTMLElement).click());
    await act(async () => { await vi.advanceTimersByTimeAsync(5000); });
    expect(q("go-start")).not.toBeNull();
    expect(q("go-progress")).toBeNull();
  });
});
