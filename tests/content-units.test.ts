// content-units.test.ts — المحتوى حيّ: كل درس وكلماته تعمل على المُشغِّل (D45)
import { describe, it, expect } from "vitest";
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { ALL_LESSONS, ALL_WORDS, ALL_LANDESKUNDE, ALL_PRUEFUNGEN, ALL_MODELLTESTS, ALL_IMAGES, ALL_LESETEXTS, LEVEL_ORDER, wordsForLesson, runtimeWordsForLesson, firstLesson, firstLessonWords } from "../src/lesson-packs.js";
import { slugify } from "../tools/lib/word-entry.js";
import { planLessonStations, fullForm } from "../src/lib/lesson-runner.js";

describe("سجل المحتوى — الوحدة 1 كاملة + بداية الوحدة 2", () => {
  it("الدروس مرتّبة والسجل مطابق للملفات", () => {
    expect(ALL_LESSONS.map((l) => l.id)).toEqual([
      "a1-u1-d1", "a1-u1-d2", "a1-u1-d3", "a1-u1-d4", "a1-u1-d5", "a1-u1-d6", "a1-u2-d1", "a1-u2-d2", "a1-u2-d3", "a1-u2-d4", "a1-u2-d5", "a1-u2-d6", "a1-u3-d1", "a1-u3-d2", "a1-u3-d3", "a1-u3-d4", "a1-u3-d5", "a1-u3-d6", "a1-u4-d1", "a1-u4-d2", "a1-u4-d3", "a1-u4-d4", "a1-u4-d5", "a1-u4-d6", "a1-u5-d1", "a1-u5-d2", "a1-u5-d3", "a1-u5-d4", "a1-u5-d5", "a1-u5-d6", "a1-u6-d1", "a1-u6-d2", "a1-u6-d3", "a1-u6-d4", "a1-u6-d5", "a1-u6-d6", "a1-u7-d1", "a1-u7-d2", "a1-u7-d3", "a1-u7-d4", "a1-u7-d5", "a1-u7-d6", "a1-u8-d1", "a1-u8-d2", "a1-u8-d3", "a1-u8-d4", "a1-u8-d5", "a1-u8-d6", "a1-u9-d1", "a1-u9-d2", "a1-u9-d3", "a1-u9-d4", "a1-u9-d5", "a1-u9-d6", "a1-u10-d1", "a1-u10-d2", "a1-u10-d3", "a1-u10-d4", "a1-u10-d5", "a1-u10-d6", "a1-u11-d1", "a1-u11-d2", "a1-u11-d3", "a1-u11-d4", "a1-u11-d5", "a1-u11-d6", "a1-u12-d1", "a1-u12-d2", "a1-u12-d3", "a1-u12-d4", "a1-u12-d5", "a1-u12-d6",
      "a1-u13-d1", "a1-u13-d2", "a1-u13-d3", "a1-u13-d4", "a1-u13-d5", // D204 · D205 · D206 · D207 · D208: تكملة SD1 للفهم (D113) — الوحدتان 13–14 بين 12 وأسبوع الامتحان 15
      "a1-u15-d1", "a1-u15-d2", "a1-u15-d3", "a1-u15-d4", "a1-u15-d5", "a1-u15-d6", // D113: أسبوع الامتحان 13 → 17 (D112) → 15 (13–14 تكملة للفهم)
      "a2-u1-d1",
    ]);
    expect(ALL_LESSONS.map((l) => [l.unit, l.day])).toEqual([
      [1, 1], [1, 2], [1, 3], [1, 4], [1, 5], [1, 6], [2, 1], [2, 2], [2, 3], [2, 4], [2, 5], [2, 6], [3, 1], [3, 2], [3, 3], [3, 4], [3, 5], [3, 6], [4, 1], [4, 2], [4, 3], [4, 4], [4, 5], [4, 6], [5, 1], [5, 2], [5, 3], [5, 4], [5, 5], [5, 6], [6, 1], [6, 2], [6, 3], [6, 4], [6, 5], [6, 6], [7, 1], [7, 2], [7, 3], [7, 4], [7, 5], [7, 6], [8, 1], [8, 2], [8, 3], [8, 4], [8, 5], [8, 6], [9, 1], [9, 2], [9, 3], [9, 4], [9, 5], [9, 6], [10, 1], [10, 2], [10, 3], [10, 4], [10, 5], [10, 6], [11, 1], [11, 2], [11, 3], [11, 4], [11, 5], [11, 6], [12, 1], [12, 2], [12, 3], [12, 4], [12, 5], [12, 6],
      [13, 1], [13, 2], [13, 3], [13, 4], [13, 5],
      [15, 1], [15, 2], [15, 3], [15, 4], [15, 5], [15, 6],
      [1, 1],
    ]);
    expect(ALL_WORDS.length).toBe(readdirSync(join(__dirname, "..", "content", "words")).filter((f) => f.endsWith(".json")).length); // ثابت مشتقّ (D188): السجل = ملفات القرص · كان 884 + + zum Beispiel · der Satz · glauben (نواة a1-u12-d4 — D179) + der Blick · das Internet · die Information (نواة a1-u12-d2 — D177) + das Ergebnis (نواة a1-u11-d5 — D175) + fehlen (نواة a1-u11-d2 — D172) + der Teil · tun · weh tun (نواة a1-u11-d1 — D171) + normal · der Job · verdienen (نواة a1-u10-d5 — D170) + der Anfang · der Verein (نواة a1-u10-d4 — D169) + früher · gewinnen (نواة a1-u10-d3 — D168) + lieb · der Moment · enden (نواة a1-u10-d2 — D167) + andere · weiter · halten · die Polizei · die Stelle (نواة a1-u9-d5 — D165) + auf sein · zu sein (نواة a1-u9-d4 — D164) + bitten · erklären · die Hilfe (نواة a1-u9-d3 — D163) + kriegen (نواة a1-u8-d3 — D158) + beste · circa (نواة a1-u8-d2 — D157) + dieser · gefallen (نواة a1-u8-d1 — D156) + gleich · ab · Achtung (نواة a1-u7-d4 — D154) + die Hausaufgabe · nie · einfach (نواة a1-u7-d3 — D153) + der Film · mehr · wandern (نواة a1-u7-d2 — D152) + die Firma · immer · die meisten (نواة a1-u7-d1 — D151) + darauf (مرساة ars-da-komposita في a1-u6-d5 — D150) + da · daneben · weg sein (نواة a1-u6-d4 — D149) + jeder · an sein · aus sein (نواة a1-u6-d3 — D148) + hoch · allein · der Raum (نواة a1-u6-d2 — D147) + breit (نواة a1-u6-d1 — D146) + nichts · wenig (نواة a1-u5-d4 — D144) + was für ein (نواة a1-u5-d3 — D143) + bar · bekommen · die Bitte (نواة a1-u5-d2 — D142) + die Lebensmittel · der Apfel · mögen (نواة a1-u5-d1 — D141) + das Glück · glücklich (نواة a1-u4-d5) · ihr (ملكيتها — N-063) (D140) + bekannt · die Bekannte · tot (نواة a1-u4-d4 — D139) + beide · die Lösung (نواة a1-u4-d3 — D138) + lieben (نواة a1-u4-d2 — D137) + Großeltern · Junge · Opa (نواة a1-u4-d1 — D136) + einmal · später · die Aufgabe (D135) + fertig · regnen · scheinen (D134) + nächste · geschlossen · geöffnet (D133) + Dank · leicht · Restaurant (D132) + Oma · Essen (D131) + schlecht · also · Gruppe (D130) + lang · lange (D128) + Text · Fehler · bedeuten · Lehrerin (D127) + Mensch · Ort · Leben (D126) + international (D125) + neu · wie viel (D116) + heute · jetzt · schwer (D119) + Anmeldung · Partner · Partnerin · Herr (D120) + Alter · Kurs · Klasse (D121) + Ende · wissen · Wort · oft · bisschen · Schüler · Schülerin · Student · Studentin (D123)
  });

  it("d6 توليف: نوع integration + معركة بعتبة 75% + جسيما التوليف", () => {
    const d6 = ALL_LESSONS.find((l) => l.id === "a1-u1-d6")!;
    expect(d6.kind).toBe("integration");
    expect(d6.praesentation.wordIds).toEqual(["alles-klar", "bis-morgen"]);
    for (const v of d6.quiz.variants) expect(v.passingScore).toBe(0.75);
  });

  it("كل درس: كلماته مكتملة + مصائده الثلاثة + حزمة SRS + مراجع صوت مطابقة", () => {
    for (const l of ALL_LESSONS) {
      const words = wordsForLesson(l);
      expect(words.length).toBeGreaterThanOrEqual(2); // d6 توليف: جسيمان فقط (بلا جديد تقريباً)
      expect(l.zusammenfassung.warningCards).toHaveLength(3);
      expect(l.zusammenfassung.srsBundleWordIds).toEqual(l.praesentation.wordIds);
      expect(l.audioManifestRefs).toHaveLength(l.praesentation.wordIds.length);
      for (const w of words) expect(w.usedInLessons).toContain(l.id);
    }
  });

  it("كل درس يمشي على مُشغِّل الحصة (planLessonStations) بكل محطاته", () => {
    for (const l of ALL_LESSONS) {
      const plan = planLessonStations(l, runtimeWordsForLesson(l));
      expect(plan.lessonId).toBe(l.id);
      expect(plan.recall.length).toBeGreaterThan(0);
      expect(plan.learn.length).toBe(l.praesentation.wordIds.length);
      expect(plan.practice.stations.length).toBeGreaterThanOrEqual(3);
      expect(plan.close.warningCards).toHaveLength(3);
    }
  });

  it("التوافق مع الاستخدام القديم: firstLesson هو d1 بكل كلماته (ثابت مشتقّ — D188)", () => {
    expect(firstLesson.id).toBe("a1-u1-d1");
    expect(firstLessonWords.map((w) => w.id)).toEqual(firstLesson.praesentation.wordIds);
    expect(firstLessonWords.map((w) => w.id)).toEqual(expect.arrayContaining(["neu", "wie-viel", "gut"])); // نواة D113 + gut (D188)
    expect(() => wordsForLesson({ ...firstLesson, praesentation: { ...firstLesson.praesentation, wordIds: ["xx"] } })).toThrow(/مفقودة/);
  });
});

describe("مصائد الوحدة 1 — انعكاسات عربية معلَّلة", () => {
  it("كل مصيدة: خطأ شائع + سبب للمتحدث العربي + تمرين تطبيق", () => {
    for (const l of ALL_LESSONS) {
      for (const t of l.zusammenfassung.warningCards) {
        expect(t.commonError.de).toContain("~~");
        expect(t.whyArabicSpeakerFails).toContain("10");
        expect(t.correct.de).toBeTruthy();
        expect(String(t.exercise.q).trim()).not.toBe("");
        expect(String(t.exercise.a).trim()).not.toBe("");
      }
    }
  });

  it("د2 (D119): أداة البلد بعد aus · اللغة بلا أداة · سؤال بالفعل أولاً — ود3 (D120): تصريف · wie لا was · حروف كبيرة", () => {
    const d2 = ALL_LESSONS.find((l) => l.id === "a1-u1-d2")!;
    const d3 = ALL_LESSONS.find((l) => l.id === "a1-u1-d3")!;
    expect(d2.zusammenfassung.warningCards[0]!.commonError.de).toContain("aus Türkei");
    expect(d2.zusammenfassung.warningCards[0]!.correct.de).toBe("Ich komme aus der Türkei.");
    expect(d2.zusammenfassung.warningCards[1]!.commonError.de).toContain("das Arabisch");
    expect(d2.zusammenfassung.warningCards[1]!.correct.de).toBe("Ich spreche Arabisch.");
    expect(d2.zusammenfassung.warningCards[2]!.correct.de).toBe("Sind Sie aus Deutschland?");
    expect(d3.zusammenfassung.warningCards[0]!.correct.de).toContain("buchstabiere");
    expect(d3.zusammenfassung.warningCards[1]!.commonError.de).toContain("Was ist Ihr Name");
    expect(d3.zusammenfassung.warningCards[1]!.correct.de).toBe("Wie ist Ihr Name?");
    expect(d3.zusammenfassung.warningCards[2]!.correct.de).toBe("der Name");
  });

  it("د4 (D121): العمر بـsein لا haben · جنس Handy لا يتبع ترجمته · الملكية تتبع جنس الكلمة — والاستدعاء من دروس سابقة", () => {
    const d4 = ALL_LESSONS.find((l) => l.id === "a1-u1-d4")!;
    const [age, gender, poss] = d4.zusammenfassung.warningCards;
    expect(age!.commonError.de).toContain("Ich habe neunzehn Jahre");
    expect(age!.correct.de).toBe("Ich bin neunzehn Jahre alt.");
    expect(age!.whyArabicSpeakerFails).toContain("j'ai");
    expect(gender!.commonError.de).toContain("Der Handy");
    expect(gender!.correct.de).toBe("Das Handy ist neu.");
    expect(poss!.correct.de).toBe("Meine Telefonnummer");
    const earlier = new Set(ALL_LESSONS.filter((l) => l.unit === 1 && l.day < 4).flatMap((l) => l.praesentation.wordIds));
    expect(d4.warmup.cardIds.filter((id) => !earlier.has(id))).toEqual([]);
  });

  it("د5 (D123): السؤال بلا فعل («مَن هذا؟») · «من أين» كلمة بكلمة · kennen لا wissen لشخص — والاستدعاء من دروس سابقة", () => {
    const d5 = ALL_LESSONS.find((l) => l.id === "a1-u1-d5")!;
    const [verb, woher, kennen] = d5.zusammenfassung.warningCards;
    expect(verb!.commonError.de).toContain("Wer das?");
    expect(verb!.correct.de).toBe("Wer ist das?");
    expect(verb!.whyArabicSpeakerFails).toContain("حذف ist");
    expect(woher!.commonError.de).toContain("Aus wo");
    expect(woher!.correct.de).toBe("Woher kommst du?");
    expect(kennen!.commonError.de).toContain("Ich weiß Lena");
    expect(kennen!.correct.de).toBe("Ich kenne Lena.");
    expect(kennen!.whyArabicSpeakerFails).toContain("connaître");
    // كان «Was ist das?» عن شخص بتعليل لا يصح: العربية نفسها تفرّق «مَن» و«ما» — فلا تداخل يُعلَّل به
    expect(d5.zusammenfassung.warningCards.some((c) => c.commonError.de.includes("Was ist das"))).toBe(false);
    const earlier = new Set(ALL_LESSONS.filter((l) => l.unit === 1 && l.day < 5).flatMap((l) => l.praesentation.wordIds));
    expect(d5.warmup.cardIds.filter((id) => !earlier.has(id))).toEqual([]);
  });

  it("u2-d1 (D125): جملة المكان بلا فعل («أين يوسف؟») · الظرف أولاً ثم الفاعل (V2) · die Niederlande جمع — والاستدعاء من دروس سابقة", () => {
    const u = ALL_LESSONS.find((l) => l.id === "a1-u2-d1")!;
    const [verb, v2, plural] = u.zusammenfassung.warningCards;
    expect(verb!.commonError.de).toContain("Wo Yusuf?");
    expect(verb!.correct.de).toBe("Wo ist Yusuf?");
    expect(verb!.whyArabicSpeakerFails).toContain("حذف ist");
    expect(v2!.commonError.de).toContain("Hier ich wohne");
    expect(v2!.correct.de).toBe("Hier wohne ich.");
    expect(v2!.whyArabicSpeakerFails).toContain("حرية الظرف مقابل V2");
    expect(plural!.correct.de).toBe("Die Niederlande sind in Europa.");
    // كان «وين» تُستعمل للمنشأ في العامية — تعليل لا يصح: العاميات نفسها تفرّق (وين = wo · منين = woher)
    expect(u.zusammenfassung.warningCards.some((c) => c.whyArabicSpeakerFails.includes("وين"))).toBe(false);
    const earlier = new Set(ALL_LESSONS.filter((l) => l.unit === 1).flatMap((l) => l.praesentation.wordIds));
    expect(u.warmup.cardIds.filter((id) => !earlier.has(id))).toEqual([]);
  });

  it("u2-d2 (D126): حذف ein (التنوين وحده) · الجنس العربي ليس دليلاً (die Leben) · in einer Wohnung — والاستدعاء من دروس سابقة", () => {
    const u = ALL_LESSONS.find((l) => l.id === "a1-u2-d2")!;
    const [ein, genus, dativ] = u.zusammenfassung.warningCards;
    expect(ein!.commonError.de).toContain("Berlin ist Stadt");
    expect(ein!.correct.de).toBe("Berlin ist eine Stadt.");
    expect(ein!.whyArabicSpeakerFails).toContain("حذف ein");
    expect(genus!.commonError.de).toContain("Die Leben");
    expect(genus!.correct.de).toBe("Das Leben in Berlin ist neu.");
    expect(dativ!.correct.de).toBe("Ich wohne in einer Wohnung.");
    // كان «spreche über Deutsch» بتعليل لا يصح: العربية نفسها تفرّق «أتحدث العربية» و«أتحدث عن العربية» ·
    // و«das Muttersprache» تعليلها جنس المركّبات — قاعدة a1-u6-d2 (لا تُسحب قبل وقتها)
    expect(u.zusammenfassung.warningCards.some((c) => /über|Muttersprache/.test(c.commonError.de))).toBe(false);
    // N-018: لا كلمة من دروس سابقة تُعرض «جديدة» هنا
    const earlier = new Set(ALL_LESSONS.filter((l) => l.unit === 1 || l.id === "a1-u2-d1").flatMap((l) => l.praesentation.wordIds));
    expect(u.praesentation.wordIds.filter((id) => earlier.has(id))).toEqual([]);
    expect(u.warmup.cardIds.filter((id) => !earlier.has(id))).toEqual([]);
  });

  it("u2-d3 (D127): الجنس من النهاية لا من المعنى (das Mädchen) ولا من الترجمة (der Schmetterling) · ولا محايد في العربية (das Zentrum)", () => {
    const u = ALL_LESSONS.find((l) => l.id === "a1-u2-d3")!;
    const [natural, translated, neuter] = u.zusammenfassung.warningCards;
    expect(natural!.commonError.de).toContain("die Mädchen");
    expect(natural!.correct.de).toBe("Das Mädchen heißt Lena.");
    expect(natural!.whyArabicSpeakerFails).toContain("das Mädchen = «هي»");
    expect(translated!.commonError.de).toContain("die Schmetterling");
    expect(translated!.whyArabicSpeakerFails).toContain("التاء المربوطة");
    expect(neuter!.commonError.de).toContain("der Zentrum");
    expect(neuter!.exercise.a).toBe("Das Zentrum ist dort.");
    // كانت بطاقة «die Lehrer (للمعلّمة)» بتعليل لا يصح («المعلّمة بالعربية بالتأنيث فقط؛ الألماني يغيّر الكلمة نفسها» —
    // والعربية تغيّر الكلمة نفسها بالتاء: معلم ← معلمة) وفيه كلمة دخيلة «sex»
    expect(u.zusammenfassung.warningCards.some((c) => /Lehrer/.test(c.commonError.de) || /sex/.test(c.whyArabicSpeakerFails))).toBe(false);
    // الاستدعاء من دروس سابقة · ولا كلمة من درس سابق تُعرض «جديدة» (N-018)
    const earlier = new Set(ALL_LESSONS.filter((l) => l.unit === 1 || l.id === "a1-u2-d1" || l.id === "a1-u2-d2").flatMap((l) => l.praesentation.wordIds));
    expect(u.praesentation.wordIds.filter((id) => earlier.has(id))).toEqual([]);
    expect(u.warmup.cardIds.filter((id) => !earlier.has(id))).toEqual([]);
  });

  it("u2-d4 (D128): ss بعد الطويلة (Strasse) · حرف واحد بعد القصيرة (Tase) · ie/ei مقلوبتان (Wei) — بمبررات صحيحة", () => {
    const u = ALL_LESSONS.find((l) => l.id === "a1-u2-d4")!;
    const [sz, double, ieei] = u.zusammenfassung.warningCards;
    expect(sz!.commonError.de).toContain("~~Strasse~~");
    expect(sz!.commonError.de).toContain("في ألمانيا والنمسا"); // سويسرا تكتب ss دائماً — الخطأ خطأ في ألمانيا والنمسا فقط
    expect(sz!.correct.de).toBe("die Straße / groß");
    expect(double!.commonError.de).toContain("~~Tase~~");
    expect(double!.whyArabicSpeakerFails).toContain("الشدّة");
    expect(double!.exercise.a).toBe("Wir kommen zusammen.");
    expect(ieei!.commonError.de).toContain("~~Wei geht's?~~");
    expect(ieei!.whyArabicSpeakerFails).toContain("«بَيْت»");
    // كانت ثلاث بطاقات بتعليلات لا تصح: «طويلة (ai/au/u/o)» — heiß فيها ei لا ai · «groß ← o الطويل في au (diphthong)» ·
    // «القهوة بالعربية حركة واحدة» مبرراً لـee — وKaffee تُنطق في ألمانيا غالباً بـe قصيرة في آخرها
    const why = u.zusammenfassung.warningCards.map((c) => c.whyArabicSpeakerFails).join("\n");
    expect(why).not.toMatch(/ai\/au|القهوة/);
    // كل بطاقة تحمل خريطة التداخل · والخطأ المقصود لا يظهر إلا مشطوباً
    for (const c of u.zusammenfassung.warningCards) expect(c.whyArabicSpeakerFails).toContain("10‑ي");
    // الاستدعاء من دروس سابقة · ولا كلمة من درس سابق تُعرض «جديدة» (N-018 — strasse من u1-d4 مراجعةٌ لا جديد)
    const earlier = new Set(ALL_LESSONS.filter((l) => l.unit === 1 || ["a1-u2-d1", "a1-u2-d2", "a1-u2-d3"].includes(l.id)).flatMap((l) => l.praesentation.wordIds));
    expect(u.praesentation.wordIds.filter((id) => earlier.has(id))).toEqual([]);
    expect(u.warmup.cardIds.filter((id) => !earlier.has(id))).toEqual([]);
  });

  it("u2-d5 (D130): auch/gern بين الفاعل والفعل · الفاعل قبل الفعل بعد Natürlich · vorstellen كاملة — بمبررات صحيحة", () => {
    const u = ALL_LESSONS.find((l) => l.id === "a1-u2-d5")!;
    const [mittel, vorfeld, trennbar] = u.zusammenfassung.warningCards;
    expect(mittel!.commonError.de).toContain("~~Ich auch lese gern.~~");
    expect(mittel!.correct.de).toBe("Ich lese auch gern.");
    expect(mittel!.whyArabicSpeakerFails).toContain("«أنا أيضاً أقرأ»");
    expect(vorfeld!.commonError.de).toContain("~~Natürlich ich lese gern.~~");
    expect(vorfeld!.correct.de).toBe("Natürlich lese ich gern.");
    expect(vorfeld!.whyArabicSpeakerFails).toContain("Hier wohne ich");
    expect(trennbar!.commonError.de).toContain("~~Ich vorstelle mich.~~");
    expect(trennbar!.whyArabicSpeakerFails).toContain("الوحدة السابعة"); // قطعة الآن — قاعدة الأفعال المنفصلة في a1-u7-d5
    expect(trennbar!.exercise.a).toBe("Wir lernen uns kennen.");
    // كانت «~~Ich lerne kennen dich.~~» بتعليل يستعير aufstehen (الوحدة 7) ويعلّم موضع المفعول في الفعل المنفصل قبل وقته ·
    // و«gern أخيراً (أو ثانياً بعد الفعل في الأسئلة)» — وgern لا تقع آخراً دائماً (Ich lese gern Texte)
    const why = u.zusammenfassung.warningCards.map((c) => c.whyArabicSpeakerFails).join("\n");
    expect(why).not.toMatch(/aufstehen|gern أخيراً/);
    expect(u.zusammenfassung.warningCards.some((c) => c.commonError.de.includes("kennen dich"))).toBe(false);
    for (const c of u.zusammenfassung.warningCards) expect(c.whyArabicSpeakerFails).toContain("10‑ي");
    // الاستدعاء من دروس سابقة · ولا كلمة من درس سابق تُعرض «جديدة» (N-018)
    const earlier = new Set(ALL_LESSONS.filter((l) => l.unit === 1 || ["a1-u2-d1", "a1-u2-d2", "a1-u2-d3", "a1-u2-d4"].includes(l.id)).flatMap((l) => l.praesentation.wordIds));
    expect(u.praesentation.wordIds.filter((id) => earlier.has(id))).toEqual([]);
    expect(u.warmup.cardIds.filter((id) => !earlier.has(id))).toEqual([]);
  });

  it("u3-d1 (D131): العشرات أولاً (الفرنسية لا العربية) · كلمتان أو eins كاملة · العشرات من الآحاد كاملة — بمبررات صحيحة", () => {
    const u = ALL_LESSONS.find((l) => l.id === "a1-u3-d1")!;
    const [order, oneWord, tens] = u.zusammenfassung.warningCards;
    expect(order!.commonError.de).toContain("~~vierzig und zwei~~");
    expect(order!.correct.de).toBe("zweiundvierzig");
    // العربية «اثنان وأربعون» بترتيب الألمانية نفسه — الخطر من الفرنسية والإنجليزية (لا يُنسب إلى العربية ما ليس فيها)
    expect(order!.whyArabicSpeakerFails).toContain("العربية في صفّك");
    expect(order!.whyArabicSpeakerFails).toMatch(/الفرنسية.*الإنجليزية/);
    expect(oneWord!.commonError.de).toContain("~~ein und zwanzig~~");
    expect(oneWord!.commonError.de).toContain("~~einsundzwanzig~~");
    expect(oneWord!.exercise.a).toBe("einunddreißig");
    expect(tens!.commonError.de).toBe("~~dreizig~~ / ~~sechszig~~ / ~~siebenzig~~");
    expect(tens!.correct.de).toBe("dreißig / sechzig / siebzig");
    // كانت «~~zwanzigeins~~ / ~~twenty-one~~» بتعليل «العربية «واحد وعشرون» مألوفة … والإنجليزية تُربك» (صيغة خارج حد الإعلان
    // وإنجليزية غير مدروسة) · و«~~dreissig~~» تكراراً لقاعدة ß/ss بلا خطأ جديد · و«يُبقي على الكلمة كاملة» بلا سبب
    const all = u.zusammenfassung.warningCards.map((c) => `${c.commonError.de} ${c.whyArabicSpeakerFails}`).join("\n");
    expect(all).not.toMatch(/zwanzigeins|twenty|dreissig/);
    for (const c of u.zusammenfassung.warningCards) expect(c.whyArabicSpeakerFails).toContain("10‑ي");
    // الاستدعاء من دروس سابقة · ولا كلمة من درس سابق تُعرض «جديدة» (N-018)
    const earlier = new Set(ALL_LESSONS.filter((l) => l.unit <= 2).flatMap((l) => l.praesentation.wordIds));
    expect(u.praesentation.wordIds.filter((id) => earlier.has(id))).toEqual([]);
    expect(u.warmup.cardIds.filter((id) => !earlier.has(id))).toEqual([]);
  });

  it("u3-d2 (D132): nur بعد الكمية (كـ«فقط») · حرف جر بعد kosten (كالباء) · Euros بالجمع (الفرنسية لا العربية) — بمبررات صحيحة", () => {
    const u = ALL_LESSONS.find((l) => l.id === "a1-u3-d2")!;
    const [nur, kosten, euros] = u.zusammenfassung.warningCards;
    expect(nur!.commonError.de).toContain("~~Das kostet zweihundert Euro nur.~~");
    expect(nur!.correct.de).toBe("Das kostet nur zweihundert Euro.");
    expect(nur!.whyArabicSpeakerFails).toContain("«فقط»");
    expect(kosten!.commonError.de).toContain("~~Das kostet für fünf Euro.~~");
    expect(kosten!.whyArabicSpeakerFails).toContain("kaufen + für صحيحة"); // لا يُعمَّم المنع على كل für قبل السعر
    expect(euros!.commonError.de).toContain("~~zweihundert Euros~~");
    expect(euros!.whyArabicSpeakerFails).toContain("العربية في صفّك");
    // كانت «~~Ich bezahle für die Rechnung.~~» وتمرينها «~~bezahlen für das Brot~~ ← das Brot bezahlen» — وfür etwas bezahlen صحيحة
    // (Ich habe für das Brot zwei Euro bezahlt) · و«~~das Euro~~ — اليورو مذكر» بلا تداخل عربي («اليورو» مذكر في العربية أيضاً)
    const all = u.zusammenfassung.warningCards.map((c) => `${c.commonError.de} ${JSON.stringify(c.exercise)}`).join("\n");
    expect(all).not.toMatch(/bezahle für|bezahlen für|das Euro/);
    for (const c of u.zusammenfassung.warningCards) expect(c.whyArabicSpeakerFails).toContain("10‑ي");
    // الاستدعاء من دروس سابقة · ولا كلمة من درس سابق تُعرض «جديدة» (N-018)
    const earlier = new Set(ALL_LESSONS.filter((l) => l.unit <= 2 || l.id === "a1-u3-d1").flatMap((l) => l.praesentation.wordIds));
    expect(u.praesentation.wordIds.filter((id) => earlier.has(id))).toEqual([]);
    expect(u.warmup.cardIds.filter((id) => !earlier.has(id))).toEqual([]);
  });

  it("u3-d3 (D133): halb من الساعة الحالية (كـ«السابعة والنصف») · Uhr للمدة (كـ«ساعة») · الحرف الكبير يفرّق Morgen/morgen — بمبررات صحيحة", () => {
    const u = ALL_LESSONS.find((l) => l.id === "a1-u3-d3")!;
    const [halb, stunde, morgen] = u.zusammenfassung.warningCards;
    expect(halb!.commonError.de).toContain("~~Es ist halb sieben.~~ (7:30)");
    expect(halb!.correct.de).toBe("Es ist halb acht. (7:30)");
    expect(halb!.whyArabicSpeakerFails).toContain("«السابعة والنصف»");
    expect(stunde!.commonError.de).toContain("~~Der Kurs ist zwei Uhr lang.~~");
    expect(stunde!.correct.de).toBe("Der Kurs ist zwei Stunden lang.");
    expect(stunde!.whyArabicSpeakerFails).toContain("«ساعة»");
    expect(morgen!.whyArabicSpeakerFails).toContain("بلا حروف كبيرة");
    expect(morgen!.exercise.a).toBe("Der Kurs ist morgen früh.");
    // كانت «~~Es ist um drei Uhr.~~» بتعليل «الساعة الثالثة بحرف الجر أحياناً بالعربية» — والعربية نفسها تفرّق «الساعة الثالثة» (الآن)
    // و«في الثالثة» (الموعد) كالألمانية · وفي تصحيحها Termin (درس a1-u3-d4) · وكان في الـQuiz «Ich stehe früh auf.» (aufstehen — الوحدة 7)
    const all = JSON.stringify(u.zusammenfassung.warningCards);
    expect(all).not.toMatch(/Termin|بحرف الجر أحياناً/);
    expect(JSON.stringify(u.quiz)).not.toMatch(/stehe/);
    for (const c of u.zusammenfassung.warningCards) expect(c.whyArabicSpeakerFails).toContain("10‑ي");
    // الاستدعاء من دروس سابقة · ولا كلمة من درس سابق تُعرض «جديدة» (N-018)
    const earlier = new Set(ALL_LESSONS.filter((l) => l.unit <= 2 || ["a1-u3-d1", "a1-u3-d2"].includes(l.id)).flatMap((l) => l.praesentation.wordIds));
    expect(u.praesentation.wordIds.filter((id) => earlier.has(id))).toEqual([]);
    expect(u.warmup.cardIds.filter((id) => !earlier.has(id))).toEqual([]);
  });

  it("u3-d4 (D134): حرف واحد لكل وقت (كـ«في») · حذف es الوهمي (كـ«تمطر») · treffen بلا uns (كـ«نلتقي») — بمبررات صحيحة", () => {
    const u = ALL_LESSONS.find((l) => l.id === "a1-u3-d4")!;
    const [praep, es, uns] = u.zusammenfassung.warningCards;
    expect(praep!.commonError.de).toContain("~~am Januar~~");
    expect(praep!.correct.de).toBe("um drei Uhr · am Montag · im Januar");
    expect(praep!.whyArabicSpeakerFails).toContain("«في»");
    expect(es!.commonError.de).toContain("~~Regnet.~~");
    expect(es!.whyArabicSpeakerFails).toContain("حذف es الوهمي"); // بند خريطة 10‑ي نفسه
    expect(uns!.commonError.de).toBe("~~Wir treffen am Montag.~~");
    expect(uns!.correct.de).toBe("Wir treffen uns am Montag.");
    // كانت «~~die Januar~~ / ~~das März~~ — الشهور بالعربية محايدة أحياناً» (لا تداخل: الشهور مذكرة في العربية أيضاً) ·
    // و«~~Wir treffen wir uns.~~ / ~~Ich treffe mich dich.~~» (أخطاء لا يقع فيها أحد) · وفي تمرينها Freitag (a1-u10-d2)
    const all = JSON.stringify(u.zusammenfassung.warningCards);
    expect(all).not.toMatch(/die Januar|محايدة|treffen wir uns\.~~|Freitag/);
    for (const c of u.zusammenfassung.warningCards) expect(c.whyArabicSpeakerFails).toContain("10‑ي");
    // الاستدعاء من دروس سابقة · ولا كلمة من درس سابق تُعرض «جديدة» (N-018)
    const earlier = new Set(ALL_LESSONS.filter((l) => l.unit <= 2 || ["a1-u3-d1", "a1-u3-d2", "a1-u3-d3"].includes(l.id)).flatMap((l) => l.praesentation.wordIds));
    expect(u.praesentation.wordIds.filter((id) => earlier.has(id))).toEqual([]);
    expect(u.warmup.cardIds.filter((id) => !earlier.has(id))).toEqual([]);
  });

  it("u3-d5 (D135): أرقام الهاتف والوقت — حوار كامل في البنود، الكلمات الثلاث في النواة، ومصائد جنس حقيقية", () => {
    const u = ALL_LESSONS.find((l) => l.id === "a1-u3-d5")!;
    expect(u.praesentation.wordIds).toHaveLength(15);
    expect(u.praesentation.wordIds).toEqual(expect.arrayContaining(["einmal", "spaeter", "aufgabe"]));
    expect(u.praesentation.grammarArsenalIds).toEqual(["ars-hoeren-zahlen"]);
    expect(u.warmup.cardIds).toEqual(["uhr", "zwanzig", "telefonnummer"]);
    expect(u.zusammenfassung.warningCards).toHaveLength(3);
    for (const card of u.zusammenfassung.warningCards) expect(card.whyArabicSpeakerFails).toContain("10‑ي");
    const audioIds = u.uebung.stations.filter((s) => s.type === "listening" || s.type === "dictation").flatMap((s) => s.items.map((i) => String(i.audioId)));
    expect(audioIds.filter((id) => id.startsWith("h5-")).sort((a, b) => Number(a.slice(3)) - Number(b.slice(3))))
      .toEqual(Array.from({ length: 14 }, (_, i) => `h5-${i + 1}`));
    expect(audioIds.filter((id) => id.startsWith("n5-")).sort((a, b) => Number(a.slice(3)) - Number(b.slice(3))))
      .toEqual(Array.from({ length: 7 }, (_, i) => `n5-${i + 1}`));
    const practiceQuestions = new Set(u.uebung.stations.flatMap((s) => s.items.flatMap((i) => typeof i.q === "string" ? [i.q] : [])));
    expect(u.quiz.variants.flatMap((v) => v.items.map((i) => i.q)).some((q) => practiceQuestions.has(q))).toBe(false);
    // N-053: collocation المعروضة في NetworkLab لا تُسرّب فعل bekommen غير المدروس حتى اليوم.
    expect(ALL_WORDS.find((w) => w.id === "anruf")!.kollocation).toMatchObject({ de: "Der Anruf kommt.", verb: "kommen" });
  });

  it("u4-d2 (D137): ‑e من أداة المملوك (كـ«ـي» الثابتة) · für mich للملكية (كـ«لي») · فعلان بعد lieben (كـ«أحب أقرأ») — بمبررات صحيحة", () => {
    const u = ALL_LESSONS.find((l) => l.id === "a1-u4-d2")!;
    const [endung, fuerMich, liebe] = u.zusammenfassung.warningCards;
    expect(endung!.commonError.de).toBe("~~mein Katze~~ / ~~mein Familie~~");
    expect(endung!.correct.de).toBe("meine Katze · meine Familie · mein Hund");
    expect(endung!.whyArabicSpeakerFails).toContain("«كلبي» و«قطتي» و«عائلتي» بالياء نفسها");
    expect(endung!.exercise.a).toBe("meine Tasche · mein Auto · meine Eltern");
    expect(fuerMich!.commonError.de).toContain("~~Das Auto ist für mich.~~");
    expect(fuerMich!.correct.de).toBe("Das Auto gehört mir. · Das ist mein Auto.");
    expect(fuerMich!.whyArabicSpeakerFails).toContain("Für mich ist das spät"); // für mich معروفة منذ u2-d2/u3-d3 بمعنى «بالنسبة لي»
    expect(liebe!.commonError.de).toBe("~~Ich liebe lese.~~");
    expect(liebe!.correct.de).toBe("Ich lese gern. · Ich liebe meine Familie.");
    expect(liebe!.whyArabicSpeakerFails).toContain("«أحب أقرأ»");
    // كانت «~~der mein Bruder~~» بتعليل «أخي بلا أداة بالعربية — والألمانية كذلك» (نقل إيجابي لا خطأ عربي: «كلبي» بلا «ال») ·
    // و«gehört يجرّ … كما antworten تماماً» (Dativ قبل وقته — الوحدة 8) · و«~~dein Hund~~ (للكلبة?)» · و«جنس المالك لا يهم» (sein للمالك المذكر)
    const all = JSON.stringify(u.zusammenfassung.warningCards);
    expect(all).not.toMatch(/der mein Bruder|antworten|للكلبة|جنس المالك لا يهم|gehört mich/);
    for (const c of u.zusammenfassung.warningCards) expect(c.whyArabicSpeakerFails).toContain("10‑ي");
    // الخيارات لا تجعل جمعاً صحيحاً خطأً: Onkel وSchlüssel جمعهما بالشكل نفسه (meine Onkel = أعمامي) — فلا يُعرض meine Onkel/deine Schlüssel مشتِّتاً إلا مع ist للمفرد
    const choiceTexts = [...u.uebung.stations.flatMap((s) => s.items), ...u.quiz.variants.flatMap((v) => v.items)]
      .flatMap((i) => (Array.isArray((i as { choices?: unknown }).choices) ? ((i as { choices: string[] }).choices) : []));
    expect(choiceTexts.filter((c) => /^(meine|deine|seine) (Onkel|Schlüssel)$/.test(c))).toEqual([]);
    // الاستدعاء من دروس سابقة · ولا كلمة من درس سابق تُعرض «جديدة» (N-018)
    const earlier = new Set(ALL_LESSONS.filter((l) => l.unit <= 3 || l.id === "a1-u4-d1").flatMap((l) => l.praesentation.wordIds));
    expect(u.praesentation.wordIds.filter((id) => earlier.has(id))).toEqual([]);
    expect(u.warmup.cardIds.filter((id) => !earlier.has(id))).toEqual([]);
  });

  it("u4-d3 (D138): «عندي أخٌ» مرفوع (لا مفعول) · «مَن» الثابتة · النصب العربي لكل الأسماء — بمبررات نحوية صحيحة", () => {
    const u = ALL_LESSONS.find((l) => l.id === "a1-u4-d3")!;
    const [haben, wen, alle] = u.zusammenfassung.warningCards;
    expect(haben!.commonError.de).toBe("~~Ich habe ein Bruder.~~");
    expect(haben!.correct.de).toBe("Ich habe einen Bruder.");
    // «عندي أخٌ»: الأخ مبتدأ مؤخر مرفوع والملكية بحرف الجر — لا «عندي أخاً» (نصب خاطئ في العربية كان في البطاقة القديمة)
    expect(haben!.whyArabicSpeakerFails).toContain("«عندي أخٌ»");
    expect(haben!.whyArabicSpeakerFails).toContain("مبتدأ مرفوع لا مفعول");
    expect(haben!.exercise.a).toBe("einen Sohn und eine Tochter");
    expect(wen!.commonError.de).toBe("~~Wer beschreibst du?~~");
    expect(wen!.correct.de).toBe("Wen beschreibst du?");
    expect(wen!.whyArabicSpeakerFails).toContain("«مَن جاء؟» و«مَن رأيت؟»");
    expect(alle!.commonError.de).toContain("~~Ich habe einen Schwester.~~");
    expect(alle!.correct.de).toBe("Ich habe eine Schwester. · Ich beschreibe ein Foto.");
    expect(alle!.whyArabicSpeakerFails).toContain("«أخاً» و«أختاً» و«صورةً»");
    for (const c of u.zusammenfassung.warningCards) expect(c.whyArabicSpeakerFails).toContain("10‑ي");
    // البطاقات القديمة: «عندي أخاً» (نصب لا تقوله العربية) · sehen قبل درسها (a1-u4-d4) · صفة منعوتة قبل قاعدتها (einen alten Vater — A2)
    const all = JSON.stringify(u);
    expect(all).not.toMatch(/عندي أخاً|siehst|sehe |alten Vater|lange Haare|schönes Foto/);
    // الصفات بعد ist وحدها: لا نهاية صفة منعوتة في أي نص ألماني (التدريب · Quiz · البطاقات)
    const sample = (id: string) => ALL_WORDS.find((w) => w.id === id)!.sampleSentence!.de;
    expect(["haar", "schoen", "foto", "bild", "wen"].map(sample)).toEqual([
      "Meine Haare sind lang.", "Das Foto ist sehr schön.", "Ich liebe das Foto.", "Ich beschreibe ein Bild.", "Wen beschreibst du?",
    ]);
    // المشتِّتات ليست ألمانية صحيحة: لا «Ich habe den Hund.» ولا «Wen liebt Bruno?» (صحيحتان بمعنى آخر)
    const choiceTexts = [...u.uebung.stations.flatMap((s) => s.items), ...u.quiz.variants.flatMap((v) => v.items)]
      .flatMap((i) => (Array.isArray((i as { choices?: unknown }).choices) ? ((i as { choices: string[] }).choices) : []));
    expect(choiceTexts.filter((c) => /^(Ich habe den Hund\.|Wen liebt Bruno\?|Ich kenne die Lösung\.)$/.test(c))).toEqual([]);
    // الاستدعاء من دروس سابقة · ولا كلمة من درس سابق تُعرض «جديدة» (N-018)
    const earlier = new Set(ALL_LESSONS.filter((l) => l.unit <= 3 || l.id === "a1-u4-d1" || l.id === "a1-u4-d2").flatMap((l) => l.praesentation.wordIds));
    expect(u.praesentation.wordIds.filter((id) => earlier.has(id))).toEqual([]);
    expect(u.warmup.cardIds).toEqual(["hund", "katze", "auto"]);
    expect(u.warmup.cardIds.filter((id) => !earlier.has(id))).toEqual([]);
  });

  it("u4-d4 (D139): ضمير الشيء بجنس كلمته العربية (الصورة ← sie) · تكرار «بين» · جذع المضارع الثابت — بمبررات صحيحة", () => {
    const u = ALL_LESSONS.find((l) => l.id === "a1-u4-d4")!;
    const [pronoun, zwischen, stem] = u.zusammenfassung.warningCards;
    expect(pronoun!.commonError.de).toBe("~~Ja, ich sehe sie.~~ (das Foto)");
    expect(pronoun!.correct.de).toBe("Siehst du das Foto? — Ja, ich sehe es.");
    // العربية بلا محايد والضمير فيها يتبع جنس الكلمة العربية («الصورة» مؤنثة ← «أراها»)
    expect(pronoun!.whyArabicSpeakerFails).toContain("«الصورة» مؤنثة فنقول «أراها»");
    expect(pronoun!.whyArabicSpeakerFails).toContain("ولا محايد في العربية");
    expect(pronoun!.exercise.a).toBe("es");
    expect(zwischen!.commonError.de).toBe("~~zwischen Oma und zwischen Opa~~");
    expect(zwischen!.correct.de).toBe("Das Kind sitzt zwischen Oma und Opa.");
    // «بيني وبينك» تكرار واجب مع الضمير في العربية — وzwischen تُذكر مرة واحدة
    expect(zwischen!.whyArabicSpeakerFails).toContain("«بيني وبينك»");
    expect(stem!.commonError.de).toBe("~~Sehst du den Hund?~~ / ~~Er tragt eine Brille.~~");
    expect(stem!.correct.de).toBe("Siehst du den Hund? · Er trägt eine Brille.");
    expect(stem!.whyArabicSpeakerFails).toContain("«أرى · ترى · يرى»");
    for (const c of u.zusammenfassung.warningCards) expect(c.whyArabicSpeakerFails).toContain("10‑ي");
    // البطاقات القديمة: «~~Er ist eine Brille.~~» (ليس نقلاً عربياً) · مصيدة V2 بعد الظرف (مكررة من u2-d1 وu2-d5) · ~~Ich sehe mein Bruder.~~ (مصيدة d3)
    const cards = JSON.stringify(u.zusammenfassung.warningCards);
    expect(cards).not.toMatch(/Er ist eine Brille|Links mein Vater steht|Ich sehe mein Bruder/);
    // لا Dativ بعد neben/zwischen ولا أمر ولا قطعة «auf dem Foto» ولا hängt/Wand في أي نص ألماني للدرس (Dativ قاعدة الوحدتين 8 و9)
    const de = JSON.stringify({ e: u.einstieg, s: u.uebung.stations.map((st) => st.items.map((i) => ({ ...i, why: "" }))), q: u.quiz.variants.map((v) => v.items.map((i) => ({ ...i, why: "" }))), z: u.zusammenfassung.summary.de, w: u.zusammenfassung.warningCards.map((c) => [c.commonError.de, c.correct.de, c.exercise]) });
    expect(de).not.toMatch(/(neben|zwischen) (dem|der|den|meinem|meiner|deinem|deiner|einem|einer)\b|auf dem Foto|Zeig mir|hängt|Wand|Akkusativ/i);
    const sample = (id: string) => ALL_WORDS.find((w) => w.id === id)!.sampleSentence!.de;
    expect(["zeigen", "sitzen", "laecheln", "neben", "gemeinsam", "bekannt", "bekannte", "tot"].map(sample)).toEqual([
      "Das Foto zeigt meine Familie.", "Neben Oma sitzt Opa.", "Das Kind lächelt.", "Ich sitze neben Oma.", "Wir essen gemeinsam.",
      "Oma ist dort sehr bekannt.", "Das ist eine Bekannte von Oma.", "Opa ist tot, aber hier lächelt er.",
    ]);
    // المشتِّتات ليست ألمانية صحيحة بمعنى آخر: لا «Ja, ich sehe es.» لمذكر ولا «Wen trägt deine Oma?» ولا «Ja, ich kenne sie.» في خيارات المذكر
    const choiceTexts = [...u.einstieg.pretestItems.flatMap((p) => p.choices), ...u.uebung.stations.flatMap((s) => s.items), ...u.quiz.variants.flatMap((v) => v.items)]
      .flatMap((i) => (typeof i === "string" ? [i] : Array.isArray((i as { choices?: unknown }).choices) ? ((i as { choices: string[] }).choices) : []));
    expect(choiceTexts.filter((c) => /^(Ja, ich sehe es\.|Ja, ich sehe den\.|Wen trägt deine Oma\?|Kennst du den Mann\? — Ja, ich kenne sie\.|Siehst du meine Mutter\? — Ja, ich sehe ihn\.)$/.test(c))).toEqual([]);
    // tot موضوع حساس: لا مهمة تطلب من المتعلم ذكر متوفّى من عائلته — والموقف يقول صراحة «بلا حاجة إلى معلومات عائلية حقيقية»
    expect(u.uebung.communicativeTask.successCriteria.join(" ")).not.toMatch(/tot|متوفّ/);
    expect(u.uebung.communicativeTask.situation.ar).toContain("بلا حاجة إلى معلومات عائلية حقيقية");
    // الاستدعاء من دروس سابقة · ولا كلمة من درس سابق تُعرض «جديدة» (N-018)
    const earlier = new Set(ALL_LESSONS.filter((l) => l.unit <= 3 || ["a1-u4-d1", "a1-u4-d2", "a1-u4-d3"].includes(l.id)).flatMap((l) => l.praesentation.wordIds));
    expect(u.praesentation.wordIds.filter((id) => earlier.has(id))).toEqual([]);
    expect(u.warmup.cardIds).toEqual(["opa", "loesung", "foto"]);
    expect(u.warmup.cardIds.filter((id) => !earlier.has(id))).toEqual([]);
  });

  it("u4-d5 (D140): ‑e علامةً للمالكة كـ«ـها» (~~ihre Mann~~) · الفرنسية sa mère (~~Er liebt ihre Mutter~~) · باء «فخور بـ» — بمبررات صحيحة", () => {
    const u = ALL_LESSONS.find((l) => l.id === "a1-u4-d5")!;
    const [ending, french, stolz] = u.zusammenfassung.warningCards;
    expect(ending!.commonError.de).toBe("~~ihre Mann~~");
    expect(ending!.correct.de).toBe("Ihr Mann ist Lehrer. · Ihre Tochter ist jung.");
    // «ـها» علامة المالكة وحدها ولا تتغير مع المملوك — والنهاية الألمانية من أداة المملوك ودوره
    expect(ending!.whyArabicSpeakerFails).toContain("«زوجُها · عملُها»");
    expect(ending!.exercise).toMatchObject({ a: "Ihr Vater wohnt in Tunesien." });
    expect(french!.commonError.de).toBe("~~Er liebt ihre Mutter.~~ (= أمّه)");
    expect(french!.correct.de).toBe("Er liebt seine Mutter.");
    // العربية عون هنا («أمُّه/أمُّها») والخطر من الفرنسية — لا يُنسب إلى العربية ما ليس فيها (سابقة u3-d1)
    expect(french!.whyArabicSpeakerFails).toContain("العربية في صفّك هنا");
    expect(french!.whyArabicSpeakerFails).toContain("sa mère");
    expect(stolz!.commonError.de).toBe("~~Ich bin stolz mit Oma.~~");
    expect(stolz!.correct.de).toBe("Ich bin stolz auf Oma.");
    expect(stolz!.whyArabicSpeakerFails).toContain("«فخور بـ»");
    for (const c of u.zusammenfassung.warningCards) expect(c.whyArabicSpeakerFails).toContain("10‑ي");
    // البطاقات القديمة: «إخوتي مفرد في التفكير العربي أحياناً» (بلا أساس) · aufnehmen المنفصل كأنه معروف (مثل aufstehen — الوحدة 7) · مصيدة الجمع المكررة
    const cards = JSON.stringify(u.zusammenfassung.warningCards);
    expect(cards).not.toMatch(/في التفكير العربي|aufstehen|Ich nehme auf eine|mein Geschwister/);
    // لا Dativ بعد von/mit/in/zu ولا Genitiv ولا صفة منعوتة ولا اسم مدينة غير معلن في أي نص ألماني للدرس
    const de = JSON.stringify({ e: u.einstieg, s: u.uebung.stations.map((st) => st.items.map((i) => ({ ...i, why: "" }))), q: u.quiz.variants.map((v) => v.items.map((i) => ({ ...i, why: "" }))), z: u.zusammenfassung.summary.de, w: u.zusammenfassung.warningCards.map((c) => [c.commonError.de, c.correct.de, c.exercise]) });
    expect(de).not.toMatch(/\b(von|mit|in|zu) (dem|der|meinem|meiner|deinem|deiner|seinem|seiner|ihrem|ihrer|einem|einer)\b|\bzur\b|\bzum\b|meines|kurze|Sfax|Aufnahme/);
    const sample = (id: string) => ALL_WORDS.find((w) => w.id === id)!.sampleSentence!.de;
    expect(["geschwister", "zwilling", "beruf", "arbeiten", "arbeit", "aufnehmen", "erzaehlen", "glueck", "gluecklich", "ihr"].map(sample)).toEqual([
      "Hast du Geschwister?", "Meine Brüder sind Zwillinge.", "Was ist sein Beruf?", "Meine Mutter arbeitet viel.", "Sie liebt ihre Arbeit.",
      "Ich nehme eine Nachricht auf.", "Erzählst du von Tunesien?", "Du hast Glück!", "Meine Oma ist glücklich.", "Ihr Mann ist Lehrer.",
    ]);
    // المشتِّتات ليست ألمانية صحيحة بمعنى آخر: لا جذع مالك آخر (sein/ihr) مشتِّتاً — «Sie liebt seinen Sohn.» صحيحة بمعنى آخر
    const choiceTexts = [...u.einstieg.pretestItems.flatMap((p) => p.choices), ...u.uebung.stations.flatMap((s) => s.items), ...u.quiz.variants.flatMap((v) => v.items)]
      .flatMap((i) => (typeof i === "string" ? [i] : Array.isArray((i as { choices?: unknown }).choices) ? ((i as { choices: string[] }).choices) : []));
    const quizChoices = u.quiz.variants.flatMap((v) => v.items.flatMap((i) => i.choices ?? []));
    for (const item of u.quiz.variants.flatMap((v) => v.items).filter((i) => i.choices)) {
      const wrong = item.choices!.filter((c) => c !== item.a);
      const swapOwner = (s: string) => s.replace(/\b([Ss])ein/g, "§$1").replace(/\b([Ii])hr/g, (_m, c: string) => (c === "I" ? "Sein" : "sein")).replace(/§S/g, "Ihr").replace(/§s/g, "ihr");
      expect(wrong).not.toContain(swapOwner(item.a));
    }
    expect(choiceTexts.filter((c) => /^(Sein Mann ist Lehrer\.|Dein Vater arbeitet viel\?|Was ist Ihr Beruf\?)$/.test(c))).toEqual([]);
    expect(quizChoices.length).toBeGreaterThan(0);
    // الاستدعاء من دروس سابقة · ولا كلمة من درس سابق تُعرض «جديدة» (N-018) — kurz (u2-d4) خرجت
    const earlier = new Set(ALL_LESSONS.filter((l) => l.unit <= 3 || ["a1-u4-d1", "a1-u4-d2", "a1-u4-d3", "a1-u4-d4"].includes(l.id)).flatMap((l) => l.praesentation.wordIds));
    expect(u.praesentation.wordIds.filter((id) => earlier.has(id))).toEqual([]);
    expect(u.warmup.cardIds).toEqual(["mann", "brille", "kind"]);
    expect(u.warmup.cardIds.filter((id) => !earlier.has(id))).toEqual([]);
  });

  it("u5-d1 (D141): «ال» العامة (~~Ich mag den Fisch.~~) · تنوين المادة (~~Ich esse ein Fleisch.~~) · «أنا جوعان» (~~Ich bin Hunger.~~) — بمبررات صحيحة", () => {
    const u = ALL_LESSONS.find((l) => l.id === "a1-u5-d1")!;
    const [generic, mass, hunger] = u.zusammenfassung.warningCards;
    expect(generic!.commonError.de).toBe("~~Ich mag den Fisch.~~ (= السمك عموماً)");
    expect(generic!.correct.de).toBe("Ich mag Fisch.");
    // «ال» للعموم في العربية · والفرنسية J'aime le poisson تعزز النقل (تأثير معلن — سابقة u3-d1) · وden Fisch صحيحة لسمك بعينه فلا تُعدّ خطأً مطلقاً
    expect(generic!.whyArabicSpeakerFails).toContain("«أحبّ السمكَ»");
    expect(generic!.whyArabicSpeakerFails).toContain("J'aime le poisson");
    expect(generic!.whyArabicSpeakerFails).toContain("«هذا السمك» بعينه");
    expect(generic!.exercise).toMatchObject({ a: "Ich mag Obst." });
    expect(mass!.commonError.de).toBe("~~Ich esse ein Fleisch.~~");
    expect(mass!.correct.de).toBe("Ich esse Fleisch.");
    // التنوين ≈ ein (ما تعلّمه في u2-d2: ein Haus) يمتد خطأً إلى اسم المادة «آكلُ لحماً»
    expect(mass!.whyArabicSpeakerFails).toContain("«آكلُ لحماً · آكلُ أرزاً»");
    expect(mass!.whyArabicSpeakerFails).toContain("ein Haus");
    expect(mass!.exercise).toMatchObject({ a: "Yusuf isst Reis." });
    expect(hunger!.commonError.de).toBe("~~Ich bin Hunger.~~");
    expect(hunger!.correct.de).toBe("Ich habe jetzt Hunger.");
    // «جوعان» صفة خبراً · والفرنسية j'ai faim عونٌ مسمّى (الفعل «يملك» مع اسم)
    expect(hunger!.whyArabicSpeakerFails).toContain("«أنا جوعان»");
    expect(hunger!.whyArabicSpeakerFails).toContain("j'ai faim");
    for (const c of u.zusammenfassung.warningCards) expect(c.whyArabicSpeakerFails).toContain("10‑ي");
    // البطاقات القديمة: مصيدة الجمع الثالثة (~~ein Nudel~~ — والمفرد die Nudel موجود) · ~~die Eies~~ · Durst (الدرس الخامس)
    const cards = JSON.stringify(u.zusammenfassung.warningCards);
    expect(cards).not.toMatch(/Nudel|Eies|Durst/);
    // لا Dativ بأداة بعد von/mit/in/zu · ولا kein/nicht (الدرس الرابع) · ولا möchte (الدرس الثالث) · ولا كلمات الأمثلة القديمة في أي نص ألماني للدرس
    const de = JSON.stringify({ e: u.einstieg, s: u.uebung.stations.map((st) => st.items.map((i) => ({ ...i, why: "" }))), q: u.quiz.variants.map((v) => v.items.map((i) => ({ ...i, why: "" }))), z: u.zusammenfassung.summary.de, w: u.zusammenfassung.warningCards.map((c) => [c.commonError.de, c.correct.de, c.exercise]) });
    expect(de).not.toMatch(/\b(von|mit|in|zu) (dem|der|meinem|meiner|deinem|deiner|seinem|seiner|ihrem|ihrer|einem|einer)\b|\bzur\b|\bzum\b|\bkein|\bnicht\b|möchte|Frühstück|frisch|lecker|gesund|Durst/);
    // N-021: أمثلة البطاقات بلا أسماء علم — المقياس يفحصها بلا قائمة سماح فيعدّ «Lena» غير مدروسة
    const sample = (id: string) => ALL_WORDS.find((w) => w.id === id)!.sampleSentence!.de;
    expect(["wurst", "fleisch", "fisch", "ei", "reis", "obst", "gemuese", "hunger", "lebensmittel", "apfel", "moegen"].map(sample).join(" ")).not.toMatch(/Lena|Yusuf|Berlin/);
    expect(["wurst", "fleisch", "fisch", "ei", "reis", "obst", "gemuese", "hunger", "lebensmittel", "apfel", "moegen"].map(sample)).toEqual([
      "Brot oder Wurst? — Beide, bitte!", "Die Suppe ist mit Fleisch und Reis.", "Fisch, bitte! Ich mag Fisch.", "Ein Ei? Nein, zwei Eier, bitte!",
      "Ich esse Fisch und Reis.", "Ich esse oft Obst.", "Wir essen viel Gemüse.", "Du hast Hunger, oder?",
      "Die Lebensmittel hier sind teuer.", "Ich esse oft einen Apfel.", "Magst du Eier?",
    ]);
    // المشتِّتات ليست ألمانية صحيحة بمعنى آخر: لا أداة تعريف قبل طعام عام (صحيحة لطعام بعينه) · لا معدود صحيح (ein Brot · einen Salat
    // · eine Suppe · eine Wurst) · لا «zwei Eis» (بوظتان) · ولا تركيب سليم بمعنى عبثي (essen/isst Hunger)
    const choiceTexts = [...u.einstieg.pretestItems.flatMap((p) => p.choices), ...u.uebung.stations.flatMap((s) => s.items), ...u.quiz.variants.flatMap((v) => v.items)]
      .flatMap((i) => (typeof i === "string" ? [i] : Array.isArray((i as { choices?: unknown }).choices) ? ((i as { choices: string[] }).choices) : []));
    expect(choiceTexts.filter((c) => /\b(den|das|der|die) (Fisch|Obst|Gemüse|Reis|Fleisch|Brot|Wurst|Nudeln)\b|ein Brot|einen Salat|eine Suppe|eine Wurst|zwei Eis\b|(essen|isst|esse) Hunger/.test(c))).toEqual([]);
    expect(choiceTexts.length).toBeGreaterThan(30);
    // الاستدعاء من دروس سابقة · ولا كلمة من درس سابق تُعرض «جديدة» (N-018)
    const earlier = new Set(ALL_LESSONS.filter((l) => l.unit <= 4).flatMap((l) => l.praesentation.wordIds));
    expect(u.praesentation.wordIds.filter((id) => earlier.has(id))).toEqual([]);
    expect(u.warmup.cardIds).toEqual(["kaese", "tasse", "das-essen"]);
    expect(u.warmup.cardIds.filter((id) => !earlier.has(id))).toEqual([]);
  });

  it("u5-d2 (D142): الأداة للوعاء (~~Ich bekomme einen Glas Saft.~~) · بلا von (~~eine Flasche von Wasser~~) · «شرب الحساء» (~~Ich trinke eine Suppe.~~) — بمبررات صحيحة", () => {
    const u = ALL_LESSONS.find((l) => l.id === "a1-u5-d2")!;
    const [container, von, soup] = u.zusammenfassung.warningCards;
    expect(container!.commonError.de).toBe("~~Ich bekomme einen Glas Saft.~~");
    expect(container!.correct.de).toBe("Ein Glas Saft, bitte!");
    // الإضافة: التنوين على المضاف إليه (المشروب) لا على الوعاء · وما تعلّمه في u2-d2 (التنوين ≈ ein: ein Haus) يبني الأداة على جنس المشروب
    expect(container!.whyArabicSpeakerFails).toContain("«كأسُ عصيرٍ»");
    expect(container!.whyArabicSpeakerFails).toContain("ein Haus");
    expect(container!.exercise).toMatchObject({ a: "Wir bekommen ein Glas Tee." });
    expect(von!.commonError.de).toBe("~~eine Flasche von Wasser~~");
    // «كأسٌ من الماء» بـ«من» + الفرنسية une bouteille d'eau (تأثير معلن) — والإضافة «زجاجةُ ماءٍ» عونٌ مسمّى
    expect(von!.whyArabicSpeakerFails).toContain("«كأسٌ من الماء»");
    expect(von!.whyArabicSpeakerFails).toContain("une bouteille d'eau");
    expect(von!.whyArabicSpeakerFails).toContain("فهنا تساعدك العربية");
    expect(von!.exercise).toMatchObject({ a: "Ich bekomme ein Glas Milch." });
    expect(soup!.commonError.de).toBe("~~Ich trinke eine Suppe.~~ (بالملعقة)");
    expect(soup!.correct.de).toBe("Ich esse eine Suppe.");
    // الاستعمال العربي والتونسي حجةً (لا اشتقاق مزعوم لاسم الشربة) · والاستثناء الصادق: حساء يُشرب من فنجان
    expect(soup!.whyArabicSpeakerFails).toContain("«نشربو الشربة»");
    expect(soup!.whyArabicSpeakerFails).toContain("إلا حساءً يُشرب من فنجان");
    expect(soup!.whyArabicSpeakerFails).not.toMatch(/اسمها نفسه من/);
    for (const c of u.zusammenfassung.warningCards) expect(c.whyArabicSpeakerFails).toContain("10‑ي");
    // البطاقات القديمة: ~~Tee, bitte!~~ (صحيحة جواباً قصيراً: Kaffee oder Tee? — Tee, bitte.) · «السوائل محايدة» (لا قاعدة كهذه) · Speise وحدها
    const cards = JSON.stringify(u.zusammenfassung.warningCards);
    expect(cards).not.toMatch(/Tee, bitte!~~|محايدة|Speise~~/);
    // لا Dativ بأداة · ولا kein/nicht (الدرس الرابع) · ولا möchte/will (الدرس الثالث) · ولا كلمات لاحقة أو غير مدروسة في أي نص ألماني للدرس
    const de = JSON.stringify({ e: u.einstieg, s: u.uebung.stations.map((st) => st.items.map((i) => ({ ...i, why: "" }))), q: u.quiz.variants.map((v) => v.items.map((i) => ({ ...i, why: "" }))), z: u.zusammenfassung.summary.de, w: u.zusammenfassung.warningCards.map((c) => [c.commonError.de, c.correct.de, c.exercise]) });
    expect(de).not.toMatch(/\b(von|mit|in|zu) (dem|der|meinem|meiner|deinem|deiner|seinem|seiner|ihrem|ihrer|einem|einer)\b|\bzur\b|\bzum\b|\bkein|\bnicht\b|möchte|\bwill\b|Getränk|Gast|Durst|Zucker|Kuchen|schmeckt|Orangensaft|Zitrone/);
    // N-069: يوسف لا يطلب الكحول — لا جملة ألمانية في الدرس فيها Yusuf أو ich مع Bier/Wein
    const sentences = de.split(/[.!?"]/);
    expect(sentences.filter((x) => /\b(Yusuf|Ich|ich)\b/.test(x) && /\b(Bier|Wein)\b/.test(x))).toEqual([]);
    // N-021: أمثلة البطاقات بلا أسماء علم · وD108: لا نص رسمي حرفي (Ein Glas Wasser, bitte · Die Speisekarte, bitte · Ein Bier, bitte)
    const sample = (id: string) => ALL_WORDS.find((w) => w.id === id)!.sampleSentence!.de;
    const ids = ["wasser", "milch", "saft", "bier", "wein", "tee", "trinken", "speisekarte", "bestellen", "glas", "flasche", "zahlen", "bar", "bekommen", "die-bitte"];
    expect(ids.map(sample).join(" ")).not.toMatch(/Lena|Yusuf|Berlin/);
    expect(ids.map(sample)).toEqual([
      "Ein Wasser, bitte!", "Kaffee mit Milch, bitte.", "Einen Saft, bitte!", "Der Mann bestellt ein Bier.", "Die Frau bekommt ein Glas Wein.",
      "In Tunesien trinken wir Tee im Glas.", "Ich trinke einen Kaffee.", "Hier ist die Speisekarte.", "Wir bestellen jetzt.",
      "Ich bekomme ein Glas Tee.", "Eine Flasche Wasser, bitte.", "Wir zahlen zusammen.", "Ich zahle bar.", "Ich bekomme einen Tee, bitte.",
      "Ich habe eine Bitte: langsam, bitte!",
    ]);
    // المشتِّتات ليست ألمانية صحيحة بمعنى آخر: لا «Ein Tee/Saft/Kaffee/Wein, bitte» (عامية صحيحة في المقهى) · لا «trinkt eine Suppe»
    // (صحيحة لحساء من فنجان) · لا «bestellt Sie» (تُقرأ «ماذا تطلب هي؟») · لا «Zahle, bitte» (أمر صحيح) · لا «zwei Glas» (صحيحة في الكميات)
    const choiceTexts = [...u.einstieg.pretestItems.flatMap((p) => p.choices), ...u.uebung.stations.flatMap((s) => s.items), ...u.quiz.variants.flatMap((v) => v.items)]
      .flatMap((i) => (typeof i === "string" ? [i] : Array.isArray((i as { choices?: unknown }).choices) ? ((i as { choices: string[] }).choices) : []));
    expect(choiceTexts.filter((c) => /\bEin (Tee|Saft|Kaffee|Wein)\b|trink\w* eine Suppe|bestellt Sie|Zahle, bitte|zwei Glas\b/.test(c))).toEqual([]);
    expect(choiceTexts.length).toBeGreaterThan(30);
    // الاستدعاء من دروس سابقة · ولا كلمة من درس سابق تُعرض «جديدة» (N-018)
    const earlier = new Set(ALL_LESSONS.filter((l) => l.unit <= 4 || l.id === "a1-u5-d1").flatMap((l) => l.praesentation.wordIds));
    expect(u.praesentation.wordIds.filter((id) => earlier.has(id))).toEqual([]);
    expect(u.warmup.cardIds).toEqual(["tasse", "kellner", "suppe"]);
    expect(u.warmup.cardIds.filter((id) => !earlier.has(id))).toEqual([]);
  });

  it("u5-d3 (D143): الطلب الحادّ (~~Ich will einen Kaffee.~~) · الفعل الثاني مصرَّف (~~Er möchte isst einen Kuchen.~~) · القياس (~~Ich habe satt.~~) — بمبررات صحيحة", () => {
    const u = ALL_LESSONS.find((l) => l.id === "a1-u5-d3")!;
    const [will, isst, satt] = u.zusammenfassung.warningCards;
    expect(will!.commonError.de).toBe("~~Ich will einen Kaffee.~~ (للنادل)");
    expect(will!.correct.de).toBe("Ich möchte einen Kaffee, bitte.");
    // مصيدة تداولية عربية حقيقية: «أريد» محايدة واللطف في «من فضلك» (وفي تونس «نحبّ قهوة») — والألمانية تحمله في صيغة الفعل · والفرنسية عونٌ مسمّى
    expect(will!.whyArabicSpeakerFails).toContain("«أريد قهوةً من فضلك» مهذبة بالعربية");
    expect(will!.whyArabicSpeakerFails).toContain("«نحبّ قهوة»");
    expect(will!.whyArabicSpeakerFails).toContain("je veux وje voudrais");
    expect(will!.exercise).toMatchObject({ a: "Ich möchte ein Wasser." });
    expect(isst!.commonError.de).toBe("~~Er möchte isst einen Kuchen.~~");
    expect(isst!.correct.de).toBe("Er möchte einen Kuchen essen.");
    // الفعل الثاني مصرَّف مع الفاعل وبعد الأول مباشرة («يريد أن يأكلَ» · «يحبّ ياكل») — بدل مصيدة zu القديمة (مصدرها الإنجليزية to لا العربية)
    expect(isst!.whyArabicSpeakerFails).toContain("«يريد أن يأكلَ كعكةً»");
    expect(isst!.whyArabicSpeakerFails).toContain("«يحبّ ياكل»");
    expect(isst!.exercise).toMatchObject({ a: "Du möchtest einen Tee trinken." });
    expect(satt!.commonError.de).toBe("~~Ich habe satt.~~");
    // العربية تساعد هنا («أنا شبعان» صفة) والخطأ قياسٌ على Hunger haben — لا «تداخل عربي» بلا دليل · وIch habe es satt = سئمتُ
    expect(satt!.whyArabicSpeakerFails).toContain("هنا تساعدك العربية");
    expect(satt!.whyArabicSpeakerFails).toContain("القياس على Hunger haben");
    expect(satt!.whyArabicSpeakerFails).toContain("Ich habe es satt (بـes) تعبيرٌ آخر معناه «سئمتُ»");
    expect(satt!.exercise).toMatchObject({ a: "habe / bist" });
    for (const c of u.zusammenfassung.warningCards) expect(c.whyArabicSpeakerFails).toContain("10‑ي");
    // البطاقات القديمة: ~~Ich möchte zu essen.~~ (مصدرها الإنجليزية لا «أن») · «يتبادلان» (Hunger/satt بلا دليل) · ~~das Ei~~/~~ein Eis~~ (زوج أدنى لا تداخل)
    expect(JSON.stringify(u.zusammenfassung.warningCards)).not.toMatch(/zu essen\.~~|يتبادلان|~~das Ei~~/);
    // لا kein/nicht (الدرس الرابع) · لا es gibt (u6-d3) · لا Dativ بأداة · وzum قطعة الوجبات وحدها (قرار D143) · ولا كلمات لاحقة
    const de = JSON.stringify({ e: u.einstieg, s: u.uebung.stations.map((st) => st.items.map((i) => ({ ...i, why: "" }))), q: u.quiz.variants.map((v) => v.items.map((i) => ({ ...i, why: "" }))), z: u.zusammenfassung.summary.de, w: u.zusammenfassung.warningCards.map((c) => [c.commonError.de, c.correct.de, c.exercise]) });
    expect(de).not.toMatch(/\b(von|mit|in|zu) (dem|der|meinem|meiner|deinem|deiner|seinem|seiner|ihrem|ihrer|einem|einer)\b|\bzur\b|\bkein|\bnicht\b|\bgibt\b|frisch|lecker|Getränk|Durst|Zucker|nichts|wenig|gleichfalls/);
    // zum في الفراغ تظهر بعد ملئه وحده («Was möchtest du ___ Frühstück?» والإجابة zum) — طفرة D143: «___ Mittag» أفلتت من النص الخام
    const gapFilled = u.uebung.stations.filter((st) => st.type === "gap-fill").flatMap((st) => st.items.map((i) => String(i.q).replace("___", String(i.a))));
    expect([...`${de} ${gapFilled.join(" ")}`.matchAll(/\bzum (\p{L}+)/gu)].map((m) => m[1]).filter((x) => !["Frühstück", "Mittagessen", "Abendessen"].includes(x!))).toEqual([]);
    expect(gapFilled.filter((t) => /\bzum Frühstück\b/.test(t))).toHaveLength(1);
    // N-069: يوسف لا يطلب الكحول ولا الخنزير
    const sentences = de.split(/[.!?"]/);
    expect(sentences.filter((x) => /\b(Yusuf|Ich|ich)\b/.test(x) && /\b(Bier|Wein|Wurst)\b/.test(x))).toEqual([]);
    // N-021: أمثلة البطاقات بلا أسماء علم · وD108: لا نص رسمي حرفي (Der Kuchen schmeckt super · Danke gleichfalls · Was für eine Farbe möchten Sie)
    const sample = (id: string) => ALL_WORDS.find((w) => w.id === id)!.sampleSentence!.de;
    const ids = ["fruehstueck", "mittagessen", "abendessen", "butter", "marmelade", "kuchen", "eis", "appetit", "schmecken", "satt", "kartoffel", "tomate", "was-fuer-ein"];
    expect(ids.map(sample).join(" ")).not.toMatch(/Lena|Yusuf|Berlin/);
    expect(ids.map(sample)).toEqual([
      "Das Frühstück ist um acht.", "Das Mittagessen ist fertig!", "Was möchtest du zum Abendessen?", "Brot mit Butter, bitte.",
      "Ich esse Brot mit Marmelade.", "Der Kuchen schmeckt gut!", "Ich möchte ein Eis, bitte.", "Guten Appetit! – Danke, guten Appetit!",
      "Das schmeckt sehr gut!", "Ich bin satt, danke.", "Ich esse Kartoffeln und Fleisch.", "Einen Salat mit Tomaten, bitte!",
      "Was für ein Eis isst du gern?",
    ]);
    // المشتِّتات ليست ألمانية صحيحة بمعنى آخر: لا «Ich will …» (صحيحة نحواً — المصيدة تداولية) · لا «Was für Kuchen/Eis …» بلا ein (صحيحة للجمع
    // والمادة) · لا «es satt» (سئمتُ) · لا «zwei Eis» (حصتان) · لا «möchtet/wollt» (صحيحتان مع ihr) · ولا صيغ مخترعة (willt · wollst)
    const choiceTexts = [...u.einstieg.pretestItems.flatMap((p) => p.choices), ...u.uebung.stations.flatMap((s) => s.items), ...u.quiz.variants.flatMap((v) => v.items)]
      .flatMap((i) => (typeof i === "string" ? [i] : Array.isArray((i as { choices?: unknown }).choices) ? ((i as { choices: string[] }).choices) : []));
    // (الخيارات الألمانية وحدها — خيار الاستماع العربي «لأن «Ich will» تبدو كطلب طفل» يسمّي الجملة ولا يقترحها)
    expect(choiceTexts.filter((c) => !/[\u0600-\u06FF]/.test(c) && /\b[Ii]ch will\b|Was für (Kuchen|Eis|Salat|Suppe|Tee|Marmelade|Kartoffeln)\b|es satt|zwei Eis\b|möchtet|wollt\b|willt|wollst|willen/.test(c))).toEqual([]);
    expect(choiceTexts.length).toBeGreaterThan(30);
    // الاستدعاء من دروس سابقة (Mittag · Abend جزءا المركّبين · mögen أصل möchte) · ولا كلمة من درس سابق تُعرض «جديدة» (N-018)
    const earlier = new Set(ALL_LESSONS.filter((l) => l.unit <= 4 || ["a1-u5-d1", "a1-u5-d2"].includes(l.id)).flatMap((l) => l.praesentation.wordIds));
    expect(u.praesentation.wordIds.filter((id) => earlier.has(id))).toEqual([]);
    expect(u.warmup.cardIds).toEqual(["mittag", "abend", "moegen"]);
    expect(u.warmup.cardIds.filter((id) => !earlier.has(id))).toEqual([]);
  });

  it("u5-d4 (D144): النفي على «عند» (~~Ich habe nicht Gabel.~~) · «ليس» تُسقط ist (~~Die Suppe nicht scharf.~~) · «لا» قبل الفعل (~~Ich nicht zahle heute.~~) — بمبررات صحيحة", () => {
    const u = ALL_LESSONS.find((l) => l.id === "a1-u5-d4")!;
    const [noun, copula, order] = u.zusammenfassung.warningCards;
    expect(noun!.commonError.de).toBe("~~Ich habe nicht Gabel.~~");
    expect(noun!.correct.de).toBe("Ich habe keine Gabel.");
    // «ليس عندي شوكة» / «ما عنديش …»: النفي على «عند» والاسم كما هو — والاسم مفرد معدود بلا أداة (Gabel ← Gabeln) فلا قراءة صحيحة للخطأ
    // (nicht + اسم مادة أو جمع صحيحة في المقابلة «nicht Kaffee, sondern …» — فلم تُجعل مصيدة ولا مشتِّتاً)
    expect(noun!.whyArabicSpeakerFails).toContain("«ليس عندي شوكة»");
    expect(noun!.whyArabicSpeakerFails).toContain("«ما عنديش …»");
    expect(noun!.whyArabicSpeakerFails).toContain("وهي ein بحرف k");
    expect(noun!.exercise).toMatchObject({ a: "Lena hat keine Tasse." });
    expect(copula!.commonError.de).toBe("~~Die Suppe nicht scharf.~~");
    expect(copula!.correct.de).toBe("Die Suppe ist nicht scharf.");
    // «ليس» فعلٌ ناقص يحمل النفي والربط معاً · «الشربة موش حارّة» بلا فعل — امتداد needs-ist
    expect(copula!.whyArabicSpeakerFails).toContain("«ليس» فعلٌ ناقص يحمل النفي والربط معاً");
    expect(copula!.whyArabicSpeakerFails).toContain("«الشربة موش حارّة»");
    expect(copula!.exercise).toMatchObject({ a: "Der Fisch ist nicht frisch." });
    expect(order!.commonError.de).toBe("~~Ich nicht zahle heute.~~");
    expect(order!.correct.de).toBe("Ich zahle heute nicht.");
    expect(order!.whyArabicSpeakerFails).toContain("«لا أدفعُ اليوم»");
    expect(order!.exercise).toMatchObject({ a: "Wir bestellen jetzt nicht." });
    for (const c of u.zusammenfassung.warningCards) expect(c.whyArabicSpeakerFails).toContain("10‑ي");
    // البطاقات القديمة: ~~Ich möchte nicht Kaffee.~~ بتعليل «لا قبل الاسم» (وصف خاطئ للعربية) · ~~kein scharf~~ · نهايات kein «(Akk)» بلا دليل عربي
    expect(JSON.stringify(u.zusammenfassung.warningCards)).not.toMatch(/«لا» قبل الاسم|~~kein scharf~~|\(Akk\)/);
    // لا Dativ بأداة · لا zum/zur · لا es gibt · لا صفة منعوتة (kleine Portion — A2) · لا zu بمعنى «أكثر من اللازم» · ولا كلمات لاحقة أو غير مدروسة
    const de = JSON.stringify({ e: u.einstieg, s: u.uebung.stations.map((st) => st.items.map((i) => ({ ...i, why: "" }))), q: u.quiz.variants.map((v) => v.items.map((i) => ({ ...i, why: "" }))), z: u.zusammenfassung.summary.de, w: u.zusammenfassung.warningCards.map((c) => [c.commonError.de, c.correct.de, c.exercise]) });
    expect(de).not.toMatch(/\b(von|mit|in|zu) (dem|der|meinem|meiner|deinem|deiner|seinem|seiner|ihrem|ihrer|einem|einer)\b|\bzur\b|\bzum\b|\bgibt\b|\bvon\b|Tisch|braucht|\bSalz\b|kochen|backen|Mahlzeit|sofort|\bleer\b|Chips|beliebt|\bkalt|kleine|\bzu (scharf|salzig|viel|groß)\b/);
    // N-069: يوسف لا يطلب الكحول ولا الخنزير
    const sentences = de.split(/[.!?"]/);
    expect(sentences.filter((x) => /\b(Yusuf|Ich|ich)\b/.test(x) && /\b(Bier|Wein|Wurst)\b/.test(x))).toEqual([]);
    // N-021: أمثلة البطاقات بلا أسماء علم · وD108: لا نص رسمي حرفي (Die Suppe ist mir zu scharf · Das Messer ist sehr scharf · eine kleine Portion Eis)
    const sample = (id: string) => ALL_WORDS.find((w) => w.id === id)!.sampleSentence!.de;
    const ids = ["scharf", "salzig", "frisch", "portion", "teller", "loeffel", "gabel", "messer", "gast", "bestellung", "trinkgeld", "getraenk", "nichts", "wenig"];
    expect(ids.map(sample).join(" ")).not.toMatch(/Lena|Yusuf|Berlin/);
    expect(ids.map(sample)).toEqual([
      "Ist die Suppe scharf?", "Die Suppe ist sehr salzig.", "Das Gemüse ist frisch.", "Eine Portion Reis, bitte.", "Einen Teller Suppe, bitte!",
      "Hier ist ein Löffel.", "Fleisch mit Messer und Gabel.", "Das Messer ist scharf!", "Der Gast bestellt einen Kaffee.", "Die Bestellung ist fertig!",
      "Das Trinkgeld ist für Sie!", "Möchten Sie ein Getränk?", "Nein, danke, ich möchte nichts.", "Wir haben heute wenig Zeit.",
    ]);
    // المشتِّتات ليست ألمانية صحيحة بمعنى آخر: لا nicht + اسم مادة أو جمع (صحيحة في المقابلة) · لا keine + Messer/Löffel/Teller (جمعها كمفردها)
    // · لا kein(e)s الضمير · لا «nicht nichts» (نفي النفي صحيح) ولا «kein nichts» (das Nichts اسم) · لا «Ich möchte nicht.» (صحيحة)
    const choiceTexts = [...u.einstieg.pretestItems.flatMap((p) => p.choices), ...u.uebung.stations.flatMap((s) => s.items), ...u.quiz.variants.flatMap((v) => v.items)]
      .flatMap((i) => (typeof i === "string" ? [i] : Array.isArray((i as { choices?: unknown }).choices) ? ((i as { choices: string[] }).choices) : []));
    expect(choiceTexts.filter((c) => !/[\u0600-\u06FF]/.test(c) && /\bnicht (Kaffee|Fleisch|Brot|Wasser|Fisch|Messer|Löffel|Teller|Eier|Gläser)\b|\bkeine (Messer|Löffel|Teller)\b|\bkeine?s\b|nicht nichts|kein nichts|Ich möchte nicht\.|keinen\.$/.test(c))).toEqual([]);
    expect(choiceTexts.length).toBeGreaterThan(30);
    // الاستدعاء من دروس سابقة (das Glas · der Kellner · viel عكس wenig) · ولا كلمة من درس سابق تُعرض «جديدة» (N-018)
    const earlier = new Set(ALL_LESSONS.filter((l) => l.unit <= 4 || ["a1-u5-d1", "a1-u5-d2", "a1-u5-d3"].includes(l.id)).flatMap((l) => l.praesentation.wordIds));
    expect(u.praesentation.wordIds.filter((id) => earlier.has(id))).toEqual([]);
    expect(u.warmup.cardIds).toEqual(["glas", "kellner", "viel"]);
    expect(u.warmup.cardIds.filter((id) => !earlier.has(id))).toEqual([]);
  });

  it("u5-d5 (D145): kein قبل الملكية (~~Das ist kein mein Kaffee.~~) · nicht بعد الفعل مباشرة (~~Ich trinke nicht den Kaffee.~~) · «لستُ عطشاناً» (~~Ich bin nicht Durst.~~) — بمبررات صحيحة", () => {
    const u = ALL_LESSONS.find((l) => l.id === "a1-u5-d5")!;
    const [poss, pos, durst] = u.zusammenfassung.warningCards;
    expect(poss!.commonError.de).toBe("~~Das ist kein mein Kaffee.~~");
    expect(poss!.correct.de).toBe("Das ist nicht mein Kaffee.");
    // «موش قهوة/موش قهوتي» و«ليست قهوةً/ليست قهوتي»: حرف واحد للحالتين + kein الأمس للاسم — وmein تعيّن الاسم كـ«ال»
    expect(poss!.whyArabicSpeakerFails).toContain("«موش قهوة» و«موش قهوتي»");
    expect(poss!.whyArabicSpeakerFails).toContain("كما تعيّنه «ال» أو ياء المتكلم");
    expect(poss!.exercise).toMatchObject({ a: "Das ist nicht dein Teller." });
    expect(pos!.commonError.de).toBe("~~Ich trinke nicht den Kaffee.~~");
    expect(pos!.correct.de).toBe("Ich trinke den Kaffee nicht.");
    // «لا أشربُ القهوةَ» والفرنسية je ne bois pas le café — والإعلان الصادق: nicht قبل المعرّف للمقابلة فقط (فليست خطأً بكل قراءة)
    expect(pos!.whyArabicSpeakerFails).toContain("«لا أشربُ القهوةَ»");
    expect(pos!.whyArabicSpeakerFails).toContain("je ne bois pas le café");
    expect(pos!.whyArabicSpeakerFails).toContain("للمقابلة بين شيئين فقط");
    expect(pos!.exercise).toMatchObject({ a: "Ich esse das Hähnchen nicht." });
    expect(durst!.commonError.de).toBe("~~Ich bin nicht Durst.~~");
    expect(durst!.correct.de).toBe("Ich habe keinen Durst.");
    expect(durst!.whyArabicSpeakerFails).toContain("«ما نيش عطشان»");
    expect(durst!.exercise).toMatchObject({ a: "Lena hat keinen Hunger." });
    for (const c of u.zusammenfassung.warningCards) expect(c.whyArabicSpeakerFails).toContain("10‑ي");
    // البطاقات القديمة: ~~Ich bin Durst.~~/~~Ich habe satt.~~ (تكرار D141/D143 بادعاء «حالات») · ~~der Hähnchen~~ (قاعدة ‑chen من u2-d3) · ~~Ich nehme nicht Kuchen.~~ (nehmen u7-d4)
    expect(JSON.stringify(u.zusammenfassung.warningCards)).not.toMatch(/~~Ich habe satt|~~der Hähnchen|nehme/);
    // لا Dativ بأداة (an der Kasse) · لا zum · لا es gibt · لا nehmen (u7-d4) · لا Tisch (u6-d1) · لا als · لا أمر Sie · لا صفة مُسمّاة (nichts Scharfes) · ولا das Café (الوحدة 13 — خطة D113)
    const de = JSON.stringify({ e: u.einstieg, s: u.uebung.stations.map((st) => st.items.map((i) => ({ ...i, why: "" }))), q: u.quiz.variants.map((v) => v.items.map((i) => ({ ...i, why: "" }))), z: u.zusammenfassung.summary.de, w: u.zusammenfassung.warningCards.map((c) => [c.commonError.de, c.correct.de, c.exercise]) });
    expect(de).not.toMatch(/\b(von|mit|in|zu|an) (dem|der|meinem|meiner|deinem|deiner|seinem|seiner|ihrem|ihrer|einem|einer)\b|\bzur\b|\bzum\b|\bgibt\b|\bnehme|\bnimmt\b|\bTisch\b|\bals\b|Probieren Sie|Scharfes|Café|sondern|\bdir\b/i); // \bTisch\b: Nachtisch كلمة اليوم
    // N-069: يوسف لا يطلب الكحول ولا الخنزير
    const sentences = de.split(/[.!?"]/);
    expect(sentences.filter((x) => /\b(Yusuf|Ich|ich)\b/.test(x) && /\b(Bier|Wein|Wurst)\b/.test(x))).toEqual([]);
    // N-021: أمثلة البطاقات بلا أسماء علم · وD108: لا نص رسمي حرفي (Ich habe großen Durst · Zahlen Sie bitte an der Kasse · Ein Hähnchen mit Pommes)
    const sample = (id: string) => ALL_WORDS.find((w) => w.id === id)!.sampleSentence!.de;
    const ids = ["durst", "salz", "pfeffer", "zucker", "sahne", "limonade", "haehnchen", "nachtisch", "vorspeise", "kasse", "reservieren", "probieren", "kochen", "backen", "kueche", "gesund", "mahlzeit"];
    expect(ids.map(sample).join(" ")).not.toMatch(/Lena|Yusuf|Berlin/);
    expect(ids.map(sample)).toEqual([
      "Ich habe Durst!", "Salz und Pfeffer, bitte!", "Der Pfeffer ist scharf.", "Kaffee mit Zucker, bitte.", "Kuchen mit Sahne, bitte.", "Eine Limonade, bitte!",
      "Hähnchen mit Kartoffeln, bitte.", "Möchten Sie einen Nachtisch?", "Nein, danke, keine Vorspeise.", "Die Kasse ist dort.", "Ich möchte für morgen reservieren.",
      "Ich probiere den Kuchen.", "Ich koche Suppe.", "Die Mutter backt Kuchen.", "Die Küche ist klein.", "Obst ist gesund.", "Wir essen drei Mahlzeiten.",
    ]);
    // المشتِّتات ليست ألمانية صحيحة بمعنى آخر: لا nicht + اسم مادة/جمع/معرّف مباشرة (صحيحة في المقابلة) · لا «nicht mein …» مشتِّتاً حين الإجابة kein
    // (صحيحة بمعنى آخر) · لا «kein Zucker/Hunger» (عامية مسموعة) · لا «reservieren für morgen» (إخراج الجار صحيح في الكلام)
    const choiceTexts = [...u.einstieg.pretestItems.flatMap((p) => p.choices), ...u.uebung.stations.flatMap((s) => s.items), ...u.quiz.variants.flatMap((v) => v.items)]
      .flatMap((i) => (typeof i === "string" ? [i] : Array.isArray((i as { choices?: unknown }).choices) ? ((i as { choices: string[] }).choices) : []));
    const german = choiceTexts.filter((c) => !/[\u0600-\u06FF]/.test(c));
    expect(german.filter((c) => /\bnicht (den|die|das|Kaffee|Zucker|Sahne|Salz|Tee|Kuchen)\b|\bkein (Zucker|Hunger|Durst)\b|reservieren für/.test(c))).toEqual([]);
    for (const it of u.quiz.variants.flatMap((v) => v.items)) {
      if (Array.isArray(it.choices) && /\bkein\b/.test(String(it.a))) expect(it.choices.filter((c) => /\bnicht (mein|dein|sein)\b/.test(String(c)))).toEqual([]);
    }
    expect(choiceTexts.length).toBeGreaterThan(30);
    // الاستدعاء من دروس سابقة (der Kuchen ↔ die Küche · mein · der Hunger) · ولا كلمة من درس سابق تُعرض «جديدة» (N-018)
    const earlier = new Set(ALL_LESSONS.filter((l) => l.unit <= 4 || ["a1-u5-d1", "a1-u5-d2", "a1-u5-d3", "a1-u5-d4"].includes(l.id)).flatMap((l) => l.praesentation.wordIds));
    expect(u.praesentation.wordIds.filter((id) => earlier.has(id))).toEqual([]);
    expect(u.warmup.cardIds).toEqual(["kuchen", "mein", "hunger"]);
    expect(u.warmup.cardIds.filter((id) => !earlier.has(id))).toEqual([]);
  });

  it("u6-d1 (D146): المعدود بعد 11–99 مفرد بالعربية (~~zwanzig Stuhl~~) · ü بلا مقابل عربي (~~die Stuhle~~) · جنس «الخزانة» لا ينتقل (~~die Schrank~~) — بمبررات صحيحة", () => {
    const u = ALL_LESSONS.find((l) => l.id === "a1-u6-d1")!;
    const [num, uml, gen] = u.zusammenfassung.warningCards;
    expect(num!.commonError.de).toBe("~~zwanzig Stuhl~~");
    expect(num!.correct.de).toBe("zwanzig Stühle");
    // العدد والمعدود: 3–10 جمع (عون) · 11–99 مفرد منصوب · المئة والألف مفرد مجرور — والألمانية جمع بعد كل عدد فوق الواحد
    expect(num!.whyArabicSpeakerFails).toContain("«ثلاثة كراسٍ»");
    expect(num!.whyArabicSpeakerFails).toContain("«عشرون كرسياً»");
    expect(num!.whyArabicSpeakerFails).toContain("«مئة كرسيّ»");
    expect(num!.exercise).toMatchObject({ a: "Das Restaurant hat dreißig Tische." });
    expect(uml!.commonError.de).toBe("~~die Stuhle~~");
    expect(uml!.correct.de).toBe("die Stühle");
    expect(uml!.whyArabicSpeakerFails).toContain("ü حركة أمامية مدوّرة لا مقابل لها في العربية");
    expect(uml!.exercise).toMatchObject({ a: "zwei Schränke" });
    expect(gen!.commonError.de).toBe("~~die Schrank~~");
    expect(gen!.correct.de).toBe("der Schrank");
    expect(gen!.whyArabicSpeakerFails).toContain("«الخزانة» و«الطاولة» و«الأريكة» مؤنثة");
    expect(gen!.exercise).toMatchObject({ a: "Der Tisch ist neu." });
    for (const c of u.zusammenfassung.warningCards) expect(c.whyArabicSpeakerFails).toContain("10‑ي");
    // البطاقات القديمة: «‑en/‑er كثيراً neuter» (تعميم بلا أساس) · ~~der Bett~~/~~die Kissen~~ (die Kissen جمع صحيح!) · Gärten (كلمة u6-d2)
    expect(JSON.stringify(u.zusammenfassung.warningCards)).not.toMatch(/neuter|~~der Bett~~|~~die Kissen~~|Gärten/);
    // لا Dativ بأداة (auf dem Tisch · im Schrank — Wechselpräpositionen في الوحدة 9) · لا es gibt (u6-d3) · لا كلمات الغرف والشقة اللاحقة · ولا voll/bequem/hart
    const de = JSON.stringify({ e: u.einstieg, s: u.uebung.stations.map((st) => st.items.map((i) => ({ ...i, why: "" }))), q: u.quiz.variants.map((v) => v.items.map((i) => ({ ...i, why: "" }))), z: u.zusammenfassung.summary.de, w: u.zusammenfassung.warningCards.map((c) => [c.commonError.de, c.correct.de, c.exercise]) });
    expect(de).not.toMatch(/\b(von|mit|in|zu|an|auf) (dem|der|meinem|meiner|deinem|deiner|seinem|seiner|ihrem|ihrer|einem|einer)\b|\b(im|am|zum|zur|ins|da)\b|\bgibt\b|Zimmer|Möbel|Fenster|\bTür|\bWand\b|\bvoll\b|bequem|\bhart\b|Umlaut/);
    const sentences = de.split(/[.!?"]/);
    expect(sentences.filter((x) => /\b(Yusuf|Ich|ich)\b/.test(x) && /\b(Bier|Wein|Wurst)\b/.test(x))).toEqual([]);
    // N-021: أمثلة البطاقات بلا أسماء علم · وD108: لا نص رسمي حرفي (Das Sofa ist neu · Wie breit ist der Schrank)
    const sample = (id: string) => ALL_WORDS.find((w) => w.id === id)!.sampleSentence!.de;
    const ids = ["tisch", "stuhl", "sofa", "bett", "schrank", "lampe", "teppich", "sessel", "regal", "spiegel", "vorhang", "kissen", "breit"];
    expect(ids.map(sample).join(" ")).not.toMatch(/Lena|Yusuf|Berlin|Das Sofa ist neu|Wie breit/);
    expect(ids.map(sample)).toEqual([
      "Der Tisch ist groß, die Stühle sind klein.", "Hier sind zwei Stühle.", "Ich habe kein Sofa.", "Wir kaufen zwei Betten.", "Ich habe einen Schrank.",
      "Ich kaufe eine Lampe.", "Der Teppich ist schön.", "Der Sessel ist alt, aber schön.", "Rechts sind zwei Regale.", "Links ist ein Spiegel.",
      "Ich habe keine Vorhänge.", "Das Sofa hat sechs Kissen.", "Das Bett ist sehr breit.",
    ]);
    // المشتِّتات ليست ألمانية صحيحة بمعنى آخر: لا صيغة Dativ جمع (Tischen · Stühlen … صحيحة في «mit …») · لا «keine Lampe» (مفرد صحيح)
    // · لا «die Spiegel/Kissen/Sessel» مع sind مشتِّتاً (جمع صحيح)
    const choiceTexts = [...u.einstieg.pretestItems.flatMap((p) => p.choices), ...u.uebung.stations.flatMap((s) => s.items), ...u.quiz.variants.flatMap((v) => v.items)]
      .flatMap((i) => (typeof i === "string" ? [i] : Array.isArray((i as { choices?: unknown }).choices) ? ((i as { choices: string[] }).choices) : []));
    const german = choiceTexts.filter((c) => !/[\u0600-\u06FF]/.test(c));
    expect(german.filter((c) => /\b(Tischen|Stühlen|Schränken|Teppichen|Regalen|Vorhängen|Spiegeln|Sesseln)\b|\bkeine (Lampe|Gabel|Tasse)\b/.test(c))).toEqual([]);
    for (const it of u.quiz.variants.flatMap((v) => v.items)) {
      if (Array.isArray(it.choices)) expect(it.choices.filter((c) => c !== it.a && /^Die (Spiegel|Kissen|Sessel) sind\b/.test(String(c)))).toEqual([]);
    }
    expect(choiceTexts.length).toBeGreaterThan(30);
    // الاستدعاء من دروس سابقة (die Wohnung · der Apfel ← die Äpfel · die Mutter ← die Mütter) · ولا كلمة من درس سابق تُعرض «جديدة» (N-018)
    const earlier = new Set(ALL_LESSONS.filter((l) => l.unit <= 5).flatMap((l) => l.praesentation.wordIds));
    expect(u.praesentation.wordIds.filter((id) => earlier.has(id))).toEqual([]);
    expect(u.warmup.cardIds).toEqual(["wohnung", "apfel", "mutter"]);
    expect(u.warmup.cardIds.filter((id) => !earlier.has(id))).toEqual([]);
  });

  it("u6-d2 (D147): أداة الجزء الأول لا تنتقل (~~die Familienname~~) · الإضافة كلمتان (~~Wohn Zimmer~~) · الخبر العربي يطابق المبتدأ (~~Die Wohnung ist ruhige.~~) — بمبررات صحيحة", () => {
    const u = ALL_LESSONS.find((l) => l.id === "a1-u6-d2")!;
    const [head, one, pred] = u.zusammenfassung.warningCards;
    expect(head!.commonError.de).toBe("~~die Familienname~~");
    expect(head!.correct.de).toBe("der Familienname");
    // الأصل أولاً في الإضافة العربية («اسمُ العائلة») فيأخذ المتعلم أداة أول جزء — والألمانية من آخر جزء
    expect(head!.whyArabicSpeakerFails).toContain("«اسمُ العائلة»");
    expect(head!.whyArabicSpeakerFails).toContain("der Name ⇒ der Familienname");
    expect(head!.exercise).toMatchObject({ a: "Das Mittagessen ist gut." });
    expect(one!.commonError.de).toBe("~~Wohn Zimmer~~");
    expect(one!.correct.de).toBe("das Wohnzimmer");
    // الإضافة كلمتان و«ال» على الثانية · والإنجليزية living room كلمتان — التأثير الإنجليزي معلن بأنه إنجليزي
    expect(one!.whyArabicSpeakerFails).toContain("«غرفة النوم»");
    expect(one!.whyArabicSpeakerFails).toContain("الإنجليزية living room");
    expect(one!.exercise).toMatchObject({ a: "Meine Telefonnummer ist neu." });
    expect(pred!.commonError.de).toBe("~~Die Wohnung ist ruhige.~~");
    expect(pred!.correct.de).toBe("Die Wohnung ist ruhig.");
    expect(pred!.whyArabicSpeakerFails).toContain("«الشقةُ هادئةٌ»");
    expect(pred!.exercise).toMatchObject({ a: "Die Küche ist klein." });
    for (const c of u.zusammenfassung.warningCards) expect(c.whyArabicSpeakerFails).toContain("10‑ي");
    // البطاقات القديمة: «للمرة الرابعة» · ~~die Gärten~~ (die Gärten جمع صحيح!) · «ue في slugs» ورسم gemuetlich (معرّف داخلي أمام المتعلم — D118)
    expect(JSON.stringify(u.zusammenfassung.warningCards)).not.toMatch(/للمرة الرابعة|~~die Gärten~~|slugs|gemuetlich/);
    // لا Dativ بأداة (im Schlafzimmer — أين؟ في u6-d4) · لا es gibt (u6-d3) · لا كلمات الغرف اللاحقة (Fenster · Tür · Wand · Möbel · oben) · لا schlafen · ولا مصطلح Umlaut
    // (audioId معرّف داخلي لا يُعرض — word-gemuetlich فيه مشروع)
    const de = JSON.stringify({ e: u.einstieg, s: u.uebung.stations.map((st) => st.items.map((i) => ({ ...i, why: "", audioId: "" }))), q: u.quiz.variants.map((v) => v.items.map((i) => ({ ...i, why: "" }))), z: u.zusammenfassung.summary.de, w: u.zusammenfassung.warningCards.map((c) => [c.commonError.de, c.correct.de, c.exercise]) });
    expect(de).not.toMatch(/\b(von|mit|in|zu|an|auf) (dem|der|meinem|meiner|deinem|deiner|seinem|seiner|ihrem|ihrer|einem|einer)\b|\b(im|am|zum|zur|ins|da)\b|\bgibt\b|Möbel|Fenster|\bTür|\bWand\b|\boben\b|\bschlaf(e|en|t)?\b|Umlaut|gemuetlich/);
    // N-021: أمثلة البطاقات بلا أسماء علم · وD108: لا نص رسمي حرفي (Mein Zimmer ist sehr hell · Hier ist das Schlafzimmer · Er kommt allein)
    const sample = (id: string) => ALL_WORDS.find((w) => w.id === id)!.sampleSentence!.de;
    const ids = ["zimmer", "schlafzimmer", "wohnzimmer", "badezimmer", "flur", "balkon", "treppe", "keller", "garten", "hell", "ruhig", "gemuetlich", "hoch", "allein", "raum"];
    expect(u.praesentation.wordIds).toEqual(ids);
    expect(ids.map(sample).join(" ")).not.toMatch(/Lena|Yusuf|Berlin|Mein Zimmer ist sehr hell|Hier ist das Schlafzimmer|Er kommt allein/);
    expect(ids.map(sample)).toEqual([
      "Wie viele Zimmer hat das Haus?", "Das Schlafzimmer hat ein Bett und einen Schrank.", "Das Wohnzimmer ist groß und hell.", "Wir haben nur ein Badezimmer.",
      "Links ist der Flur, rechts ist das Badezimmer.", "Ich habe keinen Balkon.", "Die Treppe ist lang.", "Das Haus hat einen Keller.", "Die Großeltern haben einen Garten.",
      "Das Badezimmer ist klein, aber hell.", "Die Wohnung ist ruhig.", "Mein Zimmer ist klein, aber gemütlich.", "Das Haus ist sehr hoch.", "Ich wohne allein.", "Der Raum ist hoch und hell.",
    ]);
    // المشتِّتات ليست ألمانية صحيحة بمعنى آخر: لا «Die …zimmer/Keller sind» مشتِّتاً (جمع صحيح — الجمع كالمفرد) · لا kein + مذكر مفعولاً (عامية «kein Garten»)
    // · لا ‑e على صفة بعد ist إلا مشتِّتاً · ولا «große» (تصادم جذع مع Größe — N-060)
    const choiceItems = [...u.uebung.stations.flatMap((s) => s.items), ...u.quiz.variants.flatMap((v) => v.items)]
      .flatMap((i) => (Array.isArray((i as { choices?: unknown }).choices) ? [i as unknown as { choices: string[]; a: string }] : []));
    const pre = u.einstieg.pretestItems.flatMap((p) => (p.choices ? [{ choices: [...p.choices], a: p.answer }] : []));
    const german = [...choiceItems, ...pre].flatMap((i) => i.choices.filter((c) => c !== i.a && !/[\u0600-\u06FF]/.test(c)));
    expect(german.filter((c) => /^Die \p{L}*(zimmer|Zimmer|Keller) sind\b|\bkein (Garten|Balkon|Keller|Flur|Raum)\b|\bgroße\b/u.test(c))).toEqual([]);
    for (const i of [...choiceItems, ...pre]) expect(/ ist \p{L}+e\.$/u.test(i.a), i.a).toBe(false);
    // وصواب الفراغ والترتيب كذلك: لا ‑e على صفة الخبر بعد ist/sind (Die Wohnung ist klein und ruhig.)
    const gapFilled = u.uebung.stations.find((s) => s.type === "gap-fill")!.items.map((i) => String(i.q).replace("___", String(i.a)).split("(")[0]!.trim());
    const built = u.uebung.stations.find((s) => s.type === "build-sentence")!.items.map((i) => String(i.a));
    expect([...gapFilled, ...built].filter((x) => /\b(ist|sind) (sehr )?(\p{L}+ und )?\p{L}+e\.$/u.test(x))).toEqual([]);
    expect(german).toHaveLength(14); // الاختبار القبلي 2 + ست جمل Quiz × 2
    // الاستدعاء من دروس سابقة (ثلاثة مركّبات: der Familienname · die Telefonnummer · die Speisekarte) · ولا كلمة من درس سابق تُعرض «جديدة» (N-018)
    const earlier = new Set(ALL_LESSONS.filter((l) => l.unit <= 5 || l.id === "a1-u6-d1").flatMap((l) => l.praesentation.wordIds));
    expect(u.praesentation.wordIds.filter((id) => earlier.has(id))).toEqual([]);
    expect(u.warmup.cardIds).toEqual(["familienname", "telefonnummer", "speisekarte"]);
    expect(u.warmup.cardIds.filter((id) => !earlier.has(id))).toEqual([]);
  });

  it("u6-d3 (D148): الاسم بعد «يوجد» فاعلٌ مرفوع (~~Es gibt ein Tisch.~~) · لا ضمير شكلي (~~Gibt einen Balkon?~~) · «كلّ» لا تتغيّر (~~jeder Zimmer~~) — بمبررات صحيحة", () => {
    const u = ALL_LESSONS.find((l) => l.id === "a1-u6-d3")!;
    const [akk, es, jed] = u.zusammenfassung.warningCards;
    expect(akk!.commonError.de).toBe("~~Es gibt ein Tisch.~~");
    expect(akk!.correct.de).toBe("Es gibt einen Tisch.");
    expect(akk!.whyArabicSpeakerFails).toContain("«يوجد مكتبٌ»");
    expect(akk!.whyArabicSpeakerFails).toContain("مبتدأ مؤخر مرفوع");
    expect(akk!.exercise).toMatchObject({ a: "Es gibt keinen Schreibtisch." });
    expect(es!.commonError.de).toBe("~~Gibt einen Balkon?~~");
    expect(es!.correct.de).toBe("Gibt es einen Balkon?");
    expect(es!.whyArabicSpeakerFails).toContain("العربية بلا ضمير شكلي");
    expect(es!.whyArabicSpeakerFails).toContain("الفرنسية il y a");
    expect(es!.exercise).toMatchObject({ a: "Hier gibt es einen Kühlschrank." });
    expect(jed!.commonError.de).toBe("~~jeder Zimmer~~");
    expect(jed!.correct.de).toBe("jedes Zimmer");
    expect(jed!.whyArabicSpeakerFails).toContain("«كلُّ غرفةٍ»");
    expect(jed!.whyArabicSpeakerFails).toContain("every الإنجليزية");
    expect(jed!.exercise).toMatchObject({ a: "Jedes Fenster ist groß." });
    for (const c of u.zusammenfassung.warningCards) expect(c.whyArabicSpeakerFails).toContain("10‑ي");
    // البطاقات القديمة: «لا Dativ» (والخطأ ~~Es gibt der Tisch.~~ رفعٌ لا جرّ) · «الآلات مؤنثة غالباً» (الحاسوب والتلفاز مذكران) · «Kühle+Schrank» (الصواب kühl) و«للمرة الخامسة»
    expect(JSON.stringify(u.zusammenfassung.warningCards)).not.toMatch(/لا Dativ|الآلات مؤنثة|Kühle|للمرة الخامسة|Es gibt der/);
    // لا Dativ بأداة (in der Küche — أين؟ في u6-d4) · لا كلمات u6-d4 اللاحقة (oben · unten · Ecke · stellen …) ولا Möbel (u6-d5) · ولا مصطلحا Akkusativ/Dativ
    const de = JSON.stringify({ e: u.einstieg, s: u.uebung.stations.map((st) => st.items.map((i) => ({ ...i, why: "", audioId: "" }))), q: u.quiz.variants.map((v) => v.items.map((i) => ({ ...i, why: "" }))), z: u.zusammenfassung.summary.de, w: u.zusammenfassung.warningCards.map((c) => [c.commonError.de, c.correct.de, c.exercise]) });
    expect(de).not.toMatch(/\b(von|mit|in|zu|an|auf) (dem|der|meinem|meiner|deinem|deiner|seinem|seiner|ihrem|ihrer|einem|einer)\b|\b(im|am|zum|zur|ins|da)\b|Möbel|\boben\b|\bunten\b|\bEcke\b|\bstellen\b|\blegen\b|Akkusativ|Dativ|\bgeben\b/);
    // N-021: أمثلة البطاقات بلا أسماء علم · وD108: لا نص رسمي حرفي (Das Licht ist aus · Die Waschmaschine ist günstig · Der Fernseher ist kaputt)
    const sample = (id: string) => ALL_WORDS.find((w) => w.id === id)!.sampleSentence!.de;
    const ids = ["fenster", "tuer", "wand", "boden", "decke", "heizung", "kuehlschrank", "waschmaschine", "fernseher", "computer", "schreibtisch", "dach", "jeder", "an-sein", "aus-sein"];
    expect(u.praesentation.wordIds).toEqual(ids);
    expect(ids.map(sample).join(" ")).not.toMatch(/Lena|Yusuf|Berlin|Das Licht ist aus|Die Waschmaschine ist günstig|Der Fernseher ist kaputt/);
    expect(ids.map(sample)).toEqual([
      "Das Zimmer hat zwei Fenster.", "Links ist die Tür.", "Die Wände sind hell.", "Der Boden ist alt, aber schön.", "Die Decke ist sehr hoch.",
      "Gibt es eine Heizung?", "Es gibt einen Kühlschrank.", "Wir haben keine Waschmaschine.", "Es gibt keinen Fernseher.", "Ich habe einen Computer.",
      "Rechts ist ein Schreibtisch.", "Das Haus ist alt, aber das Dach ist neu.", "Jeder Raum hat ein Fenster.", "Der Computer ist an.", "Die Heizung ist aus.",
    ]);
    // المشتِّتات ليست ألمانية صحيحة بمعنى آخر: لا ein/kein + مذكر بعد es gibt (عامية «ein Tisch») · لا «Gibt einen …» بلا es (حذف es العامي)
    // · لا «Es gibt einen …?» بنبرة سؤال (صحيحة) · لا geben (غير مدروسة) · ولا خيار ألماني لمعنى an/aus (Der Fernseher ist aus صحيحة بمعنى آخر)
    const choiceItems = [...u.uebung.stations.flatMap((s) => s.items), ...u.quiz.variants.flatMap((v) => v.items)]
      .flatMap((i) => (Array.isArray((i as { choices?: unknown }).choices) ? [i as unknown as { choices: string[]; a: string }] : []));
    const pre = u.einstieg.pretestItems.flatMap((p) => (p.choices ? [{ choices: [...p.choices], a: p.answer }] : []));
    const german = [...choiceItems, ...pre].flatMap((i) => i.choices.filter((c) => c !== i.a && !/[\u0600-\u06FF]/.test(c)));
    expect(german.filter((c) => /\b(ein|kein) (Tisch|Computer|Schreibtisch|Fernseher|Kühlschrank|Balkon|Boden|Raum)\b|^Gibt (ein|kein)|^Es gibt .*\?$|\bgeben\b|\b(an|aus)\.$/u.test(c))).toEqual([]);
    expect(german).toHaveLength(18); // الاختبار القبلي 2 + ثماني جمل Quiz × 2
    // الاستدعاء من دروس سابقة (أمثلتها مفعولٌ به بعد haben: einen Schrank · keinen Balkon · einen Keller) · ولا كلمة من درس سابق تُعرض «جديدة» (N-018)
    const earlier = new Set(ALL_LESSONS.filter((l) => l.unit <= 5 || ["a1-u6-d1", "a1-u6-d2"].includes(l.id)).flatMap((l) => l.praesentation.wordIds));
    expect(u.praesentation.wordIds.filter((id) => earlier.has(id))).toEqual([]);
    expect(u.warmup.cardIds).toEqual(["schrank", "balkon", "keller"]);
    expect(u.warmup.cardIds.filter((id) => !earlier.has(id))).toEqual([]);
  });

  it("u6-d4 (D149): الجرّ العربي دائم (~~Ich stelle die Lampe in der Ecke.~~) · «وضع» فعلٌ واحد (~~Ich lege die Tasse auf den Tisch.~~) · «أين تضع؟» (~~Wo stellst du den Tisch?~~) — بمبررات صحيحة", () => {
    const u = ALL_LESSONS.find((l) => l.id === "a1-u6-d4")!;
    const [kasus, verb, frage] = u.zusammenfassung.warningCards;
    expect(kasus!.commonError.de).toBe("~~Ich stelle die Lampe in der Ecke.~~");
    expect(kasus!.correct.de).toBe("Ich stelle die Lampe in die Ecke.");
    expect(kasus!.whyArabicSpeakerFails).toContain("حرف الجر العربي يجرّ دائماً مهما كان السؤال");
    expect(kasus!.whyArabicSpeakerFails).toContain("«وضعتُ المصباحَ في الركنِ»");
    expect(kasus!.exercise).toMatchObject({ a: "Ich stelle den Stuhl an den Tisch." });
    expect(verb!.commonError.de).toBe("~~Ich lege die Tasse auf den Tisch.~~");
    expect(verb!.correct.de).toBe("Ich stelle die Tasse auf den Tisch.");
    expect(verb!.whyArabicSpeakerFails).toContain("«حطّ»");
    expect(verb!.whyArabicSpeakerFails).toContain("put الإنجليزية وmettre الفرنسية");
    // الجملة المشطوبة صحيحة نحواً بمعنى آخر (الفنجان مستلقٍ على جنبه) — والبطاقة تقول ذلك صراحة لا «خطأ نحوي»
    expect(verb!.whyArabicSpeakerFails).toContain("مستلقٍ على جنبه");
    expect(verb!.exercise).toMatchObject({ a: "Ich lege den Schlüssel auf den Tisch." });
    expect(frage!.commonError.de).toBe("~~Wo stellst du den Tisch?~~");
    expect(frage!.correct.de).toBe("Wohin stellst du den Tisch?");
    expect(frage!.whyArabicSpeakerFails).toContain("«أين تضع الطاولة؟»");
    expect(frage!.whyArabicSpeakerFails).toContain("«وين ماشي؟»");
    expect(frage!.exercise).toMatchObject({ a: "Wohin legst du das Handy?" });
    for (const c of u.zusammenfassung.warningCards) expect(c.whyArabicSpeakerFails).toContain("10‑ي");
    // البطاقات القديمة: «stellen (تِلْ)» رمز مشوّه · ««أين» واحدة بالعربية» («إلى أين» موجودة — النقل من «أين» مع «وضع») · ~~Ich lege den Tisch.~~ ناقصة بلا مكان
    expect(JSON.stringify(u.zusammenfassung.warningCards)).not.toMatch(/تِلْ|«أين» واحدة|~~Ich lege den Tisch\.~~|Akkusativ|Dativ/);
    // Quiz القديم: «oben / unten» بشرطة مائلة · «Dativ (Wo ist das Bild? — An der Wand)» مصطلحٌ وشرح داخل الإجابة · والتخمين القبلي يكشف إجابته
    expect(JSON.stringify(u.quiz)).not.toMatch(/oben \/ unten|Dativ \(/);
    expect(JSON.stringify(u.einstieg)).not.toMatch(/Akkusativ|Dativ|Wohin\?/);
    // N-021: أمثلة البطاقات بلا أسماء علم · وD108: لا نص رسمي حرفي (Ich wohne oben · Daneben ist die Bank · Herr Meier ist schon weg · Das Poster hängt über dem Bett)
    const sample = (id: string) => ALL_WORDS.find((w) => w.id === id)!.sampleSentence!.de;
    const ids = ["ecke", "mitte", "oben", "unten", "ueber", "unter", "hinter", "auf", "stellen", "legen", "haengen", "wohin", "da", "daneben", "weg-sein"];
    expect(u.praesentation.wordIds).toEqual(ids);
    expect(ids.map(sample).join(" ")).not.toMatch(/Lena|Yusuf|Berlin|Ich wohne oben|Daneben ist die Bank|ist schon weg|Das Poster hängt/);
    expect(ids.map(sample)).toEqual([
      "In der Ecke steht ein Regal.", "Der Tisch steht in der Mitte.", "Mein Zimmer ist oben.", "Unten gibt es einen Keller.", "Über dem Sofa hängt ein Spiegel.",
      "Das Handy ist unter dem Kissen.", "Hinter der Tür steht ein Stuhl.", "Die Tasse steht auf dem Tisch.", "Ich stelle die Lampe auf den Tisch.", "Ich lege das Handy auf das Bett.",
      "Ich hänge den Spiegel an die Wand.", "Wohin stellst du den Schrank?", "Da ist die Katze!", "Hier ist das Sofa, und daneben steht eine Lampe.", "Mein Schlüssel ist weg!",
    ]);
    // المشتِّتات ليست ألمانية صحيحة بمعنى آخر: لا فعل وضعٍ آخر لشيء ممكن الوضع (Ich lege die Tasse … صحيحة لفنجان مقلوب) · لا «hängt über» + مفعولٍ بجنسه الصحيح
    // (über + مفعول مع hängen اللازم ممكنة: «Die Haare hängen über die Schultern» — أما «über die Tisch» فجنسٌ خاطئ) · لا «Wo … ?» للوضع (العامية الجنوبية قد تقولها) · لا وضع + أداة مكان مع aufhängen المحتملة (hänge … an der Wand)
    // — فالمشتِّت إما أداة بجنس آخر (in den Ecke · über der Tisch) وإما وضع + أداة مكان مع stellen/legen وحدهما · أو فعلٌ لازم بمفعول (stehe den Stuhl) · أو متعدٍّ بلا مفعول (Das Sofa stellt …)
    const choiceItems = [...u.uebung.stations.flatMap((s) => s.items), ...u.quiz.variants.flatMap((v) => v.items)]
      .flatMap((i) => (Array.isArray((i as { choices?: unknown }).choices) ? [i as unknown as { choices: string[]; a: string }] : []));
    const pre = u.einstieg.pretestItems.flatMap((p) => (p.choices ? [{ choices: [...p.choices], a: p.answer }] : []));
    const german = [...choiceItems, ...pre].flatMap((i) => i.choices.filter((c) => c !== i.a && !/[\u0600-\u06FF]/.test(c)));
    expect(german.filter((c) => /\blege (die Tasse|das Glas)|\bstelle (den Teppich|das Bild)|hängt über (den Tisch|das (Bett|Sofa|Fenster)|die (Wand|Tür|Lampe|Ecke))|^Wo (stellst|legst|hängst)|\bhänge .* (an|auf) (der|dem) /u.test(c))).toEqual([]);
    expect(german).toHaveLength(20); // الاختبار القبلي 2 + ست جمل Quiz × 2 + ثلاثة بنود أفعال Quiz × 2
    // الاستدعاء من دروس سابقة (Wo wohnst du? · Ich sitze neben Oma. · Links steht mein Vater.) · ولا كلمة من درس سابق تُعرض «جديدة» (N-018)
    const earlier = new Set(ALL_LESSONS.filter((l) => l.unit <= 5 || ["a1-u6-d1", "a1-u6-d2", "a1-u6-d3"].includes(l.id)).flatMap((l) => l.praesentation.wordIds));
    expect(u.praesentation.wordIds.filter((id) => earlier.has(id))).toEqual([]);
    expect(u.warmup.cardIds).toEqual(["wo", "neben", "stehen"]);
    expect(u.warmup.cardIds.filter((id) => !earlier.has(id))).toEqual([]);
  });

  it("u6-d5 (D150): «عليه» حرفٌ ثم ضمير (~~Ich lege die Kissen auf es.~~) · الفعل المتقدّم مفرداً (~~Darauf steht zwei Vasen.~~) · «الأثاث» مفرد اللفظ (~~Die Möbel ist alt.~~) — بمبررات صحيحة", () => {
    const u = ALL_LESSONS.find((l) => l.id === "a1-u6-d5")!;
    const [prep, verb, moebel] = u.zusammenfassung.warningCards;
    expect(prep!.commonError.de).toBe("~~Ich lege die Kissen auf es.~~");
    expect(prep!.correct.de).toBe("Ich lege die Kissen darauf.");
    expect(prep!.whyArabicSpeakerFails).toContain("الحرف أولاً ثم الضمير المتصل");
    expect(prep!.whyArabicSpeakerFails).toContain("on it الإنجليزية");
    expect(prep!.exercise).toMatchObject({ a: "Ich lege das Handy darauf." });
    expect(verb!.commonError.de).toBe("~~Darauf steht zwei Vasen.~~");
    expect(verb!.correct.de).toBe("Darauf stehen zwei Vasen.");
    expect(verb!.whyArabicSpeakerFails).toContain("والفصحى تُفرد الفعل إذا تقدّم على فاعله");
    // es gibt وحدها لا تتغيّر (فاعلها es) — والعامية تجمع الفعل المتقدّم فتعين (عونٌ مسمّى لا ادعاء)
    expect(verb!.whyArabicSpeakerFails).toContain("وes gibt وحدها لا تتغيّر لأن فاعلها es");
    expect(verb!.whyArabicSpeakerFails).toContain("«جاو الصغار»");
    expect(verb!.exercise).toMatchObject({ a: "Daneben sind zwei Pflanzen." });
    expect(moebel!.commonError.de).toBe("~~Die Möbel ist alt.~~");
    expect(moebel!.correct.de).toBe("Die Möbel sind alt.");
    expect(moebel!.whyArabicSpeakerFails).toContain("furniture الإنجليزية");
    expect(moebel!.whyArabicSpeakerFails).toContain("les meubles sont");
    expect(moebel!.exercise).toMatchObject({ a: "Meine Möbel sind neu." });
    for (const c of u.zusammenfassung.warningCards) expect(c.whyArabicSpeakerFails).toContain("10‑ي");
    // البطاقات القديمة: ~~ein Möbel~~/~~das Möbel~~ (das Möbel موجودٌ نادراً — ليس خطأً) · «~~die Nachbarn~~ فقط» (die Nachbarn صحيحة) ومصطلح n-Deklination
    // · ~~Auf das steht eine Lampe.~~ (و«Auf dem steht …» الإشارية صحيحة في الكلام) — والتخمين القديم يكشف إجابته «(da + auf = darauf)»
    expect(JSON.stringify(u.zusammenfassung.warningCards)).not.toMatch(/~~ein Möbel~~|~~das Möbel~~|~~die Nachbarn~~|n-Deklination|Auf das steht|Pluralia/);
    expect(JSON.stringify(u.quiz)).not.toMatch(/Deklination|جمع فقط|die Etage \/ das Stockwerk/);
    expect(JSON.stringify(u.einstieg)).not.toMatch(/da \+ auf = darauf/);
    // المشتِّتات ليست ألمانية صحيحة بمعنى آخر: لا «auf dem/der …» الإشارية · لا den Nachbar (صيغة مقبولة — Wiktionary) · لا drauf/drin (عامية صحيحة)
    // · لا مفرد مع فاعلين متعاطفين (Darauf steht eine Vase und eine Lampe — مقبول) · لا darin للوضع (يحتمل مكان الفعل)
    const choiceItems = [...u.uebung.stations.flatMap((s) => s.items), ...u.quiz.variants.flatMap((v) => v.items)]
      .flatMap((i) => (Array.isArray((i as { choices?: unknown }).choices) ? [i as unknown as { choices: string[]; a: string }] : []));
    const pre = u.einstieg.pretestItems.flatMap((p) => (p.choices ? [{ choices: [...p.choices], a: p.answer }] : []));
    const german = [...choiceItems, ...pre].flatMap((i) => i.choices.filter((c) => c !== i.a && !/[\u0600-\u06FF]/.test(c)));
    expect(german.filter((c) => /\b(auf|in|unter|über|neben|hinter) (dem|der)\b|den Nachbar\b|\bdrauf\b|\bdrin\b| und (ein|eine) |\bdarin\.$/iu.test(c))).toEqual([]); // بلا حالة أحرف: «Auf dem steht …» أول الجملة (نجت طفرةٌ بالحرف الكبير في D150)
    expect(german).toHaveLength(20); // التخمين 2 + جمل Quiz (da · Möbel · الوضع) 6 × 2 + بنود المطابقة 3 × 2
    // الاستدعاء من الدرسين الماضيين (daneben · auf · Badezimmer) · ولا كلمة من درس سابق تُعرض «جديدة» (N-018)
    const earlier = new Set(ALL_LESSONS.filter((l) => l.unit <= 5 || ["a1-u6-d1", "a1-u6-d2", "a1-u6-d3", "a1-u6-d4"].includes(l.id)).flatMap((l) => l.praesentation.wordIds));
    expect(u.praesentation.wordIds.filter((id) => earlier.has(id))).toEqual([]);
    expect(u.warmup.cardIds).toEqual(["daneben", "auf", "badezimmer"]);
    expect(u.warmup.cardIds.filter((id) => !earlier.has(id))).toEqual([]);
  });

  it("u7-d1 (D151): «معظم الناس» إضافة (~~Meisten die Leute …~~) · «أستحمّ» للدُش والحوض (~~Ich bade jeden Morgen.~~ — صحيحة نحواً بمعنى آخر) · «أذهب لأنام» باللام (~~Ich gehe zu schlafen.~~) — بمبررات صحيحة", () => {
    const u = ALL_LESSONS.find((l) => l.id === "a1-u7-d1")!;
    const [meisten, baden, zu] = u.zusammenfassung.warningCards;
    expect(meisten!.commonError.de).toBe("~~Meisten die Leute trinken am Morgen Kaffee.~~");
    expect(meisten!.correct.de).toBe("Die meisten Leute trinken am Morgen Kaffee.");
    expect(meisten!.whyArabicSpeakerFails).toContain("«ال» على الكلمة الثانية وحدها");
    expect(meisten!.whyArabicSpeakerFails).toContain("most people الإنجليزية");
    expect(meisten!.exercise).toMatchObject({ a: "Die meisten Jungen schlafen gern lange." });
    expect(baden!.commonError.de).toBe("~~Ich bade jeden Morgen.~~");
    expect(baden!.correct.de).toBe("Ich dusche jeden Morgen.");
    // الجملة المشطوبة صحيحة نحواً بمعنى آخر (حوض الاستحمام كل صباح — أو السباحة) — والبطاقة تقول ذلك صراحة · والعامية والفرنسية عونان مسمّيان
    expect(baden!.whyArabicSpeakerFails).toContain("صحيحة نحواً بمعنى آخر");
    expect(baden!.whyArabicSpeakerFails).toContain("والقاموس يترجمها baden");
    expect(baden!.whyArabicSpeakerFails).toContain("«نعمل دوش» والفرنسية se doucher");
    expect(baden!.exercise).toMatchObject({ a: "Mein Bruder duscht am Morgen." });
    expect(zu!.commonError.de).toBe("~~Ich gehe zu schlafen.~~");
    expect(zu!.correct.de).toBe("Ich gehe jetzt schlafen.");
    expect(zu!.whyArabicSpeakerFails).toContain("«أذهبُ لأنام» باللام");
    expect(zu!.whyArabicSpeakerFails).toContain("go to sleep الإنجليزية");
    expect(zu!.whyArabicSpeakerFails).toContain("كما بعد möchte وwill");
    expect(zu!.exercise).toMatchObject({ a: "Um elf gehe ich schlafen." });
    for (const c of u.zusammenfassung.warningCards) expect(c.whyArabicSpeakerFails).toContain("10‑ي");
    // البطاقات القديمة: ~~Ich aufwache um sieben.~~ (قاعدة الأفعال المنفصلة u7-d5 — لا سحب) · ~~Ich habe müde~~ («أنا تعبان» صفةٌ تعين لا تخدع)
    // · «aufwachen = wecken» (الفعلان منفصلان في العربية أيضاً — عونٌ لا خطأ) بمصطلحي intransitiv/transitiv
    expect(JSON.stringify(u.zusammenfassung.warningCards)).not.toMatch(/aufwache|habe müde|intransitiv|transitiv/);
    expect(JSON.stringify(u.quiz)).not.toMatch(/→|aufwachen → |schlafen → er schläft/);
    expect(JSON.stringify(u.einstieg)).not.toMatch(/الفعل المنفصل/);
    // المشتِّتات ليست ألمانية صحيحة بمعنى آخر: لا «duscht/badet» بديلاً للآخر (كلاهما صحيح بمعناه) · لا aufwachen بمفعول (تخلطها لهجاتٌ ألمانية — DWB)
    // · لا aufwecken (صحيحة: Der Wecker weckt mich auf) · لا «ziehe … an» بلا mich (تحتمل «أشدّ»)
    const choiceItems = [...u.uebung.stations.flatMap((s) => s.items), ...u.quiz.variants.flatMap((v) => v.items)]
      .flatMap((i) => (Array.isArray((i as { choices?: unknown }).choices) ? [i as unknown as { choices: string[]; a: string }] : []));
    const pre = u.einstieg.pretestItems.flatMap((p) => (p.choices ? [{ choices: [...p.choices], a: p.answer }] : []));
    const german = [...choiceItems, ...pre].flatMap((i) => i.choices.filter((c) => c !== i.a && !/[\u0600-\u06FF]/.test(c)));
    expect(german.filter((c) => /\b(duscht|badet|dusche|bade)\b.*\b(Morgen|Abend|Sonntag)\b/iu.test(c) && !/Am Sonntag (Lena badet|badest Lena)/u.test(c))).toEqual([]);
    expect(german.filter((c) => /\bwacht\b.*\bauf\b|weckt\b.*\bauf\.|\bziehe\b(?!.*\bmich\b)/iu.test(c))).toEqual([]);
    expect(german).toHaveLength(18); // التخمين 2 + المشتِّتات الألمانية في Quiz: 8 بنود × 2
    // الاستدعاء من دروس سابقة (Uhr · der Morgen · der Abend — الساعة وأوقات اليوم) · ولا كلمة من درس سابق تُعرض «جديدة» (N-018)
    const earlier = new Set(ALL_LESSONS.filter((l) => l.unit <= 6).flatMap((l) => l.praesentation.wordIds));
    expect(u.praesentation.wordIds.filter((id) => earlier.has(id))).toEqual([]);
    expect(u.warmup.cardIds).toEqual(["uhr", "morgen", "abend"]);
    expect(u.warmup.cardIds.filter((id) => !earlier.has(id))).toEqual([]);
  });

  it("u7-d2 (D152): «أحبّ … أكثر» (~~Ich lese mehr gern.~~) · gern ليست فعلاً (~~Ich gern Fußball.~~) · «أنا زهقان» صفة الشخص (~~Ich bin langweilig.~~ — صحيحة نحواً بمعنى آخر) — بمبررات صحيحة", () => {
    const u = ALL_LESSONS.find((l) => l.id === "a1-u7-d2")!;
    const [mehr, gern, lang] = u.zusammenfassung.warningCards;
    expect(mehr!.commonError.de).toBe("~~Ich lese mehr gern.~~");
    expect(mehr!.correct.de).toBe("Ich lese lieber.");
    expect(mehr!.whyArabicSpeakerFails).toContain("بكلمة «أكثر»");
    expect(mehr!.whyArabicSpeakerFails).toContain("I like … more الإنجليزية وj'aime plus الفرنسية");
    expect(mehr!.exercise).toMatchObject({ a: "Wir spielen lieber Fußball." });
    expect(gern!.commonError.de).toBe("~~Ich gern Fußball.~~");
    expect(gern!.correct.de).toBe("Ich spiele gern Fußball.");
    expect(gern!.whyArabicSpeakerFails).toContain("فعلُها «أحبّ»");
    expect(gern!.whyArabicSpeakerFails).toContain("like الإنجليزية وaimer الفرنسية");
    expect(gern!.whyArabicSpeakerFails).toContain("mögen (الوحدة 5)");
    expect(gern!.exercise).toMatchObject({ a: "Lena hört gern Musik." });
    expect(lang!.commonError.de).toBe("~~Ich bin langweilig.~~");
    expect(lang!.correct.de).toBe("Mir ist so langweilig!");
    // الجملة المشطوبة صحيحة نحواً بمعنى آخر («أنا شخصٌ مملّ») — والبطاقة تقول ذلك صراحة · وI'm bored الإنجليزية معلنة
    expect(lang!.whyArabicSpeakerFails).toContain("صحيحة نحواً بمعنى آخر");
    expect(lang!.whyArabicSpeakerFails).toContain("«أنا شخصٌ مملّ»");
    expect(lang!.whyArabicSpeakerFails).toContain("I'm bored الإنجليزية");
    expect(lang!.exercise).toMatchObject({ a: "Am Sonntag ist mir oft langweilig." });
    for (const c of u.zusammenfassung.warningCards) expect(c.whyArabicSpeakerFails).toContain("10‑ي");
    // البطاقات القديمة: ~~Ich spiele den Fußball.~~ (صحيحة نحواً: «أمرّر الكرة» — den Fußball الكرة نفسها) · ~~Das macht Spass.~~ (Spass صحيحة في سويسرا —
    // ولينا هناك — وmachen قبل درسه u7-d3) · ~~am gern~~ · ~~Ich spiele das Tennis.~~ (Tennis غير مدروسة)
    expect(JSON.stringify(u.zusammenfassung.warningCards)).not.toMatch(/den Fußball|Spass|macht|am gern|Tennis/);
    expect(JSON.stringify(u.quiz)).not.toMatch(/→|Berlin|Tennis/);
    // المشتِّتات ليست ألمانية صحيحة بمعنى آخر: لا gerne (صحيحة) · لا «bin … langweilig» (أنا مملّ) · لا Ich spaziere (صحيحة وإن قلّت)
    // · لا den Fußball (تمرير الكرة) · لا Spass (سويسرا)
    const choiceItems = [...u.uebung.stations.flatMap((s) => s.items), ...u.quiz.variants.flatMap((v) => v.items)]
      .flatMap((i) => (Array.isArray((i as { choices?: unknown }).choices) ? [i as unknown as { choices: string[]; a: string }] : []));
    const pre = u.einstieg.pretestItems.flatMap((p) => (p.choices ? [{ choices: [...p.choices], a: p.answer }] : []));
    const german = [...choiceItems, ...pre].flatMap((i) => i.choices.filter((c) => c !== i.a && !/[\u0600-\u06FF]/.test(c)));
    expect(german.filter((c) => /\bgerne\b|\bbin\b.*\blangweilig\b|\bspaziere\b|den Fußball|Spass/iu.test(c))).toEqual([]);
    expect(german).toHaveLength(20); // التخمين 2 + المشتِّتات الألمانية في Quiz: 9 بنود × 2
    // الاستدعاء من دروس سابقة (gern · das Hobby · lesen — u2-d5) — كانت spielen من كلمات اليوم نفسه · ولا كلمة من درس سابق تُعرض «جديدة» (N-018)
    const earlier = new Set(ALL_LESSONS.filter((l) => l.unit <= 6 || l.id === "a1-u7-d1").flatMap((l) => l.praesentation.wordIds));
    expect(u.praesentation.wordIds.filter((id) => earlier.has(id))).toEqual([]);
    expect(u.warmup.cardIds).toEqual(["gern", "hobby", "lesen"]);
    expect(u.warmup.cardIds.filter((id) => !earlier.has(id))).toEqual([]);
  });

  it("u7-d3 (D153): «تـ» واحدة لأنتَ ولهي (~~Lena machst …~~) · مفرد الاحترام اليومي (~~Wartest Sie …?~~) · «أنتظرك» بمفعولٍ مباشر (~~Ich warte dich.~~ — صحيحة نحواً بمعنى آخر) — بمبررات صحيحة", () => {
    const u = ALL_LESSONS.find((l) => l.id === "a1-u7-d3")!;
    const [ta, sie, warten] = u.zusammenfassung.warningCards;
    expect(ta!.commonError.de).toBe("~~Lena machst ihre Hausaufgaben.~~");
    expect(ta!.correct.de).toBe("Lena macht ihre Hausaufgaben.");
    expect(ta!.whyArabicSpeakerFails).toContain("«تـ» واحدة للمخاطَب وللغائبة");
    expect(ta!.whyArabicSpeakerFails).toContain("«أنتَ تعمل» و«هي تعمل»");
    expect(ta!.exercise).toMatchObject({ a: "Meine Mutter sucht den Schlüssel." });
    expect(sie!.commonError.de).toBe("~~Wartest Sie schon lange?~~");
    expect(sie!.correct.de).toBe("Warten Sie schon lange?");
    // الادعاء مقيَّد بالكلام اليومي: الرسائل الرسمية العربية تجمع للاحترام («حضرتكم تتفضّلون») — وهي وvous الفرنسية عونان معلنان
    expect(sie!.whyArabicSpeakerFails).toContain("في الكلام اليومي");
    expect(sie!.whyArabicSpeakerFails).toContain("«حضرتكم تتفضّلون»");
    expect(sie!.whyArabicSpeakerFails).toContain("vous attendez الفرنسية");
    expect(sie!.exercise).toMatchObject({ a: "Brauchen Sie den Computer?" });
    expect(warten!.commonError.de).toBe("~~Ich warte dich.~~");
    expect(warten!.correct.de).toBe("Ich warte auf dich.");
    // الجملة المشطوبة صحيحة نحواً بمعنى آخر (warten + مفعول مباشر = «يصون آلة») — والبطاقة تقول ذلك صراحة · وj'attends معلنة · وwait for عون
    expect(warten!.whyArabicSpeakerFails).toContain("صحيحة نحواً بمعنى آخر");
    expect(warten!.whyArabicSpeakerFails).toContain("«يصون آلةً ويفحصها»");
    expect(warten!.whyArabicSpeakerFails).toContain("j'attends الفرنسية");
    expect(warten!.whyArabicSpeakerFails).toContain("wait for بحرف جرٍّ أيضاً");
    expect(warten!.exercise).toMatchObject({ a: "Lena wartet auf ihren Bruder." });
    for (const c of u.zusammenfassung.warningCards) expect(c.whyArabicSpeakerFails).toContain("10‑ي");
    // البطاقات القديمة: ~~du macht~~/~~er suchst~~ (بلا مبرر عربي) · ~~ge-telefoniert~~ (Perfekt — الوحدة 10) · ~~Ich warte den Bus.~~
    // (صحيحة نحواً: «أصون الحافلة» — بلا قول ذلك · وBus من u7-d4)
    expect(JSON.stringify(u.zusammenfassung.warningCards)).not.toMatch(/ge-telefoniert|telefoniert|den Bus|\ber suchst\b|\bdu macht\b/);
    // المشتِّتات ليست ألمانية صحيحة بمعنى آخر: لا wartst/arbeitst (عامية) · لا ‑est بعد s/ß/z (قديمة) · لا er/sie + ‑e (Konjunktiv I: er mache)
    // · لا mach وحدها (أمر وعامية ich mach) · لا warten + مفعول مباشر (يصون) · لا für dich · لا auf dir (مكان) · لا «macht/wartet/telefoniert Sie» (تُسمع sie صحيحة)
    const choiceItems = [...u.uebung.stations.flatMap((s) => s.items), ...u.quiz.variants.flatMap((v) => v.items)]
      .flatMap((i) => (Array.isArray((i as { choices?: unknown }).choices) ? [i as unknown as { choices: string[]; a: string }] : []));
    const pre = u.einstieg.pretestItems.flatMap((p) => (p.choices ? [{ choices: [...p.choices], a: p.answer }] : []));
    const german = [...choiceItems, ...pre].flatMap((i) => i.choices.filter((c) => c !== i.a && !/[\u0600-\u06FF]/.test(c)));
    expect(german.filter((c) => /wartst|arbeitst|putzest|schließest|benutzest|\b(er|sie|es|Lena|Yusuf|Vater|Mutter|Schwester|Bruder) (mache|suche|putze|öffne|schließe|brauche|rufe|besuche|benutze|telefoniere|schicke|warte|arbeite)\b|\bmach\b|\bwartet? (dich|den|ihn|Lena|ihren)\b|\bfür (dich|mich|Lena)\b|\bauf (dir|mir)\b|(macht|wartet|telefoniert) Sie/iu.test(c))).toEqual([]);
    expect(german).toHaveLength(20); // التخمين 2 + المشتِّتات الألمانية في Quiz: 9 بنود × 2
    // الاستدعاء من دروس سابقة (arbeiten: e قبل t · heißen: du heißt · wohnen) — كانت machen من كلمات اليوم نفسه · ولا كلمة من درس سابق تُعرض «جديدة» (N-018)
    const earlier = new Set(ALL_LESSONS.filter((l) => l.unit <= 6 || ["a1-u7-d1", "a1-u7-d2"].includes(l.id)).flatMap((l) => l.praesentation.wordIds));
    expect(u.praesentation.wordIds.filter((id) => earlier.has(id))).toEqual([]);
    expect(u.warmup.cardIds).toEqual(["arbeiten", "heissen", "wohnen"]);
    expect(u.warmup.cardIds.filter((id) => !earlier.has(id))).toEqual([]);
  });

  it("u7-d4 (D154): ثبات حركة المضارع العربي (~~Lena nehmt …~~) · «أركب القطار» بمفعولٍ مباشر (~~Ich fahre den Zug.~~ — صحيحة نحواً بمعنى «أقود») · isst/ist بالصوت نفسه (~~Lena ist einen Apfel.~~) — بمبررات صحيحة", () => {
    const u = ALL_LESSONS.find((l) => l.id === "a1-u7-d4")!;
    const [stem, ride, isst] = u.zusammenfassung.warningCards;
    expect(stem!.commonError.de).toBe("~~Lena nehmt das Fahrrad.~~");
    expect(stem!.correct.de).toBe("Lena nimmt das Fahrrad.");
    expect(stem!.whyArabicSpeakerFails).toContain("«آخذ · تأخذ · يأخذ» بحركةٍ واحدة");
    expect(stem!.whyArabicSpeakerFails).toContain("قاعدة الدرس الماضي قالت «الجذع ثابت»");
    expect(stem!.exercise).toMatchObject({ a: "Meine Oma spricht nur Arabisch." });
    expect(ride!.commonError.de).toBe("~~Ich fahre den Zug.~~");
    expect(ride!.correct.de).toBe("Ich nehme den Zug.");
    // الجملة المشطوبة صحيحة نحواً بمعنى آخر (fahren + مفعول مباشر = يقود) — والبطاقة تقول ذلك · وtake/prendre عونان معلنان
    expect(ride!.whyArabicSpeakerFails).toContain("صحيحة نحواً بمعنى آخر");
    expect(ride!.whyArabicSpeakerFails).toContain("= «يقود»");
    expect(ride!.whyArabicSpeakerFails).toContain("take the train الإنجليزية وprendre le train الفرنسية (عونان)");
    expect(ride!.exercise).toMatchObject({ a: "Am Abend nehme ich den Bus." });
    expect(isst!.commonError.de).toBe("~~Lena ist einen Apfel.~~");
    expect(isst!.correct.de).toBe("Lena isst einen Apfel.");
    expect(isst!.whyArabicSpeakerFails).toContain("تُنطقان بالصوت نفسه");
    expect(isst!.whyArabicSpeakerFails).toContain("بلا فعل كون أصلاً في الجملة الاسمية");
    expect(isst!.whyArabicSpeakerFails).toContain("ist من sein لا تأخذ مفعولاً");
    expect(isst!.exercise).toMatchObject({ a: "Mein Bruder isst einen Kuchen." });
    for (const c of u.zusammenfassung.warningCards) expect(c.whyArabicSpeakerFails).toContain("10‑ي");
    // البطاقات القديمة: ~~er fahrt~~ (صحيحة في لهجات الجنوب والنمسا — والحدّ يقول ذلك) · ~~Er ist Brot.~~ (صحيحة نحواً: «هو خبز») · ~~er nehmt / er sprecht / er gebt~~ معاً
    expect(JSON.stringify(u.zusammenfassung.warningCards)).not.toMatch(/fahrt|Brot|er sprecht|er gebt/);
    // المشتِّتات ليست ألمانية صحيحة بمعنى آخر: لا fahrt/lauft/wascht بعد er أو اسم (لهجة الجنوب والنمسا) · لا «fahre den/fährt den» (يقود)
    // · لا «ist + اسمٌ بلا أداة» (هو خبز) · لا ihr مع صيغة er أو du (قراءة داتيف: «لها»)
    const choiceItems = [...u.uebung.stations.flatMap((s) => s.items), ...u.quiz.variants.flatMap((v) => v.items)]
      .flatMap((i) => (Array.isArray((i as { choices?: unknown }).choices) ? [i as unknown as { choices: string[]; a: string }] : []));
    const pre = u.einstieg.pretestItems.flatMap((p) => (p.choices ? [{ choices: [...p.choices], a: p.answer }] : []));
    const german = [...choiceItems, ...pre].flatMap((i) => i.choices.filter((c) => c !== i.a && !/[\u0600-\u06FF]/.test(c)));
    expect(german.filter((c) => /\b(fahrt|fahrst|lauft|laufst|wascht|waschst)\b|\b(fahre|fährt|fährst) (den|die|das|einen)\b|\bist (Brot|Kuchen|Fisch|Obst)\b|\b(wäscht|wäschst|fährst|nimmst|nimmt|gibt|gibst) ihr\b/iu.test(c))).toEqual([]);
    expect(german).toHaveLength(20); // التخمين 2 + المشتِّتات الألمانية في Quiz: 9 بنود × 2
    // الاستدعاء من دروس سابقة (essen · lesen · schlafen — isst · liest · schläft) — كانت fahren وZug من كلمات اليوم نفسه · وsprechen (u1-d2) خرجت من «الجديد» (N-018)
    const earlier = new Set(ALL_LESSONS.filter((l) => l.unit <= 6 || ["a1-u7-d1", "a1-u7-d2", "a1-u7-d3"].includes(l.id)).flatMap((l) => l.praesentation.wordIds));
    expect(u.praesentation.wordIds.filter((id) => earlier.has(id))).toEqual([]);
    expect(u.warmup.cardIds).toEqual(["essen", "lesen", "schlafen"]);
    expect(u.warmup.cardIds.filter((id) => !earlier.has(id))).toEqual([]);
  });

  it("u7-d5 (D155): الفعل العربي كلمةٌ واحدة (~~Ich aufstehe …~~) · المفعول يلي الفعل وtidy up (~~Ich räume auf mein Zimmer.~~) · «أشاهد التلفاز» بمفعول (~~Ich sehe den Fernseher.~~ — صحيحة نحواً بمعنى «أرى الجهاز») — بمبررات صحيحة", () => {
    const u = ALL_LESSONS.find((l) => l.id === "a1-u7-d5")!;
    const [whole, object, tv] = u.zusammenfassung.warningCards;
    expect(whole!.commonError.de).toBe("~~Ich aufstehe jeden Tag um sieben.~~");
    expect(whole!.correct.de).toBe("Ich stehe jeden Tag um sieben auf.");
    expect(whole!.whyArabicSpeakerFails).toContain("الفعل العربي كلمةٌ واحدة لا تتجزأ");
    expect(whole!.whyArabicSpeakerFails).toContain("والقاموس يعطي aufstehen كلمةً واحدة");
    expect(whole!.exercise).toMatchObject({ a: "Lena ruft ihre Oma an." });
    expect(object!.commonError.de).toBe("~~Ich räume auf mein Zimmer.~~");
    expect(object!.correct.de).toBe("Ich räume mein Zimmer auf.");
    expect(object!.whyArabicSpeakerFails).toContain("«أرتّب غرفتي»");
    expect(object!.whyArabicSpeakerFails).toContain("والإنجليزية tidy up my room");
    expect(object!.exercise).toMatchObject({ a: "Mein Bruder wäscht die Teller ab." });
    expect(tv!.commonError.de).toBe("~~Ich sehe den Fernseher.~~");
    expect(tv!.correct.de).toBe("Ich sehe fern.");
    // الجملة المشطوبة صحيحة نحواً بمعنى آخر («أرى جهاز التلفاز») — والبطاقة تقول ذلك · وwatch TV وregarder la télé معلنتان
    expect(tv!.whyArabicSpeakerFails).toContain("صحيحة نحواً بمعنى آخر");
    expect(tv!.whyArabicSpeakerFails).toContain("«أرى جهاز التلفاز»");
    expect(tv!.whyArabicSpeakerFails).toContain("watch TV الإنجليزية وregarder la télé الفرنسية");
    expect(tv!.exercise).toMatchObject({ a: "Mein Vater sieht jeden Abend fern." });
    for (const c of u.zusammenfassung.warningCards) expect(c.whyArabicSpeakerFails).toContain("10‑ي");
    // البطاقات القديمة: ~~Ich möchte stehen auf.~~ (مكرر من الوحدة 5 بلا مبرر عربي) · ~~Ich sehe das Fernsehen.~~ / ~~Ich kaufe ein Einkauf.~~ (Einkauf غير مدروسة
    // — و«Fernsehen sehen/schauen» عاميةٌ مسموعة)
    expect(JSON.stringify(u.zusammenfassung.warningCards)).not.toMatch(/stehen auf|das Fernsehen|Einkauf/);
    // المشتِّتات ليست ألمانية صحيحة بمعنى آخر: لا «Ich stehe um sieben.» (أقف في السابعة) · لا إخراج ظرفٍ بعد الجزء («… auf um sieben» — عامية مسموعة)
    // · لا «… den Fernseher» (أرى الجهاز) · لا Fernseher بلا أداة (جمع: أجهزة) · لا wascht (لهجة) · لا «kaufe ein + اسم» (ein أداة: أشتري …)
    const choiceItems = [...u.uebung.stations.flatMap((s) => s.items), ...u.quiz.variants.flatMap((v) => v.items)]
      .flatMap((i) => (Array.isArray((i as { choices?: unknown }).choices) ? [i as unknown as { choices: string[]; a: string }] : []));
    const pre = u.einstieg.pretestItems.flatMap((p) => (p.choices ? [{ choices: [...p.choices], a: p.answer }] : []));
    const german = [...choiceItems, ...pre].flatMap((i) => i.choices.filter((c) => c !== i.a && !/[\u0600-\u06FF]/.test(c)));
    expect(german.filter((c) => /\bstehe um \p{L}+\.$|\b\p{L}+(e|st|t) (auf|an|ein|ab|fern) (um|am|im|jeden)\b|\bFernseher\b|\bwascht\b|\bkaufe ein (Brot|Buch|\p{Lu})/u.test(c))).toEqual([]);
    expect(german).toHaveLength(20); // التخمين 2 + المشتِّتات الألمانية في Quiz: 9 بنود × 2
    // الاستدعاء من دروس سابقة (aufwachen · anfangen — قطعتان منفصلتان من u7-d1 · kochen) · ولا كلمة من درس سابق تُعرض «جديدة» (N-018)
    const earlier = new Set(ALL_LESSONS.filter((l) => l.unit <= 6 || ["a1-u7-d1", "a1-u7-d2", "a1-u7-d3", "a1-u7-d4"].includes(l.id)).flatMap((l) => l.praesentation.wordIds));
    expect(u.praesentation.wordIds.filter((id) => earlier.has(id))).toEqual([]);
    expect(u.warmup.cardIds).toEqual(["aufwachen", "anfangen", "kochen"]);
    expect(u.warmup.cardIds.filter((id) => !earlier.has(id))).toEqual([]);
  });

  it("D155: معاني الكلمات وجمل أمثلتها بالعربية وحدها — كان معنى Haushalt «家务 · משק منزل» (صينية وعبرية) فصار «أعمال البيت · تدبير المنزل»", () => {
    const foreign = /[\u0590-\u05FF\u0400-\u04FF\u3040-\u30FF\u4E00-\u9FFF\uAC00-\uD7AF]/u;
    const arabic = /[\u0600-\u06FF]/u;
    const bad = ALL_WORDS.filter((w) => w.ar.some((a) => foreign.test(a) || !arabic.test(a)) || (w.sampleSentence && (foreign.test(w.sampleSentence.ar) || !arabic.test(w.sampleSentence.ar)))).map((w) => w.id);
    expect(bad).toEqual([]);
    expect(ALL_WORDS.find((w) => w.id === "haushalt")!.ar).toEqual(["أعمال البيت", "تدبير المنزل"]);
  });

  it("D156: ملاحظة الجمع تطابق الجمع نفسه — Umlaut يُدّعى ولا يقع (Kleid «umlaut + er: Kleider» · Gerät/Geschäft/Gespräch «umlaut + e» والـä في المفرد أصلاً) · ونهاية لا تقع (Mantel «+ er: Mäntel») — صُحّحت ويمنعها هذا الاختبار", () => {
    const deum = (s: string) => s.replace(/ä/g, "a").replace(/ö/g, "o").replace(/ü/g, "u").replace(/Ä/g, "A").replace(/Ö/g, "O").replace(/Ü/g, "U");
    const umlauts = (s: string) => [...s].filter((c) => "äöüÄÖÜ".includes(c)).length;
    const bad: string[] = [];
    for (const w of ALL_WORDS) {
      const note = w.pluralRuleNote ?? "";
      if (w.wordClass !== "noun" || !note || !w.plural) continue;
      const sing = w.de.replace(/^(der|die|das) /u, "").trim();
      const plural = w.plural.replace(/^die /u, "").trim();
      const newUmlaut = umlauts(plural) > umlauts(sing);
      // (1) ملاحظة تدّعي Umlaut (umlaut · u→ü · «ä + …» · «ä بلا نهاية») والجمع بلا Umlaut جديد
      const claimsUmlaut = /umlaut|[aou]→[äöü]|(^|\s)[äöü] (\+|بلا)/iu.test(note) && !/بلا umlaut/iu.test(note);
      if (claimsUmlaut && !newUmlaut) bad.push(`${w.id}: Umlaut غير واقع`);
      // (2) الاصطلاح الجديد: «‑e: …» · «ü + ‑er: …» — النهاية المذكورة هي نهاية الجمع فعلاً · و«بلا نهاية» = الجمع كالمفرد (بلا Umlaut)
      const m = /^(?:[äöü] \+ )?‑(e|n|en|er|se|s|nen):/u.exec(note);
      if (m && deum(plural) !== deum(sing) + m[1]) bad.push(`${w.id}: النهاية ‑${m[1]} غير واقعة`);
      if (/^(?:[äöü] )?بلا نهاية/u.test(note) && deum(plural) !== deum(sing)) bad.push(`${w.id}: «بلا نهاية» غير واقع`);
      // (3) D157: المثال داخل الملاحظة «der X ← die Y» يذكر الجمع نفسه (قياس الطفرة: «die Kunde» في ملاحظة Kunde كانت تمرّ لأن الفحص على حقل plural وحده)
      const ex = /^[^(]*?(?:der|die|das) \S+ ← die (\S+)/u.exec(note);
      if (ex && ex[1] !== plural.replace(/[.,;:!?]$/u, "")) bad.push(`${w.id}: مثال الملاحظة «die ${ex[1]}» ≠ الجمع «${w.plural}»`);
    }
    expect(bad).toEqual([]);
    const note = (id: string) => ALL_WORDS.find((x) => x.id === id)!.pluralRuleNote;
    expect(note("mantel")).toBe("ä بلا نهاية: der Mantel ← die Mäntel (‑el في الآخر — كـder Vater ← die Väter)");
    expect(note("kleid")).toBe("‑er: das Kleid ← die Kleider (كـdas Kind ← die Kinder)");
    expect(note("geraet")).toMatch(/^‑e: das Gerät ← die Geräte/);
    expect(note("bruder")).toBe("ü بلا نهاية: der Bruder ← die Brüder (‑er في الآخر)");
    // Groesse رسمٌ بديل للحروف لا كتابةٌ ألمانية — والكتابة السويسرية Grösse (ss بدل ß)
    expect(note("groesse")).not.toMatch(/Groesse/);
    expect(note("groesse")).toContain("Grösse");
  });

  it("u8-d1 (D156): «حذائي» مفردٌ للزوج (~~Mein Schuh ist neu.~~ — صحيحة نحواً بمعنى «فردة») · «أحبّ» وI like (~~Ich gefalle das Kleid.~~) · «هذا» بلا محايد (~~Dieser Kleid ist schön.~~) — بمبررات صحيحة", () => {
    const u = ALL_LESSONS.find((l) => l.id === "a1-u8-d1")!;
    const [pair, like, neuter] = u.zusammenfassung.warningCards;
    expect(pair!.commonError.de).toBe("~~Mein Schuh ist neu.~~");
    expect(pair!.correct.de).toBe("Meine Schuhe sind neu.");
    // الجملة المشطوبة صحيحة نحواً بمعنى آخر («فردة حذائي») — والبطاقة تقول ذلك
    expect(pair!.whyArabicSpeakerFails).toContain("صحيحة نحواً بمعنى آخر");
    expect(pair!.whyArabicSpeakerFails).toContain("«حذائي جديد» بالمفرد للزوج كله");
    expect(pair!.exercise).toMatchObject({ a: "Wo sind meine Schuhe?" });
    expect(like!.commonError.de).toBe("~~Ich gefalle das Kleid.~~");
    expect(like!.correct.de).toBe("Das Kleid gefällt mir.");
    // «يعجبني الفستان» العربية وla robe me plaît الفرنسية عونان · والخطأ من «أحبّ» وI like the dress (معلنة)
    expect(like!.whyArabicSpeakerFails).toContain("I like the dress");
    expect(like!.whyArabicSpeakerFails).toContain("«يعجبني الفستان» العربية وla robe me plaît الفرنسية (عونان)");
    expect(like!.whyArabicSpeakerFails).toContain("mögen (الوحدة 5)");
    expect(like!.exercise).toMatchObject({ a: "Dieser Pullover gefällt mir." });
    expect(neuter!.commonError.de).toBe("~~Dieser Kleid ist schön.~~");
    expect(neuter!.correct.de).toBe("Dieses Kleid ist schön.");
    expect(neuter!.whyArabicSpeakerFails).toContain("ولا محايد فيها");
    expect(neuter!.exercise).toMatchObject({ a: "Dieses Hemd ist zu klein." });
    for (const c of u.zusammenfassung.warningCards) expect(c.whyArabicSpeakerFails).toContain("10‑ي");
    // البطاقات القديمة: ~~der Hemd~~ (فكرتها بقيت في القاعدة) · ~~die Mantels / die Rocks~~ (‑s إنجليزي بلا مبرر عربي) · «~~die Hose~~؟ نعم» (تشطب الصحيح!)
    expect(JSON.stringify(u.zusammenfassung.warningCards)).not.toMatch(/Mantels|Rocks|Kleids|~~die Hose~~/);
    // المشتِّتات ليست ألمانية صحيحة بمعنى آخر: لا «Mein Schuh» (فردة) · لا Konjunktiv I «gefalle» بعد اسم (تحكي الكلام) · لا «ein/kein» قبل مذكر منصوب (عامية الشمال «'n»)
    // · لا tragt (لهجة الجنوب)
    const choiceItems = [...u.uebung.stations.flatMap((s) => s.items), ...u.quiz.variants.flatMap((v) => v.items)]
      .flatMap((i) => (Array.isArray((i as { choices?: unknown }).choices) ? [i as unknown as { choices: string[]; a: string }] : []));
    const pre = u.einstieg.pretestItems.flatMap((p) => (p.choices ? [{ choices: [...p.choices], a: p.answer }] : []));
    const german = [...choiceItems, ...pre].flatMap((i) => i.choices.filter((c) => c !== i.a && !/[\u0600-\u06FF]/.test(c)));
    expect(german.filter((c) => /\bMein Schuh\b|\b(Jacke|Kleid|Hemd|Rock|Hut|Farbe) gefalle\b|\b(trägt|nehme|kaufe|möchte) (ein|kein) (Mantel|Rock|Hut|Pullover)\b|\btragt\b/u.test(c))).toEqual([]);
    expect(german).toHaveLength(20); // التخمين 2 + المشتِّتات الألمانية في Quiz: 9 بنود × 2
    // الاستدعاء من دروس سابقة (die Tasche · tragen · kaufen) — كانت Schuh من كلمات اليوم نفسه
    const earlier = new Set(ALL_LESSONS.filter((l) => l.unit <= 7).flatMap((l) => l.praesentation.wordIds));
    expect(u.praesentation.wordIds.filter((id) => earlier.has(id))).toEqual([]);
    expect(u.warmup.cardIds).toEqual(["tasche", "tragen", "kaufen"]);
    expect(u.warmup.cardIds.filter((id) => !earlier.has(id))).toEqual([]);
  });

  it("u8-d2 (D157): «الحذاء» مفردٌ للزوج (~~Was kostet die Schuhe?~~) · «كم» واحدة للعدد والسعر (~~Wie kostet das Hemd?~~) · علامة المفعول لا تظهر (~~den Kunde~~ — n-Deklination) — بمبررات صحيحة", () => {
    const u = ALL_LESSONS.find((l) => l.id === "a1-u8-d2")!;
    const [pair, wie, nDekl] = u.zusammenfassung.warningCards;
    expect(pair!.commonError.de).toBe("~~Was kostet die Schuhe?~~");
    expect(pair!.correct.de).toBe("Was kosten die Schuhe?");
    expect(pair!.whyArabicSpeakerFails).toContain("«الحذاء» مفردٌ في العربية للزوج كله");
    expect(wie!.commonError.de).toBe("~~Wie kostet das Hemd?~~");
    expect(wie!.correct.de).toBe("Was kostet das Hemd? / Wie viel kostet das Hemd?");
    expect(wie!.whyArabicSpeakerFails).toMatch(/«كم».*Wie وحدها = «كيف»/);
    expect(nDekl!.commonError.de).toBe("~~Der Verkäufer fragt den Kunde.~~"); // D188: fragt مستعارة معلنة (borrowedWords) بدل ليّ D185 إلى kennt
    expect(nDekl!.correct.de).toBe("Der Verkäufer fragt den Kunden.");
    expect(nDekl!.whyArabicSpeakerFails).toMatch(/den Nachbarn/);
    for (const c of u.zusammenfassung.warningCards) expect(c.whyArabicSpeakerFails).toContain("10‑ي");
    // الاستدعاء من دروس سابقة (der Preis · kosten · bezahlen) — كانت Cent من كلمات اليوم نفسه
    const earlier = new Set(ALL_LESSONS.filter((l) => l.unit <= 7 || l.id === "a1-u8-d1").flatMap((l) => l.praesentation.wordIds));
    expect(u.praesentation.wordIds.filter((id) => earlier.has(id))).toEqual([]);
    expect(u.warmup.cardIds).toEqual(["preis", "kosten", "bezahlen"]);
    expect(u.warmup.cardIds.filter((id) => !earlier.has(id))).toEqual([]);
  });

  it("u8-d3 (D158): «أن» تطلب zu (~~Ich muss zu bezahlen.~~) · الفعلان يتصرّفان معاً (~~Ich muss kaufe einen Gürtel.~~) · «يجب» ثابتة لكل فاعل (~~Du muss bezahlen.~~) — بمبررات صحيحة", () => {
    const u = ALL_LESSONS.find((l) => l.id === "a1-u8-d3")!;
    const [zu, conj, fixed] = u.zusammenfassung.warningCards;
    expect(zu!.commonError.de).toBe("~~Ich muss zu bezahlen.~~");
    expect(zu!.correct.de).toBe("Ich muss bezahlen.");
    expect(zu!.whyArabicSpeakerFails).toMatch(/«أن» قبل الفعل الثاني.*لا تضع شيئاً قبل المصدر/);
    expect(conj!.commonError.de).toBe("~~Ich muss kaufe einen Gürtel.~~");
    expect(conj!.correct.de).toBe("Ich muss einen Gürtel kaufen.");
    expect(conj!.whyArabicSpeakerFails).toMatch(/تصرّف الفعلين معاً.*مصدراً كما في القاموس/);
    expect(fixed!.commonError.de).toBe("~~Du muss bezahlen.~~");
    expect(fixed!.correct.de).toBe("Du musst bezahlen.");
    expect(fixed!.whyArabicSpeakerFails).toMatch(/«يجب» في العربية كلمةٌ واحدة ثابتة.*ich muss · du musst · er muss · wir müssen/);
    for (const c of u.zusammenfassung.warningCards) expect(c.whyArabicSpeakerFails).toContain("10‑ي");
    // N-020: الاستدعاء من دروس سابقة (anprobieren · kaufen · bezahlen) — كانت passen وmöglich من كلمات اليوم نفسه
    const earlier = new Set(ALL_LESSONS.filter((l) => l.unit <= 7 || ["a1-u8-d1", "a1-u8-d2"].includes(l.id)).flatMap((l) => l.praesentation.wordIds));
    expect(u.praesentation.wordIds.filter((id) => earlier.has(id))).toEqual([]);
    expect(u.warmup.cardIds).toEqual(["anprobieren", "kaufen", "bezahlen"]);
    expect(u.warmup.cardIds.filter((id) => !earlier.has(id))).toEqual([]);
  });

  it("D151: ملاحظات الجمع في الدروس المُرقّاة بلا مصطلح داخلي — كان «Gleich_plural» يظهر للمتعلم في 11 كلمة (Sessel · Spiegel · Kissen · Wecker …) فصار «بلا نهاية: der Sessel ← die Sessel» (نمط D146)", () => {
    const done = new Set(ALL_LESSONS.filter((l) => l.unit <= 6 || ["a1-u7-d1", "a1-u7-d2", "a1-u7-d3", "a1-u7-d4", "a1-u7-d5", "a1-u8-d1", "a1-u8-d2", "a1-u8-d3"].includes(l.id)).flatMap((l) => l.praesentation.wordIds)); // D158: u8-d3 · D152: u7-d2 · D153: u7-d3 · D154: u7-d4 · D155: u7-d5 · D156: u8-d1 · D157: u8-d2
    const jargon = ALL_WORDS.filter((w) => done.has(w.id) && /Gleich_plural|[A-Za-z]+_[A-Za-z]+/.test(w.pluralRuleNote ?? "")).map((w) => w.id);
    expect(jargon).toEqual([]);
    const note = (id: string) => ALL_WORDS.find((w) => w.id === id)!.pluralRuleNote;
    expect(note("sessel")).toBe("بلا نهاية: der Sessel ← die Sessel (‑el في الآخر — نمط D146)");
    expect(note("kuchen")).toMatch(/die Küche ← die Küchen \(المطابخ\) كلمةٌ أخرى/);
    // Trinkgeld جمعه Trinkgelder (لا «Gleich_plural غالباً» كما كانت الملاحظة تقول خطأً)
    expect(note("trinkgeld")).toMatch(/das Trinkgeld ← die Trinkgelder/);
    expect(ALL_WORDS.find((w) => w.id === "trinkgeld")!.plural).toBe("die Trinkgelder");
  });

  it("D141: اسم الجمع الدائم في الدروس المُرقّاة بلا جنس مفرد ولا بطاقة جنس (اصطلاح D136) — die Leute صُحّحت (كانت بطاقة جنس تسأل عن die كأنها مؤنثة)", () => {
    const done = new Set(ALL_LESSONS.filter((l) => l.unit <= 5 || ["a1-u6-d1", "a1-u6-d2", "a1-u6-d3", "a1-u6-d4", "a1-u6-d5", "a1-u7-d1", "a1-u7-d2", "a1-u7-d3", "a1-u7-d4", "a1-u7-d5", "a1-u8-d1", "a1-u8-d2", "a1-u8-d3"].includes(l.id)).flatMap((l) => l.praesentation.wordIds)); // D158: u8-d3 · D157: u8-d2 · D145: الوحدة 5 كلها مُرقّاة · D146: u6-d1 · D147: u6-d2 · D148: u6-d3 · D149: u6-d4 · D150: u6-d5 · D151: u7-d1 · D152: u7-d2 · D153: u7-d3 · D154: u7-d4 · D155: u7-d5 · D156: u8-d1
    const pluralOnly = ALL_WORDS.filter((w) => done.has(w.id) && w.wordClass === "noun" && /جمع فقط|قائمة Goethe: pl\./.test(w.pluralRuleNote ?? ""));
    // D150: Möbel دخلت (N-070 — كانت بجنس die وبطاقة جنس و«جمع فقط … مثل Nudeln» — والمفرد das Möbel موجود نادراً) ⇒ «جمعاً عادةً» بلا جنس مفرد
    expect(pluralOnly.map((w) => w.id).sort()).toEqual(["eltern", "geschwister", "grosseltern", "lebensmittel", "leute", "moebel"]);
    for (const w of pluralOnly) expect([w.id, w.gender, w.srsCardTypes.includes("gender")]).toEqual([w.id, "none", false]);
    // Nudeln ليست منها: المفرد die Nudel موجود (قائمة Goethe A2) فجنسها المؤنث صحيح
    expect(ALL_WORDS.find((w) => w.id === "nudeln")!.gender).toBe("die");
  });

  it("D144: معرّف الكلمة = slugify(de) (ä ← ae · ö ← oe · ü ← ue) — إلا قائمة معلنة بأسبابها · laeffel صُحّح إلى loeffel", () => {
    const off = ALL_WORDS.filter((w) => slugify(w.de.replace(/\s*\(.*?\)\s*/g, " ").trim()) !== w.id).map((w) => w.id).sort();
    expect(off).toEqual([
      "achso", "das-essen", "das-leben", "die-bitte", // die-bitte · das-essen · das-leben: معرّف صريح للمتجانس بجانب bitte/essen/leben (D126) · achso: قطعة «ach so» بلا فاصل
      "erkaltung", // N-074: رسم خاطئ (ä ← a بدل ae) — يُصحَّح مع مساره في ترقية a1-u11-d2
      "morgen", // «der Morgen / morgen» مدخل واحد للاسم والظرف
      "nord", "ost", "sued", "west", // N-074: مختصرة (der Norden …) — قرار التوحيد في ترقية a1-u9-d1
      "wie-gehts", // «Wie geht's?» بلا الفاصلة العليا
    ]);
    expect(ALL_WORDS.find((w) => w.id === "loeffel")?.de).toBe("Löffel");
  });

  it("بطاقات الثقافة (Landeskunde): 12 بطاقة — كل وحدة ببطاقة واحدة + الحقائق ≥2", () => {
    expect(ALL_LANDESKUNDE.length).toBe(12);
    const units = ALL_LANDESKUNDE.map((c) => c.unit).sort((a, b) => a - b);
    expect(units).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    for (const card of ALL_LANDESKUNDE) {
      expect(card.facts.length).toBeGreaterThanOrEqual(2);
      expect(card.title.de.length).toBeGreaterThan(0);
      expect(card.title.ar.length).toBeGreaterThan(0);
      expect(card.sourceNote.length).toBeGreaterThan(0);
    }
  });

  it("الاختبارات الدورية: 6 Kurztest + 3 Monatsprüfung — تراكمية وبحدود الحجم", () => {
    const kurz = ALL_PRUEFUNGEN.filter((t) => t.kind === "kurztest");
    const monat = ALL_PRUEFUNGEN.filter((t) => t.kind === "monatspruefung");
    expect(kurz.length).toBe(6);
    expect(monat.length).toBe(3);
    for (const t of kurz) {
      expect(t.items.length).toBeLessThanOrEqual(12);
      expect(t.timeBudgetMin).toBe(15);
    }
    for (const t of monat) {
      expect(t.items.length).toBeGreaterThanOrEqual(10);
    }
    for (const t of ALL_PRUEFUNGEN) {
      expect(t.passingScore).toBe(0.75);
      expect(t.coversUnits.length).toBeGreaterThan(0);
    }
  });

  it("الامتحان التجريبي: 4 مهارات كاملة + حدود الصدق", () => {
    expect(ALL_MODELLTESTS.length).toBeGreaterThanOrEqual(1);
    for (const t of ALL_MODELLTESTS) {
      const skills = t.sections.map((s) => s.skill).sort();
      expect(skills).toEqual(["hoeren", "lesen", "schreiben", "sprechen"]);
      expect(t.passingScore).toBeGreaterThan(0);
      expect(t.passingScore).toBeLessThanOrEqual(1);
      expect(t.sourceNote.length).toBeGreaterThan(0);
      for (const s of t.sections) {
        expect(s.timeBudgetMin).toBeGreaterThan(0);
        for (const part of s.parts) {
          expect(part.items.length).toBeGreaterThan(0);
        }
      }
    }
  });

  it("الصور التوضيحية (D96): alt مطلوب + هوية بصرية واحدة + ربط بالدروس", () => {
    expect(ALL_IMAGES.length).toBeGreaterThanOrEqual(10);
    const guides = new Set(ALL_IMAGES.map((a) => a.styleGuide));
    expect(guides.size).toBe(1); // دليل واحد — الهوية البصرية
    for (const a of ALL_IMAGES) {
      expect(a.alt.length).toBeGreaterThan(0);
      expect(a.usedInLessons.length).toBeGreaterThan(0);
      expect(a.file.length).toBeGreaterThan(0);
      expect(a.license.length).toBeGreaterThan(0);
    }
  });

  it("نصوص القراءة: نص لكل وحدة + أسئلة + مسرد + حدود الصدق", () => {
    expect(ALL_LESETEXTS.length).toBe(12);
    const units = ALL_LESETEXTS.map((t) => t.unit).sort((a, b) => a - b);
    expect(units).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    for (const t of ALL_LESETEXTS) {
      expect(t.text.de.length).toBeGreaterThanOrEqual(40);
      expect(t.glossary.length).toBeGreaterThanOrEqual(1);
      expect(t.questions.length).toBeGreaterThanOrEqual(2);
      expect(t.sourceNote.length).toBeGreaterThan(0);
    }
  });
});

describe("A2 يبدأ (D101) — الترتيب بالمستوى + قواعد A2 + عرض الأداة مرة واحدة", () => {
  const a2 = ALL_LESSONS.filter((l) => l.level === "A2");
  const a1Ids = new Set(ALL_WORDS.filter((w) => w.level === "A1").map((w) => w.id));

  it("قفل المسار: كل دروس A1 قبل أي درس A2 (لا تداخل بين المستويات)", () => {
    const levels = ALL_LESSONS.map((l) => LEVEL_ORDER[l.level]);
    expect(levels).toEqual([...levels].sort((a, b) => a - b));
    expect(ALL_LESSONS.findIndex((l) => l.level === "A2")).toBe(ALL_LESSONS.filter((l) => l.level === "A1").length);
    expect(ALL_LESSONS[1]!.id).toBe("a1-u1-d2"); // a2-u1-d1 لا يقع بين a1-u1-d1 وa1-u1-d2
  });

  it("a2-u1-d1: Perfekt منهجي — 13 كلمة A2 جديدة (لا تكرار لـA1) + أصوات مطابقة", () => {
    const l = a2.find((x) => x.id === "a2-u1-d1")!;
    expect(l.ziel.ar).toContain("Perfekt");
    const words = wordsForLesson(l);
    expect(words).toHaveLength(13);
    for (const w of words) {
      expect(w.level).toBe("A2");
      expect(w.unit).toBe(1);
      expect(w.goetheList).toContain("A2");
      expect(a1Ids.has(w.id)).toBe(false);
      expect(w.sampleSentence?.sourceLesson).toBe("a2-u1-d1");
    }
    expect(l.audioManifestRefs).toEqual(l.praesentation.wordIds.map((id) => `word-${id}`));
    expect(l.curriculumRef.goetheWordListOverlap).toEqual(l.praesentation.wordIds);
  });

  it("A2: كل محطة تخلط بنى A1 سابقة (interleaving) + تنوع المحطات ≥3 أنواع + المصائد على خريطة التداخل", () => {
    expect(a2.length).toBeGreaterThan(0);
    for (const l of a2) {
      for (const s of l.uebung.stations) {
        expect(s.interleavedWith.length).toBeGreaterThan(0);
        for (const ref of s.interleavedWith) expect(a1Ids.has(ref), `مرجع خلط غير موجود: ${ref}`).toBe(true);
      }
      expect(new Set(l.uebung.stations.map((s) => s.type)).size).toBeGreaterThanOrEqual(3);
      expect(l.zusammenfassung.warningCards).toHaveLength(3);
      for (const t of l.zusammenfassung.warningCards) expect(t.whyArabicSpeakerFails).toContain("10‑ي");
    }
  });

  it("الأفعال: Perfekt مسجّل لكل فعل — وأفعال sein موسومة needs-ist", () => {
    for (const w of wordsForLesson(a2.find((x) => x.id === "a2-u1-d1")!)) {
      if (w.wordClass !== "verb") continue;
      expect(w.forms?.perfekt, w.id).toMatch(/^(hat|ist) /);
      expect(w.forms!.perfekt!.startsWith("ist ")).toBe(w.grammarRisks.includes("needs-ist"));
    }
  });

  it("fullForm: الأداة تُعرض مرة واحدة — لا «die die Landschaft» في أي بطاقة من كل الدروس", () => {
    expect(fullForm({ de: "die Landschaft", article: "die" })).toBe("die Landschaft");
    expect(fullForm({ de: "Wohnung", article: "die" })).toBe("die Wohnung");
    expect(fullForm({ de: "lachen" })).toBe("lachen");
    const doubled = /\b(der|die|das) \1\b/;
    for (const l of ALL_LESSONS) {
      const plan = planLessonStations(l, runtimeWordsForLesson(l));
      for (const c of plan.learn) expect(c.explanation, `${l.id}/${c.wordId}`).not.toMatch(doubled);
      for (const c of plan.recall) expect(c.front, `${l.id}/${c.id}`).not.toMatch(doubled);
    }
  });
});
