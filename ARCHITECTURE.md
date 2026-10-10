# ARCHITECTURE.md — المعمارية ومسار البيانات (الدستور v6.1 §2 + §19‑ب)

## هيكل المشروع
```
reise-yusuf/
├── STATE.md / PROGRESS.md / DECISIONS.md / CHANGELOG.md   ← ملفات الحالة (قانون 32)
├── ARCHITECTURE.md / README.md
├── docs/
│   ├── M0-plan.md            ← خطة المعلم 0 (S0.1–S0.12 + DoD)
│   └── dos/M0.DOD.md         ← قائمة تحقق الإغلاق + Test IDs
├── content/                  ← كل المحتوى بيانات (D3/D27 — JSON يتحقق منه zod)
│   ├── schemas/              ← مصدر واحد للحقيقة (common/word/card/lesson/
│   │                            learner-state/manifest/arsenal + index)
│   ├── arsenal/              ← الخزانة §10 (شفرات/جداول/قوائم) + curriculum-reference.json
│   ├── lessons/{a1,a2,b1,b2} ← الدروس (a1-u3-d2.json ...)
│   ├── story/                ← الشخصيات الثمانية + أقواس القصة (§11/D20‑أ)
│   ├── manifests/            ← audio-manifest.json (Piper/D20) + image-manifest.json
│   └── unit0/                ← بطاقات الوحدة صفر (4+8) + محفّزات JIT (§9)
├── src/
│   ├── lib/                  ← mastery (D18)، fsrs، أدوات
│   ├── stores/               ← Dexie (حالة المتعلم)
│   ├── components/ pages/    ← React (RTL + Bidi — قانون 29)
│   └── styles/               ← الهوية: der▲ أزرق / die● أحمر / das■ أخضر (§15‑هـ)
├── tests/                    ← vitest — Test IDs من docs/dos/*.DOD.md
└── tools/                    ← validate-content.ts (G1) + سكربتات Piper/ASR
```

## مسار البيانات
1. **المحتوى:** JSON في `/content` → يتحقق منه `tools/validate-content.ts` (zod + قوانين G1) → يقرأه التطبيق.
2. **حالة المتعلم:** تُكتب في Dexie (مطابقة لـlearner-state.ts) → snapshot يومي JSON (GitHub API، مفتاح في المتصفح) → zip دوري للكل (قانون 14).
3. **الصوت:** نصوص → audio-manifest (P0/P1/P2) → Piper محلي → ملفات opus/mp3 → Web Speech احتياطي فوري (D7/D20).
4. **الجودة:** G1 (tools) → G2 (روابط موثقة في كل درس) → G3 (تدقيق خصمي كل وحدتين) → G4 (tests/ — لا إغلاق بلا أخضراء).

## القواعد غير القابلة للتفاوض
- لا محتوى تعليمي داخل الكود (D3) | schemaVersion في كل ملف (قانون 32) | Bidi: كل نص ألماني `dir="ltr"` (قانون 29) | الترميز المزدوج للجنس في كل ظهور (§15‑هـ) | usedInLessons يتحدّث آلياً (§10‑ح) | الإتقان = S ≥ 21/30 (D18) | لا اختبار تحديد مستوى إطلاقاً (D24).
