import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

interface AiTipProps {
  tips: string[];
}

export default function AiTip({ tips }: AiTipProps) {
  const [open, setOpen] = useState(false);

  if (!tips || tips.length === 0) return null;

  return (
    <div className="mt-3 rounded-xl border border-violet-500/30 bg-violet-500/5 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center gap-2 px-3 py-2 text-left"
      >
        <span className="text-base leading-none">🤖</span>
        <span className="text-xs font-semibold text-violet-300 flex-1">
          AI Tip
        </span>
        {open ? (
          <ChevronUp className="w-3.5 h-3.5 text-violet-400" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5 text-violet-400" />
        )}
      </button>

      {open && (
        <div className="px-3 pb-3 space-y-1.5">
          {tips.map((tip) => (
            <p
              key={tip}
              className="text-xs text-muted-foreground leading-relaxed flex gap-2"
            >
              <span className="text-violet-400 shrink-0 mt-0.5">•</span>
              <span>{tip}</span>
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
