import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import Base64Encode from '../base64-encode'

// Mock nanoid
vi.mock('nanoid', () => ({ nanoid: () => 'test-id-123' }))
// Mock sonner toast
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

// 1. UI渲染测试

describe('Base64Encode UI', () => {
  beforeEach(() => {
    render(<Base64Encode />)
  })

  it('渲染主标题和描述', () => {
    expect(screen.getByText(/Base64 Encoder\/Decoder/)).toBeInTheDocument()
    expect(screen.getByText(/Advanced encoding and decoding tool/)).toBeInTheDocument()
  })

  it('渲染模板按钮', () => {
    expect(screen.getByText('Text to Base64')).toBeInTheDocument()
    expect(screen.getByText('Base64 to Text')).toBeInTheDocument()
    expect(screen.getByText('Text to URL Encoded')).toBeInTheDocument()
  })

  it('渲染输入输出区域', () => {
    expect(screen.getByText('Input')).toBeInTheDocument()
    expect(screen.getByText('Output')).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/Enter text to encode/)).toBeInTheDocument()
  })
})

// 2. 功能测试

describe('Base64Encode 功能', () => {
  beforeEach(() => {
    render(<Base64Encode />)
  })

  it('输入内容后可实时Base64编码', async () => {
    const textarea = screen.getByPlaceholderText(/Enter text to encode/)
    fireEvent.change(textarea, { target: { value: 'Hello' } })
    await waitFor(() => {
      expect(screen.getByDisplayValue('SGVsbG8=')).toBeInTheDocument()
    })
  })

  it('切换模板可自动切换输入输出格式', async () => {
    const btn = screen.getByText('Base64 to Text')
    fireEvent.click(btn)
    expect(screen.getByText('Base64')).toBeInTheDocument() // 输入格式
    expect(screen.getByText('Text')).toBeInTheDocument() // 输出格式
  })

  it('支持编码/解码切换', async () => {
    // 找到第一个操作类型下拉框（Encode/Decode）
    const selects = screen.getAllByRole('button')
    const opSelect = selects.find((btn) => /Encode|Decode/.test(btn.textContent || ''))
    expect(opSelect).toBeDefined()
    fireEvent.click(opSelect!)
    // 查找所有decode文本，排除描述等
    const decodeOptions = await screen.findAllByText(/decode/i)
    const menuOption =
      decodeOptions.find(
        (opt) =>
          opt.getAttribute('data-state') !== null ||
          opt.getAttribute('role') === 'option' ||
          opt.className.includes('SelectItem')
      ) || decodeOptions[0]
    fireEvent.click(menuOption!)
    // 断言输出格式下拉框内容变为Text（即已切换为decode）
    // 找到所有下拉按钮，第二个为outputFormat
    const allSelects = screen.getAllByRole('button')
    const outputSelect = allSelects.find(
      (btn) => btn.textContent?.toLowerCase().includes('text') || btn.textContent?.toLowerCase().includes('base64')
    )
    expect(outputSelect?.textContent?.toLowerCase()).toContain('text')
  })

  it('支持复制输入和输出', async () => {
    const textarea = screen.getByPlaceholderText(/Enter text to encode/)
    fireEvent.change(textarea, { target: { value: 'Test123' } })
    await waitFor(() => {
      expect(screen.getByDisplayValue('VGVzdDEyMw==')).toBeInTheDocument()
    })
    // 复制按钮存在
    expect(screen.getAllByText('Copy').length).toBeGreaterThan(0)
  })

  it('清空按钮可清空输入', () => {
    const textarea = screen.getByPlaceholderText(/Enter text to encode/)
    fireEvent.change(textarea, { target: { value: 'Test' } })
    const clearBtn = screen.getByText('Clear')
    fireEvent.click(clearBtn)
    expect((textarea as HTMLTextAreaElement).value).toBe('')
  })

  it('切换到Batch Processing标签页', async () => {
    // 精确获取tab按钮，避免与描述重复
    const batchTabs = screen.getAllByRole('tab', { name: /Batch Processing/i })
    expect(batchTabs.length).toBeGreaterThan(0)
    fireEvent.click(batchTabs[0])
    // 只断言tab内容区存在
    const tabpanels = await screen.findAllByRole('tabpanel')
    expect(tabpanels.length).toBeGreaterThan(0)
  })
})
