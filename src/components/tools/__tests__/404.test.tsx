import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ToolNotFound from '../404';

describe('ToolNotFound Component', () => {
  it('renders the error message correctly', () => {
    render(<ToolNotFound />);
    
    // 验证中文错误信息是否存在 - 使用正则表达式进行部分匹配
    expect(screen.getByText(/工具未找到/i)).toBeInTheDocument();
    
    // 验证英文错误信息是否存在 - 使用正则表达式进行部分匹配
    expect(screen.getByText(/Tool Not Found/i)).toBeInTheDocument();
    
    // 验证样式类是否正确应用
    const container = screen.getByText(/工具未找到/i).closest('div');
    expect(container).toHaveClass('text-center');
    expect(container).toHaveClass('text-red-500');
    expect(container).toHaveClass('text-xl');
    expect(container).toHaveClass('mt-20');
  });
});