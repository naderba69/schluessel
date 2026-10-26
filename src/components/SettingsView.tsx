// src/components/SettingsView.tsx — تبويب الإعدادات §2.9 (N-155 · D269): بياناتك + المظهر + النسخ + مسح البيانات + عن المشروع.
// يجمع شاشتي الإعدادات والبيانات (المكوّنان نفسهما المستعملان في لوحة المطوّر — مصدر واحد، قانون 30:
// لا يُعرضان معاً أبداً: اللوحة مخفية خلف #labs).
import { useState } from "react";
import { DataScreen, SettingsScreen, type ProfilePatch } from "./SystemLab.js";
import { BRAND } from "../lib/brand.js";
import type { CoachWindow } from "../../content/schemas/index.js";

export function SettingsView({
  profile,
  onSaveProfile,
  onWipe,
}: {
  profile: { name: string; journeyName: string; coachWindows: readonly CoachWindow[] };
  onSaveProfile: (patch: ProfilePatch) => void;
  onWipe: () => void;
}) {
  const [confirmWipe, setConfirmWipe] = useState(false);
  return (
    <div data-testid="settings-view">
      <h2>⚙️ الإعدادات</h2>
      <SettingsScreen profile={profile} onSaveProfile={onSaveProfile} />
      <DataScreen />
      <section data-testid="wipe-screen">
        <h3>🗑️ مسح البيانات</h3>
        {!confirmWipe ? (
          <button data-testid="wipe-start" onClick={() => setConfirmWipe(true)}>
            ابدأ من جديد…
          </button>
        ) : (
          <p>
            سيُمحى كل تقدّمك على هذا الجهاز نهائياً.{" "}
            <button data-testid="wipe-confirm" onClick={onWipe}>
              نعم، امحُ كل شيء
            </button>{" "}
            <button onClick={() => setConfirmWipe(false)}>تراجع</button>
          </p>
        )}
      </section>
      <section data-testid="about-screen">
        <h3>عن المشروع</h3>
        <p>
          🔑 {BRAND.nameAr} — <span dir="ltr">{BRAND.nameDe}</span> · {BRAND.sloganAr}
        </p>
        <p>يعمل بلا إنترنت · بياناتك على جهازك أنت.</p>
      </section>
    </div>
  );
}
