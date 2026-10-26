// src/components/BottomNav.tsx — الشريط السفلي الثابت (N-155 · D269): 5 أقسام — اليوم · الخريطة · المدرب · الدفتر · الإعدادات.
// قالب ثابت (قانون 16): نفس المواضع دائماً — لا توهان. يُخفى أثناء الحصة (تركيز) وأثناء أول تشغيل.
import type { MainTab } from "./main-tabs.js";

const TABS: { id: MainTab; label: string }[] = [
  { id: "today", label: "🏠 اليوم" },
  { id: "map", label: "🗺️ الخريطة" },
  { id: "coach", label: "🎯 المدرب" },
  { id: "golden", label: "💛 الدفتر" },
  { id: "settings", label: "⚙️ الإعدادات" },
];

export function BottomNav({ tab, onTab }: { tab: MainTab; onTab: (t: MainTab) => void }) {
  return (
    <nav data-testid="bottom-nav" aria-label="أقسام التطبيق">
      {TABS.map((t) => (
        <button
          key={t.id}
          data-testid={`tab-${t.id}`}
          data-active={tab === t.id ? "yes" : "no"}
          aria-current={tab === t.id ? "page" : undefined}
          onClick={() => onTab(t.id)}
        >
          {t.label}
        </button>
      ))}
    </nav>
  );
}
