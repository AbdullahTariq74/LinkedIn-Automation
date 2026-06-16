'use client';

import { useState, useRef, useEffect } from 'react';

type Option = { value: string; label: string };

export function CustomSelect({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  options: Option[];
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selected = options.find(o => o.value === value);
  const displayLabel = selected?.label ?? placeholder ?? value;

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%',
          background: 'var(--bg-input)',
          border: '1px solid var(--border)',
          color: selected ? 'var(--text)' : 'var(--text-subtle)',
          borderRadius: '8px',
          padding: '8px 32px 8px 12px',
          fontSize: '13px',
          textAlign: 'left',
          cursor: 'pointer',
          position: 'relative',
          outline: 'none',
        }}
      >
        {displayLabel}
        <span style={{
          position: 'absolute', right: 10, top: '50%',
          transform: open ? 'translateY(-50%) rotate(180deg)' : 'translateY(-50%)',
          transition: 'transform 0.15s',
          opacity: 0.45,
          fontSize: 10,
        }}>▼</span>
      </button>

      {open && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 4px)',
          left: 0,
          right: 0,
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          overflow: 'hidden',
          zIndex: 100,
          boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
        }}>
          {options.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { onChange(opt.value); setOpen(false); }}
              style={{
                display: 'block',
                width: '100%',
                padding: '9px 12px',
                textAlign: 'left',
                background: opt.value === value ? 'rgba(43,206,247,0.08)' : 'transparent',
                color: opt.value === value ? '#2BCEF7' : 'var(--text)',
                fontSize: '13px',
                cursor: 'pointer',
                border: 'none',
                borderBottom: '1px solid var(--border-row)',
              }}
              onMouseEnter={e => {
                if (opt.value !== value)
                  (e.currentTarget as HTMLElement).style.background = 'var(--hover-row)';
              }}
              onMouseLeave={e => {
                if (opt.value !== value)
                  (e.currentTarget as HTMLElement).style.background = 'transparent';
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
