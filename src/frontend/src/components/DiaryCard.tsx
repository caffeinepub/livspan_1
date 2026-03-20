import { Textarea } from "@/components/ui/textarea";
import {
  BookOpen,
  Check,
  Loader2,
  Moon,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { useLanguage } from "../hooks/useLanguage";
import {
  useAddDiaryEntry,
  useDeleteDiaryEntry,
  useGetDiaryEntries,
  useUpdateDiaryEntry,
} from "../hooks/useQueries";
import { t } from "../i18n";

function formatTimestamp(): string {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const year = now.getFullYear();
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  return `${day}.${month}.${year} ${hours}:${minutes}`;
}

export default function DiaryCard() {
  const { lang } = useLanguage();
  const tr = t[lang];

  const { data: entries = [], isLoading } = useGetDiaryEntries();
  const addEntry = useAddDiaryEntry();
  const updateEntry = useUpdateDiaryEntry();
  const deleteEntry = useDeleteDiaryEntry();

  const [isAdding, setIsAdding] = useState(false);
  const [newText, setNewText] = useState("");
  const [editingId, setEditingId] = useState<bigint | null>(null);
  const [editText, setEditText] = useState("");

  const handleAdd = () => {
    const trimmed = newText.trim();
    if (!trimmed) return;
    addEntry.mutate(
      { text: trimmed, timestamp: formatTimestamp() },
      {
        onSuccess: () => {
          setNewText("");
          setIsAdding(false);
        },
      },
    );
  };

  const handleDelete = (id: bigint) => {
    deleteEntry.mutate(id);
  };

  const startEdit = (id: bigint, text: string) => {
    setEditingId(id);
    setEditText(text);
  };

  const handleSaveEdit = () => {
    const trimmed = editText.trim();
    if (!trimmed || editingId === null) return;
    updateEntry.mutate(
      { id: editingId, text: trimmed },
      {
        onSuccess: () => {
          setEditingId(null);
          setEditText("");
        },
      },
    );
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditText("");
  };

  const handleCancelAdd = () => {
    setIsAdding(false);
    setNewText("");
  };

  return (
    <div className="glass-card rounded-2xl p-5">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 rounded-xl bg-violet-500/15 flex items-center justify-center text-violet-400 shrink-0">
          <Moon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-display font-semibold text-sm text-foreground">
            {tr.diary_title}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {tr.diary_desc}
          </p>
        </div>
        {!isAdding && (
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className="w-8 h-8 rounded-xl bg-violet-500/15 flex items-center justify-center text-violet-400 hover:bg-violet-500/25 transition-colors shrink-0"
            aria-label={tr.diary_add}
            data-ocid="diary.open_modal_button"
          >
            <Plus className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* New entry form */}
      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden mb-4"
          >
            <div className="space-y-2">
              <Textarea
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
                placeholder={tr.diary_placeholder}
                className="text-sm resize-none bg-muted/30 border-border/40 focus:border-violet-400/50 min-h-[90px]"
                autoFocus
                data-ocid="diary.textarea"
              />
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={handleCancelAdd}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                  data-ocid="diary.cancel_button"
                >
                  <X className="w-3.5 h-3.5" />
                  {tr.diary_cancel}
                </button>
                <button
                  type="button"
                  onClick={handleAdd}
                  disabled={!newText.trim() || addEntry.isPending}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-violet-500/20 text-violet-300 hover:bg-violet-500/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  data-ocid="diary.submit_button"
                >
                  {addEntry.isPending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  {tr.diary_save}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Entries list */}
      {isLoading ? (
        <div
          className="flex items-center justify-center py-8"
          data-ocid="diary.loading_state"
        >
          <Loader2 className="w-5 h-5 animate-spin text-violet-400/60" />
        </div>
      ) : entries.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-6"
          data-ocid="diary.empty_state"
        >
          <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center mx-auto mb-2">
            <BookOpen className="w-5 h-5 text-violet-400/50" />
          </div>
          <p className="text-xs font-medium text-muted-foreground">
            {tr.diary_no_entries}
          </p>
          <p className="text-xs text-muted-foreground/60 mt-0.5">
            {tr.diary_no_entries_sub}
          </p>
        </motion.div>
      ) : (
        <div className="max-h-[360px] min-h-[120px] overflow-y-auto pr-1">
          <div className="space-y-3" data-ocid="diary.list">
            <AnimatePresence initial={false}>
              {entries.map((entry, idx) => (
                <motion.div
                  key={String(entry.id)}
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: 20, transition: { duration: 0.15 } }}
                  transition={{ duration: 0.2 }}
                  className="group rounded-xl bg-muted/20 border border-border/30 hover:border-border/50 p-3 transition-colors"
                  data-ocid={`diary.item.${idx + 1}`}
                >
                  {editingId === entry.id ? (
                    <div className="space-y-2">
                      <Textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="text-sm resize-none bg-muted/30 border-border/40 focus:border-violet-400/50 min-h-[80px]"
                        autoFocus
                        data-ocid="diary.textarea"
                      />
                      <div className="flex gap-2 justify-end">
                        <button
                          type="button"
                          onClick={handleCancelEdit}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                          data-ocid="diary.cancel_button"
                        >
                          <X className="w-3 h-3" />
                          {tr.diary_cancel}
                        </button>
                        <button
                          type="button"
                          onClick={handleSaveEdit}
                          disabled={!editText.trim() || updateEntry.isPending}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] bg-violet-500/20 text-violet-300 hover:bg-violet-500/30 transition-colors disabled:opacity-40"
                          data-ocid="diary.save_button"
                        >
                          {updateEntry.isPending ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Check className="w-3 h-3" />
                          )}
                          {tr.diary_save}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className="text-[10px] text-muted-foreground/70 font-mono bg-muted/40 px-2 py-0.5 rounded-full">
                          {entry.timestamp}
                        </span>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                          <button
                            type="button"
                            onClick={() => startEdit(entry.id, entry.text)}
                            className="w-6 h-6 rounded-lg flex items-center justify-center text-muted-foreground hover:text-violet-400 hover:bg-violet-500/10 transition-colors"
                            aria-label={tr.diary_edit}
                            data-ocid={`diary.edit_button.${idx + 1}`}
                          >
                            <Pencil className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(entry.id)}
                            disabled={deleteEntry.isPending}
                            className="w-6 h-6 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-40"
                            aria-label={tr.diary_delete}
                            data-ocid={`diary.delete_button.${idx + 1}`}
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-foreground/90 leading-relaxed whitespace-pre-wrap">
                        {entry.text}
                      </p>
                    </>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
}
