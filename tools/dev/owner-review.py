#!/usr/bin/env python3
# tools/dev/owner-review.py — توليد تقرير المراجعة وملخّص الملاحظات والقرارات للمالك من الملفات نفسها (D181 · N-104)
# المصادر: docs/PROFESSIONAL_CONTINUATION_PROMPT_AR.md §10 · DECISIONS.md · tools/upgrade-status.ts · tools/plan-status.ts
# الاستعمال: python3 tools/dev/owner-review.py [--out docs/reports/owner-review-<date>.md] [--date 2026-10-18]
# التوصيات (REC) تُكتب يدوياً هنا لكل ملاحظة «بانتظار المالك» — ما عداها مولَّد.
import re, json, glob, subprocess, sys, os, datetime
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
os.chdir(ROOT)
DATE = sys.argv[sys.argv.index('--date') + 1] if '--date' in sys.argv else datetime.date.today().isoformat()
OUT = sys.argv[sys.argv.index('--out') + 1] if '--out' in sys.argv else f'docs/reports/owner-review-{DATE}.md'
P=open('docs/PROFESSIONAL_CONTINUATION_PROMPT_AR.md',encoding='utf-8').read()
sec=P[P.index('## 10.'):P.index('<!-- owner-notes:end -->')]
notes=re.findall(r'^- \*\*(N-\d+)\*\* · \[([^\]]+)\] · ([^·]*) · (.*)$',sec,flags=re.M)
assert notes, 'لم تُقرأ ملاحظات §10'
D=open('DECISIONS.md',encoding='utf-8').read()
heads=re.findall(r'^## (D\d+) \(([\d-]+)\): ([^\n]*)',D,flags=re.M)
early=re.findall(r'\*\*(D\d+)\*\* ([^*]+?)(?=\*\*D\d+\*\*|\n)',D[:D.index('## D47')] if '## D47' in D else D[:5000])
def cat(body):
    m=re.match(r'\s*\(([^)]*)\)',body)
    if m: return m.group(1)
    b=body
    if re.search(r'SRS|الواجهة|الحصة|الصفحة|`sessions`|مختبر القواعد|جدول ألفباء',b): return 'التطبيق'
    if re.search(r'نطق|IPA|espeak|صوت|مقطع|كلمة/دقيقة|حركة',b): return 'النطق والصوت'
    if re.search(r'محجوب|مرفقات|المرجع المنهجي|Duden|Goethe',b): return 'المصادر والبيئة'
    return 'المحتوى (قديمة — قبل اصطلاح الباب)'
def title(body):
    b=re.sub(r'^\s*\([^)]*\)\s*','',body); m=re.search(r'\*\*(.+?)\*\*',b)
    t=(m.group(1) if m else b[:100]); return t[:140]
def req(body):
    if '— المطلوب:' in body: return body.split('— المطلوب:')[-1].strip()
    if '— أُغلقت:' in body: return body.split('— أُغلقت:')[-1].strip()
    return ''
def cut(t,n): t=t.replace('|','¦').replace('\n',' '); return t if len(t)<=n else t[:n].rstrip()+' …'
# توصياتي للملاحظات التي تنتظر المالك (11)
REC={
 'N-001':'أكّد الافتراضات الخمسة كما نُفّذت (كلها عاملة في المحرك منذ M1 ولم تظهر مشكلة) — أي تغيير الآن يمسّ الاختبارات والمحتوى معاً.',
 'N-002':'وافق على الرموز الثلاثة (w=[v] · ie · r) — مُعلَّمة فعلاً في الدروس ولا تنقص إلا من قائمة الأخطار المغلقة.',
 'N-003':'لا تكتب 79 جملة قصة جديدة: احذف الحقل أو املأه آلياً من أول سطر في حوار كل درس (57 حواراً جاهزاً — D181 يثبّت التواريخ من 3 إلى 15 أبريل).',
 'N-004':'نعم — ضمّ دروس التوليف الـ18 إلى مرور ثانٍ بالمعايير نفسها؛ a1-u12-d6 اليوم ضابط سلبي حقيقي في الاختبارات (6 بنود choice · Quiz 3×4 · gewesen/gehabt).',
 'N-045':'أبقِ الكلمات السبع (مفيدة للتواصل) مع وسم «خارج A1» في المدخل — لا استبدال؛ النواة 48/48 اكتملت بلا حاجة إليها.',
 'N-063':'أكّد ما نُفّذ في D140 (ihr/ihre في u4-d5) — مستقر منذ 40 دفعة ومُختبَر.',
 'N-066':'وافق: ein Bekannter للفهم في u13–u14 لا قبلها (نهايات الصفة A2).',
 'N-069':'وافق على القيد الثقافي الحالي (لا Wurst/Bier ليوسف) — أو ارفعه صراحةً؛ لا أثر على الاختبارات.',
 'N-073':'أبقِ قطعة zum Frühstück المبكرة (u5) — تأجيلها يعيد صوغ قاعدة ومثالين وسطري حوار بلا مكسب.',
 'N-115':'(ب) يكفي ما في u11-d4 حتى A2 حيث تُجمع الأفعال المنعكسة — ملف ars-reflexiv لفعل واحد يثقل الخريطة.',
 'N-116':'(أ) يبقى dürfen+sollen معاً في ars-modal-fix — الموقف الطبي يجمعهما؛ و(ج) إضافة بطاقتي كلمة duerfen/sollen للـSRS مقبولة لاحقاً إن أردت.',
}
# أرقام مقيسة
def run(c): return subprocess.run(c,shell=True,capture_output=True,text=True).stdout.strip()
up=run('npx tsx tools/upgrade-status.ts 2>&1 | tail -3')
ps=run('npx tsx tools/plan-status.ts 2>&1 | sed -n 2p')
words=len(glob.glob('content/words/*.json')); 
M=json.load(open('content/manifests/audio-manifest.a1-u1.json')); tracks=len(M['tracks'])
rules=len(glob.glob('content/arsenal/grammar/*.json'))
lex=len(json.load(open('tools/pronunciation-lexicon.json'))['entries'])
dlg=0
for f in glob.glob('content/audio-scripts/a1-u*-d*.json'):
    if json.load(open(f,encoding='utf-8')).get('kind')=='dialogue': dlg+=1
from collections import Counter
st=Counter('مغلقة' if n[1].startswith('مغلقة') else n[1] for n in notes)
L=[]
L.append(f'# المراجعة الختامية وملخّص الملاحظات والقرارات — للمالك (D181 · {DATE})\n')
L.append('> أمر المالك (2026-10-17): «جمع جميع ملاحظاتك وقراراتك لنناقشها في نهاية المشروع». هذا الملف مولَّد من `docs/PROFESSIONAL_CONTINUATION_PROMPT_AR.md` §10 وDECISIONS.md والأدوات (`upgrade-status` · `plan-status`) بالسكربت `tools/dev/owner-review.py` — المصدر الحاكم يبقى §10 وDECISIONS.md؛ هنا الترتيب والتوصية فقط. لا يُعدَّل يدوياً؛ يُعاد توليده عند الحاجة.\n')
L.append('## 1. حالة المشروع عند نهاية المرور (مقيسة)\n')
L.append(f'- **ترقية الدروس:** {up.splitlines()[1].strip()} — دروس المحتوى في الوحدات 1–12 كلها (D116–D180) · دروس التوليف d6 وأسبوع الامتحان u15 (18 درساً) خارج المرور (N-004).')
L.append(f'- **نواة SD1 (D113):** {ps.strip()}')
L.append(f'- **الحجم:** {words} بطاقة كلمة · {tracks} مساراً صوتياً (Piper — مثبّت في git) · {rules} ملف قاعدة يوم (Arsenal) · {dlg} حواراً (كلها مكالمات فيديو بين يوسف في برلين ولينا في سويسرا — N-037/N-100) · معجم النطق {lex} مدخلاً.')
L.append('- **البوابة الأخيرة (الدفعة 135):** vitest 713/713 (64 ملفاً) · tsc 0 · validate-content 1131 ملفاً / 0 خطأ / 0 تحذير · build ✓ · تدقيق النطق 1666 كلمة / 0 مخالفة بلا قرار.')
L.append(f'- **السجل:** {len(notes)} ملاحظة في §10 (بانتظار المالك {st["بانتظار المالك"]} · مفتوحة {st["مفتوحة"]} · مغلقة {st["مغلقة"]}) · {len(heads)+46} قراراً (D1–D46 في رأس DECISIONS.md · D47–D180 كتلاً مفصّلة).\n')
L.append('## 2. نتائج المراجعة الختامية (D181 — لقطة ثابتة من الدفعة 135، لا تُحدَّث آلياً)\n')
L.append('| الفحص | الأداة | النتيجة |')
L.append('|---|---|---|')
L.append('| اكتمال الترقية (قاعدة · تطبيق · Quiz · تغطية · أخطاء معلنة) للستين | `tools/upgrade-status.ts` | 60/60 في الأجزاء الثلاثة — صفر نقص |')
L.append('| نواة SD1 داخل الدروس | `tools/plan-status.ts` | 48/48 إسناداً · 123/123 كلمة · إصلاحات النص 2/4 (الباقيان Straßenbahn/Ticket ينتميان إلى وحدتي الفهم 13–14 غير المنتَجتين — ليسا من المرور) |')
L.append('| النسخ الحرفي من SD1/A2 (D108) على نصوص الستين المعروضة | `check.ts` (خارج المستودع — N-104) على 60 درساً | 63 تطابقاً كلها كلمة واحدة أو عبارة ثابتة قصيرة (Wie spät ist es? · Können Sie mir helfen? · Ich bin zu Hause داخل جملة أطول · zum Beispiel) — لا جملة مثال كاملة منسوخة؛ هذه حالات N-113 (الصيغ الثابتة القصيرة) لا خرقاً |')
L.append('| تسرّب كلمات الدروس اللاحقة (N-103) | `check.ts` · يدوياً في الوحدة 12 | صفر في الوحدة 12؛ الوحدات السابقة فُحصت درساً درساً عند ترقيتها |')
L.append('| تسلسل تواريخ القصة (N-096) | عناوين السكربتات | متصل بلا فجوة: u10-d3 الجمعة 3 أبريل → u12-d5 الأربعاء 15 أبريل (13 يوماً متتالية) · قبلها أيام الأسبوع بلا تاريخ (u7-d4 … u10-d2) |')
L.append('| إطار المكالمة (N-037/N-100) | يدوياً | ثغرة واحدة مسجَّلة: **N-119** — حضور يوسف عيد لينا السبت 18 أبريل جسدياً (D178/D179/D180) وهما في بلدين |')
L.append('| الاختبارات | `npx vitest run` | 713/713 — كتلة D180 تثبّت done للستين من ملف الترقية، وa1-u12-d6 ضابط سلبي حقيقي |')
L.append('')
L.append('## 3. ما ينتظر قرارك (11) — مع توصيتي\n')
L.append('| # | الموضوع | ما طُلب منك | توصيتي |')
L.append('|---|---|---|---|')
for nid,stt,ds,body in notes:
    if stt=='بانتظار المالك':
        L.append(f'| {nid} | {cut(title(body),110)} | {cut(req(body),220)} | {REC.get(nid,"—")} |')
L.append('')
L.append('## 4. قرارات مؤقتة اتخذتُها بلا قرارك (تُناقش دفعةً واحدة)\n')
L.append('هذه قرارات نطاق أو منهج نُفّذت لأن المرور كان سيتوقف بدونها؛ كلها مسجَّلة في DECISIONS.md وقابلة للعكس:\n')
for x in [
 '**لا ملف قاعدة جديد حين يغطّي ملفٌ قائم المفهوم** (D174 · D176 · D177 · D179 · D180): denn/deswegen/sondern والظرف أولاً على ars-satzklammer/ars-weil-satz · ‑ieren بلا ge على ars-zeitangaben/ars-perfekt · abfahren/ankommen على ars-trennbare — البديل: ملفات صغيرة مستقلة (أوضح للمتعلم، أثقل للخريطة).',
 '**ars-modal-fix تجمع dürfen وsollen** (D175 — N-116) و**sich fühlen بلا ملف منعكس** (D174 — N-115).',
 '**الصيغ الثابتة القصيرة من SD1/A2 ليست نسخاً** (N-113): Wie spät ist es? · Können Sie mir helfen? · Was ist Ihre Meinung? — والجمل الكاملة تُعاد صياغتها دائماً.',
 '**كل حوار مكالمة فيديو** (N-037/N-100) ولينا 16 سنة في سويسرا ويوسف في برلين — ومنه N-119 المفتوحة.',
 '**عدّ النواة من الملف لا من الوثائق** (N-118): الوثائق زادت واحداً من D168 إلى D177؛ صُحّح من D177 ولم تُصحَّح رؤوس الإصدارات القديمة.',
 '**a1-u12-d6 (توليف) يُعامل محتوىً في اختبار واحد** (D180) بوصفه المثال غير المُرقّى بعد اكتمال المرور — إلى أن تقرر N-004.',
 '**لا محتوى جديد بعد D180** (لا u13 ولا A2) حتى تقرر — §7 محدَّث بهذا.',
]: L.append('- '+x)
L.append('')
L.append(f'## 5. الملاحظات المفتوحة ({st["مفتوحة"]}) — مجمّعة بالباب\n')
L.append('> «مفتوحة» = مسجَّلة وتُحدَّث كل دفعة ولا تحتاج قرارك الآن إلا إن أردت إغلاقها؛ آخر عمود هو ما تطلبه الملاحظة حرفياً (مقتطع).\n')
groups={}
for nid,stt,ds,body in notes:
    if stt=='مفتوحة': groups.setdefault(cat(body),[]).append((nid,ds,body))
for g in sorted(groups,key=lambda k:-len(groups[k])):
    L.append(f'### {g} ({len(groups[g])})\n')
    L.append('| # | الدفعات | الموضوع | المطلوب |')
    L.append('|---|---|---|---|')
    for nid,ds,body in groups[g]:
        dd=ds.strip().split('، '); dsx=dd[0] if len(dd)==1 else f'{dd[0]} … {dd[-1]} ({len(dd)})'
        L.append(f'| {nid} | {dsx} | {cut(title(body),110)} | {cut(req(body),200)} |')
    L.append('')
L.append(f'## 6. الملاحظات المغلقة ({st["مغلقة"]})\n')
L.append('| # | أُغلقت ← | الموضوع |')
L.append('|---|---|---|')
for nid,stt,ds,body in notes:
    if stt.startswith('مغلقة'): L.append(f'| {nid} | {stt.replace("مغلقة ← ","")} | {cut(title(body),120)} |')
L.append('')
L.append(f'## 7. فهرس القرارات D47–D180 ({len(heads)} كتلة — والتفصيل في DECISIONS.md؛ D1–D46 في رأسه)\n')
L.append('| القرار | التاريخ | العنوان |')
L.append('|---|---|---|')
for did,date,t in sorted(heads,key=lambda h:int(h[0][1:])):
    L.append(f'| {did} | {date} | {cut(t,150)} |')
L.append('')
L.append('## 8. ما أقترحه بعد نقاشك (ترتيب تنفيذ)\n')
for x in [
 'قرارات الـ11 المعلّقة (§3) — معظمها تأكيد لما نُفّذ؛ ثلاثة منها تفتح عملاً: N-004 (مرور التوليف — 18 درساً) · N-003 (جمل القصة) · N-115/N-116 (ملفات قاعدة صغيرة).',
 'N-119 (أ أو ب) ثم دفعة صيانة واحدة لكل ما يتطلّب تعديل محتوى مرفوع (N-102/N-103/N-110/N-112 أدوات · N-108/N-109 أمثلة).',
 'بعدها فقط: وحدتا الفهم 13–14 (153 كلمة · D113) ثم A2 (D105) — أو مرور التوليف أولاً إن اخترت N-004.',
]: L.append('1. '+x)
L.append('')
os.makedirs(os.path.dirname(OUT), exist_ok=True)
open(OUT,'w',encoding='utf-8').write('\n'.join(L))
print('ok', OUT, len(L))
