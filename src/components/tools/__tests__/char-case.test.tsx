import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import CharCase from '../char-case'

// Mock nanoid
vi.mock('nanoid', () => ({ nanoid: () => 'test-id-123' }))
// Mock sonner toast
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

// 1. UI渲染测试

describe('CharCase UI', () => {
  beforeEach(() => {
    render(<CharCase />)
  })

  it('渲染主标题和描述', () => {
    expect(screen.getAllByText(/Character Case Converter/).length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText(/Convert text between different case formats/)).toBeInTheDocument()
  })

  it('渲染tab按钮', () => {
    expect(screen.getByRole('button', { name: /Manual Input/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /File Upload/i })).toBeInTheDocument()
  })

  it('切换到File Upload标签页', () => {
    fireEvent.click(screen.getByRole('button', { name: /File Upload/i }))
    expect(screen.getByText((c) => c.replace(/\s+/g, '').includes('UploadTextFiles'))).toBeInTheDocument()
    expect(screen.getByText(/Choose Files/i)).toBeInTheDocument()
  })

  it('手动输入后lowercase结果展示', async () => {
    const textarea = screen.getByLabelText('Text input for case conversion')
    fireEvent.change(textarea, { target: { value: 'hello world' } })
    // 断言lowercase结果渲染
    const results = await screen.findAllByLabelText('case-result-lowercase')
    expect(results.length).toBeGreaterThanOrEqual(1)
  })

  it('全部case类型展示', () => {
    const textarea = screen.getByLabelText('Text input for case conversion')
    fireEvent.change(textarea, { target: { value: 'hello world' } })
    // 展开全部case
    const showAllBtn = screen.getByText(/Show All Case Types/)
    fireEvent.click(showAllBtn)
    // 断言UPPERCASE、camelCase等结果至少有一个
    expect(screen.getAllByLabelText('case-result-uppercase').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByLabelText('case-result-camelcase').length).toBeGreaterThanOrEqual(1)
  })
})
