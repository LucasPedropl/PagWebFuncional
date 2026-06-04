import React, { useRef, useEffect, useCallback } from 'react';

const DEFAULT_LENGTH = 6;

interface AuthOtpInputProps {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  disabled?: boolean;
  autoFocus?: boolean;
}

/** Código de ativação com um caractere por quadrado. */
export const AuthOtpInput: React.FC<AuthOtpInputProps> = ({
  value,
  onChange,
  length = DEFAULT_LENGTH,
  disabled = false,
  autoFocus = true,
}) => {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const chars = Array.from({ length }, (_, i) => value[i]?.toUpperCase() ?? '');

  const focusIndex = useCallback((index: number) => {
    const el = inputRefs.current[index];
    if (el) {
      el.focus();
      el.select();
    }
  }, []);

  useEffect(() => {
    if (autoFocus && !disabled) focusIndex(0);
  }, [autoFocus, disabled, focusIndex]);

  const emitValue = (cells: string[]) => {
    onChange(cells.join('').replace(/\s/g, '').slice(0, length));
  };

  const updateAtIndex = (index: number, char: string) => {
    const next = Array.from({ length }, (_, i) => value[i]?.toUpperCase() ?? '');
    next[index] = char;
    emitValue(next);
  };

  const handleChange = (index: number, raw: string) => {
    const cleaned = raw.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    if (!cleaned) {
      updateAtIndex(index, '');
      return;
    }
    if (cleaned.length === 1) {
      updateAtIndex(index, cleaned);
      if (index < length - 1) focusIndex(index + 1);
      return;
    }
    const pasted = cleaned.slice(0, length - index);
    const merged = Array.from({ length }, (_, i) => value[i]?.toUpperCase() ?? '');
    pasted.split('').forEach((ch, offset) => {
      merged[index + offset] = ch;
    });
    emitValue(merged);
    const nextFocus = Math.min(index + pasted.length, length - 1);
    focusIndex(nextFocus);
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      if (chars[index]) {
        updateAtIndex(index, '');
      } else if (index > 0) {
        updateAtIndex(index - 1, '');
        focusIndex(index - 1);
      }
      return;
    }
    if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      focusIndex(index - 1);
      return;
    }
    if (e.key === 'ArrowRight' && index < length - 1) {
      e.preventDefault();
      focusIndex(index + 1);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData('text')
      .replace(/[^a-zA-Z0-9]/g, '')
      .toUpperCase()
      .slice(0, length);
    onChange(pasted);
    focusIndex(Math.min(pasted.length, length - 1));
  };

  return (
    <div className="flex justify-center gap-2 sm:gap-2.5" onPaste={handlePaste}>
      {chars.map((char, index) => (
        <input
          key={index}
          ref={(el) => {
            inputRefs.current[index] = el;
          }}
          type="text"
          inputMode="text"
          autoComplete={index === 0 ? 'one-time-code' : 'off'}
          maxLength={1}
          value={char}
          disabled={disabled}
          aria-label={`Dígito ${index + 1} do código`}
          className={`w-11 h-12 sm:w-12 sm:h-14 text-center text-lg sm:text-xl font-bold uppercase border-2 rounded-[5px] bg-white text-slate-900 transition-all focus:outline-none focus:ring-2 focus:ring-offset-0 ${
            disabled
              ? 'border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed'
              : char
                ? 'border-slate-900 focus:ring-slate-900/15'
                : 'border-slate-200 focus:border-slate-400 focus:ring-slate-900/10 hover:border-slate-300'
          }`}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onFocus={(e) => e.target.select()}
        />
      ))}
    </div>
  );
};
