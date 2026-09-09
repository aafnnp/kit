import { useTranslation } from "react-i18next"
import { type ToolNotFoundProps } from "@/components/common/schemas"

/**
 * Tool Not Found Component
 * 工具未找到页面组件
 */

// Re-export type for backward compatibility
export type { ToolNotFoundProps }

export default function ToolNotFound({ toolSlug }: ToolNotFoundProps) {
  const { t } = useTranslation()
  return (
    <div className="text-center text-red-500 text-xl mt-20">
      {t("toolNotFound.message", { slug: toolSlug })}
    </div>
  )
}
