import { browser } from "wxt/browser"
import { createLogger } from "./log"

const log = createLogger("permissions")

export interface PermissionRequest {
  permissions?: string[]
  origins?: string[]
}

/** permissions API 的入参类型（permissions 字段是 Chrome 权限名的强类型联合） */
type PermissionsOptions = Parameters<typeof browser.permissions.contains>[0]

function toOptions(request: PermissionRequest): PermissionsOptions {
  return {
    permissions: request.permissions ?? [],
    origins: request.origins ?? [],
  } as unknown as PermissionsOptions
}

export function isEmptyRequest(request: PermissionRequest): boolean {
  return !request.permissions?.length && !request.origins?.length
}

/** 检查权限是否已授予（未授予不会报错，只返回 false） */
export async function hasPermissions(request: PermissionRequest): Promise<boolean> {
  if (isEmptyRequest(request)) return true

  try {
    return Boolean(await browser.permissions.contains(toOptions(request)))
  } catch (error) {
    log.warn("权限检查失败", request, error)
    return false
  }
}

/**
 * 申请权限。
 *
 * 注意：Chrome / Firefox 都要求这个调用发生在**用户手势**里（点击处理器内），
 * 所以启用插件的流程必须"先申请权限，再写存储"，中间不要插入其它 await。
 */
export async function requestPermissions(request: PermissionRequest): Promise<boolean> {
  if (isEmptyRequest(request)) return true

  try {
    return Boolean(await browser.permissions.request(toOptions(request)))
  } catch (error) {
    log.warn("权限申请失败", request, error)
    return false
  }
}

/** 已授予则返回 true，否则发起申请 */
export async function ensurePermissions(request: PermissionRequest): Promise<boolean> {
  if (await hasPermissions(request)) return true
  return requestPermissions(request)
}
