// src/components/FirstRun.tsx — أول تشغيل (§16): مولر → اسم → الوحدة صفر (4) → أول درس
// لا اختبار تموضع في أي شاشة (D24) — المسار كاملاً FIRST_RUN_STEPS
import { useState } from "react";
import type { LearnerState, Lesson, Unit0Card, Word } from "../../content/schemas/index.js";
import { completeFirstRun, FIRST_RUN_STEPS, firstRunNext, type FirstRunStep } from "../lib/first-run.js";
import { dayOneCards, loadUnit0Deck } from "../lib/unit0.js";
import { GenderBadge } from "./GenderBadge.js";

export function WelcomeScreen({ onNext }: { onNext: () => void }) {
  return (
    <section data-screen="welcome">
      <h1>مرحباً بك في «مفتاح — Schlüssel» 🔑</h1>
      <p style={{ opacity: 0.8 }}>اللغة مفتاحك — Die Sprache ist dein Schlüssel</p>
      <p data-testid="mueller-welcome">
        مرحباً! أنا <strong>مولر</strong>، معلمك هنا. لا نحتاج اختبار تحديد مستوى — أنت تبدأ من الصفر الحقيقي، ونحن نبني معك كل شيء.
        اليوم جلسة قصيرة عمداً: 4 بطاقات فقط ثم أول درس. غداً نسترجع — هذا كل السر.
      </p>
      <button onClick={onNext}>لنبدأ</button>
    </section>
  );
}

export function NameScreen({ onSubmit }: { onSubmit: (name: string) => void }) {
  const [name, setName] = useState("");
  return (
    <section data-screen="ask-name">
      <h1>ما اسمك؟</h1>
      <p>سنناديك به في كل جلسة (يمكن تغييره لاحقاً).</p>
      <input
        aria-label="اسم المتعلم"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="اكتب اسمك هنا"
        dir="rtl"
      />
      <button onClick={() => onSubmit(name)} disabled={!name.trim()}>
        أنا جاهز
      </button>
    </section>
  );
}

export function Unit0CardView({ card }: { card: Unit0Card }) {
  return (
    <article data-screen="unit0-card" data-card-id={card.id}>
      <h2>{card.title.ar}</h2>
      <p>{card.body.ar}</p>
      {card.body.mueller && <p data-testid="mueller-line">— {card.body.mueller}</p>}
    </article>
  );
}

/**
 * N-049 (D233): تمرين كتابة ß باليد — تقييم ذاتي (كشف بعد المحاولة، بلا درجات): المتعلم يكتب على ورقة ثم يقارن بالرسم.
 */
export function HandwritingExercise() {
  const [revealed, setRevealed] = useState(false);
  return (
    <div data-testid="handwriting-exercise">
      <h4>تمرين: اكتب ß بيدك ✍️</h4>
      <ol>
        <li>من السطر العلوي انزل بخط عمودي طويل يتجاوز السطر السفلي.</li>
        <li>من وسط الخط ارسم بطناً مستديرة لليمين تُغلق على الخط نفسه.</li>
        <li>اكتبها 3 مرات على ورقة — ثم اكشف الرسم وقارن.</li>
      </ol>
      {!revealed ? (
        <button data-testid="handwriting-reveal" onClick={() => setRevealed(true)}>
          كتبتُها — أرني الرسم
        </button>
      ) : (
        <div data-testid="handwriting-model">
          <p dir="ltr" style={{ fontSize: "3rem" }}>ß</p>
          <p>قارن كتابتك: هل ينزل الخط تحت السطر؟ هل البطن مغلقة على الخط؟ إن نعم — أحسنت، هذه هي ß.</p>
        </div>
      )}
    </div>
  );
}

/**
 * N-049 (D233): بطاقة لوحة المفاتيح عند أول استعمال — فوق أول بند كتابة فيه حرف خاص (التدريب وحده؛
 * الاختبار تقييمٌ لا يُقاطَع بالتعليم). الرفض محلي + إبلاغ الأب للحفظ الدائم (تظهر مرة واحدة أبداً).
 */
export function KeyboardCard({ card, onDismiss }: { card: Unit0Card; onDismiss?: () => void }) {
  const [gone, setGone] = useState(false);
  if (gone) return null;
  const dismiss = () => { setGone(true); onDismiss?.(); };
  return (
    <div data-testid="keyboard-card">
      <Unit0CardView card={card} />
      <HandwritingExercise />
      <button data-testid="keyboard-dismiss" onClick={dismiss}>
        فهمت — تابع
      </button>
    </div>
  );
}

export function Unit0Day1Screen({ onNext }: { onNext: () => void }) {
  const cards = dayOneCards(loadUnit0Deck());
  const [i, setI] = useState(0);
  const card = cards[i];
  return (
    <section data-screen="unit0-day1">
      <Unit0CardView card={card} />
      <p data-testid="unit0-progress">
        بطاقة {i + 1} من {cards.length}
      </p>
      {i < cards.length - 1 ? (
        <button onClick={() => setI(i + 1)}>التالية</button>
      ) : (
        <button onClick={onNext}>إلى أول درس</button>
      )}
    </section>
  );
}

export function FirstLessonScreen({ lesson, words, onStart }: { lesson: Lesson; words: Word[]; onStart?: () => void }) {
  return (
    <section data-screen="first-lesson" data-lesson-id={lesson.id}>
      <h1>أول درس: {lesson.ziel.de}</h1>
      <p dir="rtl">{lesson.ziel.ar}</p>
      <p data-testid="can-do">بنهاية اليوم: {lesson.canDoDaily[0]}</p>
      <h2>أولى الكلمات</h2>
      <ul>
        {words.map((w) => (
          <li key={w.id} dir="ltr" data-word-id={w.id}>
            <GenderBadge gender={w.gender} word={w.de} /> — <span dir="rtl">{w.ar[0]}</span>
          </li>
        ))}
      </ul>
      {onStart && (
        <button data-testid="first-lesson-start" onClick={onStart}>
          ▶ إلى حصة اليوم
        </button>
      )}
    </section>
  );
}

export function FirstRun({
  onComplete,
  onFinish,
  firstLesson,
  firstLessonWords,
}: {
  onComplete: (state: LearnerState) => void;
  /** D117: نهاية التهيئة (بعد بطاقات اليوم الأول وشاشة أول درس) — قبلها كانت القشرة تقفز للوحة لحظة إدخال الاسم فلا تُرى الشاشتان */
  onFinish?: () => void;
  firstLesson: Lesson;
  firstLessonWords: Word[];
}) {
  const [step, setStep] = useState<FirstRunStep>(FIRST_RUN_STEPS[0]);
  const advance = () => {
    const next = firstRunNext(step);
    if (next) setStep(next);
  };

  if (step === "welcome") return <WelcomeScreen onNext={advance} />;
  if (step === "ask-name")
    return (
      <NameScreen
        onSubmit={(name) => {
          onComplete(completeFirstRun(name)); // الحالة تُنشأ الآن — الدخول للدرس في نفس الجلسة (§16)
          advance();
        }}
      />
    );
  if (step === "unit0-day1") return <Unit0Day1Screen onNext={advance} />;
  return <FirstLessonScreen lesson={firstLesson} words={firstLessonWords} onStart={onFinish} />;
}
