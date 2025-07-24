/**
 * 404 Tool Not Found
 * 未找到工具页面
 */
interface ToolNotFoundProps {
  toolSlug?: string
}

export default function ToolNotFound({ toolSlug }: ToolNotFoundProps) {
  return (
    <div className="text-center text-red-500 text-xl mt-20">
      工具未找到: {toolSlug}
      <br />
      Tool Not Found: {toolSlug}
    </div>
  )
}
