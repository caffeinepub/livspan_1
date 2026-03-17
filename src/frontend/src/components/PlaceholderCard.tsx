import type { ReactNode } from "react";

interface Props {
  title: string;
  icon: ReactNode;
  description: string;
}

export default function PlaceholderCard({ title, icon, description }: Props) {
  return (
    <div className="glass-card rounded-2xl p-5 flex flex-col gap-3">
      <div className="flex items-center gap-2.5">
        <span className="text-green-accent">{icon}</span>
        <h3 className="font-display font-semibold text-base text-foreground">
          {title}
        </h3>
        <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-muted/60 text-muted-foreground border border-border/40">
          Coming Soon
        </span>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed">
        {description}
      </p>
      <div className="h-20 rounded-xl bg-muted/30 border border-border/30 flex items-center justify-center">
        <span className="text-muted-foreground/40 text-xs">
          Data visualization coming soon
        </span>
      </div>
    </div>
  );
}
