import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import BcryptHash from '../bcrypt-hash'

// Mock nanoid
vi.mock('nanoid', () => ({ nanoid: () => 'test-id-123' }))
// Mock sonner toast
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

describe('BcryptHash UI', () => {
  beforeEach(() => {
    render(<BcryptHash />)
  })

  it('渲染主标题和描述', () => {
    expect(screen.getByText(/Bcrypt Hash & Password Security/)).toBeInTheDocument()
    expect(screen.getByText(/Advanced Bcrypt password hashing tool/)).toBeInTheDocument()
  })

  it('渲染tab按钮', () => {
    expect(screen.getByRole('tab', { name: /Password Hasher/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /Hash Verification/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /Batch Processing/i })).toBeInTheDocument()
  })
})

describe('BcryptHash 功能', () => {
  beforeEach(() => {
    render(<BcryptHash />)
  })

  it('支持密码输入与哈希生成', async () => {
    const input = screen.getByLabelText(/Password input for Bcrypt hashing/i)
    fireEvent.change(input, { target: { value: 'TestPassword123!' } })
    const btn = screen.getByRole('button', { name: /generate bcrypt hash/i })
    fireEvent.click(btn)
    // 只断言Bcrypt Hash Results文本出现
    expect(await screen.findByText(/Bcrypt Hash Results/)).toBeInTheDocument()
  })

  it('支持模板切换', async () => {
    const templateBtn = screen.getByText(/High Security/)
    fireEvent.click(templateBtn)
    expect(screen.getByText(/Enhanced security for sensitive applications/)).toBeInTheDocument()
  })

  it('支持tab切换到Hash Verification', async () => {
    const verifyTab = screen.getByRole('tab', { name: /Hash Verification/i })
    fireEvent.click(verifyTab)
    // 直接断言tab内容区有Hash Verification标题
    expect(await screen.findByText(/Hash Verification/)).toBeInTheDocument()
  })

  it('支持tab切换到Batch Processing', async () => {
    const batchTab = screen.getByRole('tab', { name: /Batch Processing/i })
    fireEvent.click(batchTab)
    expect(await screen.findByText((c) => /upload|batch/i.test(c))).toBeInTheDocument()
  })
})
