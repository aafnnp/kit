import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

// 一个简单的React组件用于测试
function ExampleComponent({ text }: { text: string }) {
  return <div>{text}</div>;
}

describe('Example Component', () => {
  it('renders with the correct text', () => {
    const testText = 'Hello, Vitest!';
    render(<ExampleComponent text={testText} />);
    
    // 验证文本是否正确渲染
    expect(screen.getByText(testText)).toBeInTheDocument();
  });
});