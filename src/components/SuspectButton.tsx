import { useState } from "react";
import { addSuspect } from "../lib/suspect-queue.js";

/** القانون 27: زر «أشك أن هذا خطأ» — كل تمرين — يُسجِّل الشك في طابور G1 فوراً (محلياً) */
export function SuspectButton({ source, text }: { source: string; text?: string }) {
  const [done, setDone] = useState(false);
  if (done)
    return (
      <p data-testid="suspect-thanks" role="status">
        سُجّل شكّك ✓ — يُعاد فحصه بأدوات الجودة. شكرًا لك (الشك مساعدة لا تذمر).
      </p>
    );
  return (
    <button
      data-testid="suspect-button"
      onClick={() => {
        addSuspect(source, text ?? "");
        setDone(true);
      }}
    >
      🤔 أشك أن هذا خطأ
    </button>
  );
}
