// src/components/VoiceMirrorCard.tsx — «المرآة الصوتية» (D571 — §8: الخميس + المرآة الصوتية)
// §7 محطة 15 (Prosodie) · §5‑هـ «المرآة الصوتية: الخميس» · خيط الطلاقة (§6): المرآة الصوتية الأسبوعية.
// شادوينغ أسبوعي مركّز على النبر: سطران من حوار مُدرَّس بصوت متحدثيه (لا صوت جديد — D251) + توجيه الأداء
// (النبرة/المقصد) من بيانات السكربت. سماع وتقليد بلا حكم نجاح/رسوب إطلاقاً (D16/5‑ب — المعيار: يفهمك أي ألماني).
import { useEffect, useState } from "react";
import type { AudioScript } from "../../content/schemas/index.js";
import { LESSON_INDEX, loadScriptsForLesson } from "../lesson-packs.js";
import { isVoiceMirrorDay, pickMirrorLesson, pickMirrorLines } from "../lib/weekly-cards.js";
import { PlayButton } from "./LessonSession.js";

const TARGET_REPEATS = 3;

export function VoiceMirrorCard({ currentIndex, now = new Date() }: { currentIndex: number; now?: Date }) {
  const lessonId = isVoiceMirrorDay(now) ? pickMirrorLesson(now, currentIndex) : null;
  const [script, setScript] = useState<AudioScript | null>(null);
  const [repeats, setRepeats] = useState<Record<string, number>>({});
  useEffect(() => {
    if (!lessonId) {
      setScript(null);
      setRepeats({});
      return;
    }
    let live = true;
    const entry = LESSON_INDEX.find((e) => e.id === lessonId);
    void loadScriptsForLesson(lessonId, entry?.level ?? "A1").then(
      (scripts) => {
        if (!live) return;
        const pick = scripts.find((s) => s.kind === "dialogue") ?? scripts[0] ?? null;
        setScript(pick);
        setRepeats({});
      },
      () => {
        if (live) setScript(null);
      },
    );
    return () => {
      live = false;
    };
  }, [lessonId]);

  if (!lessonId) return null; // ليس الخميس — لا بطاقة (§8)
  if (!script) return <p data-testid="voice-mirror-loading">المرآة الصوتية…</p>;

  const lines = pickMirrorLines(script.lines, now);
  return (
    <section data-testid="voice-mirror" aria-label="المرآة الصوتية">
      <h3>المرآة الصوتية 🪞 — الخميس</h3>
      <p data-testid="vm-hint">استمع إلى كل سطر ثم كرّره بصوت عالٍ — لاحظ النبرة (<span dir="ltr">Satzmelodie</span>) وحاكِها.</p>
      {lines.map((line) => {
        const done = repeats[line.id] ?? 0;
        return (
          <div key={line.id} data-testid="vm-line">
            <p dir="ltr" data-testid="vm-text">
              {line.text}
            </p>
            {line.direction && <p data-testid="vm-direction">النبرة: {line.direction}</p>}
            <PlayButton audioId={line.id} speakText={line.text} label="استمع إلى السطر" />{" "}
            <button
              type="button"
              data-testid="vm-repeat"
              onClick={() => setRepeats((r) => ({ ...r, [line.id]: Math.min(TARGET_REPEATS, (r[line.id] ?? 0) + 1) }))}
            >
              كرّرتها ({done}/{TARGET_REPEATS})
            </button>
            {done >= TARGET_REPEATS && <span data-testid="vm-done"> ✓ ثلاث مرات — أحسنت</span>}
          </div>
        );
      })}
      <p data-testid="vm-no-judge">بلا تصحيح ولا حكم — المعيار المعلن: يفهمك أي ألماني بلا جهد.</p>
    </section>
  );
}
