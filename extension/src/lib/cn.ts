/** 极简 classNames 拼接（不引入 clsx，保持扩展体积） */
export function cn(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(" ")
}
