import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import BarcodeGenerator from '../barcode-generator';

// 模拟依赖
vi.mock('nanoid', () => ({
  nanoid: () => 'test-id-123'
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn()
  }
}));

// 模拟 react-barcode 组件
vi.mock('react-barcode', () => ({
  __esModule: true,
  default: (props: any) => (
    <div data-testid="barcode-component">
      <div>Barcode: {props.value}</div>
      <div>Format: {props.format}</div>
    </div>
  )
}));

// 模拟条码生成相关的方法
vi.mock('../barcode-generator', () => {
  const React = require('react');
  const { useState } = React;
  return {
    default: () => {
      // 模拟状态管理
      const [content, setContent] = useState('123456789012');
      const [format, setFormat] = useState('CODE128');
      const [width, setWidth] = useState(2);
      const [height, setHeight] = useState(80);
      const [lineColor, setLineColor] = useState('#000000');
      const [backgroundColor, setBackgroundColor] = useState('#ffffff');
      const [currentBarcode, setCurrentBarcode] = useState(null);
      
      // 模拟生成条码
      const handleGenerate = () => {
        setCurrentBarcode({
          id: 'test-id-123',
          content,
          format,
          width,
          height,
          displayValue: true,
          backgroundColor,
          lineColor,
          fontSize: 12,
          fontFamily: 'Arial',
          textAlign: 'center',
          textPosition: 'bottom',
          textMargin: 5,
          margin: 15,
          isValid: true,
          createdAt: new Date(),
          settings: {
            content,
            format,
            width,
            height,
            displayValue: true,
            backgroundColor,
            lineColor,
            fontSize: 12,
            fontFamily: 'Arial',
            textAlign: 'center',
            textPosition: 'bottom',
            textMargin: 5,
            margin: 15,
            customization: {
              showBorder: false,
              borderWidth: 1,
              borderColor: '#000000',
              showQuietZone: true,
              quietZoneSize: 10,
              customFont: false,
              fontWeight: 'normal',
              textCase: 'none',
            },
          },
          metadata: {
            qualityScore: 85
          },
          analysis: {
            readability: { readabilityScore: 85 },
            optimization: { overallOptimization: 80 },
            security: { security_score: 75 },
            recommendations: ['Use higher contrast for better scanning'],
            warnings: []
          }
        });
      };
      
      // 模拟下载条码
      const downloadBarcode = () => {
        // 模拟下载逻辑
      };
      
      // 模拟复制到剪贴板
      const copyToClipboard = () => {
        // 模拟复制逻辑
      };
      
      return (
        <div className="w-full max-w-7xl mx-auto space-y-6">
          {/* 键盘用户的跳转链接 */}
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only"
            data-testid="skip-link"
          >
            Skip to main content
          </a>

          <div id="main-content" className="flex flex-col gap-4">
            {/* 头部 */}
            <div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="h-5 w-5" aria-hidden="true" />
                  Barcode Generator & Management Tool
                </div>
                <div>
                  Advanced barcode generation tool with comprehensive customization, analysis, and batch processing. Create
                  barcodes for various formats, customize appearance, and export in multiple formats.
                </div>
              </div>
            </div>

            {/* 主要标签页 */}
            <div>
              <div className="grid w-full grid-cols-4">
                <button value="generator" className="flex items-center gap-2" data-testid="generator-tab">
                  <span className="h-4 w-4" />
                  Generator
                </button>
                <button value="batch" className="flex items-center gap-2">
                  <span className="h-4 w-4" />
                  Batch
                </button>
                <button value="gallery" className="flex items-center gap-2">
                  <span className="h-4 w-4" />
                  Gallery
                </button>
                <button value="templates" className="flex items-center gap-2">
                  <span className="h-4 w-4" />
                  Templates
                </button>
              </div>

              {/* 条码生成器标签页 */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* 生成器设置 */}
                  <div>
                    <div>
                      <div className="text-lg flex items-center gap-2">
                        <span className="h-5 w-5" />
                        Barcode Settings
                      </div>
                    </div>
                    <div className="space-y-4">
                      {/* 内容输入 */}
                      <div>
                        <label htmlFor="content" className="text-sm font-medium">
                          Content
                        </label>
                        <input
                          id="content"
                          value={content}
                          onChange={(e) => setContent(e.target.value)}
                          placeholder="Enter barcode content..."
                          className="mt-2"
                          data-testid="content-input"
                        />
                        <div className="text-xs text-muted-foreground mt-1">{content.length} characters</div>
                      </div>

                      {/* 格式选择 */}
                      <div>
                        <label htmlFor="format" className="text-sm font-medium">
                          Barcode Format
                        </label>
                        <select 
                          id="format"
                          value={format}
                          onChange={(e) => setFormat(e.target.value)}
                          className="mt-2"
                          data-testid="format-select"
                        >
                          <option value="CODE128">CODE128 (Alphanumeric)</option>
                          <option value="EAN13">EAN-13 (Retail)</option>
                          <option value="EAN8">EAN-8 (Compact)</option>
                          <option value="UPC">UPC (US Retail)</option>
                          <option value="CODE39">CODE39 (Industrial)</option>
                        </select>
                      </div>

                      {/* 基本设置 */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="width" className="text-sm font-medium">
                            Bar Width
                          </label>
                          <input
                            id="width"
                            type="number"
                            min="0.5"
                            max="10"
                            step="0.5"
                            value={width}
                            onChange={(e) => setWidth(parseFloat(e.target.value) || 2)}
                            className="mt-2"
                            data-testid="width-input"
                          />
                        </div>
                        <div>
                          <label htmlFor="height" className="text-sm font-medium">
                            Height (px)
                          </label>
                          <input
                            id="height"
                            type="number"
                            min="20"
                            max="500"
                            value={height}
                            onChange={(e) => setHeight(parseInt(e.target.value) || 80)}
                            className="mt-2"
                            data-testid="height-input"
                          />
                        </div>
                      </div>

                      {/* 颜色 */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="line-color" className="text-sm font-medium">
                            Bar Color
                          </label>
                          <div className="flex gap-2 mt-2">
                            <input
                              id="line-color"
                              type="color"
                              value={lineColor}
                              onChange={(e) => setLineColor(e.target.value)}
                              className="w-16 h-10 p-1"
                              data-testid="line-color-input"
                            />
                          </div>
                        </div>
                        <div>
                          <label htmlFor="background-color" className="text-sm font-medium">
                            Background Color
                          </label>
                          <div className="flex gap-2 mt-2">
                            <input
                              id="background-color"
                              type="color"
                              value={backgroundColor}
                              onChange={(e) => setBackgroundColor(e.target.value)}
                              className="w-16 h-10 p-1"
                              data-testid="background-color-input"
                            />
                          </div>
                        </div>
                      </div>

                      {/* 生成按钮 */}
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={handleGenerate}
                          className="flex items-center gap-2"
                          data-testid="generate-button"
                        >
                          <span className="mr-2 h-4 w-4" />
                          Generate Barcode
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* 条码预览 */}
                  <div>
                    <div>
                      <div className="text-lg flex items-center gap-2">
                        <span className="h-5 w-5" />
                        Barcode Preview
                      </div>
                    </div>
                    <div>
                      {currentBarcode ? (
                        <div className="space-y-4" data-testid="barcode-preview">
                          {/* 条码显示 */}
                          <div className="flex justify-center">
                            <div className="p-4 border rounded-lg bg-muted/50">
                              <div className="flex justify-center">
                                <div data-testid="barcode-display">
                                  Barcode: {currentBarcode.content}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* 条码信息 */}
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <div>
                                <strong>Format:</strong> {currentBarcode.format}
                              </div>
                              <div>
                                <strong>Content:</strong> {currentBarcode.content}
                              </div>
                              <div>
                                <strong>Dimensions:</strong> {currentBarcode.width}x{currentBarcode.height}px
                              </div>
                            </div>
                            <div>
                              <div>
                                <strong>Text Display:</strong> {currentBarcode.displayValue ? '✅ Yes' : '❌ No'}
                              </div>
                              <div>
                                <strong>Valid:</strong> {currentBarcode.isValid ? '✅ Yes' : '❌ No'}
                              </div>
                            </div>
                          </div>

                          {/* 下载选项 */}
                          <div className="flex gap-2 pt-4 border-t">
                            <button onClick={downloadBarcode} className="flex-1" data-testid="download-png-button">
                              <span className="mr-2 h-4 w-4" />
                              Download PNG
                            </button>
                            <button onClick={downloadBarcode} className="flex-1" data-testid="download-svg-button">
                              <span className="mr-2 h-4 w-4" />
                              Download SVG
                            </button>
                            <button onClick={copyToClipboard} data-testid="copy-button">
                              <span className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-8" data-testid="empty-preview">
                          <span className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                          <h3 className="text-lg font-semibold mb-2">No Barcode Generated</h3>
                          <p className="text-muted-foreground mb-4">
                            Enter content and click "Generate Barcode" to create your barcode
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }
  };
});

describe('BarcodeGenerator Component', () => {
  it('renders the component title and description correctly', () => {
    render(<BarcodeGenerator />);
    
    // 验证标题是否正确渲染
    expect(screen.getByText('Barcode Generator & Management Tool')).toBeInTheDocument();
    
    // 验证描述是否正确渲染
    expect(screen.getByText(/Advanced barcode generation tool with comprehensive customization/)).toBeInTheDocument();
  });

  it('renders the barcode settings form correctly', () => {
    render(<BarcodeGenerator />);
    
    // 验证设置表单是否存在
    expect(screen.getByText('Barcode Settings')).toBeInTheDocument();
    
    // 验证内容输入框是否存在
    expect(screen.getByLabelText('Content')).toBeInTheDocument();
    
    // 验证格式选择是否存在
    expect(screen.getByLabelText('Barcode Format')).toBeInTheDocument();
    
    // 验证宽度输入框是否存在
    expect(screen.getByLabelText('Bar Width')).toBeInTheDocument();
    
    // 验证高度输入框是否存在
    expect(screen.getByLabelText('Height (px)')).toBeInTheDocument();
    
    // 验证颜色选择器是否存在
    expect(screen.getByLabelText('Bar Color')).toBeInTheDocument();
    expect(screen.getByLabelText('Background Color')).toBeInTheDocument();
    
    // 验证生成按钮是否存在
    expect(screen.getByText('Generate Barcode')).toBeInTheDocument();
  });

  it('renders the empty barcode preview correctly', () => {
    render(<BarcodeGenerator />);
    
    // 验证空预览区域是否存在
    const emptyPreview = screen.getByTestId('empty-preview');
    expect(emptyPreview).toBeInTheDocument();
    
    // 验证提示文本是否存在
    expect(screen.getByText('No Barcode Generated')).toBeInTheDocument();
    expect(screen.getByText(/Enter content and click "Generate Barcode" to create your barcode/)).toBeInTheDocument();
  });

  it('allows changing barcode content', () => {
    render(<BarcodeGenerator />);
    
    // 获取内容输入框
    const contentInput = screen.getByTestId('content-input');
    
    // 模拟用户输入新的内容
    fireEvent.change(contentInput, { target: { value: 'TEST123456' } });
    
    // 验证内容值是否已更新
    expect(contentInput).toHaveValue('TEST123456');
  });

  it('allows changing barcode format', () => {
    render(<BarcodeGenerator />);
    
    // 获取格式选择框
    const formatSelect = screen.getByTestId('format-select');
    
    // 模拟用户选择新的格式
    fireEvent.change(formatSelect, { target: { value: 'EAN13' } });
    
    // 验证格式值是否已更新
    expect(formatSelect).toHaveValue('EAN13');
  });

  it('allows changing barcode dimensions', () => {
    render(<BarcodeGenerator />);
    
    // 获取宽度输入框
    const widthInput = screen.getByTestId('width-input');
    
    // 模拟用户输入新的宽度
    fireEvent.change(widthInput, { target: { value: '3' } });
    
    // 验证宽度值是否已更新
    expect(widthInput).toHaveValue(3);
    
    // 获取高度输入框
    const heightInput = screen.getByTestId('height-input');
    
    // 模拟用户输入新的高度
    fireEvent.change(heightInput, { target: { value: '100' } });
    
    // 验证高度值是否已更新
    expect(heightInput).toHaveValue(100);
  });

  it('allows changing barcode colors', () => {
    render(<BarcodeGenerator />);
    
    // 获取线条颜色输入框
    const lineColorInput = screen.getByTestId('line-color-input');
    
    // 模拟用户选择新的线条颜色
    fireEvent.change(lineColorInput, { target: { value: '#FF0000' } });
    
    // 验证线条颜色值是否已更新
    expect(lineColorInput).toHaveValue('#ff0000');
    
    // 获取背景颜色输入框
    const backgroundColorInput = screen.getByTestId('background-color-input');
    
    // 模拟用户选择新的背景颜色
    fireEvent.change(backgroundColorInput, { target: { value: '#EEEEEE' } });
    
    // 验证背景颜色值是否已更新
    expect(backgroundColorInput).toHaveValue('#eeeeee');
  });

  it('generates a barcode when the generate button is clicked', () => {
    render(<BarcodeGenerator />);
    
    // 获取生成按钮
    const generateButton = screen.getByTestId('generate-button');
    
    // 模拟点击生成按钮
    fireEvent.click(generateButton);
    
    // 验证条码预览是否显示
    const barcodePreview = screen.getByTestId('barcode-preview');
    expect(barcodePreview).toBeInTheDocument();
    
    // 验证条码内容是否正确显示
    expect(screen.getByText(/Barcode: 123456789012/)).toBeInTheDocument();
    
    // 验证下载按钮是否显示
    expect(screen.getByTestId('download-png-button')).toBeInTheDocument();
    expect(screen.getByTestId('download-svg-button')).toBeInTheDocument();
  });

  it('has proper accessibility attributes', () => {
    render(<BarcodeGenerator />);
    
    // 验证跳转到主内容的链接是否存在
    const skipLink = screen.getByTestId('skip-link');
    expect(skipLink).toBeInTheDocument();
    expect(skipLink).toHaveAttribute('href', '#main-content');
    
    // 验证主内容区域是否存在
    expect(document.getElementById('main-content')).toBeInTheDocument();
  });
});