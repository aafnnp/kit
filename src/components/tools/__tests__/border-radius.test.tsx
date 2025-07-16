import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import BorderRadius from '../border-radius'

// Mock nanoid
vi.mock('nanoid', () => ({ nanoid: () => 'test-id-123' }))
// Mock sonner toast
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

describe('BorderRadius UI', () => {
  beforeEach(() => {
    render(<BorderRadius />)
  })

  it('渲染主标题和描述', () => {
    expect(screen.getAllByText(/Border Radius Generator/).length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText(/Advanced border radius generator/)).toBeInTheDocument()
  })

  it('渲染tab按钮', () => {
    expect(screen.getByRole('tab', { name: /Border Radius Generator/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /Batch Processing/i })).toBeInTheDocument()
  })

  it('渲染模板按钮', () => {
    expect(screen.getByText('Small')).toBeInTheDocument()
    expect(screen.getByText('Medium')).toBeInTheDocument()
    expect(screen.getByText('Full')).toBeInTheDocument()
  })

  it('切换模板并预览', () => {
    fireEvent.click(screen.getByText('Full'))
    expect(screen.getByText('Full')).toBeInTheDocument()
    expect(screen.getByText('Fully rounded (circular)')).toBeInTheDocument()
  })

  it('切换类型和单位', () => {
    fireEvent.mouseDown(screen.getByLabelText(/Border Radius Type/i))
    fireEvent.click(screen.getByText(/Individual Corners/i))
    expect(screen.getAllByText((c) => c.replace(/\s+/g, '').includes('TopLeft')).length).toBeGreaterThanOrEqual(1)
    fireEvent.mouseDown(screen.getByLabelText(/Unit/i))
    fireEvent.click(screen.getByText(/rem/i))
    expect(screen.getByText(/rem/)).toBeInTheDocument()
  })

  it('滑块与输入联动', () => {
    const numberInputs = screen.getAllByRole('spinbutton')
    expect(numberInputs.length).toBeGreaterThan(0)
    fireEvent.change(numberInputs[0], { target: { value: '20' } })
    expect(numberInputs[0]).toHaveValue(20)
  })

  it('预览区渲染', () => {
    expect(screen.getByText(/Border Radius Preview/)).toBeInTheDocument()
    expect(screen.getByText(/CSS Code/)).toBeInTheDocument()
  })

  it('导出与复制按钮存在', () => {
    expect(screen.getByText(/Export CSS/)).toBeInTheDocument()
    expect(screen.getByText(/Export SCSS/)).toBeInTheDocument()
    expect(screen.getByText(/Tailwind Classes/)).toBeInTheDocument()
    expect(screen.getByText(/Export JSON/)).toBeInTheDocument()
    expect(screen.getByText(/Copy CSS/)).toBeInTheDocument()
  })

  it('切换到Batch Processing标签页', async () => {
    fireEvent.click(screen.getByRole('tab', { name: /Batch Processing/i }))
    expect(
      await screen.findByText((c) => c.replace(/\s+/g, '').includes('UploadBorderRadiusFiles'))
    ).toBeInTheDocument()
    expect(screen.getByText(/Choose Files/i)).toBeInTheDocument()
  })
})
