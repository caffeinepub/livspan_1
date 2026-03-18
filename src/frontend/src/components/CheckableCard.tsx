import { CheckCircle2, Circle } from "lucide-react";
import { motion } from "motion/react";
import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
  checked: boolean;
  onToggle: () => void;
  label: string;
}

export default function CheckableCard({
  children,
  checked,
  onToggle,
  label,
}: Props) {
  return (
    <div
      className={[
        "relative rounded-xl transition-all duration-300",
        checked
          ? "ring-1 ring-green-500/50 shadow-[0_0_12px_0_oklch(0.76_0.14_148_/_0.18)] opacity-80"
          : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
      <button
        type="button"
        onClick={onToggle}
        title={label}
        aria-label={label}
        className="absolute top-3 right-3 z-10 flex items-center justify-center transition-all duration-200 hover:scale-110"
        data-ocid="routine.checkbox"
      >
        <motion.div
          key={checked ? "checked" : "unchecked"}
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.18 }}
        >
          {checked ? (
            <CheckCircle2
              className="w-5 h-5"
              style={{ color: "oklch(0.76 0.14 148)" }}
            />
          ) : (
            <Circle className="w-5 h-5 text-border hover:text-muted-foreground" />
          )}
        </motion.div>
      </button>
    </div>
  );
}
