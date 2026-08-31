import { useEffect, useState } from "react";

interface LiveTimerProps {
  startedAt: string;
}

export default function LiveTimer({ startedAt }: LiveTimerProps) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const start = new Date(startedAt).getTime();
    const tick = () => setElapsed(Date.now() - start);
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startedAt]);

  const totalSeconds = Math.floor(elapsed / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;

  const display = h > 0
    ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
    : `${m}:${String(s).padStart(2, "0")}`;

  return (
    <span style={{
      fontVariantNumeric: "tabular-nums",
      fontWeight: 600,
      letterSpacing: "0.02em",
    }}>
      ⏱ {display}
    </span>
  );
}
