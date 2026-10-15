// src/components/StruckText.tsx — رسم «~~الخطأ~~» شطباً حقيقياً (<del>) — D128
// الخطأ المقصود لا يُرى إلا مشطوباً: هكذا يقرؤه المتعلم صيغةً مرفوضة لا كلمةً بعلامتين غريبتين.
import { Fragment } from "react";
import { splitStruck } from "../lib/struck-text.js";

export function StruckText({ text }: { text: string }) {
  return (
    <>
      {splitStruck(text).map((p, i) =>
        p.struck ? (
          <del key={i} data-testid="struck">
            {p.text}
          </del>
        ) : (
          <Fragment key={i}>{p.text}</Fragment>
        ),
      )}
    </>
  );
}
