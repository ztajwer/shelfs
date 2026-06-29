"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface ScrollOpenModalProps {
  open: boolean;
  onClose: () => void;
}

const AUTO_DISMISS_MS = 3000;
const EXIT_MS = 1150;

function prefersReducedMotion() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export default function ScrollOpenModal({ open, onClose }: ScrollOpenModalProps) {
  const [present, setPresent] = useState(false);
  const [exiting, setExiting] = useState(false);
  const autoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearAutoTimer = useCallback(() => {
    if (autoTimerRef.current) {
      clearTimeout(autoTimerRef.current);
      autoTimerRef.current = null;
    }
  }, []);

  const finishExit = useCallback(() => {
    setPresent(false);
    setExiting(false);
    onClose();
  }, [onClose]);

  const startExit = useCallback(() => {
    clearAutoTimer();
    if (prefersReducedMotion()) {
      finishExit();
      return;
    }
    setExiting(true);
  }, [clearAutoTimer, finishExit]);

  useEffect(() => {
    if (!open) return;

    setPresent(true);
    setExiting(false);
    clearAutoTimer();
    autoTimerRef.current = setTimeout(startExit, AUTO_DISMISS_MS);
    return clearAutoTimer;
  }, [open, startExit, clearAutoTimer]);

  useEffect(() => {
    if (open || !present || exiting) return;
    startExit();
  }, [open, present, exiting, startExit]);

  useEffect(() => {
    if (!exiting) return;

    exitTimerRef.current = setTimeout(finishExit, EXIT_MS);
    return () => {
      if (exitTimerRef.current) {
        clearTimeout(exitTimerRef.current);
        exitTimerRef.current = null;
      }
    };
  }, [exiting, finishExit]);

  if (!present) return null;

  return (
    <div
      className={`scroll-open-modal-backdrop fixed inset-0 z-[35] flex items-center justify-center px-6${
        exiting ? " scroll-open-modal-backdrop--exit" : ""
      }`}
      onClick={startExit}
      role="presentation"
    >
      <div
        className={`scroll-open-modal-ring${exiting ? " scroll-open-modal-ring--exit" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="scroll-open-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="scroll-open-modal-circle">
          <button
            type="button"
            onClick={startExit}
            className="scroll-open-modal-close absolute flex items-center justify-center"
            aria-label="Close"
          >
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden>
              <path
                d="M1 1L11 11M11 1L1 11"
                stroke="currentColor"
                strokeWidth="1.25"
                strokeLinecap="round"
              />
            </svg>
          </button>

          <div className="scroll-open-modal-icon mb-3 flex animate-gentle-pulse items-center justify-center">
            <svg width="15" height="22" viewBox="0 0 18 26" fill="none" aria-hidden>
              <path
                d="M9 1.5V20M9 20L4 15M9 20L14 15"
                stroke="currentColor"
                strokeWidth="1"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <p
            id="scroll-open-modal-title"
            className="scroll-open-modal-title font-display text-[1.15rem] font-light leading-none tracking-[0.06em] sm:text-[1.28rem]"
          >
            Scroll to Open
          </p>

          <div className="scroll-open-modal-divider my-2.5 flex items-center gap-3">
            <span className="scroll-open-modal-divider-line h-px w-10" />
            <span className="scroll-open-modal-divider-gem h-1.5 w-1.5 rotate-45" />
            <span className="scroll-open-modal-divider-line h-px w-10" />
          </div>

          <p className="scroll-open-modal-sub font-sans text-[10px] font-light uppercase tracking-[0.32em] sm:text-[11px]">
            Enter the boutique
          </p>
        </div>
      </div>
    </div>
  );
}
