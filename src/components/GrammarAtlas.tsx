// src/components/GrammarAtlas.tsx — أطلس القواعد «خريطة المترو» (D576 — §12)
// عرض الخطوط الستة بمحطاتها: فتح تدريجي · تشريح المحطة من شفرتها · آلية الصدأ (تذكير لا لوم — D23).
// Bidi إلزامي (§12): كل جملة/مثال ألماني في dir="ltr" دون استثناء.
import { useState } from "react";
import type { GrammarRule } from "../lib/grammar-discovery.js";
import { ATLAS_LINES, stationStatus, type AtlasStation } from "../lib/grammar-atlas.js";
import { LESSON_ORDER, loadGrammarRule } from "../lesson-packs.js";

const STATUS_AR: Record<string, string> = {
  reference: "مرجع",
  locked: "🔒 تُفتح في درسها",
  open: "✅ مفتوحة",
  rusty: "⚠️ مهملة منذ وقت — تذكير لا لوم",
};

export function GrammarAtlas({
  currentIndex,
  daysSinceSeen,
}: {
  currentIndex: number;
  daysSinceSeen?: Record<string, number>;
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [rule, setRule] = useState<GrammarRule | null>(null);
  const lessonIndexOf = (id: string) => LESSON_ORDER.indexOf(id);

  const open = (s: AtlasStation) => {
    if (!s.arsenalId) {
      setOpenId(s.id);
      setRule(null);
      return;
    }
    setOpenId(s.id);
    setRule(null);
    void loadGrammarRule(s.arsenalId).then((r) => setRule(r ?? null));
  };

  return (
    <section data-testid="grammar-atlas" aria-label="أطلس القواعد">
      <h2>🚇 أطلس القواعد — خريطة المترو</h2>
      <p data-testid="atlas-hint">مرجع القواعد كله هنا: خطوطٌ ستّ، ومحطتك تُفتح عندما يأتِ درسها.</p>
      {ATLAS_LINES.map((line) => (
        <div key={line.id} data-testid={`atlas-line-${line.id}`} style={{ borderRight: `6px solid ${line.color}`, paddingRight: 8, marginBottom: 10 }}>
          <h3>
            <span style={{ color: line.color }}>●</span> {line.nameAr} <small dir="ltr">{line.nameDe}</small>
          </h3>
          <ul style={{ listStyle: "none", padding: 0, display: "flex", flexWrap: "wrap", gap: 6 }}>
            {line.stations.map((s) => {
              const st = stationStatus(s, currentIndex, lessonIndexOf, daysSinceSeen?.[s.id]);
              return (
                <li key={s.id}>
                  <button
                    type="button"
                    data-testid={`station-${s.id}`}
                    data-status={st}
                    disabled={st === "locked"}
                    onClick={() => open(s)}
                    aria-label={`${s.titleAr} — ${STATUS_AR[st]}`}
                  >
                    {st === "locked" ? "🔒 " : st === "rusty" ? "⚠️ " : st === "reference" ? "📖 " : "✅ "}
                    {s.titleAr}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
      {openId && (
        <div data-testid="station-anatomy">
          <h3>تشريح المحطة</h3>
          {rule ? (
            <>
              <p data-testid="anatomy-topic">{rule.topicAr}</p>
              <p data-testid="anatomy-rule-ar">{rule.ruleAr}</p>
              <p dir="ltr" data-testid="anatomy-rule-de">
                {rule.ruleDe}
              </p>
              <ul>
                {rule.examples.map((ex, i) => (
                  <li key={i} data-testid="anatomy-example">
                    <span dir="ltr">{ex.de}</span> — <span>{ex.ar}</span>
                  </li>
                ))}
              </ul>
              <p data-testid="anatomy-contrast">⚖️ {rule.contrastAr}</p>
              {rule.limitsAr && rule.limitsAr.length > 0 && (
                <p data-testid="anatomy-limits">🚧 {rule.limitsAr.join(" · ")}</p>
              )}
            </>
          ) : (
            <p data-testid="anatomy-static">
              {ATLAS_LINES.flatMap((l) => l.stations).find((x) => x.id === openId)?.titleAr} — تشريحها الكامل يأتي في
              درسها؛ الأطلس يحفظ لها مكانها على الخط.
            </p>
          )}
          <button type="button" data-testid="anatomy-close" onClick={() => setOpenId(null)}>
            إغلاق التشريح ←
          </button>
        </div>
      )}
    </section>
  );
}
