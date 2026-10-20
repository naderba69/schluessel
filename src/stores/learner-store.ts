// src/stores/learner-store.ts — حفظ تقدّم المتعلم (D117): IndexedDB على جهازه عبر Dexie — بلا خادم (تكلفة صفر)
// القواعد: (1) لا يُحفظ ما لا يطابق المخطط (parse قبل كل كتابة) (2) الكتابات بترتيب إطلاقها — الأخيرة هي الباقية:
//   ضمان من مواصفة IndexedDB نفسها (معاملات rw ذات نطاق متداخل تُنفَّذ بترتيب إنشائها) — مُثبَت باختبار؛ لا طابور يدوي فوقه
// (3) بيانات تالفة لا تُمحى بصمت أبداً: التحميل يرمي، والواجهة تعرض «نزّل نسخة خام» قبل أي «ابدأ من جديد».
import { LearnerState as LearnerStateSchema, type LearnerState } from "../../content/schemas/index.js";
import { loadLearnerState, openDb, saveLearnerState, type YusufDB } from "./db.js";

/** اسم قاعدة التطبيق في المتصفح (قاعدة الاختبارات الافتراضية في db.ts منفصلة عنها) */
export const APP_DB_NAME = "schluessel";

export interface LearnerStore {
  /** false = لا تخزين محلي في هذا المتصفح: التقدّم يبقى في هذه الجلسة فقط (وتقول الواجهة ذلك صراحة) */
  readonly persistent: boolean;
  load(): Promise<LearnerState | null>;
  save(state: LearnerState): Promise<void>;
  /** نسخة خام بلا فحص — لإنقاذ بيانات تالفة قبل مسحها */
  rawDump(): Promise<string>;
  clear(): Promise<void>;
}

export function dexieLearnerStore(db: YusufDB): LearnerStore {
  return {
    persistent: true,
    load: () => loadLearnerState(db),
    save(state) {
      let valid: LearnerState;
      try {
        valid = LearnerStateSchema.parse(state);
      } catch (e) {
        return Promise.reject(e instanceof Error ? e : new Error(String(e)));
      }
      return saveLearnerState(db, valid);
    },
    async rawDump() {
      const tables: Record<string, unknown[]> = {};
      for (const t of db.tables) tables[t.name] = await t.toArray();
      return JSON.stringify({ db: db.name, dumpedAt: new Date().toISOString(), tables }, null, 2);
    },
    async clear() {
      await db.transaction("rw", db.tables, async () => {
        for (const t of db.tables) await t.clear();
      });
    },
  };
}

export function memoryLearnerStore(): LearnerStore {
  let saved: LearnerState | null = null;
  return {
    persistent: false,
    load: async () => saved,
    save: async (state) => {
      saved = LearnerStateSchema.parse(state);
    },
    rawDump: async () => JSON.stringify({ memory: saved }, null, 2),
    clear: async () => {
      saved = null;
    },
  };
}

/** متجر المتصفح: IndexedDB إن وُجد (كل المتصفحات الحديثة) — وإلا ذاكرة الجلسة مع إعلان صريح */
export function browserLearnerStore(env: { indexedDB?: unknown } = globalThis as { indexedDB?: unknown }): LearnerStore {
  return env.indexedDB ? dexieLearnerStore(openDb(APP_DB_NAME)) : memoryLearnerStore();
}
