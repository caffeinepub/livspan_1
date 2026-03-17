import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useEffect, useState } from "react";
import type { RoutineWithStatus } from "../backend.d";
import { useLanguage } from "../hooks/useLanguage";
import { t } from "../i18n";

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (title: string, time: string, description: string) => void;
  routine?: RoutineWithStatus | null;
  isSaving?: boolean;
}

export default function RoutineModal({
  open,
  onClose,
  onSave,
  routine,
  isSaving,
}: Props) {
  const { lang } = useLanguage();
  const tr = t[lang];

  const [title, setTitle] = useState("");
  const [time, setTime] = useState("08:00");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (open) {
      setTitle(routine?.title ?? "");
      setTime(routine?.time ?? "08:00");
      setDescription(routine?.description ?? "");
    }
  }, [open, routine]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !time) return;
    onSave(title.trim(), time, description.trim());
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="glass-card border-border/60 max-w-md"
        data-ocid="routine.dialog"
      >
        <DialogHeader>
          <DialogTitle className="font-display text-lg text-foreground">
            {routine ? tr.edit_routine : tr.new_routine}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label
              htmlFor="routine-title"
              className="text-muted-foreground text-sm"
            >
              {tr.title_label}
            </Label>
            <Input
              id="routine-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={tr.title_placeholder}
              className="bg-input border-border/60 focus:ring-green-accent focus:border-green-accent"
              required
              data-ocid="routine.input"
            />
          </div>
          <div className="space-y-1.5">
            <Label
              htmlFor="routine-time"
              className="text-muted-foreground text-sm"
            >
              {tr.time_label}
            </Label>
            <Input
              id="routine-time"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="bg-input border-border/60 focus:ring-green-accent focus:border-green-accent"
              required
              data-ocid="routine.input"
            />
          </div>
          <div className="space-y-1.5">
            <Label
              htmlFor="routine-desc"
              className="text-muted-foreground text-sm"
            >
              {tr.description_label}
            </Label>
            <Textarea
              id="routine-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={tr.description_placeholder}
              rows={3}
              className="bg-input border-border/60 focus:ring-green-accent focus:border-green-accent resize-none"
              data-ocid="routine.textarea"
            />
          </div>
          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-border/60 text-muted-foreground hover:text-foreground"
              data-ocid="routine.cancel_button"
            >
              {tr.cancel}
            </Button>
            <Button
              type="submit"
              disabled={isSaving || !title.trim()}
              className="bg-gold text-primary-foreground hover:opacity-90 font-semibold"
              data-ocid="routine.save_button"
            >
              {isSaving ? tr.saving : tr.save_routine}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
