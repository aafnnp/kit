import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from "react"
import { cn } from "@/lib/cn"

type ButtonVariant = "primary" | "secondary" | "ghost"
type ButtonSize = "sm" | "md"

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
}

export function Button({
  variant = "secondary",
  size = "md",
  loading = false,
  className,
  children,
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button
      type="button"
      className={cn("kit-btn", `kit-btn--${variant}`, `kit-btn--${size}`, className)}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? <Spinner size={14} /> : null}
      {children}
    </button>
  )
}

export function IconButton({
  label,
  className,
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button type="button" className={cn("kit-icon-btn", className)} aria-label={label} title={label} {...rest}>
      {children}
    </button>
  )
}

export function Card({
  children,
  className,
  as: Tag = "div",
}: {
  children: ReactNode
  className?: string
  as?: "div" | "section" | "li"
}) {
  return <Tag className={cn("kit-card", className)}>{children}</Tag>
}

export function Spinner({ size = 16 }: { size?: number }) {
  return <span className="kit-spinner" style={{ width: size, height: size }} aria-hidden="true" />
}

export function Switch({
  checked,
  onChange,
  disabled,
  label,
}: {
  checked: boolean
  onChange: (next: boolean) => void
  disabled?: boolean
  label: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className={cn("kit-switch", checked && "is-on")}
      disabled={disabled}
      onClick={() => onChange(!checked)}
    >
      <span className="kit-switch__thumb" />
    </button>
  )
}

export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "primary" | "danger" }) {
  return <span className={cn("kit-badge", `kit-badge--${tone}`)}>{children}</span>
}

export function Input({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn("kit-input", className)} {...rest} />
}

export function Section({ title, children, actions }: { title: string; children: ReactNode; actions?: ReactNode }) {
  return (
    <section className="kit-section">
      <header className="kit-section__header">
        <h2 className="kit-section__title">{title}</h2>
        {actions}
      </header>
      {children}
    </section>
  )
}

export function EmptyState({ icon, title, hint, action }: { icon: string; title: string; hint?: string; action?: ReactNode }) {
  return (
    <div className="kit-empty">
      <span className="kit-empty__icon" aria-hidden="true">
        {icon}
      </span>
      <p className="kit-empty__title">{title}</p>
      {hint ? <p className="kit-empty__hint">{hint}</p> : null}
      {action}
    </div>
  )
}

export function Field({
  label,
  value,
  onChange,
  placeholder,
  multiline,
  rows = 4,
}: {
  label: string
  value: string
  onChange: (next: string) => void
  placeholder?: string
  multiline?: boolean
  rows?: number
}) {
  return (
    <label className="kit-field">
      <span className="kit-field__label">{label}</span>
      {multiline ? (
        <textarea
          className="kit-input kit-input--area"
          value={value}
          rows={rows}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : (
        <input
          className="kit-input"
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
    </label>
  )
}

export function KeyValue({ label, value, mono }: { label: string; value: ReactNode; mono?: boolean }) {
  return (
    <div className="kit-kv">
      <span className="kit-kv__label">{label}</span>
      <span className={cn("kit-kv__value", mono && "kit-mono")}>{value}</span>
    </div>
  )
}
