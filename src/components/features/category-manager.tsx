import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Settings, Edit, Trash2, GripVertical, SortAsc, SortDesc } from "lucide-react"
import { useCustomCategories, SORT_OPTIONS } from "@/lib/data"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core"
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

interface CategoryManagerProps {
  allTools: any[]
  onCategoryChange?: () => void
}

const CATEGORY_COLORS = [
  "#3b82f6", // blue
  "#10b981", // emerald
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // violet
  "#06b6d4", // cyan
  "#84cc16", // lime
  "#f97316", // orange
  "#ec4899", // pink
  "#6b7280", // gray
]

export function CategoryManager({ allTools, onCategoryChange }: CategoryManagerProps) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.startsWith("en") ? "en" : "zh"

  const {
    customCategories,
    sortOption,
    createCategory,
    deleteCategory,
    updateCategory,
    addToolToCategory,
    removeToolFromCategory,
    reorderCategories,
    setSortOption,
  } = useCustomCategories()

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<any>(null)
  const [newCategoryName, setNewCategoryName] = useState({ zh: "", en: "" })
  const [selectedColor, setSelectedColor] = useState(CATEGORY_COLORS[0])

  // 创建新分类
  const handleCreateCategory = () => {
    if (newCategoryName.zh.trim() && newCategoryName.en.trim()) {
      createCategory(newCategoryName, selectedColor)
      setNewCategoryName({ zh: "", en: "" })
      setSelectedColor(CATEGORY_COLORS[0])
      setIsCreateDialogOpen(false)
      onCategoryChange?.()
    }
  }

  // 编辑分类
  const handleEditCategory = (category: any) => {
    setEditingCategory(category)
    setNewCategoryName(category.name)
    setSelectedColor(category.color || CATEGORY_COLORS[0])
    setIsEditDialogOpen(true)
  }

  // 保存编辑
  const handleSaveEdit = () => {
    if (editingCategory && newCategoryName.zh.trim() && newCategoryName.en.trim()) {
      updateCategory(editingCategory.id, {
        name: newCategoryName,
        color: selectedColor,
      })
      setIsEditDialogOpen(false)
      setEditingCategory(null)
      setNewCategoryName({ zh: "", en: "" })
      onCategoryChange?.()
    }
  }

  // 删除分类
  const handleDeleteCategory = (categoryId: string) => {
    if (confirm(t("category.delete.confirm", "确定要删除这个分类吗？"))) {
      deleteCategory(categoryId)
      onCategoryChange?.()
    }
  }

  // 拖拽传感器
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // 拖拽重排序
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = customCategories.findIndex((item) => item.id === active.id)
      const newIndex = customCategories.findIndex((item) => item.id === over.id)

      const newItems = arrayMove(customCategories, oldIndex, newIndex)
      const newOrder = newItems.map((item) => item.id)
      reorderCategories(newOrder)
      onCategoryChange?.()
    }
  }

  // 添加工具到分类
  const handleAddToolToCategory = (categoryId: string, toolSlug: string) => {
    addToolToCategory(categoryId, toolSlug)
    onCategoryChange?.()
  }

  // 从分类移除工具
  const handleRemoveToolFromCategory = (categoryId: string, toolSlug: string) => {
    removeToolFromCategory(categoryId, toolSlug)
    onCategoryChange?.()
  }

  // 更改排序方式
  const handleSortChange = (newSortKey: string) => {
    const newDirection = sortOption.key === newSortKey && sortOption.direction === "asc" ? "desc" : "asc"
    setSortOption({ key: newSortKey as any, direction: newDirection })
    onCategoryChange?.()
  }

  return (
    <div className="space-y-4">
      {/* 工具栏 */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5" />
          <h3 className="text-lg font-semibold">{t("category.management", "分类管理")}</h3>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          {/* 排序选择 */}
          <Select
            value={sortOption.key}
            onValueChange={handleSortChange}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <div className="flex items-center gap-2">
                {sortOption.direction === "asc" ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
                <SelectValue />
              </div>
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((option) => (
                <SelectItem
                  key={option.key}
                  value={option.key}
                >
                  {option.label[locale]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* 创建分类按钮 */}
          <Dialog
            open={isCreateDialogOpen}
            onOpenChange={setIsCreateDialogOpen}
          >
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto">
                <Plus className="w-4 h-4 mr-2" />
                {t("category.create", "创建分类")}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t("category.create", "创建分类")}</DialogTitle>
                <DialogDescription>{t("category.create.desc", "创建一个新的工具分类来组织你的工具")}</DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="name-zh">{t("category.name.zh", "中文名称")}</Label>
                  <Input
                    id="name-zh"
                    value={newCategoryName.zh}
                    onChange={(e) => setNewCategoryName((prev) => ({ ...prev, zh: e.target.value }))}
                    placeholder={t("category.name.zh.placeholder", "输入中文名称")}
                  />
                </div>

                <div>
                  <Label htmlFor="name-en">{t("category.name.en", "英文名称")}</Label>
                  <Input
                    id="name-en"
                    value={newCategoryName.en}
                    onChange={(e) => setNewCategoryName((prev) => ({ ...prev, en: e.target.value }))}
                    placeholder={t("category.name.en.placeholder", "输入英文名称")}
                  />
                </div>

                <div>
                  <Label>{t("category.color", "分类颜色")}</Label>
                  <div className="flex gap-2 mt-2">
                    {CATEGORY_COLORS.map((color) => (
                      <button
                        key={color}
                        className={`w-8 h-8 rounded-full border-2 ${
                          selectedColor === color ? "border-foreground" : "border-transparent"
                        }`}
                        style={{ backgroundColor: color }}
                        onClick={() => setSelectedColor(color)}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  {t("common.cancel", "取消")}
                </Button>
                <Button onClick={handleCreateCategory}>{t("common.create", "创建")}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* 自定义分类列表 */}
      {customCategories.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-md font-medium">{t("category.custom", "自定义分类")}</h4>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={customCategories.map((cat) => cat.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {customCategories.map((category) => (
                  <SortableCategoryCard
                    key={category.id}
                    category={category}
                    locale={locale}
                    allTools={allTools}
                    onEdit={handleEditCategory}
                    onDelete={handleDeleteCategory}
                    onAddTool={handleAddToolToCategory}
                    onRemoveTool={handleRemoveToolFromCategory}
                    t={t}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      )}

      {/* 编辑分类对话框 */}
      <Dialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("category.edit", "编辑分类")}</DialogTitle>
            <DialogDescription>{t("category.edit.desc", "修改分类的名称和颜色")}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name-zh">{t("category.name.zh", "中文名称")}</Label>
              <Input
                id="edit-name-zh"
                value={newCategoryName.zh}
                onChange={(e) => setNewCategoryName((prev) => ({ ...prev, zh: e.target.value }))}
                placeholder={t("category.name.zh.placeholder", "输入中文名称")}
              />
            </div>

            <div>
              <Label htmlFor="edit-name-en">{t("category.name.en", "英文名称")}</Label>
              <Input
                id="edit-name-en"
                value={newCategoryName.en}
                onChange={(e) => setNewCategoryName((prev) => ({ ...prev, en: e.target.value }))}
                placeholder={t("category.name.en.placeholder", "输入英文名称")}
              />
            </div>

            <div>
              <Label>{t("category.color", "分类颜色")}</Label>
              <div className="flex gap-2 mt-2">
                {CATEGORY_COLORS.map((color) => (
                  <button
                    key={color}
                    className={`w-8 h-8 rounded-full border-2 ${
                      selectedColor === color ? "border-foreground" : "border-transparent"
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setSelectedColor(color)}
                  />
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              {t("common.cancel", "取消")}
            </Button>
            <Button onClick={handleSaveEdit}>{t("common.save", "保存")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// 可排序的分类卡片组件
interface SortableCategoryCardProps {
  category: any
  locale: string
  allTools: any[]
  onEdit: (category: any) => void
  onDelete: (categoryId: string) => void
  onAddTool: (categoryId: string, toolSlug: string) => void
  onRemoveTool: (categoryId: string, toolSlug: string) => void
  t: any
}

function SortableCategoryCard({
  category,
  locale,
  allTools,
  onEdit,
  onDelete,
  onAddTool,
  onRemoveTool,
  t,
}: SortableCategoryCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: category.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`${isDragging ? "shadow-lg opacity-50" : ""}`}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing"
            >
              <GripVertical className="w-4 h-4 text-muted-foreground" />
            </div>

            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: category.color }}
              />
              <CardTitle className="text-base">{category.name[locale]}</CardTitle>
              <Badge variant="secondary">
                {category.tools.length} {t("tools.count", "个工具")}
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(category)}
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(category.id)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-2">
          {/* 分类中的工具 */}
          {category.tools.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {category.tools.map((toolSlug: string) => {
                const tool = allTools.find((t) => t.slug === toolSlug)
                return tool ? (
                  <Badge
                    key={toolSlug}
                    variant="outline"
                    className="text-xs"
                  >
                    {tool.name}
                    <button
                      className="ml-1 hover:text-destructive"
                      onClick={() => onRemoveTool(category.id, toolSlug)}
                    >
                      ×
                    </button>
                  </Badge>
                ) : null
              })}
            </div>
          )}

          {/* 添加工具 */}
          <Select onValueChange={(toolSlug) => onAddTool(category.id, toolSlug)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder={t("category.add.tool", "添加工具到此分类")} />
            </SelectTrigger>
            <SelectContent>
              {allTools
                .filter((tool) => !category.tools.includes(tool.slug))
                .map((tool) => (
                  <SelectItem
                    key={tool.slug}
                    value={tool.slug}
                  >
                    {tool.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  )
}
