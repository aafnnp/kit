# 测试指南

本项目使用 Vitest 作为测试框架，结合 React Testing Library 进行组件测试。

## 测试命令

```bash
# 运行测试（监视模式）
npm test

# 运行测试（UI界面）
npm run test:ui

# 运行测试（单次运行）
npm run test:run

# 运行测试并生成覆盖率报告
npm run coverage
```

## 测试文件结构

- 测试文件应放在与被测组件相同的目录中，或放在 `src/test` 目录下
- 测试文件命名应遵循 `.test.tsx` 或 `.spec.tsx` 的格式
- 对于非组件的工具函数，使用 `.test.ts` 或 `.spec.ts` 格式

## 编写测试的最佳实践

1. 使用 `describe` 块组织相关测试
2. 使用 `it` 或 `test` 描述单个测试用例
3. 使用 `expect` 进行断言
4. 使用 React Testing Library 的查询方法（如 `getByText`, `getByRole` 等）

## 示例

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Button } from '@/components/ui/button';

describe('Button Component', () => {
  it('renders with the correct text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });
});
```

## 模拟和存根

使用 Vitest 的 `vi` 对象进行模拟：

```tsx
import { vi } from 'vitest';

// 模拟函数
const mockFn = vi.fn();

// 模拟模块
vi.mock('@/lib/api', () => ({
  fetchData: vi.fn().mockResolvedValue({ data: 'mocked data' }),
}));
```

## 更多资源

- [Vitest 文档](https://vitest.dev/)
- [React Testing Library 文档](https://testing-library.com/docs/react-testing-library/intro/)
- [Jest DOM 断言](https://github.com/testing-library/jest-dom)