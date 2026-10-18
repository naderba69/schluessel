# tools/dev — أدوات الفحص داخل المستودع (N-104 · قرار المالك 2026-10-18 رقم 17)

كانت هذه الأدوات تعيش في `/home/user/work` و`/tmp` وضاعت ثلاث مرات مع انقطاع الصندوق. الآن في git؛ والنصوص الرسمية وحدها تبقى خارجه (حقوق Goethe-Institut) وتُجلب عند الحاجة إلى `.dev-cache/` (في `.gitignore`).

| الأداة | ما تفعله | الاستعمال |
|---|---|---|
| `fetch-official.sh` | يجلب PDF قائمتي SD1 وA2 بالـblob المثبَّت في `content/wordlists/*.json` (يتحقق من sha256) ويستخرج نصّيهما بـpdfplumber، ومرجع ipa-dict بالـblob المثبَّت في `tools/pronunciation-reference.de.json` | `bash tools/dev/fetch-official.sh` |
| `check-lesson.ts` | ثلاثة فحوص على كل جملة ألمانية في درس (أو ملف أسطر): الجبهة (قانون 13) · تسرّب كلمات الدروس اللاحقة (N-103) · التطابق الحرفي مع SD1/A2 (D108 — يحتاج `.dev-cache`) | `npx tsx tools/dev/check-lesson.ts a1-u12-d2 [--names A,B] [--file f.txt] [--script] [--only-hits] [--json]` |
| `speech-rate.py` | سرعة الكلام المقيسة لكل مسار من المانيفست (كلمات ÷ دقائق) ويُعلِّم ما فوق 200 كلمة/دقيقة (قرار المالك على N-015) — بوابة في `tests/dev-tools.test.ts` | `python3 tools/dev/speech-rate.py [--all] [--threshold 200] [--json]` |
| `owner-review.py` | يولّد تقرير المالك (§10 + DECISIONS.md + الأداتان) — التوصيات في `REC` داخله | `python3 tools/dev/owner-review.py [--out …] [--date …]` |
| `docs-sync.py` | **D186 — DECISIONS.md مصدر وحيد:** يولّد CHANGELOG/PROGRESS/STATE ورأس الموجّه من الكتل المهيكلة (≥D186: الدفعة · الموجّه · للقارئ · البوابة · التالي) بين `<!-- docs-sync:start/end -->` — ما قبلها تاريخ مجمَّد | `python3 tools/dev/docs-sync.py --check` (البوابة) · `--write` بعد كتابة القرار · `--json` |
| `notes.py` | **D186 — سجل §10 بأداة:** إضافة/إغلاق/عدّ/فحص الملاحظات بقواعد `tests/owner-notes.test.ts` نفسها — يرفض الكتابة عند أي مخالفة (D غير موجود · عدّ · المطلوب/أُغلقت) | `python3 tools/dev/notes.py list [--status open]` · `add --source D… --cat … --title … --body … --need …` · `close N-### --by D… --text …` · `check` |

قواعد: لا تُلتزم ملفات `.dev-cache/` أبداً · `check-lesson.ts` بلا `.dev-cache` يعمل ويقول صراحةً إن المقارنة الرسمية لم تُفحص · الإبطاء لسطر بعينه يكون بحقل `lengthScale` في سطر السكربت (D182) ثم `npx tsx tools/dialogue-splitter.ts <script.json>` (يُعيد ذلك السطر وحده).
