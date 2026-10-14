// tools/validate-content.ts — أداة G1 الحتمية (S0.4) | تفحص /content/** وتطبق zod + قوانين الدستور
// التشغيل: npm run validate:content  |  للاختبار: validateContentTree(entries)
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { join, relative, resolve as resolvePath } from "node:path";
import { pathToFileURL } from "node:url";
import {
  Word, Lesson, AudioManifest, ImageManifest, CurriculumReference, ArsenalFile,
  Unit0Deck, CultureCard, CyclicTest, Modelltest, ReadingText, AudioScript, ExamFormat, OfficialWordlist, CurriculumPlan, SCHEMA_VERSION,
} from "../content/schemas/index.js";
import { answerSupported, checkScriptAgainstManifest, type TrackLike } from "./lib/script-audio.js";
import { evidenceIn } from "../content/schemas/answer-key.js";
import { contentTokens, knownStems, unknownTokens } from "./lib/vocab-forms.js";
import { deriveGoetheList, describeEvidence, evidenceFor, indexWordlists, sameLevels } from "./lib/goethe-lists.js";
import { checkPlan } from "./lib/curriculum-plan.js";
import { VOICE_ID, VOICE_ID_FEMALE, PINNED_VOICES, FEMALE_ROLES, WORD_CLIP_MAX_SEC, RMS_WINDOW_DB } from "../src/lib/audio.js";

export interface Issue {
  level: "error" | "warning";
  code: string;
  path: string;
  message: string;
}

export interface ContentEntry {
  path: string; // مسار نسبي عن content/
  data: unknown;
}

export interface ValidationReport {
  errors: Issue[];
  warnings: Issue[];
  fileCount: number;
}

/** نسب بطاقات SRS المستهدفة لكل مستوى (§4) */
export const SRS_TARGETS: Record<string, { production: number; comprehension: number; audio: number }> = {
  A1: { production: 0.4, comprehension: 0.5, audio: 0.1 },
  A2: { production: 0.5, comprehension: 0.4, audio: 0.1 },
  B1: { production: 0.6, comprehension: 0.3, audio: 0.1 },
  B2: { production: 0.7, comprehension: 0.2, audio: 0.1 },
};

const BADGE = "🚧 فوق مستواك الحالي — تحدٍّ اختياري";

function classify(path: string): "word" | "lesson" | "audio-manifest" | "image-manifest" | "curriculum" | "arsenal" | "unit0" | "landeskunde" | "pruefungen" | "modelltest" | "lese" | "audio-script" | "exam-format" | "wordlist" | "plan" | "unknown" {
  const p = path.replace(/\\/g, "/");
  if (p.startsWith("manifests/audio-manifest")) return "audio-manifest";
  if (p.startsWith("manifests/image-manifest")) return "image-manifest";
  if (p.startsWith("arsenal/curriculum-reference")) return "curriculum";
  if (p.startsWith("arsenal/")) return "arsenal";
  if (p.startsWith("words/")) return "word";
  if (p.startsWith("lessons/")) return "lesson";
  if (p.startsWith("unit0/")) return "unit0";
  if (p.startsWith("landeskunde/")) return "landeskunde";
  if (p.startsWith("pruefungen/")) return "pruefungen";
  if (p.startsWith("modelltest/")) return "modelltest";
  if (p.startsWith("lese/")) return "lese";
  if (p.startsWith("audio-scripts/")) return "audio-script";
  if (p.startsWith("exam-formats/")) return "exam-format";
  if (p.startsWith("wordlists/")) return "wordlist";
  if (p.startsWith("plans/")) return "plan";
  return "unknown";
}

export function validateContentTree(entries: ContentEntry[], opts: { contentRoot?: string } = {}): ValidationReport {
  const errors: Issue[] = [];
  const warnings: Issue[] = [];
  const push = (level: "error" | "warning", code: string, path: string, message: string) =>
    (level === "error" ? errors : warnings).push({ level, code, path, message });

  const words = new Map<string, { path: string; word: Word }>();
  const lessons = new Map<string, { path: string; lesson: Lesson }>();
  const entryPaths = new Set(entries.map((e) => e.path)); // فحص الإشارات مستقل عن ترتيب الملفات
  let audioIds: Set<string> | null = null;
  // D103: للفحص المتقاطع بعد قراءة كل الملفات (ترتيب الملفات لا يهم)
  let manifestPath = "";
  let manifestTracks = new Map<string, TrackLike & { file: string }>();
  let characterVoices: Record<string, string> = {};
  const scripts = new Map<string, { path: string; script: AudioScript }>();
  const modelltests: { path: string; test: Modelltest }[] = [];
  const examFormats = new Map<string, ExamFormat>(); // D108: الصيغة الرسمية لكل مستوى
  const wordlists = new Map<string, OfficialWordlist>(); // D110: فهارس قوائم Goethe الرسمية
  const plans: { path: string; plan: CurriculumPlan }[] = []; // D112: خطط التوزيع المنهجية المُلزِمة
  let curriculum: CurriculumReference | null = null;

  for (const entry of entries) {
    const kind = classify(entry.path);
    try {
      switch (kind) {
        case "word": {
          const w = Word.parse(entry.data);
          words.set(w.id, { path: entry.path, word: w });
          break;
        }
        case "lesson": {
          const l = Lesson.parse(entry.data);
          lessons.set(l.id, { path: entry.path, lesson: l });
          break;
        }
        case "audio-manifest": {
          const m = AudioManifest.parse(entry.data);
          audioIds = new Set(m.tracks.map((t) => t.id));
          manifestPath = entry.path;
          manifestTracks = new Map(m.tracks.map((t) => [t.id, t] as const));
          characterVoices = m.characterVoices;
          // القانون 11 + D103: صوت ثابت لكل شخصية — مسار بشخصية صوته = characterVoices[الشخصية] حرفياً
          for (const t of m.tracks) {
            if (!t.characterId) continue;
            const want = m.characterVoices[t.characterId];
            if (want && t.voiceParams.speaker !== want)
              push("error", "e-audio-character-voice", entry.path,
                `صوت ${t.id} = ${t.voiceParams.speaker} والصوت الثابت لـ${t.characterId} = ${want} (القانون 11)`);
          }
          if (m.tracks.some((t) => t.isGuest && t.priority === "P0"))
            push("warning", "w-audio-guest-p0", entry.path, "ضيوف P0 — الضيوف مخصصون لتمارين Hören لا للحوارات السردية (§5‑هـ)");
          // استقرار الصوت (D20 + D98 — مُنفَّذ فعلياً في D100): الصوتان المثبَّتان حصراً — لا تذبذب أبداً
          const pinned: readonly string[] = PINNED_VOICES;
          const femaleRoles: readonly string[] = FEMALE_ROLES;
          for (const t of m.tracks) {
            const speaker = t.voiceParams.speaker;
            if (!pinned.includes(speaker))
              push("error", "e-audio-voice-drift", entry.path,
                `تذبذب صوت في ${t.id}: ${speaker} ليس من الصوتين المثبَّتين (${PINNED_VOICES.join(" / ")})`);
            // D98: الصوت الأنثوي للحوار فقط (character/guest/dialogue) — الكلمات والإعلانات بالصوت الرئيسي (thorsten) دائماً
            else if (speaker === VOICE_ID_FEMALE && !femaleRoles.includes(t.role))
              push("error", "e-audio-voice-role", entry.path,
                `الصوت الأنثوي في دور غير مسموح: ${t.id} (role=${t.role}) — المسموح: ${FEMALE_ROLES.join("/")}`);
          }
          for (const [character, voice] of Object.entries(m.characterVoices)) {
            if (!pinned.includes(voice))
              push("error", "e-audio-voice-drift", entry.path,
                `صوت الشخصية ${character} غير مثبَّت: ${voice} (المسموح: ${PINNED_VOICES.join(" / ")})`);
          }
          // تحليل فعلي للملفات (القانون 6) — يُفعَّل عند تمرير contentRoot (CLI)
          if (opts.contentRoot) {
            for (const t of m.tracks) {
              const f = resolvePath(opts.contentRoot, t.file);
              if (!existsSync(f)) {
                push("error", "e-audio-missing", entry.path, `ملف صوتي مفقود فعلياً: ${t.file}`);
                continue;
              }
              const sha = `sha256:${createHash("sha256").update(readFileSync(f)).digest("hex")}`;
              if (t.hash && t.hash !== sha)
                push("error", "e-audio-hash", entry.path, `بصمة الملف لا تطابق المانيفست: ${t.file}`);
              try {
                const probe = JSON.parse(
                  execFileSync("python3", [join(process.cwd(), "tools/audio_probe.py"), f], { encoding: "utf8" }),
                ) as { durationSec: number; rmsDb: number };
                if (t.role === "word" && probe.durationSec > WORD_CLIP_MAX_SEC)
                  push("error", "e-audio-duration", entry.path,
                    `مقطع كلمة أطول من ${WORD_CLIP_MAX_SEC}s: ${t.file} = ${probe.durationSec.toFixed(2)}s`);
                if (probe.rmsDb > RMS_WINDOW_DB[1] || probe.rmsDb < RMS_WINDOW_DB[0])
                  push("error", "e-audio-rms", entry.path,
                    `RMS خارج النافذة [${RMS_WINDOW_DB[0]}..${RMS_WINDOW_DB[1]}]: ${t.file} = ${probe.rmsDb}dB`);
              } catch {
                push("error", "e-audio-missing", entry.path, `تعذّر تحليل الملف الصوتي: ${t.file}`);
              }
              if (t.role === "word") {
                const wid = t.id.replace(/^word-/, "");
                if (!entryPaths.has(`words/${wid}.json`))
                  push("error", "e-g2-refs", entry.path, `إشارة كلمة غير موجودة: ${wid}`);
              }
            }
          }
          break;
        }
        case "image-manifest": {
          ImageManifest.parse(entry.data);
          break;
        }
        case "curriculum": {
          curriculum = CurriculumReference.parse(entry.data);
          for (const lvl of ["A1", "A2", "B1", "B2"] as const) {
            if (!curriculum.levels[lvl]) push("error", "e-curriculum-level", entry.path, `مستوى ${lvl} مفقود من المرجع المنهجي (D15)`);
          }
          break;
        }
        case "arsenal": {
          const a = ArsenalFile.parse(entry.data);
          if (a.usedInLessons.length === 0)
            push("warning", "w-arsenal-unused", entry.path, "ملف خزانة بلا usedInLessons بعد (§10‑ح)");
          break;
        }
        case "unit0": {
          Unit0Deck.parse(entry.data); // يفرض 4 يوم أول + 8 JIT ومعرّفات فريدة (§9)
          break;
        }
        case "landeskunde": {
          const card = CultureCard.parse(entry.data); // D93: بطاقات الثقافة الأسبوعية
          if (card.facts.length < 2)
            push("error", "e-culture-facts", entry.path, "بطاقة ثقافة بلا حقائق كافية (≥2)");
          break;
        }
        case "modelltest": {
          // D95: الامتحان التجريبي الكامل — المخطط يفرض المهارات الأربع مرة واحدة لكلٍّ (D109)
          modelltests.push({ path: entry.path, test: Modelltest.parse(entry.data) });
          break;
        }
        case "lese": {
          const r = ReadingText.parse(entry.data); // D97: نصوص القراءة
          if (r.questions.length < 2)
            push("error", "e-lese-questions", entry.path, "نص قراءة بلا أسئلة كافية (≥2)");
          break;
        }
        case "pruefungen": {
          const t = CyclicTest.parse(entry.data); // D94: الاختبارات الدورية التراكمية
          if (t.kind === "kurztest" && t.items.length > 12)
            push("error", "e-kurztest-size", entry.path, "Kurztest أطول من 12 عنصراً (15 دقيقة فقط)");
          if (t.kind === "monatspruefung" && t.items.length < 10)
            push("error", "e-monats-size", entry.path, "Monatsprüfung أقصر من 10 عناصر");
          break;
        }
        case "exam-format": {
          const f = ExamFormat.parse(entry.data); // D108: الصيغة الرسمية (وثائق Goethe المجانية)
          if (examFormats.has(f.level)) push("error", "e-exam-format-dup", entry.path, `صيغتان رسميتان للمستوى ${f.level}`);
          examFormats.set(f.level, f);
          break;
        }
        case "wordlist": {
          const l = OfficialWordlist.parse(entry.data); // D110: الكلمات الرئيسية فقط — لا جمل أمثلة
          if (wordlists.has(l.id)) push("error", "e-wordlist-dup", entry.path, `فهرس مكرر: ${l.id}`);
          wordlists.set(l.id, l);
          break;
        }
        case "plan": {
          const pl = CurriculumPlan.parse(entry.data); // D112: البنية (المعرّفات · التتابع · الأحجام · لا تكرار)
          if (plans.some((x) => x.plan.id === pl.id)) push("error", "e-plan-dup", entry.path, `خطة مكررة: ${pl.id}`);
          plans.push({ path: entry.path, plan: pl });
          break;
        }
        case "audio-script": {
          const sc = AudioScript.parse(entry.data); // D103: السكربت الصوتي الموجَّه
          if (scripts.has(sc.id)) push("error", "e-audio-script-dup", entry.path, `معرّف سكربت مكرر: ${sc.id}`);
          scripts.set(sc.id, { path: entry.path, script: sc });
          break;
        }
        default:
          push("warning", "w-unknown-file", entry.path, "ملف غير معروف في شجرة المحتوى");
      }
    } catch (err) {
      push("error", "e-schema", entry.path, `فشل التحقق zod: ${(err as Error).message.split("\n")[0]}`);
    }
  }

  if (!curriculum)
    push("warning", "w-no-curriculum", "arsenal/curriculum-reference.json", "المرجع المنهجي مفقود (D15/§10‑ط)");

  // ——— D103: السكربتات الصوتية ↔ المانيفست ———
  if (audioIds) {
    const scriptLineIds = new Set<string>();
    for (const { path, script } of scripts.values()) {
      for (const l of script.lines) scriptLineIds.add(l.id);
      for (const issue of checkScriptAgainstManifest(script, manifestTracks, characterVoices))
        push("error", issue.code, path, issue.message);
    }
    for (const t of manifestTracks.values())
      if (t.file.startsWith("audio/scripts/") && !scriptLineIds.has(t.id))
        push("error", "e-audio-script-orphan", manifestPath, `مسار سكربت يتيم بلا سطر في أي سكربت: ${t.id}`);
  }

  // ——— D108 + D109: الامتحان التجريبي مقابل الصيغة الرسمية لمستواه ———
  // المدة · عدد الأجزاء · البنود · نوع المهمة · مرات السماع. كان تحذيراً (D108) لأن امتحاننا خالفها
  // معلناً؛ صار مطابقاً بنداً بنداً (D109) فأي انحراف لاحق خطأ يمنع الدمج — لا تراجع صامت.
  for (const { path, test } of modelltests) {
    const f = examFormats.get(test.level);
    if (!f) continue;
    for (const official of f.skills) {
      const ours = test.sections.find((x) => x.skill === official.skill);
      if (!ours) continue; // غياب المهارة يرفضه المخطط
      const diffs: string[] = [];
      if (ours.timeBudgetMin !== official.minutes) diffs.push(`المدة ${ours.timeBudgetMin} والرسمية ${official.minutes} د`);
      if (ours.parts.length !== official.parts.length) diffs.push(`الأجزاء ${ours.parts.length} والرسمية ${official.parts.length}`);
      else
        official.parts.forEach((op, i) => {
          const p = ours.parts[i]!;
          if (op.items && p.items.length !== op.items) diffs.push(`الجزء ${op.part}: ${p.items.length} بنود والرسمي ${op.items}`);
          if (p.taskType !== op.kind) diffs.push(`الجزء ${op.part}: المهمة ${p.taskType} والرسمية ${op.kind}`);
          if (op.playCount && p.playCount !== op.playCount) diffs.push(`الجزء ${op.part}: السماع ${p.playCount ?? "—"}× والرسمي ${op.playCount}×`);
        });
      if (diffs.length)
        push("error", "e-modelltest-format", path, `${official.skill} لا يطابق «${f.exam}»: ${diffs.join(" · ")}`);
    }
  }

  // ——— D103 + D109: لا سؤال استماع بلا صوت حقيقي يحمل جوابه ودليله ———
  for (const { path, test } of modelltests) {
    for (const section of test.sections.filter((s) => s.skill === "hoeren")) {
      for (const part of section.parts) {
        const ref = part.audioScriptRef;
        const entry = ref ? scripts.get(ref) : undefined;
        if (!entry) {
          if (ref) push("error", "e-hoeren-audio", path, `سكربت الاستماع غير موجود: ${ref} (${part.id})`);
          continue; // غياب المرجع نفسه يرفضه zod
        }
        if (!entry.script.usedIn.includes(`${test.id}#${part.id}`))
          push("error", "e-hoeren-audio", path, `السكربت ${ref} لا يعلن استخدامه في ${test.id}#${part.id} (usedIn)`);
        const lines = new Map(entry.script.lines.map((l) => [l.id, l] as const));
        for (const [i, item] of part.items.entries()) {
          const heard: string[] = [];
          for (const a of item.audioRefs ?? []) {
            const l = lines.get(a);
            if (!l) push("error", "e-hoeren-audio", path, `${part.id}#${i + 1}: المقطع ${a} ليس من أسطر ${ref}`);
            else heard.push(l.text);
          }
          if (heard.length === 0) continue;
          const transcript = heard.join(" ");
          // D109: الدليل منطوق حرفياً في مقاطع البند نفسه (لا في مقطع آخر)
          if (item.evidence && !evidenceIn(item.evidence, transcript))
            push("error", "e-hoeren-evidence", path, `${part.id}#${i + 1}: الدليل «${item.evidence}» غير منطوق في مقاطعه`);
          // Richtig/Falsch: الجواب حكم على عبارة لا كلمة تُسمع — الدليل وحده يحسمه
          if (part.taskType === "richtig-falsch") continue;
          const sup = answerSupported(item.a, transcript);
          if (!sup.ok)
            push("error", "e-hoeren-answer", path, `${part.id}#${i + 1}: الجواب «${item.a}» غير مسموع في المقاطع (ينقص: ${sup.missing.join("، ")})`);
        }
      }
    }
  }

  // ——— D109: توازن مفتاح الإجابة — جزء كل أجوبته «Richtig» أو كلها الخيار نفسه يُحل بالتخمين ———
  for (const { path, test } of modelltests) {
    for (const section of test.sections) {
      for (const part of section.parts) {
        if (!["mc3", "richtig-falsch", "a-b"].includes(part.taskType) || part.items.length < 3) continue;
        const keys = part.items.map((it) => (part.taskType === "mc3" ? String(it.choices?.indexOf(it.a)) : it.a));
        if (new Set(keys).size === 1)
          push("warning", "w-modelltest-balance", path, `${part.id}: كل الأجوبة ${part.taskType === "mc3" ? `في الموضع ${Number(keys[0]) + 1}` : `«${keys[0]}»`} — مفتاح يُخمَّن`);
      }
    }
  }

  // ——— D109: قفل المفردات في الامتحان (قانون الجبهة 13) ———
  // كل نص يراه/يسمعه المتعلم (النصوص · الصوت · الأسئلة · الخيارات · نماذج الإجابة) من مفردات مستواه وما قبله
  // فقط؛ التعليمات خارج القفل لأنها ثنائية اللغة. أسماء العلم تُستثنى بإعلانها في properNouns فقط.
  if (words.size > 0) {
    const order: Record<string, number> = { A1: 0, A2: 1, B1: 2, B2: 3 };
    for (const { path, test } of modelltests) {
      const stems = knownStems([...words.values()].map((w) => w.word).filter((w) => order[w.level]! <= order[test.level]!));
      const allow = new Set(test.properNouns.flatMap((n) => contentTokens(n)));
      const seen = new Set<string>();
      for (const section of test.sections) {
        for (const part of section.parts) {
          const shown: string[] = [];
          if (part.audioScriptRef) for (const l of scripts.get(part.audioScriptRef)?.script.lines ?? []) shown.push(l.text);
          for (const t of part.texts ?? []) shown.push(t.title ?? "", t.de);
          for (const it of part.items) {
            shown.push(it.q, ...(it.choices ?? []));
            if (section.skill === "schreiben" || section.skill === "sprechen") shown.push(it.a);
          }
          const text = shown.join("\n");
          for (const t of contentTokens(text)) seen.add(t);
          const unknown = unknownTokens(text, stems, allow);
          if (unknown.length)
            push("error", "e-modelltest-vocab", path, `${part.id}: مفردات غير مدروسة حتى ${test.level} (قانون الجبهة 13): ${unknown.join("، ")}`);
        }
      }
      // اسم علم مُعلن ولا يظهر في الامتحان = استثناء بلا سبب (باب خلفي لتمرير كلمة غير مدروسة)
      for (const n of test.properNouns)
        if (!contentTokens(n).every((t) => seen.has(t)))
          push("warning", "w-modelltest-proper-noun", path, `اسم علم مُعلن لا يظهر في نصوص الامتحان: ${n}`);
    }
  }

  // ——— قوانين الدرس ———
  for (const [id, { path, lesson }] of lessons) {
    // R2: مهمة تواصلية حقيقية (د‑01)
    if (lesson.uebung.communicativeTask.successCriteria.length === 0)
      push("error", "e-comm-task", path, "المهمة التواصلية بلا معايير نجاح (§3/د‑01)");
    // R3: Interleaving من الدرس الثالث؛ وكل المحطات من A2 (§3/ب‑08)
    const stations = lesson.uebung.stations;
    const anyInterleaved = stations.some((s) => s.interleavedWith.length > 0);
    if (lesson.level === "A1" && lesson.day >= 3 && !anyInterleaved)
      push("error", "e-interleaving", path, "درس A1 من اليوم 3 بلا تمرين خلط (Interleaving — §3)");
    if (lesson.level !== "A1" && stations.some((s) => s.interleavedWith.length === 0))
      push("error", "e-interleaving", path, "في A2+ كل محطة يجب أن تخلط بنى سابقة (§3)");
    // R4/R5 (تأكيد مضاعف لما تفرضه المخططات)
    if (lesson.einstieg.pretestItems.length > 2)
      push("error", "e-pretest", path, "أكثر من عنصري تخمين (القانون 21)");
    if (lesson.quiz.variants.length !== 3)
      push("error", "e-quiz-variants", path, "عدد نسخ Quiz ≠ 3 (§3)");
    // R6: منطقة التحدي (§12‑ب)
    if (lesson.challengeZone) {
      if (lesson.challengeZone.badge !== BADGE)
        push("error", "e-challenge-badge", path, "وسم منطقة التحدي غير مطابق (§12‑ب)");
      const totalItems = stations.reduce((n, s) => n + s.items.length, 0) + 30;
      if (lesson.challengeZone.items.length > Math.max(1, Math.ceil(totalItems * 0.05)))
        push("error", "e-challenge-share", path, "منطقة التحدي تتجاوز 5% (§12‑ب)");
    }
    // R7: روابط G2 موثقة في كل درس (قانون 5/G2)
    const refs = lesson.gReferences;
    if (refs.duden.length + refs.wiktionary.length + refs.goethe.length === 0)
      push("error", "e-g2-refs", path, "الدرس بلا رابط مرجعي موثّق (G2 — القانون 5)");
    // R9: اكتمال الصوت مقابل المانيفست
    if (audioIds) {
      for (const ref of lesson.audioManifestRefs)
        if (!audioIds.has(ref)) push("error", "e-audio-missing", path, `مرجع صوتي مفقود من المانيفست: ${ref}`);
    }
    // R8: فهرس الاستخدام العكسي (§10‑ح) — الكلمات المعلنة في الدرس
    for (const wordId of [...lesson.praesentation.wordIds, ...lesson.zusammenfassung.srsBundleWordIds]) {
      const w = words.get(wordId);
      if (!w) {
        if (words.size > 0) // لا ننبه إن لم تُحمَّل كلمات أصلاً
          push("error", "e-word-missing", path, `كلمة معلنة غير موجودة: ${wordId}`);
        continue;
      }
      if (!w.word.usedInLessons.includes(id))
        push("error", "e-reverse-index", w.path, `usedInLessons لا يضم الدرس ${id} المستهلك (§10‑ح)`);
    }
    // R12: مطابقة المنهج المرجعي
    if (!lesson.curriculumRef.netzwerkChapter.trim())
      push("error", "e-curriculum-ref", path, "درس بلا فصل Netzwerk مطابق (D15/§10‑ط)");
  }

  // ——— قوانين الكلمة ———
  const perLevelCards: Record<string, { production: number; comprehension: number; audio: number; total: number }> = {};
  for (const [wordId, { path, word }] of words) {
    // R10: بطاقة الجنس إلزامية لكل اسم ذي جنس (§4)
    if (word.gender !== "none") {
      if (!word.article) push("error", "e-article", path, `كلمة ${wordId} ذات جنس بلا article كامل (§4/§15‑هـ)`);
      else if (!word.article.startsWith(word.gender))
        push("error", "e-article-gender", path, `article «${word.article}» لا يطابق gender «${word.gender}»`);
      if (!word.srsCardTypes.includes("gender"))
        push("error", "e-gender-card", path, `كلمة ${wordId} ذات جنس بلا بطاقة gender (§4)`);
    }
    if (!word.srsCardTypes.includes("production") && !word.srsCardTypes.includes("comprehension") && !word.chunk)
      push("error", "e-card-types", path, `كلمة ${wordId} لا تحمل بطاقة إنتاج ولا فهم (§4)`);
    // R8 الاتجاه الثاني: usedInLessons يجب أن تشير لدروس موجودة
    for (const lid of word.usedInLessons)
      if (lessons.size > 0 && !lessons.has(lid))
        push("error", "e-reverse-index", path, `usedInLessons تشير لدرس غير موجود: ${lid}`);
    // R10b: مراقبة النسب لكل مستوى (تنبيه فقط — التنفيذ في مولّد البطاقات)
    const bucket = (perLevelCards[word.level] ??= { production: 0, comprehension: 0, audio: 0, total: 0 });
    for (const t of word.srsCardTypes) {
      if (t === "production") bucket.production++;
      else if (t === "comprehension") bucket.comprehension++;
      else if (t === "audio") bucket.audio++;
    }
    bucket.total += Math.max(1, word.srsCardTypes.length);
  }
  // ——— D110: goetheList دليلٌ لا رأي — تساوي بالضبط ما تثبته القوائم الرسمية ———
  // (مُعطَّل فقط حين لا فهارس في الشجرة — أشجار الاختبار الجزئية؛ المحتوى الحقيقي يحمل الثلاثة
  // ويفرض اختبارٌ وجودها). وسمٌ بلا دليل خطأ، ودليلٌ بلا وسم خطأ: المولِّد يملؤها آلياً.
  if (wordlists.size > 0) {
    const ixs = indexWordlists([...wordlists.values()]);
    for (const [wordId, { path, word }] of words) {
      const derived = deriveGoetheList(word, ixs);
      if (!sameLevels(word.goetheList, derived))
        push("error", "e-goethe-list", path,
          `goetheList لـ${wordId} = ${JSON.stringify(word.goetheList)} والدليل = ${JSON.stringify(derived)} — ${describeEvidence(evidenceFor(word, ixs))} (أصلحها: npx tsx tools/goethe-audit.ts --apply)`);
    }
  }

  // ——— D112: خطة التوزيع المُلزِمة — كل كلمة رسمية غير مُعلَّمة مخططة · الدرس المنتَج يعلّم كلماته ———
  // (تحتاج الفهارس — أشجار الاختبار الجزئية بلا فهارس ولا خطط)
  if (wordlists.size > 0) {
    const ctx = {
      words: [...words.values()].map((w) => w.word),
      lessons: [...lessons.values()].map((l) => l.lesson),
      lists: [...wordlists.values()],
      paths: new Set(entries.map((e) => e.path)), // D113: ملفات textFixes موجودة
    };
    for (const { path, plan } of plans)
      for (const i of checkPlan(plan, ctx)) push(i.level, i.code, path, i.message);
  }

  for (const [level, b] of Object.entries(perLevelCards)) {
    const target = SRS_TARGETS[level];
    if (!target || b.total === 0) continue;
    const p = b.production / b.total, c = b.comprehension / b.total, a = b.audio / b.total;
    const off = Math.abs(p - target.production) + Math.abs(c - target.comprehension) + Math.abs(a - target.audio);
    if (off > 0.35)
      push("warning", "w-srs-ratio", `words (${level})`, `نسب أنواع البطاقات تبتعد عن مستهدف §4 (${Math.round(p * 100)}/${Math.round(c * 100)}/${Math.round(a * 100)})`);
  }

  // توافق الإصدار
  for (const entry of entries) {
    const v = (entry.data as { schemaVersion?: string } | null)?.schemaVersion;
    if (v && v.split(".")[0] !== SCHEMA_VERSION.split(".")[0])
      push("warning", "w-schema-major", entry.path, `schemaVersion ${v} يختلف في الإصدار الرئيسي عن ${SCHEMA_VERSION}`);
  }

  return { errors, warnings, fileCount: entries.length };
}

/** قراءة شجرة المحتوى من القرص */
export function loadContentDir(root: string): ContentEntry[] {
  const entries: ContentEntry[] = [];
  const walk = (dir: string) => {
    for (const name of readdirSync(dir)) {
      const full = join(dir, name);
      if (statSync(full).isDirectory()) walk(full);
      else if (name.endsWith(".json")) {
        const rel = relative(root, full).replace(/\\/g, "/");
        try {
          entries.push({ path: rel, data: JSON.parse(readFileSync(full, "utf8")) });
        } catch (err) {
          entries.push({ path: rel, data: { __parseError: String(err) } });
        }
      }
    }
  };
  walk(root);
  return entries;
}

function main() {
  const root = join(process.cwd(), "content");
  const report = validateContentDirSafe(root);
  for (const i of [...report.errors, ...report.warnings])
    console.log(`[${i.level === "error" ? "ERROR" : "WARN "}] ${i.code} @ ${i.path}: ${i.message}`);
  console.log(`\nfiles: ${report.fileCount} | errors: ${report.errors.length} | warnings: ${report.warnings.length}`);
  if (report.errors.length > 0) process.exit(1);
}

function validateContentDirSafe(root: string): ValidationReport {
  try {
    return validateContentTree(loadContentDir(root), { contentRoot: root });
  } catch (err) {
    return { errors: [{ level: "error", code: "e-io", path: root, message: String(err) }], warnings: [], fileCount: 0 };
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
