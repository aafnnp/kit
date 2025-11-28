import { useState, useCallback } from "react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Send, Plus, Trash2, Copy, Clock, Globe, FileText, Settings, Eye, EyeOff } from "lucide-react"
import { useCopyToClipboard } from "@/hooks/use-clipboard"
import {
  ApiTesterState,
  ApiRequest,
  ApiResponse,
  ApiTestResult,
  HttpMethod,
  ApiHeader,
  ApiParam,
} from "@/components/tools/api-tester/schema"
import { REQUEST_TEMPLATES, getStatusCategory, COMMON_HEADERS } from "@/components/tools/api-tester/schema"
import { ToolBase } from "@/components/common/tool-base"
import { nanoid } from "nanoid"

// 模拟 API 请求函数（在实际项目中可以使用 fetch 或 axios）
const makeApiRequest = async (request: ApiRequest): Promise<ApiResponse> => {
  const startTime = Date.now()

  try {
    // 构建 URL
    const url = new URL(request.url)
    request.params
      .filter((param) => param.enabled && param.key)
      .forEach((param) => {
        url.searchParams.append(param.key, param.value)
      })

    // 构建请求头
    const headers: Record<string, string> = {}
    request.headers
      .filter((header) => header.enabled && header.key)
      .forEach((header) => {
        headers[header.key] = header.value
      })

    // 构建请求选项
    const options: RequestInit = {
      method: request.method,
      headers,
      signal: AbortSignal.timeout(request.timeout * 1000),
    }

    // 添加请求体（如果需要）
    if (["POST", "PUT", "PATCH"].includes(request.method) && request.body) {
      options.body = request.body
    }

    // 发送请求
    const response = await fetch(url.toString(), options)
    const responseText = await response.text()
    const endTime = Date.now()

    // 构建响应头对象
    const responseHeaders: Record<string, string> = {}
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value
    })

    return {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
      data: responseText,
      size: new Blob([responseText]).size,
      time: endTime - startTime,
      timestamp: Date.now(),
    }
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : "Request failed")
  }
}

export function ApiTester() {
  const { t } = useTranslation()
  const { copyToClipboard } = useCopyToClipboard()

  const [state, setState] = useState<ApiTesterState>({
    currentRequest: {
      id: nanoid(),
      name: "New Request",
      method: "GET",
      url: "",
      headers: [{ id: nanoid(), key: "", value: "", enabled: true }],
      params: [{ id: nanoid(), key: "", value: "", enabled: true }],
      body: "",
      bodyType: "json",
      timeout: 30,
      followRedirects: true,
    },
    results: [],
    collections: [],
    environments: [],
    isLoading: false,
  })

  const [showHeaders, setShowHeaders] = useState(false)
  const [showParams, setShowParams] = useState(false)

  // 发送请求
  const handleSendRequest = useCallback(async () => {
    if (!state.currentRequest.url.trim()) return

    setState((prev) => ({ ...prev, isLoading: true, error: undefined }))

    try {
      const response = await makeApiRequest(state.currentRequest)

      const result: ApiTestResult = {
        id: nanoid(),
        request: { ...state.currentRequest },
        response,
        isLoading: false,
        timestamp: Date.now(),
      }

      setState((prev) => ({
        ...prev,
        results: [result, ...prev.results.slice(0, 9)], // 保留最近 10 个结果
        isLoading: false,
      }))
    } catch (error) {
      const result: ApiTestResult = {
        id: nanoid(),
        request: { ...state.currentRequest },
        error: error instanceof Error ? error.message : "Request failed",
        isLoading: false,
        timestamp: Date.now(),
      }

      setState((prev) => ({
        ...prev,
        results: [result, ...prev.results.slice(0, 9)],
        isLoading: false,
      }))
    }
  }, [state.currentRequest])

  // 加载模板
  const handleLoadTemplate = useCallback((template: Partial<ApiRequest>) => {
    setState((prev) => ({
      ...prev,
      currentRequest: {
        ...prev.currentRequest,
        ...template,
        id: nanoid(),
        headers: template.headers || [{ id: nanoid(), key: "", value: "", enabled: true }],
        params: template.params || [{ id: nanoid(), key: "", value: "", enabled: true }],
      },
    }))
  }, [])

  // 添加请求头
  const addHeader = useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentRequest: {
        ...prev.currentRequest,
        headers: [...prev.currentRequest.headers, { id: nanoid(), key: "", value: "", enabled: true }],
      },
    }))
  }, [])

  // 删除请求头
  const removeHeader = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      currentRequest: {
        ...prev.currentRequest,
        headers: prev.currentRequest.headers.filter((h) => h.id !== id),
      },
    }))
  }, [])

  // 更新请求头
  const updateHeader = useCallback((id: string, field: keyof ApiHeader, value: string | boolean) => {
    setState((prev) => ({
      ...prev,
      currentRequest: {
        ...prev.currentRequest,
        headers: prev.currentRequest.headers.map((h) => (h.id === id ? { ...h, [field]: value } : h)),
      },
    }))
  }, [])

  // 添加参数
  const addParam = useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentRequest: {
        ...prev.currentRequest,
        params: [...prev.currentRequest.params, { id: nanoid(), key: "", value: "", enabled: true }],
      },
    }))
  }, [])

  // 删除参数
  const removeParam = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      currentRequest: {
        ...prev.currentRequest,
        params: prev.currentRequest.params.filter((p) => p.id !== id),
      },
    }))
  }, [])

  // 更新参数
  const updateParam = useCallback((id: string, field: keyof ApiParam, value: string | boolean) => {
    setState((prev) => ({
      ...prev,
      currentRequest: {
        ...prev.currentRequest,
        params: prev.currentRequest.params.map((p) => (p.id === id ? { ...p, [field]: value } : p)),
      },
    }))
  }, [])

  // 格式化 JSON
  const formatJson = useCallback(() => {
    try {
      const parsed = JSON.parse(state.currentRequest.body)
      setState((prev) => ({
        ...prev,
        currentRequest: {
          ...prev.currentRequest,
          body: JSON.stringify(parsed, null, 2),
        },
      }))
    } catch (error) {
      // 忽略格式化错误
    }
  }, [state.currentRequest.body])

  // 清空请求
  const clearRequest = useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentRequest: {
        id: nanoid(),
        name: "New Request",
        method: "GET",
        url: "",
        headers: [{ id: nanoid(), key: "", value: "", enabled: true }],
        params: [{ id: nanoid(), key: "", value: "", enabled: true }],
        body: "",
        bodyType: "json",
        timeout: 30,
        followRedirects: true,
      },
    }))
  }, [])

  // 复制响应
  const copyResponse = useCallback(
    (result: ApiTestResult) => {
      if (result.response) {
        copyToClipboard(result.response.data, "Response data")
      }
    },
    [copyToClipboard]
  )

  // 获取状态颜色
  const getStatusColor = (status: number) => {
    const category = getStatusCategory(status)
    switch (category) {
      case "success":
        return "bg-green-100 text-green-800"
      case "redirect":
        return "bg-blue-100 text-blue-800"
      case "client-error":
        return "bg-yellow-100 text-yellow-800"
      case "server-error":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <ToolBase
      toolName={t("tools.api-tester.title", "API Tester")}
      icon={<Send className="w-5 h-5" />}
      description={t(
        "tools.api-tester.description",
        "Test REST APIs with customizable requests and detailed responses"
      )}
    >
      <div className="space-y-6">
        {/* 快速模板 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="w-5 h-5" />
              {t("tools.api-tester.templates", "Quick Templates")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {REQUEST_TEMPLATES.map((template: Partial<ApiRequest>, index: number) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => handleLoadTemplate(template)}
                >
                  {template.method} {template.name}
                </Button>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={clearRequest}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {t("common.clear", "Clear")}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 请求配置 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Settings className="w-5 h-5" />
              {t("tools.api-tester.request", "Request Configuration")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 请求方法和 URL */}
            <div className="flex gap-2">
              <Select
                value={state.currentRequest.method}
                onValueChange={(value: HttpMethod) =>
                  setState((prev) => ({
                    ...prev,
                    currentRequest: { ...prev.currentRequest, method: value },
                  }))
                }
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GET">GET</SelectItem>
                  <SelectItem value="POST">POST</SelectItem>
                  <SelectItem value="PUT">PUT</SelectItem>
                  <SelectItem value="DELETE">DELETE</SelectItem>
                  <SelectItem value="PATCH">PATCH</SelectItem>
                  <SelectItem value="HEAD">HEAD</SelectItem>
                  <SelectItem value="OPTIONS">OPTIONS</SelectItem>
                </SelectContent>
              </Select>

              <Input
                placeholder="Enter request URL..."
                value={state.currentRequest.url}
                onChange={(e) =>
                  setState((prev) => ({
                    ...prev,
                    currentRequest: { ...prev.currentRequest, url: e.target.value },
                  }))
                }
                className="flex-1"
              />

              <Button
                onClick={handleSendRequest}
                disabled={!state.currentRequest.url.trim() || state.isLoading}
                size="lg"
              >
                {state.isLoading ? <Clock className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                {state.isLoading ? t("tools.api-tester.sending", "Sending...") : t("tools.api-tester.send", "Send")}
              </Button>
            </div>

            {/* 参数和请求头切换 */}
            <div className="flex gap-2">
              <Button
                variant={showParams ? "default" : "outline"}
                size="sm"
                onClick={() => setShowParams(!showParams)}
              >
                {showParams ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                {t("tools.api-tester.params", "Parameters")} (
                {state.currentRequest.params.filter((p) => p.enabled && p.key).length})
              </Button>

              <Button
                variant={showHeaders ? "default" : "outline"}
                size="sm"
                onClick={() => setShowHeaders(!showHeaders)}
              >
                {showHeaders ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                {t("tools.api-tester.headers", "Headers")} (
                {state.currentRequest.headers.filter((h) => h.enabled && h.key).length})
              </Button>
            </div>

            {/* 查询参数 */}
            {showParams && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>{t("tools.api-tester.query-params", "Query Parameters")}</Label>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={addParam}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    {t("common.add", "Add")}
                  </Button>
                </div>

                {state.currentRequest.params.map((param) => (
                  <div
                    key={param.id}
                    className="flex gap-2 items-center"
                  >
                    <input
                      type="checkbox"
                      checked={param.enabled}
                      onChange={(e) => updateParam(param.id, "enabled", e.target.checked)}
                      className="rounded"
                    />
                    <Input
                      placeholder="Key"
                      value={param.key}
                      onChange={(e) => updateParam(param.id, "key", e.target.value)}
                      className="flex-1"
                    />
                    <Input
                      placeholder="Value"
                      value={param.value}
                      onChange={(e) => updateParam(param.id, "value", e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeParam(param.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* 请求头 */}
            {showHeaders && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>{t("tools.api-tester.request-headers", "Request Headers")}</Label>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={addHeader}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    {t("common.add", "Add")}
                  </Button>
                </div>

                {state.currentRequest.headers.map((header) => (
                  <div
                    key={header.id}
                    className="flex gap-2 items-center"
                  >
                    <input
                      type="checkbox"
                      checked={header.enabled}
                      onChange={(e) => updateHeader(header.id, "enabled", e.target.checked)}
                      className="rounded"
                    />
                    <Input
                      placeholder="Header name"
                      value={header.key}
                      onChange={(e) => updateHeader(header.id, "key", e.target.value)}
                      className="flex-1"
                      list="common-headers"
                    />
                    <Input
                      placeholder="Header value"
                      value={header.value}
                      onChange={(e) => updateHeader(header.id, "value", e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeHeader(header.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}

                {/* 常用请求头数据列表 */}
                <datalist id="common-headers">
                  {COMMON_HEADERS.map((header: string) => (
                    <option
                      key={header}
                      value={header}
                    />
                  ))}
                </datalist>
              </div>
            )}

            {/* 请求体 */}
            {["POST", "PUT", "PATCH"].includes(state.currentRequest.method) && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>{t("tools.api-tester.request-body", "Request Body")}</Label>
                  <div className="flex gap-2">
                    <Select
                      value={state.currentRequest.bodyType}
                      onValueChange={(value: any) =>
                        setState((prev) => ({
                          ...prev,
                          currentRequest: { ...prev.currentRequest, bodyType: value },
                        }))
                      }
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="json">JSON</SelectItem>
                        <SelectItem value="form">Form</SelectItem>
                        <SelectItem value="text">Text</SelectItem>
                        <SelectItem value="xml">XML</SelectItem>
                      </SelectContent>
                    </Select>

                    {state.currentRequest.bodyType === "json" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={formatJson}
                      >
                        {t("tools.api-tester.format", "Format")}
                      </Button>
                    )}
                  </div>
                </div>

                <Textarea
                  value={state.currentRequest.body}
                  onChange={(e) =>
                    setState((prev) => ({
                      ...prev,
                      currentRequest: { ...prev.currentRequest, body: e.target.value },
                    }))
                  }
                  placeholder={t("tools.api-tester.body-placeholder", "Enter request body...")}
                  className="min-h-[150px] font-mono text-sm"
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* 响应结果 */}
        {state.results.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Globe className="w-5 h-5" />
                {t("tools.api-tester.responses", "Responses")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {state.results.map((result) => (
                  <div
                    key={result.id}
                    className="border rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{result.request.method}</Badge>
                        <span className="font-mono text-sm truncate max-w-md">{result.request.url}</span>
                        {result.response && (
                          <Badge className={getStatusColor(result.response.status)}>
                            {result.response.status} {result.response.statusText}
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        {result.response && (
                          <>
                            <Clock className="w-4 h-4" />
                            {result.response.time}ms
                          </>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyResponse(result)}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {result.error ? (
                      <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                        {result.error}
                      </div>
                    ) : result.response ? (
                      <Tabs
                        defaultValue="body"
                        className="w-full"
                      >
                        <TabsList>
                          <TabsTrigger value="body">Body</TabsTrigger>
                          <TabsTrigger value="headers">Headers</TabsTrigger>
                        </TabsList>

                        <TabsContent
                          value="body"
                          className="mt-3"
                        >
                          <Textarea
                            value={result.response.data}
                            readOnly
                            className="min-h-[200px] font-mono text-sm bg-muted"
                          />
                        </TabsContent>

                        <TabsContent
                          value="headers"
                          className="mt-3"
                        >
                          <div className="space-y-2">
                            {Object.entries(result.response.headers).map(([key, value]) => (
                              <div
                                key={key}
                                className="flex gap-2 text-sm"
                              >
                                <span className="font-medium min-w-[120px]">{key}:</span>
                                <span className="text-muted-foreground break-all">{value}</span>
                              </div>
                            ))}
                          </div>
                        </TabsContent>
                      </Tabs>
                    ) : null}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </ToolBase>
  )
}

export default ApiTester
