// src/components/StruckText.tsx — رسم «~~الخطأ~~» شطباً حقيقياً (<del>) — D128
// الخطأ المقصود لا يُرى إلا مشطوباً: هكذا يقرؤه المتعلم صيغةً مرفوضة لا كلمةً بعلامتين غريبتين.
// D188: الكلمة المستعارة من درس لاحق تُرسم <abbr> بترجمتها (قرار المالك: الإعلان للمتعلم لا للحارس وحده).
import { Fragment, createContext, useContext, type ReactNode } from "react";
import type { Lesson } from "../../content/schemas/index.js";
import { splitStruck, type GlossMap } from "../lib/struck-text.js";

export type BorrowedWord = Lesson["praesentation"]["borrowedWords"][number];

const GlossContext = createContext<GlossMap>(new Map());

/** يوفّر ترجمات الكلمات المستعارة للدرس الجاري لكل نصّ يُرسم بـStruckText تحته */
export function BorrowedProvider({ words, children }: { words: readonly BorrowedWord[]; children: ReactNode }) {
  const map: GlossMap = new Map(words.map((b) => [b.form, `${b.ar} — كلمة مستعارة من درس قادم`]));
  return <GlossContext.Provider value={map}>{children}</GlossContext.Provider>;
}

export function StruckText({ text }: { text: string }) {
  const gloss = useContext(GlossContext);
  return (
    <>
      {splitStruck(text, gloss).map((p, i) =>
        p.struck ? (
          <del key={i} data-testid="struck">
            {p.text}
          </del>
        ) : p.gloss ? (
          <abbr key={i} data-testid="borrowed" title={p.gloss} lang="de">
            {p.text}
          </abbr>
        ) : (
          <Fragment key={i}>{p.text}</Fragment>
        ),
      )}
    </>
  );
}

/** صندوق «كلمات مستعارة» قبل التدريب (D188): المتعلم يعرف مسبقاً ما لم يُدرَّس بعد ولماذا هو هنا */
export function BorrowedWordsBox({ words }: { words: readonly BorrowedWord[] }) {
  if (words.length === 0) return null;
  return (
    <aside data-testid="borrowed-words">
      <h4>كلمات مستعارة من دروس قادمة</h4>
      <ul>
        {words.map((b) => (
          <li key={b.form} data-word-id={b.wordId}>
            <strong lang="de">{b.form}</strong> = {b.ar} — {b.whyAr}
          </li>
        ))}
      </ul>
    </aside>
  );
}
