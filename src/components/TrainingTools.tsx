// src/components/TrainingTools.tsx — أدوات التدريب الخمس (D579 — D573 البند 5 الأخير)
// ⏱️ توقيت الامتحان التدريجي 50/75/100% · 🦕 مفكك الديناصورات · 🏰 مراجعة القصر ·
// 🎤 بنّاء العرض · 💬 مدرب المناقشة — بوابات المعالم (A2/B1/B2) حسب التقدم (D126).
// التدريس من شفرة الخزانة (ars-vortrag/ars-meinung-gruende) — الهياكل هنا عناوين حصص.
import { useMemo, useState } from "react";
import type { Word } from "../../content/schemas/index.js";
import type { GrammarRule } from "../lib/grammar-discovery.js";
import {
  OFFICIAL_MINUTES,
  TIMING_RATIOS,
  discussionFrames,
  dinoDecompose,
  longestWord,
  palaceReviewPlan,
  presentationOutline,
  scaledMinutes,
  toolUnlocked,
} from "../lib/training-tools.js";
import { buildNetwork, memoryPalace, networkReviewFlow } from "../lib/vocab-network.js";
import { LESSON_ORDER, loadGrammarRule } from "../lesson-packs.js";

const TOOLS = [
  { id: "timing", icon: "⏱️", titleAr: "توقيت الامتحان التدريجي" },
  { id: "dino", icon: "🦕", titleAr: "مفكك الديناصورات" },
  { id: "palace", icon: "🏰", titleAr: "مراجعة القصر" },
  { id: "presentation", icon: "🎤", titleAr: "بنّاء العرض" },
  { id: "discussion", icon: "💬", titleAr: "مدرب المناقشة" },
] as const;

export function TrainingTools({
  words,
  lessonIndex,
  now = new Date(),
}: {
  words: readonly Word[];
  lessonIndex: number;
  now?: Date;
}) {
  const [open, setOpen] = useState<string | null>(null);
  const [rule, setRule] = useState<GrammarRule | null>(null);
  void now;

  const openTool = (id: string, arsenalId?: string) => {
    setOpen(open === id ? null : id);
    setRule(null);
    if (arsenalId && open !== id) void loadGrammarRule(arsenalId).then((r) => setRule(r ?? null));
  };

  const knownForms = useMemo(() => {
    const s = new Set<string>();
    for (const w of words) {
      const raw = w.de.replace(/^(der|die|das|den|dem|des|ein|eine|einem|einen|einer)\s+/i, "").split("/")[0]!;
      s.add(raw.toLowerCase());
    }
    return s;
  }, [words]);

  return (
    <section data-testid="training-tools" aria-label="أدوات التدريب">
      <h3>🧰 أدوات التدريب</h3>
      <p data-testid="tt-hint">أدوات تتدرّج معك: كل أداة تُفتح عند بلوغ معلمها.</p>
      {TOOLS.map((t) => {
        const unlocked = toolUnlocked(t.id, lessonIndex, LESSON_ORDER, words.length);
        return (
          <div key={t.id} data-testid={`tt-${t.id}`} data-unlocked={unlocked}>
            <button type="button" data-testid={`tt-toggle-${t.id}`} disabled={!unlocked} onClick={() => openTool(t.id, t.id === "presentation" ? "ars-vortrag" : t.id === "discussion" ? "ars-meinung-gruende" : undefined)}>
              {t.icon} {t.titleAr} {unlocked ? (open === t.id ? "▾" : "▸") : "🔒 تُفتح عند معلمها"}
            </button>
            {open === t.id && unlocked && (
              <div data-testid={`tt-panel-${t.id}`}>
                {t.id === "timing" && <TimingTool />}
                {t.id === "dino" && <DinoTool words={words} knownForms={knownForms} />}
                {t.id === "palace" && <PalaceTool words={words} />}
                {t.id === "presentation" && <RuleTool rule={rule} slots={presentationOutline()} testId="tt-presentation" />}
                {t.id === "discussion" && <RuleTool rule={rule} slots={discussionFrames()} testId="tt-discussion" />}
              </div>
            )}
          </div>
        );
      })}
    </section>
  );
}

function TimingTool() {
  const [level, setLevel] = useState("B1");
  const [ratio, setRatio] = useState<(typeof TIMING_RATIOS)[number]>(100);
  const minutes = OFFICIAL_MINUTES[level]!;
  return (
    <div data-testid="tt-timing-panel">
      <p>درّب المحاور على جزء من زمنها الرسمي ثم زده: ٥٠٪ ← ٧٥٪ ← ١٠٠٪ (§13).</p>
      <p>
        المستوى:{" "}
        {Object.keys(OFFICIAL_MINUTES).map((lv) => (
          <button key={lv} type="button" data-testid={`tt-timing-level-${lv}`} aria-pressed={level === lv} onClick={() => setLevel(lv)}>
            {lv}
          </button>
        ))}
      </p>
      <p>
        النسبة:{" "}
        {TIMING_RATIOS.map((r) => (
          <button key={r} type="button" data-testid={`tt-timing-ratio-${r}`} aria-pressed={ratio === r} onClick={() => setRatio(r)}>
            {r}٪
          </button>
        ))}
      </p>
      <ul>
        {(Object.keys(minutes) as (keyof typeof minutes)[]).map((skill) => (
          <li key={skill} data-testid="tt-timing-row">
            <span dir="ltr">{skill}</span>: الرسمي {minutes[skill]} دقائق ← التدريب{" "}
            <strong data-testid="tt-timing-scaled">{scaledMinutes(minutes[skill]!, ratio)}</strong> دقيقة
          </li>
        ))}
      </ul>
    </div>
  );
}

function DinoTool({ words, knownForms }: { words: readonly Word[]; knownForms: ReadonlySet<string> }) {
  const dino = longestWord(words.map((w) => w.de.replace(/^(der|die|das)\s+/i, "").split("/")[0]!));
  const [word, setWord] = useState(dino);
  const parts = dinoDecompose(word, knownForms);
  return (
    <div data-testid="tt-dino-panel">
      <p>الكلمات المركّبة الطويلة «ديناصورات» — فكّكها إلى أجزاء تعرفها.</p>
      <p>
        <input data-testid="tt-dino-input" value={word} onChange={(e) => setWord(e.target.value)} dir="ltr" />{" "}
      </p>
      {parts ? (
        <p data-testid="tt-dino-parts">
          {parts.map((p, i) => (
            <span key={i}>
              <b dir="ltr">{p}</b>
              {i < parts.length - 1 ? " + " : ""}
            </span>
          ))}
        </p>
      ) : (
        <p data-testid="tt-dino-unknown">لا أستطيع تفكيكها باليقين — اطلب تفسيرها في الدرس، ولا تخمن أبداً.</p>
      )}
    </div>
  );
}

function PalaceTool({ words }: { words: readonly Word[] }) {
  const { stations } = useMemo(
    () => memoryPalace(buildNetwork([...words]).nodes, ["المدخل", "المطبخ", "الغرفة", "الشرفة"]),
    [words],
  );
  const [step, setStep] = useState(0);
  const plan = palaceReviewPlan(stations, networkReviewFlow());
  if (plan.length === 0) return <p data-testid="tt-palace-empty">لا كلمات بعد — القصر يُبنى من مفرداتك.</p>;
  const cur = plan[Math.min(step, plan.length - 1)]!;
  return (
    <div data-testid="tt-palace-panel">
      <p>
        جولة القصر {Math.min(step + 1, plan.length)}/{plan.length} — غرفة <b>{cur.room}</b>: {cur.step.labelAr} (
        {cur.wordIds.length} كلمة)
      </p>
      <button
        type="button"
        data-testid="tt-palace-next"
        onClick={() => setStep((s) => (s + 1 >= plan.length ? 0 : s + 1))}
      >
        {step + 1 >= plan.length ? "جولة جديدة ←" : "الغرفة التالية ←"}
      </button>
    </div>
  );
}

function RuleTool({
  rule,
  slots,
  testId,
}: {
  rule: GrammarRule | null;
  slots: readonly { slot: string; slotAr: string; promptAr: string }[];
  testId: string;
}) {
  return (
    <div data-testid={testId}>
      {rule ? (
        <p data-testid={`${testId}-rule`}>
          {rule.ruleAr}{" "}
          {rule.examples.slice(0, 2).map((ex, i) => (
            <span key={i}>
              <span dir="ltr">{ex.de}</span> — {ex.ar}{" "}
            </span>
          ))}
        </p>
      ) : (
        <p>جارٍ تحميل الإرشاد من الخزانة…</p>
      )}
      <ol>
        {slots.map((s) => (
          <li key={s.slot} data-testid={`${testId}-slot-${s.slot}`}>
            <b>{s.slotAr}</b>: {s.promptAr}
          </li>
        ))}
      </ol>
    </div>
  );
}
