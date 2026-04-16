"use client";

import { ArrowUp, Paperclip } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { ModeSelector } from "./ModeSelector";
import type { SearchMode } from "@/lib/types";
import { cn } from "@/lib/utils";

interface Props {
  placeholder?: string;
  autoFocus?: boolean;
  disabled?: boolean;
  mode: SearchMode;
  onModeChange: (m: SearchMode) => void;
  onSubmit: (value: string) => void;
  onAttach?: (files: File[]) => void;
  size?: "lg" | "md";
}

export function SearchBox({
  placeholder = "Ask Scout anything…",
  autoFocus,
  disabled,
  mode,
  onModeChange,
  onSubmit,
  onAttach,
  size = "md",
}: Props) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (autoFocus) textareaRef.current?.focus();
  }, [autoFocus]);

  // Auto-grow the textarea between 1 and ~6 lines.
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 220) + "px";
  }, [value]);

  const submit = useCallback(() => {
    const v = value.trim();
    if (!v || disabled) return;
    onSubmit(v);
    setValue("");
  }, [value, disabled, onSubmit]);

  return (
    <div
      className={cn(
        "group relative rounded-2xl border border-[var(--border)] bg-[var(--bg-elev)] shadow-soft transition-colors",
        "focus-within:border-accent/60",
        size === "lg" ? "p-3" : "p-2.5",
      )}
    >
      <textarea
        ref={textareaRef}
        rows={1}
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            submit();
          }
        }}
        className={cn(
          "block w-full resize-none bg-transparent text-[15px] leading-6 text-white outline-none placeholder:text-ink-400",
          size === "lg" ? "px-2 py-1.5" : "px-1.5 py-1",
        )}
      />
      <div className="mt-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <ModeSelector value={mode} onChange={onModeChange} />
          {onAttach && (
            <label className="flex cursor-pointer items-center gap-1.5 rounded-md border border-[var(--border)] bg-[var(--bg-elev-2)] px-2.5 py-1 text-[12px] text-ink-300 hover:text-white">
              <Paperclip size={12} />
              Attach
              <input
                type="file"
                multiple
                hidden
                onChange={(e) => {
                  const files = e.target.files ? Array.from(e.target.files) : [];
                  if (files.length) onAttach(files);
                  e.currentTarget.value = "";
                }}
              />
            </label>
          )}
        </div>
        <button
          onClick={submit}
          disabled={disabled || !value.trim()}
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-full bg-accent text-white transition-opacity",
            "disabled:cursor-not-allowed disabled:opacity-30 hover:opacity-90",
          )}
          aria-label="Send"
        >
          <ArrowUp size={14} />
        </button>
      </div>
    </div>
  );
}
