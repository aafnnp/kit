import { describe, expect, it } from "vitest"
import { getDefaultEnabledIds, listPluginIds, loadPlugin, pluginCatalog, pluginIssues } from "./registry"
import { resolveEnabled } from "./store"
import { validatePlugin, validatePluginMeta } from "./define"

describe("插件注册表", () => {
  it("所有内置插件的元数据都通过校验", () => {
    expect(pluginIssues).toEqual([])
    for (const meta of pluginCatalog) {
      expect(validatePluginMeta(meta, meta.id), meta.id).toEqual([])
    }
  })

  it("id 唯一且数量稳定", () => {
    const ids = listPluginIds()
    expect(new Set(ids).size).toBe(ids.length)
    expect(ids.length).toBeGreaterThanOrEqual(6)
  })

  it("每个插件都能懒加载并且实现自洽", async () => {
    for (const id of listPluginIds()) {
      const plugin = await loadPlugin(id)
      expect(plugin, id).not.toBeNull()
      expect(plugin?.meta.id, id).toBe(id)
      expect(validatePlugin(plugin ?? undefined, id), id).toEqual([])
    }
  })

  it("默认启用的是基础插件，且不申请 host 权限", () => {
    const defaults = getDefaultEnabledIds()
    expect(defaults).toContain("page-info")
    expect(defaults).toContain("screenshot")
    expect(defaults).not.toContain("tab-manager")

    for (const meta of pluginCatalog) {
      if (meta.defaultEnabled) expect(meta.origins ?? [], meta.id).toEqual([])
    }
  })

  it("需要额外权限的插件默认关闭", () => {
    for (const meta of pluginCatalog) {
      if ((meta.permissions?.length ?? 0) > 0) {
        expect(meta.defaultEnabled, meta.id).toBe(false)
      }
    }
  })

  it("存储中没有记录时回落到 defaultEnabled", () => {
    expect(resolveEnabled({}, "screenshot")).toBe(true)
    expect(resolveEnabled({}, "tab-manager")).toBe(false)
    expect(resolveEnabled({ "tab-manager": { enabled: true, installedAt: 0 } }, "tab-manager")).toBe(true)
    expect(resolveEnabled({ "page-info": { enabled: false, installedAt: 0 } }, "page-info")).toBe(false)
  })
})
