// SkillsLab.tsx — واجهات M2: شاشات المحركات الثمانية E09–E16 | D42
// كل شاشة تعكس قواعد محركها حرفياً: القفل قبل المحاولة · الهدف أولاً · المصدر معلناً · بلا درجات نطق.
import { useState } from "react";
import {
  D16_MINIMAL_PAIRS,
  buildListeningSession,
  type MinimalPair,
} from "../lib/advanced-listening.js";
import { SOUND_CARDS, drillCycle, selfCompare, type SoundCard } from "../lib/pronunciation.js";
import { tapTranslate, readingFlow, type ReadingText } from "../lib/reading.js";
import { correctSentence, gentleWrap, sentenceOfTheDay, diaryPrompt } from "../lib/writing.js";
import { A1_RULES } from "../lib/grammar-discovery.js";
import { RuleDiscoveryView } from "./LessonContent.js";
import { buildNetwork, memoryPalace, networkReviewFlow } from "../lib/vocab-network.js";
import { familyForms } from "../lib/lesson-runner.js";
import { A1_TASKS, taskFlow, type RealTask } from "../lib/real-tasks.js";
import { CULTURE_FACTS, songOfTheWeek, factsNeedingWebVerify } from "../lib/culture.js";
import { LESSON_ORDER, firstLessonWords } from "../lesson-packs.js";
import { PlayButton } from "./LessonSession.js";
import { CHARACTER_NAME_AR } from "../lib/story.js";
import { AudioScript } from "../../content/schemas/index.js";
import alphabetJson from "../../content/audio-scripts/a1-alphabet.json";

/* ══════════ E09 — الاستماع المتقدم ══════════ */
export function ListeningLab() {
  const session = buildListeningSession({ withSlowNews: true });
  const [chosen, setChosen] = useState<string | null>(null);
  return (
    <section data-testid="listening-lab">
      <h3>👂 الاستماع المتقدم</h3>
      <p data-testid="noise-stage">مرحلة الضجيج الحالية: نقي (تترقى عند 80% تمييز)</p>
      <ul data-testid="listen-steps">
        {session.steps.map((s) => (
          <li key={s.order} data-kind={s.kind}>
            {s.labelAr}
            {s.speed ? ` — سرعة ${s.speed}` : ""}
          </li>
        ))}
      </ul>
      {D16_MINIMAL_PAIRS.map((p: MinimalPair) => (
        <div key={p.id} data-testid={`pair-${p.id}`} dir="ltr">
          <button data-testid={`play-${p.id}`}>▶ {p.deA} / {p.deB}</button>{" "}
          <span data-testid={`hint-${p.id}`} dir="rtl">{p.risk}</span>
          <button data-testid={`quiz-${p.id}`} onClick={() => setChosen(p.id)}>
            أيّهما سمعت؟
          </button>
          {chosen === p.id && (
            <p data-testid={`answer-${p.id}`} dir="rtl">
              {p.deA} = {p.arA} · {p.deB} = {p.arB} — {p.hintAr}
            </p>
          )}
        </div>
      ))}
    </section>
  );
}

/* ══════════ E10 — النطق ══════════ */
export function PronunciationLab() {
  const [sound, setSound] = useState<SoundCard["id"]>("r");
  const [note, setNote] = useState<{ noteAr: string; before: string; after: string; score: null } | null>(null);
  const card = SOUND_CARDS.find((c) => c.id === sound)!;
  return (
    <section data-testid="pronunciation-lab">
      <h3>🗣️ النطق — {card.arName}</h3>
      <p data-testid="articulation" dir="ltr">{card.articulationDe}</p>
      <p dir="rtl">{card.articulationAr}</p>
      <p data-testid="no-score-warning">⚠️ التسجيل لأذنك أنت — لا نُعطي درجات للنطق (D16).</p>
      <div data-testid="sound-tabs">
        {SOUND_CARDS.map((c) => (
          <button key={c.id} data-testid={`sound-${c.id}`} onClick={() => setSound(c.id)}>
            {c.de}
          </button>
        ))}
      </div>
      <ol data-testid="drill-steps">
        {drillCycle(sound).map((s) => (
          <li key={s.order} data-kind={s.kind}>{s.labelAr}</li>
        ))}
      </ol>
      <button
        data-testid="record-compare"
        onClick={() => setNote(selfCompare("تسجيل قبل", "تسجيل بعد"))}
      >
        قارن التسجيلين بسمعك
      </button>
      {note && <p data-testid="compare-note">{note.noteAr}</p>}
    </section>
  );
}

/* ══════════ E11 — القراءة ══════════ */
export function ReadingLab({ text }: { text: ReadingText }) {
  const [attempted, setAttempted] = useState(false);
  const [openSeg, setOpenSeg] = useState<string | null>(null);
  const flow = readingFlow(text);
  return (
    <section data-testid="reading-lab">
      <h3>📖 {text.titleAr}</h3>
      <p data-testid="read-first">{flow[0]!.labelAr}</p>
      <div data-testid="segments">
        {text.segments.map((s) => (
          <p key={s.id} dir="ltr">
            {s.de}{" "}
            <button
              data-testid={`translate-${s.id}`}
              data-locked={attempted ? "false" : "true"}
              disabled={!attempted}
              onClick={() => setOpenSeg(s.id)}
            >
              ترجم
            </button>
            {openSeg === s.id && <span data-testid={`ar-${s.id}`} dir="rtl"> {tapTranslate(text, s.id).ar}</span>}
          </p>
        ))}
      </div>
      <button data-testid="mark-read" onClick={() => setAttempted(true)}>
        قرأتُ المرة الأولى
      </button>
    </section>
  );
}

/* ══════════ E12 — الكتابة ══════════ */
export function WritingLab({ initialText = "" }: { initialText?: string }) {
  const [text, setText] = useState(initialText);
  const [submitted, setSubmitted] = useState(initialText.length > 0);
  const sotd = sentenceOfTheDay(firstLessonWords.map((w) => ({ de: w.de, ar: w.ar[0]! })), 0);
  const diary = diaryPrompt("A1");
  const correction = submitted ? correctSentence(text) : null;
  return (
    <section data-testid="writing-lab">
      <h3>✍️ الكتابة</h3>
      <p data-testid="sentence-of-day" dir="ltr">{sotd.de} <span dir="rtl">— {sotd.ar}</span></p>
      <p data-testid="diary-prompt" dir="ltr">{diary.titleDe} <span dir="rtl">— {diary.titleAr}</span></p>
      <textarea
        data-testid="writing-input"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="اكتب جملتك هنا…"
      />
      <button data-testid="writing-submit" onClick={() => setSubmitted(true)}>
        دقّق جملتي (لطيف)
      </button>
      {correction && (
        <div data-testid="correction">
          <p data-testid="corrected" dir="ltr">{correction.corrected}</p>
          <p data-testid="why">{gentleWrap(correction)}</p>
        </div>
      )}
    </section>
  );
}

/* ══════════ E13 — القواعد ══════════ */
/**
 * مختبر القواعد (خارج المسار): القواعد الثلاث المكتوبة في الكود — بالمكوّن نفسه الذي تعرض به محطة «الجديد»
 * قواعد المحتوى (D115). كانت نسخة مستقلة لا تستدعي viewExamples فيرمي «سجّل استنتاجي» خطأ عند الضغط.
 */
export function unlockedLabRules(currentLessonId?: string | null) {
  if (currentLessonId === undefined || currentLessonId === null) return [...A1_RULES];
  const rank = new Map(LESSON_ORDER.map((id, i) => [id, i] as const));
  const at = rank.get(currentLessonId);
  if (at === undefined) return [];
  return A1_RULES.filter((r) => !r.lesson || (rank.get(r.lesson) ?? Infinity) <= at).sort(
    (x, y) => (rank.get(x.lesson ?? "") ?? -1) - (rank.get(y.lesson ?? "") ?? -1),
  );
}

export function GrammarLab({ ruleId, currentLessonId }: { ruleId?: string; currentLessonId?: string | null }) {
  const unlocked = unlockedLabRules(currentLessonId);
  const [chosenId, setChosenId] = useState<string | undefined>(ruleId);
  const rule = unlocked.find((r) => r.id === chosenId) ?? unlocked[0];
  if (!rule)
    return (
      <section data-testid="grammar-lab">
        <p>لا قواعد متاحة بعد — أكمل الدرس الحالي أولاً.</p>
      </section>
    );
  return (
    <section data-testid="grammar-lab">
      <nav data-testid="grammar-rules">
        {unlocked.map((r) => (
          <button key={r.id} data-testid={`rule-${r.id}`} onClick={() => setChosenId(r.id)}>
            {r.topicAr}
          </button>
        ))}
      </nav>
      <RuleDiscoveryView rule={rule} />
    </section>
  );
}

/* ══════════ E14 — المفردات الشبكية ══════════ */
export function NetworkLab() {
  const { nodes } = buildNetwork(firstLessonWords);
  const knownFirst = new Map(firstLessonWords.map((w) => [w.id, w])); // D118: العائلة بصيغتها ومن المدروس وحده
  const { stations } = memoryPalace(nodes, ["المدخل", "المطبخ", "الغرفة", "الشرفة"]);
  return (
    <section data-testid="network-lab">
      <h3>🕸️ المفردات الشبكية</h3>
      <ul data-testid="network-nodes">
        {nodes.map((n) => (
          <li key={n.wordId} data-node={n.wordId} dir="ltr">
            {n.de} <span dir="rtl">— عائلة: {familyForms({ wordFamily: n.family }, knownFirst).join("، ") || "—"}</span>
            {n.kollocation && (
              <span data-testid={`kol-${n.wordId}`} dir="rtl"> · ركب: {n.kollocation.de}</span>
            )}
          </li>
        ))}
      </ul>
      <div data-testid="palace">
        {stations.map((s) => (
          <p key={s.room} data-room={s.room}>
            🚪 {s.room}: <span dir="ltr">{s.wordIds.join(", ")}</span>
          </p>
        ))}
      </div>
      <ol data-testid="network-flow">
        {networkReviewFlow().map((f) => (
          <li key={f.order}>{f.labelAr}</li>
        ))}
      </ol>
    </section>
  );
}

/* ══════════ E15 — المهام الحقيقية ══════════ */
export function TasksLab({ task = A1_TASKS[0]! }: { task?: RealTask }) {
  const [showModel, setShowModel] = useState(false);
  const flow = taskFlow(task);
  return (
    <section data-testid="tasks-lab">
      <h3>🎯 {task.titleAr}</h3>
      <p data-testid="task-goal">الهدف: {task.goalAr}</p>
      <p data-testid="task-scene">{task.sceneAr}</p>
      <p data-testid="task-attempt">{flow[1]!.labelAr}</p>
      <button data-testid="show-model" onClick={() => setShowModel(true)}>
        قارن بالحوار النموذجي
      </button>
      {showModel && (
        <ul data-testid="model-dialogue">
          {task.dialogue.map((l, i) => (
            <li key={i} data-speaker={l.speaker} dir="ltr">
              {l.speaker}: {l.de} <span dir="rtl">— {l.ar}</span>
            </li>
          ))}
        </ul>
      )}
      <ul data-testid="task-criteria">
        {task.successCriteriaAr.map((c, i) => (
          <li key={i}>☐ {c}</li>
        ))}
      </ul>
    </section>
  );
}

/* ══════════ E16 — الثقافة ══════════ */
export function CultureLab() {
  const song = songOfTheWeek();
  const webIds = new Set(factsNeedingWebVerify().map((f) => f.id));
  return (
    <section data-testid="culture-lab">
      <h3>🇩🇪 ألمانيا في 60 ثانية</h3>
      <ul data-testid="culture-facts">
        {CULTURE_FACTS.map((f) => (
          <li key={f.id} data-fact={f.id}>
            <b dir="ltr">{f.titleDe}</b> — {f.titleAr}: {f.bodyAr}
            <p data-testid={`source-${f.id}`}>المصدر: {f.sourceAr}</p>
            {webIds.has(f.id) && <em data-testid={`verify-${f.id}`}>⚠️ يحتاج تحقق ويب عند النشر (موعد سنوي).</em>}
          </li>
        ))}
      </ul>
      <p data-testid="song-of-week" dir="ltr">
        🎵 {song.title} <span dir="rtl">— {song.license === "public-domain" ? "ملكية عامة" : song.license} ({song.reasonAr})</span>
      </p>
    </section>
  );
}

/* ══════════ الصدفة: مختبر المهارات ══════════ */
const TABS = [
  { id: "hoeren", label: "👂 استماع" },
  { id: "sprechen", label: "🗣️ نطق" },
  { id: "lesen", label: "📖 قراءة" },
  { id: "schreiben", label: "✍️ كتابة" },
  { id: "grammatik", label: "🧩 قواعد" },
  { id: "netzwerk", label: "🕸️ شبكة" },
  { id: "aufgaben", label: "🎯 مهام" },
  { id: "kultur", label: "🇩🇪 ثقافة" },
  { id: "alphabet", label: "🔤 الأبجدية" },
] as const;

export const DEMO_TEXT: ReadingText = {
  id: "a1-read-1",
  level: "A1",
  titleDe: "Hallo!",
  titleAr: "تحية يوسف",
  segments: [
    { id: "r1", de: "Hallo! Ich heiße Yusuf.", ar: "مرحبا! اسمي يوسف.", focusWordIds: ["hallo", "heissen"] },
    { id: "r2", de: "Ich wohne in Tunesien.", ar: "أنا أسكن في تونس.", focusWordIds: ["wohnen", "tunesien"] },
    { id: "r3", de: "Ich komme aus Tunesien.", ar: "أنا من تونس.", focusWordIds: ["kommen", "tunesien"] },
  ],
};

/* ══════════ N-008 (D231) — جدول الأبجدية ══════════ */
/** جدول الحروف الثلاثين + 3 تهجيات مسجلة (سكربت a1-alphabet) — كل حرف بزر صوته */
export function AlphabetLab() {
  const script = AudioScript.parse(alphabetJson);
  const letters = script.lines.filter((ln) => !ln.id.startsWith("abc-spell-"));
  const spells = script.lines.filter((ln) => ln.id.startsWith("abc-spell-"));
  return (
    <section data-testid="alphabet-lab">
      <h3>الأبجدية الألمانية 🔤 — اضغط الحرف لتسمع اسمه</h3>
      <ol data-testid="alphabet-letters">
        {letters.map((ln) => (
          <li key={ln.id}>
            <strong dir="ltr">{ln.text.replace(/\.$/, "")}</strong> <PlayButton audioId={ln.id} speakText={ln.text} />
          </li>
        ))}
      </ol>
      <h4>تهجية الأسماء — كما تُقال حرفاً حرفاً</h4>
      <ul data-testid="alphabet-spells">
        {spells.map((ln) => (
          <li key={ln.id}>
            {ln.speaker === "announcer" ? "المذيع" : CHARACTER_NAME_AR[ln.speaker]} يتهجى:{" "}
            <span dir="ltr">{ln.text}</span> <PlayButton audioId={ln.id} speakText={ln.text} />
          </li>
        ))}
      </ul>
    </section>
  );
}

export function SkillsLab({ currentLessonId }: { currentLessonId?: string | null }) {
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("hoeren");
  return (
    <div data-testid="skills-lab">
      <h2>مختبر المهارات (M2 — E09–E16)</h2>
      <nav data-testid="skills-tabs">
        {TABS.map((t) => (
          <button key={t.id} data-testid={`tab-${t.id}`} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </nav>
      {tab === "hoeren" && <ListeningLab />}
      {tab === "sprechen" && <PronunciationLab />}
      {tab === "lesen" && <ReadingLab text={DEMO_TEXT} />}
      {tab === "schreiben" && <WritingLab />}
      {tab === "grammatik" && <GrammarLab currentLessonId={currentLessonId} />}
      {tab === "netzwerk" && <NetworkLab />}
      {tab === "aufgaben" && <TasksLab />}
      {tab === "kultur" && <CultureLab />}
      {tab === "alphabet" && <AlphabetLab />}
    </div>
  );
}
