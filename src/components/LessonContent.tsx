// src/components/LessonContent.tsx — مشغّل محتوى المحطات: الحصة تمشي بخطواتها الحقيقية
// F121: محاولة قبل كشف · §2.5: تقييم بعد الكشف · E08: الخلاصة الهادئة · الوحدة صفر JIT (§9)
import { useEffect, useRef, useState } from "react";
import { audioPlayer } from "../lib/audio-player.js";
import { FUNCTION_LABELS_AR, type Phrase } from "../lib/phrase-bank.js";
import { PlayButton } from "./LessonSession.js";
import type { Unit0Card } from "../../content/schemas/index.js";
import type { LearnCardData, RecallCardData, PracticeData, CloseData } from "../lib/lesson-runner.js";
import { RecallCardView, LearnCardView, CloseView } from "./LessonSession.js";
import type { RecallRating } from "../lib/review-engine.js";
import {
  checkBeads, revealRule, shuffledBeads, startDiscovery, submitInference, viewExamples,
  type DiscoverySession, type GrammarRule,
} from "../lib/grammar-discovery.js";
import {
  displayOrder, initialPractice, nextItem, submitAttempt, toTypedItem, type Attempt, type PracticeState, type TypedItem, type Verdict,
} from "../lib/practice-session.js";

/** أحرف ألمانية خاصة (D117): لوحة مفاتيح عربية/إنجليزية لا تملك ä ö ü ß — بلا هذه الأزرار يُعاقَب المتعلم على لوحته لا على معرفته */
export const GERMAN_KEYS = ["ä", "ö", "ü", "ß", "Ä", "Ö", "Ü"] as const;

export function UmlautKeys({ onInsert, disabled }: { onInsert: (ch: string) => void; disabled?: boolean }) {
  return (
    <span data-testid="umlaut-keys" dir="ltr">
      {GERMAN_KEYS.map((ch) => (
        <button key={ch} type="button" disabled={disabled} aria-label={`أدخل ${ch}`} onClick={() => onInsert(ch)}>
          {ch}
        </button>
      ))}
    </span>
  );
}

/** إدراج عند موضع المؤشر (لا في الآخر فقط) ثم إعادة المؤشر بعد الحرف */
export function insertAtCursor(el: HTMLInputElement | null, text: string, ch: string, set: (v: string) => void): void {
  const start = el?.selectionStart ?? text.length;
  const end = el?.selectionEnd ?? text.length;
  set(text.slice(0, start) + ch + text.slice(end));
  if (el) requestAnimationFrame(() => { el.focus(); el.setSelectionRange(start + 1, start + 1); });
}

/** محطة 1 — الاسترجاع: بطاقة بعد بطاقة، والتقييم يمرّر للتالية */
export function RecallStation({ cards, onDone }: { cards: RecallCardData[]; onDone?: () => void }) {
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const card = cards[index];
  if (!card) return <p data-testid="recall-done">انتهت جولة الاسترجاع — إلى الجديد! 💪</p>;
  return (
    <div data-testid="recall-station">
      <p data-testid="recall-counter">
        بطاقة {index + 1} من {cards.length}
      </p>
      <RecallCardView
        front={card.front}
        back={card.back}
        audioId={card.audioId}
        speakText={card.speakText}
        revealed={revealed}
        onReveal={() => setRevealed(true)}
        onRate={(_r: RecallRating) => {
          setRevealed(false);
          setIndex(index + 1);
          if (index + 1 >= cards.length) onDone?.(); // D117: اكتملت المحطة ← يُفتح «التالي»
        }}
      />
    </div>
  );
}

/** محطة 2 — الجديد: محاولة ← كشف ← التالي (F121) — ثم قاعدة اليوم بالاكتشاف الموجَّه (D115) */
export function LearnStation({
  cards,
  rules = [],
  onDone,
}: {
  cards: LearnCardData[];
  rules?: readonly GrammarRule[];
  onDone?: () => void;
}) {
  const [index, setIndex] = useState(0);
  const [ruleIndex, setRuleIndex] = useState(0);
  const [attempted, setAttempted] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const card = cards[index];
  // §3 Präsentation (D104): «الصوت يُشغَّل لحظة ظهور الكلمة» — مرة عند الظهور، والإعادة بزر 🔊
  useEffect(() => {
    if (card) void audioPlayer().play({ trackId: card.audioId, text: card.speakText });
  }, [card]);
  if (!card) {
    const rule = rules[ruleIndex];
    if (rule)
      return (
        <RuleDiscoveryView
          key={rule.id}
          rule={rule}
          onDone={() => {
            setRuleIndex(ruleIndex + 1);
            if (ruleIndex + 1 >= rules.length) onDone?.(); // D117: آخر قاعدة ← اكتملت المحطة
          }}
        />
      );
    return <p data-testid="learn-done">اكتمل الجديد — إلى التدريب! 🎯</p>;
  }
  return (
    <div data-testid="learn-station">
      <p data-testid="learn-counter">
        عنصر {index + 1} من {cards.length}
        {rules.length > 0 && <small> — ثم قاعدة اليوم 🧩</small>}
      </p>
      <LearnCardView
        promptDe={card.promptDe}
        promptAr={card.promptAr}
        attempted={attempted}
        revealed={revealed}
        explanation={card.explanation}
        audioId={card.audioId}
        speakText={card.speakText}
        onAttempt={() => setAttempted(true)}
        onReveal={() => setRevealed(true)}
      />
      {revealed && (
        <button
          data-testid="learn-next"
          onClick={() => {
            setRevealed(false);
            setAttempted(false);
            setIndex(index + 1);
            if (index + 1 >= cards.length && rules.length === 0) onDone?.(); // D117: بلا قاعدة ← آخر بطاقة تُكمل المحطة
          }}
        >
          التالي ←
        </button>
      )}
    </div>
  );
}

/**
 * قاعدة اليوم (E13 · D115): المشهد والأمثلة ← استنتاجك ← الكشف (مقفل قبل محاولتك) + المقارنة العربية والحدود
 * ← حبّات الجملة (اضغط الكلمات بالترتيب). مشترك بين محطة «الجديد» ومختبر القواعد.
 */
export function RuleDiscoveryView({ rule, onDone }: { rule: GrammarRule; onDone?: () => void }) {
  // الأمثلة تُعرض في أول رسم ← تُسجَّل «مرئية» فوراً (المحرك يرفض الاستنتاج قبلها — F121)
  const [session, setSession] = useState<DiscoverySession>(() => {
    const s = startDiscovery(rule);
    viewExamples(s, rule);
    return s;
  });
  const [inference, setInference] = useState("");
  const [pool, setPool] = useState<string[]>(() => shuffledBeads(rule, 2));
  const [line, setLine] = useState<string[]>([]);
  const [beadOk, setBeadOk] = useState<boolean | null>(null);
  const shown = session.revealed ? revealRule(session, rule) : null;

  return (
    <section data-testid="rule-discovery" data-rule-id={rule.id}>
      <h3>🧩 قاعدة اليوم — {rule.topicAr}</h3>
      {rule.sceneAr && <p data-testid="rule-scene">{rule.sceneAr}</p>}
      <ul data-testid="grammar-examples">
        {rule.examples.map((ex, i) => (
          <li key={i}>
            <span dir="ltr">{ex.de}</span> <PlayButton speakText={ex.de} /> — {ex.ar}
          </li>
        ))}
      </ul>
      <p data-testid="inference-prompt">{rule.inferencePromptAr}</p>
      <input
        data-testid="inference-input"
        value={inference}
        disabled={session.inference !== null}
        onChange={(e) => setInference(e.target.value)}
        placeholder="استنتج القاعدة بكلماتك…"
      />
      <button
        data-testid="submit-inference"
        disabled={!inference.trim() || session.inference !== null}
        onClick={() => {
          submitInference(session, inference);
          setSession({ ...session });
        }}
      >
        سجّل استنتاجي
      </button>
      <button
        data-testid="reveal-rule"
        data-locked={session.inference === null ? "true" : "false"}
        disabled={session.inference === null || session.revealed}
        onClick={() => {
          revealRule(session, rule);
          setSession({ ...session });
        }}
      >
        🔓 اكشف القاعدة
      </button>
      {shown && (
        <>
          <div data-testid="rule-view">
            <p dir="ltr">{shown.ruleDe}</p>
            <p>{shown.ruleAr}</p>
            <p data-testid="rule-contrast">{shown.contrastAr}</p>
            {shown.limitsAr.length > 0 && (
              <ul data-testid="rule-limits">
                {shown.limitsAr.map((x, i) => (
                  <li key={i}>{x}</li>
                ))}
              </ul>
            )}
          </div>
          <p>رتّب حبّات الجملة: اضغط الكلمات بالترتيب الصحيح (اضغط كلمة في السطر لإرجاعها).</p>
          <div data-testid="bead-line" dir="ltr">
            {line.map((b, i) => (
              <button
                key={`${b}-${i}`}
                data-testid={`line-${i}`}
                disabled={beadOk === true}
                onClick={() => {
                  setLine(line.filter((_, j) => j !== i));
                  setPool([...pool, b]);
                  setBeadOk(null);
                }}
              >
                {b}
              </button>
            ))}
          </div>
          <div data-testid="beads" dir="ltr">
            {pool.map((b, i) => (
              <button
                key={`${b}-${i}`}
                data-testid={`bead-${i}`}
                onClick={() => {
                  setPool(pool.filter((_, j) => j !== i));
                  setLine([...line, b]);
                  setBeadOk(null);
                }}
              >
                {b}
              </button>
            ))}
          </div>
          <button data-testid="check-beads" disabled={pool.length > 0 || beadOk === true} onClick={() => setBeadOk(checkBeads(rule, line))}>
            تحقّق من الترتيب
          </button>
          {beadOk !== null && (
            <p data-testid="bead-result">{beadOk ? "ترتيب ممتاز! ✓" : "الترتيب ليس بعد — أرجع كلمة وجرّب من جديد."}</p>
          )}
          {beadOk && onDone && (
            <button data-testid="rule-done" onClick={onDone}>
              التالي ←
            </button>
          )}
        </>
      )}
    </section>
  );
}

/** التصحيح التفسيري بعد المحاولة: الحكم + الصحيح + «لماذا» (لا يُرسم أبداً قبل المحاولة — F121) */
function FeedbackView({ verdict, onNext }: { verdict: Verdict; onNext: () => void }) {
  return (
    <div data-testid="practice-feedback" data-status={verdict.status}>
      <p>{verdict.noteAr}</p>
      {verdict.status !== "correct" && (
        <p data-testid="practice-answer" dir="ltr">
          {verdict.expected}
        </p>
      )}
      {verdict.why && <p data-testid="practice-why">💡 {verdict.why}</p>}
      <button data-testid="practice-next" onClick={onNext}>
        التالي ←
      </button>
    </div>
  );
}

/** بند مُنمَّط واحد: طريقة التفاعل حسب نوعه — حالته المحلية تُصفَّر مع كل بند (key) */
function TypedItemView({ item, verdict, onAttempt }: { item: TypedItem; verdict: Verdict | null; onAttempt: (a: Attempt) => void }) {
  const [text, setText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const [pool, setPool] = useState<string[]>(() => (item.kind === "order" ? item.tokens : []));
  const [line, setLine] = useState<string[]>([]);
  const [matches, setMatches] = useState<Record<string, string>>({});
  const audio = item.kind === "choice" || item.kind === "input" ? item.audio : undefined;
  // الاستماع والإملاء: الصوت يُشغَّل لحظة ظهور البند (كالكلمات في العرض — D104) والإعادة بزر 🔊
  // الاعتماد على القيم لا الكائن: البند يُعاد بناؤه مع كل رسم للأب، والصوت لا يُعاد بعد المحاولة
  const audioId = audio?.audioId;
  const speakText = audio?.speakText;
  useEffect(() => {
    if (audioId && speakText) void audioPlayer().play({ trackId: audioId, text: speakText });
  }, [audioId, speakText]);
  const locked = verdict !== null;

  return (
    <div data-testid="practice-item" data-kind={item.kind}>
      {audio && <PlayButton audioId={audio.audioId} speakText={audio.speakText} label="استمع إلى المقطع" />}
      {(item.kind === "choice" || item.kind === "input") && item.text && (
        <blockquote dir="ltr" data-testid="practice-text">
          {item.text}
        </blockquote>
      )}
      {item.kind === "input" && item.mode === "dictation" ? (
        <p data-testid="dictation-instruction">{item.prompt || "استمع واكتب ما تسمعه بالضبط (الحرف الكبير جزء من التهجئة)."}</p>
      ) : (
        item.prompt && <p dir="auto">{item.prompt}</p>
      )}
      {item.kind === "choice" &&
        displayOrder(item.choices, `${item.prompt}|${item.choices.join("|")}`).map((c, i) => (
          <button key={c} data-testid={`choice-${i}`} dir="auto" disabled={locked} onClick={() => onAttempt(c)}>
            {c}
          </button>
        ))}
      {item.kind === "input" && (
        <>
          <input ref={inputRef} data-testid="practice-input" dir="ltr" value={text} disabled={locked} onChange={(e) => setText(e.target.value)} />
          <UmlautKeys disabled={locked} onInsert={(ch) => insertAtCursor(inputRef.current, text, ch, setText)} />
          <button data-testid="practice-check" disabled={locked || !text.trim()} onClick={() => onAttempt(text)}>
            تحقّق
          </button>
        </>
      )}
      {item.kind === "order" && (
        <>
          <div data-testid="order-line" dir="ltr">
            {line.map((t, i) => (
              <button
                key={`${t}-${i}`}
                data-testid={`placed-${i}`}
                disabled={locked}
                onClick={() => {
                  setLine(line.filter((_, j) => j !== i));
                  setPool([...pool, t]);
                }}
              >
                {t}
              </button>
            ))}
          </div>
          <div data-testid="order-pool" dir="ltr">
            {pool.map((t, i) => (
              <button
                key={`${t}-${i}`}
                data-testid={`token-${i}`}
                disabled={locked}
                onClick={() => {
                  setPool(pool.filter((_, j) => j !== i));
                  setLine([...line, t]);
                }}
              >
                {t}
              </button>
            ))}
          </div>
          <button data-testid="practice-check" disabled={locked || pool.length > 0} onClick={() => onAttempt(line)}>
            تحقّق
          </button>
        </>
      )}
      {item.kind === "production" && (
        <button data-testid="practice-self" disabled={locked} onClick={() => onAttempt("")}>
          قلتُها بصوت عالٍ — أرني النموذج
        </button>
      )}
      {item.kind === "match" && (
        <>
          <ul data-testid="match-pairs">
            {item.pairs.map((p) => (
              <li key={p.de}>
                <span dir="ltr">{p.de}</span> ={" "}
                <select
                  data-testid={`match-${p.de}`}
                  value={matches[p.de] ?? ""}
                  disabled={locked}
                  onChange={(e) => setMatches({ ...matches, [p.de]: e.target.value })}
                >
                  <option value="">…</option>
                  {[...item.pairs].sort((a, b) => a.ar.localeCompare(b.ar)).map((o) => (
                    <option key={o.ar} value={o.ar}>
                      {o.ar}
                    </option>
                  ))}
                </select>
              </li>
            ))}
          </ul>
          <button
            data-testid="practice-check"
            disabled={locked || Object.keys(matches).length < item.pairs.length}
            onClick={() => onAttempt(matches)}
          >
            تحقّق
          </button>
        </>
      )}
    </div>
  );
}

/** محطة 3 — التدريب: محطات Übung بالترتيب + المهمة التواصلية (CLT) */
export function PracticeStation({
  data,
  redemittel = [],
  onDone,
}: {
  data: PracticeData;
  redemittel?: Phrase[];
  onDone?: () => void;
}) {
  const [state, setState] = useState<PracticeState>(initialPractice);
  const station = data.stations[state.station];
  const item = station?.items[state.item] as { q?: string; a?: string } | undefined;

  if (!station || !item) {
    return (
      <section data-testid="communicative-task">
        <h3>المهمة التواصلية 🤝</h3>
        <p>{data.communicativeTask.goal.ar} — {data.communicativeTask.situation.ar}</p>
        <ul>
          {data.communicativeTask.successCriteria.map((c, i) => (
            <li key={i}>{c}</li>
          ))}
        </ul>
        {redemittel.length > 0 && (
          <aside data-testid="redemittel">
            <h4>عبارات تساعدك (Redemittel) — مما تعلّمته حتى الآن فقط</h4>
            <ul>
              {redemittel.map((p) => (
                <li key={p.de} data-first-lesson={p.firstLesson}>
                  <span dir="ltr">{p.de}</span> <PlayButton speakText={p.de} />
                  {p.ar ? ` — ${p.ar}` : ""} <small>({p.functions.map((f) => FUNCTION_LABELS_AR[f]).join("، ")} · ظهرت في {p.firstLesson})</small>
                </li>
              ))}
            </ul>
          </aside>
        )}
      </section>
    );
  }

  const typed = toTypedItem(station.type, item);
  const next = () => {
    const after = nextItem(state, data.stations);
    setState(after);
    if (!data.stations[after.station]) onDone?.(); // D117: آخر بند ← اكتملت المحطة (ثم المهمة التواصلية)
  };
  const counter = (
    <p data-testid="practice-counter">
      تمرين {state.item + 1} من {station.items.length} — محطة {state.station + 1} من {data.stations.length}
    </p>
  );

  if (typed) {
    return (
      <section data-testid="practice-station" data-type={station.type}>
        {counter}
        <TypedItemView
          key={`${state.station}-${state.item}`}
          item={typed}
          verdict={state.verdict}
          onAttempt={(a) => setState(submitAttempt(state, typed, a))}
        />
        {state.verdict && <FeedbackView verdict={state.verdict} onNext={next} />}
      </section>
    );
  }

  // بند قديم بلا شكل مُنمَّط (درس لم يُرقَّ بعد): «أظهر الإجابة» = تقييم ذاتي بلا شرح — كما كان
  const legacy: TypedItem = { kind: "production", prompt: item.q ?? "", model: item.a ?? "", why: "" };
  return (
    <section data-testid="practice-station" data-type={station.type}>
      {counter}
      <p dir="ltr">{item.q}</p>
      {!state.verdict ? (
        <button data-testid="practice-reveal" onClick={() => setState(submitAttempt(state, legacy, ""))}>
          أظهر الإجابة
        </button>
      ) : (
        <>
          <p data-testid="practice-answer" dir="ltr">
            {item.a}
          </p>
          <button data-testid="practice-next" onClick={next}>
            التالي ←
          </button>
        </>
      )}
    </section>
  );
}

/** محطة 4 — الخلاصة: التلخيص + المصائد الذهبية + تقرير مولر المسائي (E08) */
export function CloseStation({
  data,
  report,
  preview,
  muellerLine,
}: {
  data: CloseData;
  report: string;
  preview: string;
  muellerLine: string;
}) {
  return (
    <section data-testid="close-station">
      <h3>ماذا تعلمت اليوم 🌟</h3>
      <p data-testid="lesson-summary">
        {data.summaryDe} — {data.summaryAr}
      </p>
      <h4>مصائد ذهبية (أخطاؤك هي كنزك)</h4>
      <ul data-testid="warning-cards">
        {data.warningCards.map((card, i) => (
          <li key={i}>
            <span dir="ltr">{card.commonError.de}</span> — {card.whyArabicSpeakerFails} ← الصحيح:{" "}
            <span dir="ltr">{card.correct.de}</span>
          </li>
        ))}
      </ul>
      <CloseView report={report} preview={preview} muellerLine={muellerLine} />
    </section>
  );
}

/** بطاقة الوحدة صفر JIT (§9) — عند أول استخدام فعلي للمهارة */
export function JitCardOverlay({ card, onDismiss }: { card: Unit0Card; onDismiss: () => void }) {
  return (
    <aside data-testid="jit-overlay" data-card-id={card.id}>
      <h3>{card.title.ar}</h3>
      <p>{card.body.ar}</p>
      {card.body.mueller && <p data-testid="jit-mueller">— {card.body.mueller}</p>}
      <button data-testid="jit-dismiss" onClick={onDismiss}>
        فهمت ✓
      </button>
    </aside>
  );
}
