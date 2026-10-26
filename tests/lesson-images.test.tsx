// tests/lesson-images.test.tsx — D298 · N-156/1: الصور الـ12 تصل إلى المتعلم فعلاً
// قبل D298: 12 صورة مولّدة ومربوطة بالدروس (D96/D97) — وصفر صورة في الواجهة.
import { describe, it, expect } from "vitest";
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { IMAGE_FILE_COUNT, imageUrlById, imageUrlForFile } from "../src/lib/image-assets.js";
import { ALL_IMAGES, LESSON_ORDER, lessonImages } from "../src/lesson-packs.js";
import { LessonIllustration, LessonSession } from "../src/components/LessonSession.js";

const CONTENT = join(process.cwd(), "content");
const IMG_EXT = [".jpg", ".jpeg", ".png", ".webp"];
const diskImages = readdirSync(join(CONTENT, "images")).filter((n) => IMG_EXT.some((e) => n.endsWith(e)));

describe("D298 — كل صورة مربوطة تُضمَّن في البناء وتُعرَض في درسها", () => {
  it("عدد الصور المضمَّنة = عدد ملفات الصور في content/images/", () => {
    expect(IMAGE_FILE_COUNT).toBe(diskImages.length);
    expect(IMAGE_FILE_COUNT).toBe(ALL_IMAGES.length);
  });

  it("كل أصل في المانيفست: ملفه موجود وله رابط (بالملف وبالمعرّف) — وكل ملف على القرص مذكور", () => {
    const manifestFiles = new Set(ALL_IMAGES.map((a) => a.file));
    for (const a of ALL_IMAGES) {
      expect(existsSync(join(CONTENT, a.file)), a.id).toBe(true);
      expect(imageUrlForFile(a.file), a.file).toBeTruthy();
      expect(imageUrlById(a.id), a.id).toBeTruthy();
      expect(a.alt.length, a.id).toBeGreaterThan(0); // alt إلزامي (§15)
    }
    for (const n of diskImages) expect(manifestFiles.has(`images/${n}`), n).toBe(true);
  });

  it("كل درس مذكور في usedInLessons درس حقيقي في الفهرس", () => {
    const order = new Set(LESSON_ORDER);
    for (const a of ALL_IMAGES)
      for (const l of a.usedInLessons) expect(order.has(l), `${a.id} → ${l}`).toBe(true);
  });

  it("lessonImages: درس بصورة ← أصولها · درس بصورتين ← اثنان · درس بلا صورة ← []", () => {
    expect(lessonImages("a1-u5-d1").map((a) => a.id)).toEqual(["img-brot"]);
    expect(lessonImages("a1-u7-d4")).toHaveLength(2);
    expect(lessonImages("a1-u1-d1")).toEqual([]);
  });

  it("LessonIllustration: درس بصورة ← img بالـalt والمعرّف · درس بلا صورة ← لا شيء (وبلا بديل)", () => {
    const withImg = renderToStaticMarkup(<LessonIllustration lessonId="a1-u5-d1" />);
    expect(withImg).toContain('data-testid="lesson-illustration"');
    expect(withImg).toContain('data-image-id="img-brot"');
    expect(withImg).toContain("Brot — ein Brotlaib");
    expect(renderToStaticMarkup(<LessonIllustration lessonId="a1-u1-d1" />)).toBe("");
  });

  it("صدفة الحصة تعرض الرسم تحت شريط المحطات", () => {
    const html = renderToStaticMarkup(<LessonSession illustration={<i data-testid="probe">رسم</i>} />);
    expect(html.indexOf('data-testid="session-progress"')).toBeLessThan(html.indexOf('data-testid="probe"'));
  });
});
