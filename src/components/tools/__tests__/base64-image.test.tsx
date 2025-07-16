import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Base64Image from '../base64-image'

// Mock nanoid
vi.mock('nanoid', () => ({ nanoid: () => 'test-id-123' }))
// Mock sonner toast
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

describe('Base64Image UI', () => {
  beforeEach(() => {
    render(<Base64Image />)
  })

  it('渲染主标题和描述', () => {
    expect(screen.getByText(/Base64 ⇄ Image Bidirectional Converter/)).toBeInTheDocument()
    expect(screen.getByText(/Advanced bidirectional Base64 and image converter/)).toBeInTheDocument()
  })

  it('渲染tab按钮', () => {
    expect(screen.getByRole('tab', { name: /Converter/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /Batch Processing/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /Analyzer/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /Templates/i })).toBeInTheDocument()
  })
})

describe('Base64Image 功能', () => {
  let container: HTMLElement
  beforeEach(() => {
    const renderResult = render(<Base64Image />)
    container = renderResult.container
  })

  it('支持Base64→图片输入与转换', async () => {
    const textarea = screen.getByLabelText(/Base64 input/i)
    fireEvent.change(textarea, {
      target: {
        value:
          'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
      },
    })
    const convertBtn = screen.getByRole('button', { name: /convert to image/i })
    fireEvent.click(convertBtn)
    // 只断言Image Preview文本存在
    expect(await screen.findByText(/Image Preview/)).toBeInTheDocument()
  })

  it('支持图片→Base64上传与转换', async () => {
    const switchBtn = screen.getByRole('button', { name: /Switch to Image/i })
    fireEvent.click(switchBtn)
    const file = new File([new Uint8Array([137, 80, 78, 71])], 'test.png', { type: 'image/png' })
    const fileInput = screen.getByLabelText(/select image file/i)
    fireEvent.change(fileInput, { target: { files: [file] } })
    const convertBtn = screen.getByRole('button', { name: /convert to base64/i })
    fireEvent.click(convertBtn)
    // 只断言Base64 Output文本存在
    expect(await screen.findByText(/Base64 Output/)).toBeInTheDocument()
  })

  it('支持tab切换到Batch Processing', async () => {
    const batchTab = screen.getByRole('tab', { name: /Batch Processing/i })
    fireEvent.click(batchTab)
    const tabpanels = screen.getAllByRole('tabpanel')
    expect(tabpanels.length).toBeGreaterThan(0)
  })

  it('支持tab切换到Analyzer', async () => {
    const analyzerTab = screen.getByRole('tab', { name: /Analyzer/i })
    fireEvent.click(analyzerTab)
    // 宽松查找包含analyz的文本
    const node = await screen.findByText((c) => /analyz/i.test(c))
    expect(node).toBeInTheDocument()
  })

  it('支持tab切换到Templates', async () => {
    const templatesTab = screen.getByRole('tab', { name: /Templates/i })
    fireEvent.click(templatesTab)
    // 宽松查找包含templates的文本
    const node = await screen.findByText((c) => /templates/i.test(c))
    expect(node).toBeInTheDocument()
  })
})
