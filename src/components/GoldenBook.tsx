// src/components/GoldenBook.tsx — دفتر الأخطاء الذهبية (N-150 · D250 — §2.7): كل خطأ + لماذا أخطأه الناطق بالعربية + تمرينه
// بلا لوم (D23): الأخطاء كنز — والمحلولة تبقى ظاهرة (تعود إن تكررت)
import type { ErrorEntry } from "../../content/schemas/index.js";
import { KIND_LABELS_AR, buildErrorRound } from "../lib/errors-engine.js";

function BookEntry({ entry }: { entry: ErrorEntry }) {
  const lesson = entry.payload.source.split("/")[0];
  return (
    <li data-testid="golden-entry" data-error-id={entry.id} data-kind={entry.kind}>
      <p dir="auto">
        <span data-testid="golden-wrong">✗ {entry.payload.wrong}</span> →{" "}
        <span data-testid="golden-correct">✓ {entry.payload.correct}</span>
      </p>
      <p data-testid="golden-why">{entry.payload.explanation}</p>
      <p data-testid="golden-meta">
        {KIND_LABELS_AR[entry.kind]}
        {entry.occurrences > 1 ? ` · تكرر ${entry.occurrences} مرات` : ""}
        {` · ${lesson} · ${entry.createdAt.slice(0, 10)}`}
        {entry.resolved ? " · ✓ محلول" : ""}
      </p>
    </li>
  );
}

export function GoldenBook({ errors }: { errors: readonly ErrorEntry[] }) {
  const open = buildErrorRound([...errors]);
  const solved = [...errors]
    .filter((e) => e.resolved)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return (
    <section data-testid="golden-book">
      <h2>
        📓 دفتر أخطائك الذهبية ({open.length}
        {solved.length > 0 ? ` · ${solved.length} محلولة` : ""})
      </h2>
      {errors.length === 0 ? (
        <p data-testid="golden-empty">
          دفترك فارغ — إما أنك دقيق أو لم تبدأ الحصص بعد. الأخطاء هنا كنز لا عيب 💛
        </p>
      ) : (
        <>
          {open.length > 0 ? (
            <ul data-testid="golden-open">
              {open.map((e) => (
                <BookEntry key={e.id} entry={e} />
              ))}
            </ul>
          ) : (
            <p data-testid="golden-all-solved">كل أخطائك محلولة ✓ — حافظ على الدفء!</p>
          )}
          {solved.length > 0 && (
            <details data-testid="golden-solved">
              <summary>✓ محلولة ({solved.length}) — تعود للجولة إن تكررت</summary>
              <ul>
                {solved.map((e) => (
                  <BookEntry key={e.id} entry={e} />
                ))}
              </ul>
            </details>
          )}
        </>
      )}
    </section>
  );
}
