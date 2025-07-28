import { useState, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Shield,
  Eye,
  EyeOff,
  Copy,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  Zap,
  History,
  Download,
  Trash2,
} from 'lucide-react'
import { useCopyToClipboard } from '@/hooks/use-clipboard'
import {
  PasswordStrengthState,
  PasswordStrengthResult,
  PasswordCheck,
  PasswordGenerationOptions,
  GeneratedPassword,
  PASSWORD_CHECKS,
  WEAK_PATTERNS,
  calculateEntropy,
  estimateCrackTime,
  getPasswordStrengthLevel,
  getStrengthColor,
  generatePassword,
} from '@/types/password-strength'
import { ToolBase } from '@/components/ui/tool-base'
import { nanoid } from 'nanoid'

// 分析密码强度
const analyzePasswordStrength = (password: string): PasswordStrengthResult => {
  if (!password) {
    return {
      score: 0,
      level: 'very-weak',
      feedback: {
        suggestions: ['Enter a password to analyze'],
        positives: [],
      },
      entropy: 0,
      crackTime: {
        onlineThrottling: '0 seconds',
        onlineNoThrottling: '0 seconds',
        offlineSlowHashing: '0 seconds',
        offlineFastHashing: '0 seconds',
      },
      checks: [],
    }
  }

  let score = 0
  const checks: PasswordCheck[] = []
  const suggestions: string[] = []
  const positives: string[] = []
  let warning: string | undefined

  // 执行所有检查
  PASSWORD_CHECKS.forEach((checkTemplate) => {
    let passed = false

    switch (checkTemplate.id) {
      case 'min-length':
        passed = password.length >= 8
        break
      case 'good-length':
        passed = password.length >= 12
        break
      case 'excellent-length':
        passed = password.length >= 16
        break
      case 'uppercase':
        passed = /[A-Z]/.test(password)
        break
      case 'lowercase':
        passed = /[a-z]/.test(password)
        break
      case 'numbers':
        passed = /[0-9]/.test(password)
        break
      case 'symbols':
        passed = /[^a-zA-Z0-9]/.test(password)
        break
      case 'mixed-case':
        passed = /[A-Z]/.test(password) && /[a-z]/.test(password)
        break
      case 'no-common-patterns':
        passed = !WEAK_PATTERNS.some((pattern) => pattern.regex.test(password))
        break
      case 'no-dictionary-words':
        passed = !/\b(password|admin|user|login|welcome|secret|master|root|system|default)\b/i.test(password)
        break
      case 'character-variety':
        const uniqueChars = new Set(password.toLowerCase()).size
        passed = uniqueChars >= Math.min(password.length * 0.6, 10)
        break
      case 'entropy':
        const entropy = calculateEntropy(password)
        passed = entropy >= 50
        break
    }

    if (passed) {
      score += checkTemplate.weight
      positives.push(checkTemplate.description)
    } else {
      suggestions.push(checkTemplate.description)
    }

    checks.push({
      ...checkTemplate,
      passed,
    })
  })

  // 检查弱密码模式并扣分
  WEAK_PATTERNS.forEach((pattern) => {
    if (pattern.regex.test(password)) {
      score -= pattern.penalty
      if (!warning) {
        warning = pattern.description
      }
    }
  })

  // 确保分数在 0-100 范围内
  score = Math.max(0, Math.min(100, score))

  const level = getPasswordStrengthLevel(score)
  const entropy = calculateEntropy(password)
  const crackTime = estimateCrackTime(entropy)

  return {
    score,
    level,
    feedback: {
      warning,
      suggestions: suggestions.slice(0, 5), // 限制建议数量
      positives: positives.slice(0, 5),
    },
    entropy,
    crackTime,
    checks,
  }
}

export default function PasswordStrength() {
  const { t } = useTranslation()
  const { copyToClipboard } = useCopyToClipboard()

  const [state, setState] = useState<PasswordStrengthState>({
    password: '',
    showPassword: false,
    generatedPasswords: [],
    history: [],
  })

  const [generationOptions, setGenerationOptions] = useState<PasswordGenerationOptions>({
    length: 16,
    includeUppercase: true,
    includeLowercase: true,
    includeNumbers: true,
    includeSymbols: true,
    excludeSimilar: false,
    excludeAmbiguous: false,
  })

  // 分析当前密码
  const passwordResult = useMemo(() => {
    return analyzePasswordStrength(state.password)
  }, [state.password])

  // 更新密码
  const updatePassword = useCallback((password: string) => {
    setState((prev) => ({ ...prev, password }))
  }, [])

  // 切换密码可见性
  const togglePasswordVisibility = useCallback(() => {
    setState((prev) => ({ ...prev, showPassword: !prev.showPassword }))
  }, [])

  // 生成新密码
  const generateNewPassword = useCallback(() => {
    const newPassword = generatePassword(generationOptions)
    if (newPassword) {
      const strength = analyzePasswordStrength(newPassword)
      const generated: GeneratedPassword = {
        id: nanoid(),
        password: newPassword,
        strength,
        options: { ...generationOptions },
        createdAt: Date.now(),
      }

      setState((prev) => ({
        ...prev,
        password: newPassword,
        generatedPasswords: [generated, ...prev.generatedPasswords.slice(0, 9)], // 保留最近10个
      }))
    }
  }, [generationOptions])

  // 使用生成的密码
  const useGeneratedPassword = useCallback((generated: GeneratedPassword) => {
    setState((prev) => ({ ...prev, password: generated.password }))
  }, [])

  // 删除生成的密码
  const deleteGeneratedPassword = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      generatedPasswords: prev.generatedPasswords.filter((p) => p.id !== id),
    }))
  }, [])

  // 清空生成历史
  const clearGeneratedPasswords = useCallback(() => {
    setState((prev) => ({ ...prev, generatedPasswords: [] }))
  }, [])

  // 复制密码
  const copyPassword = useCallback(
    (password: string) => {
      copyToClipboard(password, 'Password')
    },
    [copyToClipboard]
  )

  // 导出分析结果
  const exportAnalysis = useCallback(() => {
    const data = {
      password: '***hidden***',
      analysis: {
        score: passwordResult.score,
        level: passwordResult.level,
        entropy: passwordResult.entropy,
        checks: passwordResult.checks.map((check) => ({
          name: check.name,
          passed: check.passed,
          category: check.category,
        })),
      },
      generatedPasswords: state.generatedPasswords.map((p) => ({
        id: p.id,
        password: '***hidden***',
        score: p.strength.score,
        level: p.strength.level,
        createdAt: p.createdAt,
      })),
      exportedAt: new Date().toISOString(),
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `password-analysis-${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [passwordResult, state.generatedPasswords])

  return (
    <ToolBase
      toolName={t('tools.password-strength.title', 'Password Strength Checker')}
      icon={<Shield className="w-5 h-5" />}
      description={t('tools.password-strength.description', 'Analyze password strength and generate secure passwords')}
    >
      <div className="space-y-6">
        <Tabs defaultValue="analyze" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="analyze">
              <Shield className="w-4 h-4 mr-2" />
              {t('tools.password-strength.analyze', 'Analyze')}
            </TabsTrigger>
            <TabsTrigger value="generate">
              <Zap className="w-4 h-4 mr-2" />
              {t('tools.password-strength.generate', 'Generate')}
            </TabsTrigger>
            <TabsTrigger value="history">
              <History className="w-4 h-4 mr-2" />
              {t('tools.password-strength.history', 'History')}
            </TabsTrigger>
          </TabsList>

          {/* 密码分析 */}
          <TabsContent value="analyze" className="space-y-4">
            {/* 密码输入 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  {t('tools.password-strength.password-input', 'Password Analysis')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>{t('tools.password-strength.enter-password', 'Enter Password')}</Label>
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <Input
                        type={state.showPassword ? 'text' : 'password'}
                        value={state.password}
                        onChange={(e) => updatePassword(e.target.value)}
                        placeholder="Enter password to analyze..."
                        className="pr-10"
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={togglePasswordVisibility}
                        className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                      >
                        {state.showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                    <Button onClick={() => copyPassword(state.password)} disabled={!state.password}>
                      <Copy className="w-4 h-4 mr-2" />
                      {t('common.copy', 'Copy')}
                    </Button>
                  </div>
                </div>

                {/* 强度指示器 */}
                {state.password && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        {t('tools.password-strength.strength', 'Strength')}: {passwordResult.score}/100
                      </span>
                      <Badge className={getStrengthColor(passwordResult.level)}>
                        {passwordResult.level.replace('-', ' ').toUpperCase()}
                      </Badge>
                    </div>

                    <Progress value={passwordResult.score} className="w-full h-2" />

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">{t('tools.password-strength.entropy', 'Entropy')}: </span>
                        {passwordResult.entropy.toFixed(1)} bits
                      </div>
                      <div>
                        <span className="font-medium">{t('tools.password-strength.length', 'Length')}: </span>
                        {state.password.length} characters
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 详细分析 */}
            {state.password && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* 安全检查 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <CheckCircle className="w-5 h-5" />
                      {t('tools.password-strength.security-checks', 'Security Checks')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {passwordResult.checks.map((check) => (
                        <div key={check.id} className="flex items-center gap-2 text-sm">
                          {check.passed ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-500" />
                          )}
                          <span className={check.passed ? 'text-green-700' : 'text-red-700'}>{check.name}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* 破解时间估算 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5" />
                      {t('tools.password-strength.crack-time', 'Crack Time Estimates')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span>{t('tools.password-strength.online-throttled', 'Online (throttled)')}:</span>
                        <span className="font-mono">{passwordResult.crackTime.onlineThrottling}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>{t('tools.password-strength.online-unthrottled', 'Online (unthrottled)')}:</span>
                        <span className="font-mono">{passwordResult.crackTime.onlineNoThrottling}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>{t('tools.password-strength.offline-slow', 'Offline (slow hashing)')}:</span>
                        <span className="font-mono">{passwordResult.crackTime.offlineSlowHashing}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>{t('tools.password-strength.offline-fast', 'Offline (fast hashing)')}:</span>
                        <span className="font-mono">{passwordResult.crackTime.offlineFastHashing}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* 反馈信息 */}
            {state.password &&
              (passwordResult.feedback.warning ||
                passwordResult.feedback.suggestions.length > 0 ||
                passwordResult.feedback.positives.length > 0) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Info className="w-5 h-5" />
                      {t('tools.password-strength.feedback', 'Feedback')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {passwordResult.feedback.warning && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                        <AlertTriangle className="w-4 h-4 inline mr-2" />
                        {passwordResult.feedback.warning}
                      </div>
                    )}

                    {passwordResult.feedback.positives.length > 0 && (
                      <div className="space-y-2">
                        <h5 className="font-medium text-green-700">
                          {t('tools.password-strength.strengths', 'Strengths')}
                        </h5>
                        <ul className="space-y-1">
                          {passwordResult.feedback.positives.map((positive, index) => (
                            <li key={index} className="text-sm text-green-600 flex items-center gap-2">
                              <CheckCircle className="w-3 h-3" />
                              {positive}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {passwordResult.feedback.suggestions.length > 0 && (
                      <div className="space-y-2">
                        <h5 className="font-medium text-orange-700">
                          {t('tools.password-strength.suggestions', 'Suggestions')}
                        </h5>
                        <ul className="space-y-1">
                          {passwordResult.feedback.suggestions.map((suggestion, index) => (
                            <li key={index} className="text-sm text-orange-600 flex items-center gap-2">
                              <Info className="w-3 h-3" />
                              {suggestion}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
          </TabsContent>

          {/* 密码生成 */}
          <TabsContent value="generate" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  {t('tools.password-strength.password-generator', 'Password Generator')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* 生成选项 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>
                      {t('tools.password-strength.length', 'Length')}: {generationOptions.length}
                    </Label>
                    <input
                      type="range"
                      min={4}
                      max={128}
                      value={generationOptions.length}
                      onChange={(e) => setGenerationOptions((prev) => ({ ...prev, length: parseInt(e.target.value) }))}
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="uppercase"
                        checked={generationOptions.includeUppercase}
                        onChange={(e) =>
                          setGenerationOptions((prev) => ({ ...prev, includeUppercase: e.target.checked }))
                        }
                        className="w-4 h-4"
                      />
                      <Label htmlFor="uppercase">{t('tools.password-strength.uppercase', 'Uppercase (A-Z)')}</Label>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="lowercase"
                        checked={generationOptions.includeLowercase}
                        onChange={(e) =>
                          setGenerationOptions((prev) => ({ ...prev, includeLowercase: e.target.checked }))
                        }
                        className="w-4 h-4"
                      />
                      <Label htmlFor="lowercase">{t('tools.password-strength.lowercase', 'Lowercase (a-z)')}</Label>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="numbers"
                        checked={generationOptions.includeNumbers}
                        onChange={(e) =>
                          setGenerationOptions((prev) => ({ ...prev, includeNumbers: e.target.checked }))
                        }
                        className="w-4 h-4"
                      />
                      <Label htmlFor="numbers">{t('tools.password-strength.numbers', 'Numbers (0-9)')}</Label>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="symbols"
                        checked={generationOptions.includeSymbols}
                        onChange={(e) =>
                          setGenerationOptions((prev) => ({ ...prev, includeSymbols: e.target.checked }))
                        }
                        className="w-4 h-4"
                      />
                      <Label htmlFor="symbols">{t('tools.password-strength.symbols', 'Symbols (!@#$)')}</Label>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="excludeSimilar"
                      checked={generationOptions.excludeSimilar}
                      onChange={(e) => setGenerationOptions((prev) => ({ ...prev, excludeSimilar: e.target.checked }))}
                      className="w-4 h-4"
                    />
                    <Label htmlFor="excludeSimilar">
                      {t('tools.password-strength.exclude-similar', 'Exclude similar (il1Lo0O)')}
                    </Label>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="excludeAmbiguous"
                      checked={generationOptions.excludeAmbiguous}
                      onChange={(e) =>
                        setGenerationOptions((prev) => ({ ...prev, excludeAmbiguous: e.target.checked }))
                      }
                      className="w-4 h-4"
                    />
                    <Label htmlFor="excludeAmbiguous">
                      {t('tools.password-strength.exclude-ambiguous', 'Exclude ambiguous ({}[]())')}
                    </Label>
                  </div>
                </div>

                <Button onClick={generateNewPassword} className="w-full">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  {t('tools.password-strength.generate-password', 'Generate Password')}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 生成历史 */}
          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <History className="w-5 h-5" />
                    {t('tools.password-strength.generated-passwords', 'Generated Passwords')}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={exportAnalysis}>
                      <Download className="w-4 h-4 mr-2" />
                      {t('common.export', 'Export')}
                    </Button>
                    <Button size="sm" variant="outline" onClick={clearGeneratedPasswords}>
                      <Trash2 className="w-4 h-4 mr-2" />
                      {t('common.clear', 'Clear')}
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {state.generatedPasswords.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {t('tools.password-strength.no-generated', 'No generated passwords yet')}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {state.generatedPasswords.map((generated) => (
                      <div key={generated.id} className="border rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <code className="text-sm font-mono bg-muted px-2 py-1 rounded">{generated.password}</code>
                            <Badge className={getStrengthColor(generated.strength.level)}>
                              {generated.strength.level.replace('-', ' ')}
                            </Badge>
                          </div>

                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => useGeneratedPassword(generated)}>
                              {t('tools.password-strength.use', 'Use')}
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => copyPassword(generated.password)}>
                              <Copy className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => deleteGeneratedPassword(generated.id)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>
                            {t('tools.password-strength.score', 'Score')}: {generated.strength.score}/100
                          </span>
                          <span>
                            {t('tools.password-strength.length', 'Length')}: {generated.password.length}
                          </span>
                          <span>{new Date(generated.createdAt).toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ToolBase>
  )
}
