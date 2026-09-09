import { useState } from 'react'
import { useTranslation } from 'react-i18next'
/**
 * HttpStatus - HTTP 状态码查询
 * @returns 组件
 */
// 输入状态码，输出含义
const STATUS_CODES = ['200', '301', '302', '400', '401', '403', '404', '500']

const HttpStatus = () => {
  const { t } = useTranslation()
  const [code, setCode] = useState('')
  const desc = code ? t(`httpStatus.codes.${code}`, t('httpStatus.unknown')) : t('httpStatus.unknown')
  return (
    <div className="flex flex-col gap-4">
      <input
        className="w-32 border rounded px-2"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder={t('httpStatus.placeholder')}
      />
      <div className="text-sm text-muted-foreground">{desc}</div>
      <div className="text-xs text-muted-foreground">
        {STATUS_CODES.map((c) => (
          <span
            key={c}
            className="mr-2 mb-1 inline-block rounded bg-muted px-2 py-0.5"
          >
            {c}: {t(`httpStatus.codes.${c}`)}
          </span>
        ))}
      </div>
    </div>
  )
}
export default HttpStatus
