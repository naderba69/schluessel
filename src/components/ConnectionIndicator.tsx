import { useEffect, useState } from "react";

/** §16 (PWA): مؤشر اتصال — صغير وصادق: أخضر متصل · رمادي دون اتصال (التطبيق يعمل أوفلاين) */
export function ConnectionIndicator() {
  const [online, setOnline] = useState(() => globalThis.navigator?.onLine ?? true);
  useEffect(() => {
    const up = () => setOnline(true);
    const down = () => setOnline(false);
    globalThis.addEventListener?.("online", up);
    globalThis.addEventListener?.("offline", down);
    return () => {
      globalThis.removeEventListener?.("online", up);
      globalThis.removeEventListener?.("offline", down);
    };
  }, []);
  return (
    <p data-testid="connection-indicator" data-online={online ? "1" : "0"} role="status">
      {online ? "🟢 متصل" : "⚪ دون اتصال — التطبيق يعمل أوفلاين"}
    </p>
  );
}
