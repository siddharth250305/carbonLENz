import React from 'react';

export const ICON = { size: 15, strokeWidth: 1.5 };
export const MONO = 'font-mono tabular-nums';

const DOT_TONES = {
  red: 'bg-red-500',
  amber: 'bg-amber-500',
  emerald: 'bg-emerald-500',
  zinc: 'bg-zinc-300',
  blue: 'bg-sky-500',
};

export const RISK_TONE = { low: 'emerald', medium: 'amber', high: 'red' };

export function StatusDot({ tone = 'zinc', className = '' }) {
  return <span aria-hidden className={`inline-block w-1.5 h-1.5 rounded-full shrink-0 ${DOT_TONES[tone]} ${className}`} />;
}

export function Panel({ title, icon: Icon, actions, children, className = '', bodyClassName = 'p-4' }) {
  return (
    <section className={`bg-white border border-zinc-200 rounded-lg ${className}`}>
      {title && (
        <header className="flex items-center justify-between gap-3 h-11 px-4 border-b border-zinc-200">
          <h2 className="flex items-center gap-2 text-[13px] font-semibold text-zinc-900 truncate">
            {Icon && <Icon {...ICON} className="text-zinc-400 shrink-0" />}
            {title}
          </h2>
          {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
        </header>
      )}
      <div className={bodyClassName}>{children}</div>
    </section>
  );
}

export function Segmented({ options, value, onChange, ariaLabel, className = '' }) {
  return (
    <div role="radiogroup" aria-label={ariaLabel} className={`inline-flex p-0.5 bg-zinc-100 rounded-md ${className}`}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={`flex items-center gap-1.5 h-7 px-2.5 rounded-[5px] text-[13px] whitespace-nowrap transition-colors cursor-pointer ${
              active ? 'bg-white text-zinc-900 font-medium ring-1 ring-zinc-200' : 'text-zinc-500 hover:text-zinc-900'
            }`}
          >
            {o.icon && <o.icon {...ICON} />}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export const inputClass =
  'w-full h-8 px-2.5 bg-white border border-zinc-200 rounded-md text-[13px] text-zinc-900 outline-none transition-colors focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100';

export function FieldLabel({ htmlFor, children }) {
  return (
    <label htmlFor={htmlFor} className="block text-xs font-medium text-zinc-500 mb-1">
      {children}
    </label>
  );
}

export function SuffixInput({ suffix, className = '', ...props }) {
  return (
    <div className="relative">
      <input {...props} className={`${inputClass} ${MONO} pr-16 ${className}`} />
      <span className={`absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-zinc-400 pointer-events-none ${MONO}`}>{suffix}</span>
    </div>
  );
}

export function Button({ variant = 'secondary', icon: Icon, children, className = '', ...props }) {
  const styles = {
    primary: 'bg-zinc-900 text-white hover:bg-zinc-800 disabled:bg-zinc-300',
    secondary: 'bg-white text-zinc-900 border border-zinc-200 hover:bg-zinc-50 disabled:text-zinc-400',
    ghost: 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100',
  };
  return (
    <button
      type="button"
      {...props}
      className={`inline-flex items-center justify-center gap-1.5 h-8 px-3 rounded-md text-[13px] font-medium transition-colors cursor-pointer disabled:cursor-not-allowed ${styles[variant]} ${className}`}
    >
      {Icon && <Icon {...ICON} />}
      {children}
    </button>
  );
}

// Legal citations, standards and CN codes inside prose are set in monospace.
const CITATION = /((?:Delegated|Implementing)\s+Reg(?:ulation|\.)\s*\(EU\)\s*\d{4}\/\d+|(?:Impl\.|Del\.)\s*Reg\.\s*\(EU\)\s*\d{4}\/\d+|Reg(?:ulation|\.)\s*\(EU\)\s*\d{4}\/\d+|ISO\s*\d{4,5}(?:-\d)?|CN\s\d{4}(?:\s\d{2}){0,2})/g;

export function Cite({ children }) {
  const text = String(children ?? '');
  return text.split(CITATION).map((part, i) =>
    i % 2 === 1 ? (
      <span key={i} className={`${MONO} text-[0.92em]`}>{part}</span>
    ) : (
      <React.Fragment key={i}>{part}</React.Fragment>
    ),
  );
}
