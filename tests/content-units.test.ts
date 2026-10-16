// content-units.test.ts — المحتوى حيّ: كل درس وكلماته تعمل على المُشغِّل (D45)
import { describe, it, expect } from "vitest";
import { ALL_LESSONS, ALL_WORDS, ALL_LANDESKUNDE, ALL_PRUEFUNGEN, ALL_MODELLTESTS, ALL_IMAGES, ALL_LESETEXTS, LEVEL_ORDER, wordsForLesson, runtimeWordsForLesson, firstLesson, firstLessonWords } from "../src/lesson-packs.js";
import { planLessonStations, fullForm } from "../src/lib/lesson-runner.js";

describe("سجل المحتوى — الوحدة 1 كاملة + بداية الوحدة 2", () => {
  it("الدروس مرتّبة والسجل مطابق للملفات", () => {
    expect(ALL_LESSONS.map((l) => l.id)).toEqual([
      "a1-u1-d1", "a1-u1-d2", "a1-u1-d3", "a1-u1-d4", "a1-u1-d5", "a1-u1-d6", "a1-u2-d1", "a1-u2-d2", "a1-u2-d3", "a1-u2-d4", "a1-u2-d5", "a1-u2-d6", "a1-u3-d1", "a1-u3-d2", "a1-u3-d3", "a1-u3-d4", "a1-u3-d5", "a1-u3-d6", "a1-u4-d1", "a1-u4-d2", "a1-u4-d3", "a1-u4-d4", "a1-u4-d5", "a1-u4-d6", "a1-u5-d1", "a1-u5-d2", "a1-u5-d3", "a1-u5-d4", "a1-u5-d5", "a1-u5-d6", "a1-u6-d1", "a1-u6-d2", "a1-u6-d3", "a1-u6-d4", "a1-u6-d5", "a1-u6-d6", "a1-u7-d1", "a1-u7-d2", "a1-u7-d3", "a1-u7-d4", "a1-u7-d5", "a1-u7-d6", "a1-u8-d1", "a1-u8-d2", "a1-u8-d3", "a1-u8-d4", "a1-u8-d5", "a1-u8-d6", "a1-u9-d1", "a1-u9-d2", "a1-u9-d3", "a1-u9-d4", "a1-u9-d5", "a1-u9-d6", "a1-u10-d1", "a1-u10-d2", "a1-u10-d3", "a1-u10-d4", "a1-u10-d5", "a1-u10-d6", "a1-u11-d1", "a1-u11-d2", "a1-u11-d3", "a1-u11-d4", "a1-u11-d5", "a1-u11-d6", "a1-u12-d1", "a1-u12-d2", "a1-u12-d3", "a1-u12-d4", "a1-u12-d5", "a1-u12-d6",
      "a1-u15-d1", "a1-u15-d2", "a1-u15-d3", "a1-u15-d4", "a1-u15-d5", "a1-u15-d6", // D113: أسبوع الامتحان 13 → 17 (D112) → 15 (13–14 تكملة للفهم)
      "a2-u1-d1",
    ]);
    expect(ALL_LESSONS.map((l) => [l.unit, l.day])).toEqual([
      [1, 1], [1, 2], [1, 3], [1, 4], [1, 5], [1, 6], [2, 1], [2, 2], [2, 3], [2, 4], [2, 5], [2, 6], [3, 1], [3, 2], [3, 3], [3, 4], [3, 5], [3, 6], [4, 1], [4, 2], [4, 3], [4, 4], [4, 5], [4, 6], [5, 1], [5, 2], [5, 3], [5, 4], [5, 5], [5, 6], [6, 1], [6, 2], [6, 3], [6, 4], [6, 5], [6, 6], [7, 1], [7, 2], [7, 3], [7, 4], [7, 5], [7, 6], [8, 1], [8, 2], [8, 3], [8, 4], [8, 5], [8, 6], [9, 1], [9, 2], [9, 3], [9, 4], [9, 5], [9, 6], [10, 1], [10, 2], [10, 3], [10, 4], [10, 5], [10, 6], [11, 1], [11, 2], [11, 3], [11, 4], [11, 5], [11, 6], [12, 1], [12, 2], [12, 3], [12, 4], [12, 5], [12, 6],
      [15, 1], [15, 2], [15, 3], [15, 4], [15, 5], [15, 6],
      [1, 1],
    ]);
    expect(ALL_WORDS.length).toBe(818); // + die Lebensmittel · der Apfel · mögen (نواة a1-u5-d1 — D141) + das Glück · glücklich (نواة a1-u4-d5) · ihr (ملكيتها — N-063) (D140) + bekannt · die Bekannte · tot (نواة a1-u4-d4 — D139) + beide · die Lösung (نواة a1-u4-d3 — D138) + lieben (نواة a1-u4-d2 — D137) + Großeltern · Junge · Opa (نواة a1-u4-d1 — D136) + einmal · später · die Aufgabe (D135) + fertig · regnen · scheinen (D134) + nächste · geschlossen · geöffnet (D133) + Dank · leicht · Restaurant (D132) + Oma · Essen (D131) + schlecht · also · Gruppe (D130) + lang · lange (D128) + Text · Fehler · bedeuten · Lehrerin (D127) + Mensch · Ort · Leben (D126) + international (D125) + neu · wie viel (D116) + heute · jetzt · schwer (D119) + Anmeldung · Partner · Partnerin · Herr (D120) + Alter · Kurs · Klasse (D121) + Ende · wissen · Wort · oft · bisschen · Schüler · Schülerin · Student · Studentin (D123)
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

  it("التوافق مع الاستخدام القديم: firstLesson هو d1 بكل كلماته الـ17 (15 + نواة D113)", () => {
    expect(firstLesson.id).toBe("a1-u1-d1");
    expect(firstLessonWords).toHaveLength(17);
    expect(firstLessonWords.slice(-2).map((w) => w.id)).toEqual(["neu", "wie-viel"]);
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
