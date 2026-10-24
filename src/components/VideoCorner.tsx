// src/components/VideoCorner.tsx — ركن الفيديو §2.12 (D308 · N-156/11)
// أوفلاين-أولاً: الرابط المتحقق وحده قابل للضغط — وما عداه «قادم» بلا رابط.
// والإنترنت والبديل مذكوران صراحة دائماً (الصدق قبل الاكتمال — §34).
import { useState } from "react";
import type { VideoShelf } from "../../content/schemas/index.js";
import { ALL_VIDEO } from "../lesson-packs.js";
import { dayIndexOfYear } from "../lib/coach-engine.js";
import {
  VIDEO_COMING_AR,
  VIDEO_CORNER_TITLE_AR,
  VIDEO_INTERNET_NOTE_AR,
  VIDEO_OFFLINE_AR,
  VIDEO_OF_DAY_TITLE_AR,
  comingVideos,
  verifiedVideos,
  videoOfDay,
} from "../lib/video-corner.js";

export function VideoCorner({ shelf }: { shelf?: VideoShelf }) {
  const s = shelf ?? ALL_VIDEO.find((v) => v.level === "A1") ?? null;
  const [revealed, setRevealed] = useState(false);
  const verified = s ? verifiedVideos(s) : [];
  const coming = s ? comingVideos(s) : [];
  const today = videoOfDay(dayIndexOfYear(), verified);

  return (
    <section data-testid="video-corner">
      <h2>{VIDEO_CORNER_TITLE_AR}</h2>
      {today && today.url && (
        <div data-testid="video-of-day">
          <p>
            {VIDEO_OF_DAY_TITLE_AR} ({today.minutes} دقائق — {today.source}):{" "}
            <span dir="ltr">«{today.titleDe}»</span> — {today.titleAr}
          </p>
          <a data-testid="video-day-link" href={today.url} target="_blank" rel="noreferrer">
            شاهد الفيديو ▶
          </a>
          <p data-testid="video-fix-q">سؤال التثبيت: {today.fixation.q}</p>
          {!revealed ? (
            <button data-testid="video-fix-reveal" onClick={() => setRevealed(true)}>
              أظهر التوجيه
            </button>
          ) : (
            <p data-testid="video-fix-answer">{today.fixation.a}</p>
          )}
        </div>
      )}
      {coming.length > 0 && (
        <ul data-testid="video-coming">
          {coming.map((e) => (
            <li key={e.id} data-video-id={e.id}>
              <span dir="ltr">«{e.titleDe}»</span> — {e.titleAr} ({e.source}) · {VIDEO_COMING_AR}
            </li>
          ))}
        </ul>
      )}
      <p data-testid="video-internet-note">{VIDEO_INTERNET_NOTE_AR}</p>
      <p data-testid="video-offline">{VIDEO_OFFLINE_AR}</p>
    </section>
  );
}
