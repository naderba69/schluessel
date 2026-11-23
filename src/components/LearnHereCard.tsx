import { useState } from "react";
import { SEVEN_LAWS_AR, learnHereSeen, markLearnHereSeen } from "../lib/learn-here.js";

/** «كيف تتعلم هنا» — القانون 18: قوانين الدورة السبعة تُعرض أول استخدام ثم لا تُعاد إزعاجاً */
export function LearnHereCard() {
  const [seen, setSeen] = useState(learnHereSeen());
  if (seen) return null;
  return (
    <section data-testid="learn-here" aria-label="كيف تتعلم هنا">
      <h3>كيف تتعلم هنا 🌧️ — قوانين الدورة السبعة</h3>
      <ol>
        {SEVEN_LAWS_AR.map((law) => (
          <li key={law}>{law}</li>
        ))}
      </ol>
      <button
        data-testid="learn-here-dismiss"
        onClick={() => {
          markLearnHereSeen();
          setSeen(true);
        }}
      >
        فهمت، هيا بنا
      </button>
    </section>
  );
}
