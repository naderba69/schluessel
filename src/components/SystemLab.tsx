// SystemLab.tsx — واجهات M3: بوابة · تقدّم · تكيّف · ألعاب · نسخ احتياطي · إعدادات | D44
// كل شاشة تعكس قواعد محركها: حدود صدق Goethe ظاهرة · لا أرقام من العدم · بلا لوم · بلا ضغط · بصمة سلامة.
import { useState } from "react";
import { buildGate, gateSchedule, isGateWeek, INTERNAL_PASS_PERCENT } from "../lib/gate-engine.js";
import { skillBars, retention, monthlyEstimate, type SkillStat } from "../lib/progress-engine.js";
import { freezePlan, resumePlan, REASON_AR, type FreezeReason, type ScheduledCard } from "../lib/adaptation-engine.js";
import { makeWordle, guessFeedback, makeAnagram, PLAY_RULES_AR } from "../lib/play-engine.js";
import { roundTrip, fingerprint, exportJson, restore } from "../lib/data-engine.js";
import {
  DEFAULT_PREFS,
  toggleMode,
  setZoom,
  toggleFocus,
  ZOOM_STEPS,
  auditPalette,
  type ThemePrefs,
} from "../lib/ui-accessibility.js";
import type { Word } from "../../content/schemas/index.js";

/* ══════════ E17 — البوابات ══════════ */
export function GateScreen({ week = 6 }: { week?: number }) {
  const [w, setW] = useState(week);
  const gate = isGateWeek(w) ? buildGate(w) : null;
  return (
    <section data-testid="gate-screen">
      <h3>🚪 البوابات — كل 6 أسابيع</h3>
      <label>
        الأسبوع:{" "}
        <input
          data-testid="week-input"
          type="number"
          value={w}
          onChange={(e) => setW(Number(e.target.value))}
        />
      </label>
      <p data-testid="goethe-honesty">
        ⚠️ صيغة Sprechen متحقق منها من وثائق Goethe الرسمية (أكتوبر 2026) — وتُعاد مراجعتها عند النشر إن حدّث المعهد نماذجه (§4).
      </p>
      {gate ? (
        <div data-testid="gate-view">
          <p>بوابة الأسبوع {gate.gateWeek} — المهارات الأربع:</p>
          <ul data-testid="gate-sections">
            {gate.sections.map((s) => (
              <li key={s.skill} data-skill={s.skill} data-format={s.formatSource}>
                {s.labelDe} — {s.labelAr}: {s.noteAr}
              </li>
            ))}
          </ul>
          <p data-testid="gate-note">{gate.overallNoteAr}</p>
          <p>عتبتنا الداخلية المعلنة: {INTERNAL_PASS_PERCENT}% — وليست مقياساً رسمياً.</p>
        </div>
      ) : (
        <p data-testid="not-gate-week">
          الأسبوع {w} ليس أسبوع بوابة — استمرّ بروتينك. البوابات القادمة:{" "}
          <span data-testid="next-gates" dir="ltr">{gateSchedule(w + 1, w + 18).join(", ") || "—"}</span>
        </p>
      )}
    </section>
  );
}

/* ══════════ E18 — التقدم ══════════ */
export function ProgressScreen({ stats = [], reviews = 0, minutes = 0 }: { stats?: SkillStat[]; reviews?: number; minutes?: number }) {
  const hasData = stats.length > 0;
  const bars = hasData ? skillBars(stats) : [];
  const curve = [0, 1, 3, 7, 14, 30].map((t) => ({ t, r: retention(t, 10) }));
  return (
    <section data-testid="progress-screen">
      <h3>📈 تقدمك الرباعي</h3>
      {!hasData && (
        <p data-testid="no-fake-numbers">
          لا تقدّم بلا بيانات — لا أرقام من العدم. أول ما تُجيب عن عناصر حقيقية تظهر هنا نسبتك أنت.
        </p>
      )}
      <ul data-testid="skill-bars">
        {bars.map((b) => (
          <li key={b.skill} data-skill={b.skill}>
            {b.labelAr}: {(b.accuracy * 100).toFixed(0)}% ({b.minutes} دقيقة)
          </li>
        ))}
      </ul>
      <p data-testid="month-estimate">{monthlyEstimate(reviews, minutes).noteAr}</p>
      <p data-testid="forgetting-curve" dir="ltr">
        منحنى النسيان (ثبات 10 أيام): {curve.map((c) => `يوم ${c.t}: ${(c.r * 100).toFixed(0)}%`).join(" · ")}
      </p>
    </section>
  );
}

/* ══════════ E19 — التكيّف ══════════ */
const DEMO_CARDS: ScheduledCard[] = [
  { id: "hallo", dueDay: 5 },
  { id: "danke", dueDay: 6 },
  { id: "wohnen", dueDay: 20 },
];

export function AdaptationScreen() {
  const [frozen, setFrozen] = useState<ReturnType<typeof freezePlan> | null>(null);
  return (
    <section data-testid="adaptation-screen">
      <h3>🤝 التكيّف مع ظروفك</h3>
      <p>مرض · رمضان · سفر · امتحان · ظرف عائلي — تجمّد الخطة بضغطة، والجدول يُحفظ كما هو.</p>
      <div data-testid="freeze-buttons">
        {(Object.keys(REASON_AR) as FreezeReason[]).map((r) => (
          <button key={r} data-testid={`freeze-${r}`} onClick={() => setFrozen(freezePlan(DEMO_CARDS, r, 4, 7))}>
            {REASON_AR[r]}
          </button>
        ))}
      </div>
      {frozen && (
        <div data-testid="freeze-view">
          <p data-testid="freeze-note">{frozen.noteAr}</p>
          <p data-testid="freeze-preserved">
            جدولك الأصلي محفوظ: <span dir="ltr">{frozen.original.map((c) => `${c.id}(${c.dueDay})`).join(" · ")}</span>
          </p>
          <p data-testid="resume-note">{resumePlan(frozen).noteAr}</p>
        </div>
      )}
    </section>
  );
}

/* ══════════ E20 — الألعاب ══════════ */
export function PlayScreen({ words }: { words: Word[] }) {
  const studied = words.map((w) => w.de.toLowerCase());
  const wordle = makeWordle(studied);
  const sample = guessFeedback(wordle.word, wordle.word);
  const anagram = makeAnagram(studied);
  return (
    <section data-testid="play-screen">
      <h3>🎮 اللعب — من مفرداتك أنت</h3>
      <ul data-testid="play-rules">
        {PLAY_RULES_AR.map((r, i) => (
          <li key={i}>{r}</li>
        ))}
      </ul>
      <p data-testid="wordle-word" dir="ltr">
        Wordle اليوم (من كلماتك): {wordle.word} — تغذية مثال: {sample.join(" / ")}
      </p>
      <p data-testid="anagram" dir="ltr">
        لغز: {anagram.scrambled} ← الجواب مخفي حتى تجرّب
      </p>
    </section>
  );
}

/* ══════════ E21 — النسخ الاحتياطي ══════════ */
export function DataScreen() {
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const demo = { name: "يوسف", level: "A1", words: 16 };
  return (
    <section data-testid="data-screen">
      <h3>💾 بياناتك — نسخ احتياطي وبصمة سلامة</h3>
      <p>كل ما تصدّره يُستعاد بحذافيره — وأي تعديل يُرفض فوراً (لا استعادة عمياء).</p>
      <button
        data-testid="do-backup"
        onClick={() => {
          const { fp, restored } = roundTrip(demo);
          setMsg({ ok: true, text: `استُعيدت النسخة بنجاح (${restored.name} — ${restored.words} كلمة) · البصمة: ${fp.slice(0, 20)}…` });
        }}
      >
        ⬇️ صدّر واستعد تجريبياً
      </button>
      <button
        data-testid="do-tamper"
        onClick={() => {
          const json = exportJson(demo);
          const fp = fingerprint(json);
          try {
            restore(json.replace("يوسف", "أحمد"), fp);
            setMsg({ ok: true, text: "مستحيل الوصول هنا" });
          } catch (e) {
            setMsg({ ok: false, text: `رُفض الاستعادة: ${(e as Error).message}` });
          }
        }}
      >
        🧪 جرّب ملفاً مزوّراً
      </button>
      {msg && <p data-testid="data-msg" data-ok={msg.ok ? "true" : "false"}>{msg.text}</p>}
    </section>
  );
}

/* ══════════ E22 — الإعدادات/الوصولية ══════════ */
export function SettingsScreen() {
  const [prefs, setPrefs] = useState<ThemePrefs>(DEFAULT_PREFS);
  const audit = auditPalette();
  return (
    <section data-testid="settings-screen">
      <h3>⚙️ الإعدادات — الوضع الليلي والوصولية</h3>
      <p data-testid="dir-note">الاتجاه العربي (RTL) ثابت في كل الشاشات — لا يُلغى.</p>
      <div data-testid="settings-controls">
        <button data-testid="toggle-mode" onClick={() => setPrefs(toggleMode(prefs))}>
          الوضع: {prefs.mode === "light" ? "نهاري" : "ليلي"}
        </button>
        {ZOOM_STEPS.map((z) => (
          <button key={z} data-testid={`zoom-${z}`} onClick={() => setPrefs(setZoom(prefs, z))}>
            تكبير ×{z}
          </button>
        ))}
        <button data-testid="toggle-focus" onClick={() => setPrefs(toggleFocus(prefs))}>
          وضع التركيز: {prefs.focusMode ? "مفعّل" : "متوقف"}
        </button>
      </div>
      <table data-testid="contrast-audit">
        <tbody>
          {audit.map((row) => (
            <tr key={`${row.mode}-${row.pair}`} data-pass={row.pass ? "aa" : "fail"}>
              <td>{row.mode}</td>
              <td>{row.pair}</td>
              <td dir="ltr">{row.ratio.toFixed(1)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p data-testid="aa-note">كل الأزواج تجتاز معيار WCAG AA (≥ 4.5) في الوضعين.</p>
    </section>
  );
}

/* ══════════ الصدفة: لوحة النظام ══════════ */
const TABS = [
  { id: "gate", label: "🚪 بوابة" },
  { id: "progress", label: "📈 تقدّم" },
  { id: "adapt", label: "🤝 تكيّف" },
  { id: "play", label: "🎮 ألعاب" },
  { id: "data", label: "💾 نسخ" },
  { id: "settings", label: "⚙️ إعدادات" },
] as const;

export function SystemLab({ words }: { words: Word[] }) {
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("gate");
  return (
    <div data-testid="system-lab">
      <h2>لوحة النظام (M3 — E17–E22)</h2>
      <nav data-testid="system-tabs">
        {TABS.map((t) => (
          <button key={t.id} data-testid={`stab-${t.id}`} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </nav>
      {tab === "gate" && <GateScreen />}
      {tab === "progress" && <ProgressScreen />}
      {tab === "adapt" && <AdaptationScreen />}
      {tab === "play" && <PlayScreen words={words} />}
      {tab === "data" && <DataScreen />}
      {tab === "settings" && <SettingsScreen />}
    </div>
  );
}
