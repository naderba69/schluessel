// @vitest-environment happy-dom
// tests/skill-of-day.test.tsx — D300 · N-156/3: مهارة اليوم F007 (حرف/رقم/وقت بالتناوب)
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { CoachBlock } from "../src/components/CoachBlock.js";
import { alphabetLetters, numberLines, timeLines } from "../src/components/SkillsLab.js";
import {
  BLAME_WORDS,
  COACH_TASK_MAX_SEC,
  COACH_TASK_MIN_SEC,
  SKILL_OF_DAY_HINT_AR,
  SKILL_OF_DAY_LABEL_AR,
  isValidTask,
  skillOfDay,
  type SkillLine,
} from "../src/lib/coach-engine.js";
import { clipUrlForFile } from "../src/lib/audio-assets.js";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const pools = { letter: alphabetLetters(), number: numberLines(), time: timeLines() };

describe("D300 — مهارة اليوم: تناوب حتمي حرف ← رقم ← وقت", () => {
  it("ثلاثة أيام متتالية ← الأنواع الثلاثة بالترتيب، واليوم الرابع يعيد الحرف", () => {
    expect(skillOfDay(0, pools)!.kind).toBe("letter");
    expect(skillOfDay(1, pools)!.kind).toBe("number");
    expect(skillOfDay(2, pools)!.kind).toBe("time");
    expect(skillOfDay(3, pools)!.kind).toBe("letter");
  });

  it("البند داخل المهارة يتقدم مع الأيام (لا جمود على بند واحد)", () => {
    const first = skillOfDay(0, pools)!.line.id;
    const second = skillOfDay(3, pools)!.line.id;
    expect(pools.letter.length).toBeGreaterThan(1);
    expect(second).not.toBe(first);
  });

  it("مسبح فارغ ← null (لا كسر)", () => {
    const empty = { letter: [], number: [], time: [] } as Record<"letter" | "number" | "time", readonly SkillLine[]>;
    expect(skillOfDay(0, empty)).toBeNull();
  });

  it("المهارة مهمة صالحة: 30–180 ثانية + تثبيت فقط، ونصوصها بلا لوم", () => {
    const s = skillOfDay(1, pools)!;
    expect(s.durationSec).toBeGreaterThanOrEqual(COACH_TASK_MIN_SEC);
    expect(s.durationSec).toBeLessThanOrEqual(COACH_TASK_MAX_SEC);
    expect(isValidTask({ id: "f007", kind: "skill-of-day", durationSec: s.durationSec, refsKnownContent: true }).ok).toBe(true);
    const all = `${SKILL_OF_DAY_LABEL_AR.letter} ${SKILL_OF_DAY_LABEL_AR.number} ${SKILL_OF_DAY_LABEL_AR.time} ${SKILL_OF_DAY_HINT_AR}`;
    for (const w of BLAME_WORDS) expect(all).not.toContain(w);
  });

  it("كل بند في المسابح الثلاثة له مقطع صوتي ملتزم (لا مهارة صامتة)", () => {
    const files = { letter: "a1-alphabet", number: "a1-zahlen", time: "a1-uhrzeit" } as const;
    for (const k of ["letter", "number", "time"] as const)
      for (const ln of pools[k])
        expect(clipUrlForFile(`audio/scripts/${files[k]}/${ln.id}.opus`), ln.id).toBeTruthy();
  });
});

describe("D300 — عرض مهارة اليوم في تبويب المدرب", () => {
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

  it("يوم عادي: المهارة ظاهرة مع زر استماع يحمل معرّف المقطع", async () => {
    await mount(new Date(2026, 9, 21, 10, 0)); // أربعاء
    const el = q("skill-of-day")!;
    expect(el.textContent).toContain("مهارة اليوم");
    expect(el.querySelector('[data-testid="play-audio"]')!.getAttribute("data-audio-id")).toBeTruthy();
  });

  it("الأحد: المدرب صامت — لا مهارة", async () => {
    await mount(new Date(2026, 9, 25, 10, 0)); // أحد
    expect(q("skill-of-day")).toBeNull();
    expect(q("coach-rest")).not.toBeNull();
  });
});
