import { z } from "zod"
import { toolSchema } from "@/schemas/tool.schema"

const toolMetaSchema = toolSchema.extend({
  category: z.string().min(1, "Category is required"),
})

export type ToolMeta = z.infer<typeof toolMetaSchema>

export const defineToolMeta = (meta: ToolMeta): ToolMeta => toolMetaSchema.parse(meta)

export { toolMetaSchema }


