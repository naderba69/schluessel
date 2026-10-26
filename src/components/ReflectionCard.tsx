// src/components/ReflectionCard.tsx — سطر التأمل اليومي (ب-12 · D275): 30 ثانية — ماذا أتقنت؟ ماذا يحتاج غداً؟
// يظهر بعد دراسة اليوم فقط (لا تأمل بلا دراسة — النقطة تُكتسَب لا تُدَّعى) · يُحفَظ في سجل اليوم (التيليمتري)
import { useState } from "react";

export function ReflectionCard({
  initial,
  onSave,
}: {
  initial: { learned?: string; tomorrow?: string };
  onSave: (learned: string, tomorrow: string) => void;
}) {
  const [learned, setLearned] = useState(initial.learned ?? "");
  const [tomorrow, setTomorrow] = useState(initial.tomorrow ?? "");
  const [saved, setSaved] = useState(false);
  return (
    <section data-testid="reflection-card">
      <h2>🪞 سطر تأملك (30 ثانية)</h2>
      <label>
        ماذا أتقنت اليوم؟
        <input
          data-testid="reflection-learned"
          value={learned}
          onChange={(e) => {
            setLearned(e.target.value);
            setSaved(false);
          }}
          placeholder="مثال: الماضي مع haben"
        />
      </label>
      <label>
        ماذا يحتاج غداً؟
        <input
          data-testid="reflection-tomorrow"
          value={tomorrow}
          onChange={(e) => {
            setTomorrow(e.target.value);
            setSaved(false);
          }}
          placeholder="مثال: مراجعة الأرقام"
        />
      </label>
      <button
        data-testid="reflection-save"
        onClick={() => {
          onSave(learned, tomorrow);
          setSaved(true);
        }}
      >
        حفظ سطر التأمل 🌱
      </button>
      {saved && <p data-testid="reflection-saved">حُفظ سطر تأملك 🌱</p>}
    </section>
  );
}
