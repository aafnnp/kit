declare module 'web-vitals' {
  export function onLCP(cb: (metric: { value: number }) => void): void
  export function onCLS(cb: (metric: { value: number }) => void): void
  export function onINP(cb: (metric: { value: number }) => void): void
}
