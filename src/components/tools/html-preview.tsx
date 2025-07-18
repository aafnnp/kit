import { useCallback, useState, useMemo, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import {
  Download,
  Trash2,
  Copy,
  Check,
  Shuffle,
  RotateCcw,
  Zap,
  Settings,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  Search,
  Eye,
  EyeOff,
  Code,
  Monitor,
  Smartphone,
  Tablet,
  RefreshCw,
  ExternalLink,
  Globe,
  FileCode,
} from 'lucide-react'
import { nanoid } from 'nanoid'
import type {
  HTMLProcessingResult,
  HTMLMetrics,
  ExternalResource,
  AccessibilityFeature,
  PerformanceMetrics,
  HTMLAnalysis,
  ProcessingBatch,
  BatchStatistics,
  ProcessingSettings,
  HTMLTemplate,
  HTMLValidation,
  PreviewMode,
  DeviceSize,
  ExportFormat,
} from '@/types/html-preview'

// Utility functions

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const getDeviceDimensions = (device: DeviceSize): { width: string; height: string } => {
  switch (device) {
    case 'mobile':
      return { width: '375px', height: '667px' }
    case 'tablet':
      return { width: '768px', height: '1024px' }
    case 'desktop':
      return { width: '1200px', height: '800px' }
    default:
      return { width: '100%', height: '400px' }
  }
}

// HTML processing functions
const analyzeHTML = (html: string): HTMLMetrics => {
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')

  // Count elements
  const allElements = doc.querySelectorAll('*')
  const elementCount = allElements.length

  // Get unique tag types
  const tagTypes = Array.from(new Set(Array.from(allElements).map((el) => el.tagName.toLowerCase())))

  // Check document structure
  const hasDoctype = html.toLowerCase().includes('<!doctype')
  const hasHead = doc.querySelector('head') !== null
  const hasBody = doc.querySelector('body') !== null
  const hasTitle = doc.querySelector('title') !== null
  const hasMeta = doc.querySelector('meta') !== null

  // Check for CSS and JavaScript
  const hasCSS = doc.querySelector('style, link[rel="stylesheet"]') !== null || html.includes('<style')
  const hasJavaScript = doc.querySelector('script') !== null || html.includes('<script')

  // Find external resources
  const externalResources: ExternalResource[] = []

  // CSS files
  doc.querySelectorAll('link[rel="stylesheet"]').forEach((link) => {
    const href = link.getAttribute('href')
    if (href) {
      externalResources.push({
        type: 'css',
        url: href,
        isLocal: !href.startsWith('http'),
      })
    }
  })

  // JavaScript files
  doc.querySelectorAll('script[src]').forEach((script) => {
    const src = script.getAttribute('src')
    if (src) {
      externalResources.push({
        type: 'js',
        url: src,
        isLocal: !src.startsWith('http'),
      })
    }
  })

  // Images
  doc.querySelectorAll('img[src]').forEach((img) => {
    const src = img.getAttribute('src')
    if (src) {
      externalResources.push({
        type: 'image',
        url: src,
        isLocal: !src.startsWith('http'),
      })
    }
  })

  // Semantic elements
  const semanticTags = ['header', 'nav', 'main', 'section', 'article', 'aside', 'footer', 'figure', 'figcaption']
  const semanticElements = semanticTags.filter((tag) => doc.querySelector(tag))

  // Accessibility features
  const accessibilityFeatures: AccessibilityFeature[] = []

  // Alt attributes
  const imagesWithAlt = doc.querySelectorAll('img[alt]')
  if (imagesWithAlt.length > 0) {
    accessibilityFeatures.push({
      type: 'alt',
      element: 'img',
      description: `${imagesWithAlt.length} images with alt text`,
    })
  }

  // ARIA attributes
  const ariaElements = doc.querySelectorAll('[aria-label], [aria-labelledby], [aria-describedby]')
  if (ariaElements.length > 0) {
    accessibilityFeatures.push({
      type: 'aria',
      element: 'various',
      description: `${ariaElements.length} elements with ARIA attributes`,
    })
  }

  // Role attributes
  const roleElements = doc.querySelectorAll('[role]')
  if (roleElements.length > 0) {
    accessibilityFeatures.push({
      type: 'role',
      element: 'various',
      description: `${roleElements.length} elements with role attributes`,
    })
  }

  // Heading structure
  const headings = doc.querySelectorAll('h1, h2, h3, h4, h5, h6')
  if (headings.length > 0) {
    accessibilityFeatures.push({
      type: 'heading',
      element: 'h1-h6',
      description: `${headings.length} heading elements`,
    })
  }

  return {
    elementCount,
    tagTypes,
    hasDoctype,
    hasHead,
    hasBody,
    hasTitle,
    hasMeta,
    hasCSS,
    hasJavaScript,
    externalResources,
    semanticElements,
    accessibilityFeatures,
  }
}

const calculatePerformanceMetrics = (html: string, metrics: HTMLMetrics): PerformanceMetrics => {
  const renderTime = performance.now() // Simplified

  // DOM complexity (based on nesting and element count)
  const domComplexity = Math.min(100, metrics.elementCount / 10 + html.split('<').length / 20)

  // CSS complexity (rough estimate)
  const cssMatches = html.match(/{[^}]*}/g) || []
  const cssComplexity = Math.min(100, cssMatches.length / 5)

  // JavaScript complexity (rough estimate)
  const jsMatches = html.match(/function|=>|class|const|let|var/g) || []
  const jsComplexity = Math.min(100, jsMatches.length / 10)

  // SEO score
  let seoScore = 0
  if (metrics.hasTitle) seoScore += 20
  if (metrics.hasMeta) seoScore += 20
  if (metrics.hasDoctype) seoScore += 10
  if (metrics.semanticElements.length > 0) seoScore += 30
  if (html.includes('meta name="description"')) seoScore += 20

  // Accessibility score
  let accessibilityScore = 0
  if (metrics.accessibilityFeatures.length > 0) accessibilityScore += 40
  if (metrics.semanticElements.length > 3) accessibilityScore += 30
  if (html.includes('lang=')) accessibilityScore += 15
  if (html.includes('tabindex')) accessibilityScore += 15

  return {
    renderTime,
    domComplexity,
    cssComplexity,
    jsComplexity,
    seoScore: Math.min(100, seoScore),
    accessibilityScore: Math.min(100, accessibilityScore),
  }
}

const performHTMLAnalysis = (html: string, metrics: HTMLMetrics, performance: PerformanceMetrics): HTMLAnalysis => {
  const analysis: HTMLAnalysis = {
    isValidHTML: true,
    hasModernStructure: false,
    isResponsive: false,
    hasAccessibilityFeatures: false,
    hasSEOElements: false,
    suggestedImprovements: [],
    htmlIssues: [],
    qualityScore: 100,
    securityIssues: [],
    performanceIssues: [],
  }

  // Check if HTML is valid (basic check)
  try {
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')
    const parserErrors = doc.querySelector('parsererror')
    if (parserErrors) {
      analysis.isValidHTML = false
      analysis.htmlIssues.push('HTML parsing errors detected')
      analysis.qualityScore -= 30
    }
  } catch {
    analysis.isValidHTML = false
    analysis.htmlIssues.push('Invalid HTML structure')
    analysis.qualityScore -= 30
  }

  // Check modern structure
  analysis.hasModernStructure = metrics.hasDoctype && metrics.hasHead && metrics.hasBody
  if (!analysis.hasModernStructure) {
    analysis.suggestedImprovements.push('Add proper HTML5 document structure with DOCTYPE, head, and body')
    analysis.qualityScore -= 20
  }

  // Check responsiveness
  analysis.isResponsive = html.includes('viewport') || html.includes('media query') || html.includes('@media')
  if (!analysis.isResponsive) {
    analysis.suggestedImprovements.push('Add viewport meta tag and responsive design elements')
    analysis.qualityScore -= 15
  }

  // Check accessibility
  analysis.hasAccessibilityFeatures = metrics.accessibilityFeatures.length > 0
  if (!analysis.hasAccessibilityFeatures) {
    analysis.suggestedImprovements.push('Add accessibility features like alt text, ARIA labels, and semantic elements')
    analysis.qualityScore -= 20
  }

  // Check SEO elements
  analysis.hasSEOElements = metrics.hasTitle && metrics.hasMeta
  if (!analysis.hasSEOElements) {
    analysis.suggestedImprovements.push('Add title tag and meta description for better SEO')
    analysis.qualityScore -= 15
  }

  // Security checks
  if (html.includes('javascript:') || html.includes('onclick=') || html.includes('onload=')) {
    analysis.securityIssues.push('Inline JavaScript detected - consider using external scripts')
    analysis.qualityScore -= 10
  }

  if (html.includes('eval(') || html.includes('innerHTML')) {
    analysis.securityIssues.push('Potentially unsafe JavaScript patterns detected')
    analysis.qualityScore -= 15
  }

  // Performance issues
  if (metrics.externalResources.length > 10) {
    analysis.performanceIssues.push('Many external resources may impact loading performance')
    analysis.qualityScore -= 10
  }

  if (performance.domComplexity > 80) {
    analysis.performanceIssues.push('High DOM complexity may impact rendering performance')
    analysis.qualityScore -= 10
  }

  return analysis
}

// HTML templates
const htmlTemplates: HTMLTemplate[] = [
  {
    id: 'basic-page',
    name: 'Basic HTML Page',
    description: 'Simple HTML5 page with proper structure',
    category: 'Basic',
    htmlCode: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Basic HTML Page</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Welcome to My Website</h1>
        <p>This is a basic HTML page with proper structure and styling.</p>
    </div>
</body>
</html>`,
    features: ['HTML5 DOCTYPE', 'Responsive viewport', 'Basic CSS styling', 'Semantic structure'],
    useCase: ['Landing pages', 'Simple websites', 'Learning HTML'],
  },
  {
    id: 'responsive-layout',
    name: 'Responsive Layout',
    description: 'Modern responsive layout with CSS Grid and Flexbox',
    category: 'Layout',
    htmlCode: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Responsive Layout</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
        .container { display: grid; grid-template-areas: "header header" "nav main" "footer footer"; grid-template-rows: auto 1fr auto; min-height: 100vh; }
        header { grid-area: header; background: #333; color: white; padding: 1rem; }
        nav { grid-area: nav; background: #f4f4f4; padding: 1rem; width: 200px; }
        main { grid-area: main; padding: 1rem; }
        footer { grid-area: footer; background: #333; color: white; padding: 1rem; text-align: center; }
        @media (max-width: 768px) { .container { grid-template-areas: "header" "nav" "main" "footer"; } nav { width: 100%; } }
    </style>
</head>
<body>
    <div class="container">
        <header><h1>Responsive Website</h1></header>
        <nav><ul><li>Home</li><li>About</li><li>Contact</li></ul></nav>
        <main><h2>Main Content</h2><p>This layout adapts to different screen sizes.</p></main>
        <footer><p>&copy; 2024 My Website</p></footer>
    </div>
</body>
</html>`,
    features: ['CSS Grid layout', 'Responsive design', 'Mobile-first approach', 'Semantic HTML'],
    useCase: ['Business websites', 'Portfolios', 'Blogs'],
  },
  {
    id: 'form-example',
    name: 'Accessible Form',
    description: 'Form with accessibility features and validation',
    category: 'Forms',
    htmlCode: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Accessible Form</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 600px; margin: 2rem auto; padding: 0 1rem; }
        .form-group { margin-bottom: 1rem; }
        label { display: block; margin-bottom: 0.5rem; font-weight: bold; }
        input, textarea, select { width: 100%; padding: 0.5rem; border: 1px solid #ccc; border-radius: 4px; }
        input:focus, textarea:focus, select:focus { outline: 2px solid #007bff; }
        .error { color: #dc3545; font-size: 0.875rem; }
        button { background: #007bff; color: white; padding: 0.75rem 1.5rem; border: none; border-radius: 4px; cursor: pointer; }
        button:hover { background: #0056b3; }
    </style>
</head>
<body>
    <form>
        <h1>Contact Form</h1>
        <div class="form-group">
            <label for="name">Name *</label>
            <input type="text" id="name" name="name" required aria-describedby="name-error">
            <div id="name-error" class="error" role="alert"></div>
        </div>
        <div class="form-group">
            <label for="email">Email *</label>
            <input type="email" id="email" name="email" required aria-describedby="email-error">
            <div id="email-error" class="error" role="alert"></div>
        </div>
        <div class="form-group">
            <label for="message">Message</label>
            <textarea id="message" name="message" rows="4"></textarea>
        </div>
        <button type="submit">Send Message</button>
    </form>
</body>
</html>`,
    features: ['ARIA attributes', 'Form validation', 'Accessible labels', 'Error handling'],
    useCase: ['Contact forms', 'Registration forms', 'Surveys'],
  },
  {
    id: 'card-layout',
    name: 'Card Layout',
    description: 'Modern card-based layout with CSS animations',
    category: 'Components',
    htmlCode: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Card Layout</title>
    <style>
        body { font-family: 'Segoe UI', sans-serif; margin: 0; padding: 2rem; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
        .container { max-width: 1200px; margin: 0 auto; }
        h1 { text-align: center; color: white; margin-bottom: 2rem; }
        .cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem; }
        .card { background: white; border-radius: 12px; padding: 1.5rem; box-shadow: 0 4px 6px rgba(0,0,0,0.1); transition: transform 0.3s ease, box-shadow 0.3s ease; }
        .card:hover { transform: translateY(-5px); box-shadow: 0 8px 25px rgba(0,0,0,0.15); }
        .card h3 { color: #333; margin-bottom: 1rem; }
        .card p { color: #666; line-height: 1.6; }
        .btn { display: inline-block; background: #667eea; color: white; padding: 0.5rem 1rem; text-decoration: none; border-radius: 6px; margin-top: 1rem; transition: background 0.3s ease; }
        .btn:hover { background: #5a6fd8; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Our Services</h1>
        <div class="cards">
            <div class="card">
                <h3>Web Design</h3>
                <p>Create beautiful and responsive websites that work on all devices.</p>
                <a href="#" class="btn">Learn More</a>
            </div>
            <div class="card">
                <h3>Development</h3>
                <p>Build robust web applications with modern technologies and best practices.</p>
                <a href="#" class="btn">Learn More</a>
            </div>
            <div class="card">
                <h3>SEO</h3>
                <p>Optimize your website for search engines and improve your online visibility.</p>
                <a href="#" class="btn">Learn More</a>
            </div>
        </div>
    </div>
</body>
</html>`,
    features: ['CSS Grid', 'Hover animations', 'Gradient backgrounds', 'Card components'],
    useCase: ['Service pages', 'Product showcases', 'Team pages'],
  },
  {
    id: 'interactive-demo',
    name: 'Interactive Demo',
    description: 'Interactive HTML with JavaScript functionality',
    category: 'Interactive',
    htmlCode: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Interactive Demo</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 2rem auto; padding: 0 1rem; }
        .demo-section { margin: 2rem 0; padding: 1.5rem; border: 1px solid #ddd; border-radius: 8px; }
        button { background: #28a745; color: white; border: none; padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer; margin: 0.5rem; }
        button:hover { background: #218838; }
        .counter { font-size: 2rem; font-weight: bold; color: #007bff; }
        .color-box { width: 100px; height: 100px; border: 2px solid #333; margin: 1rem 0; transition: all 0.3s ease; }
        input[type="range"] { width: 100%; }
    </style>
</head>
<body>
    <h1>Interactive HTML Demo</h1>

    <div class="demo-section">
        <h2>Counter</h2>
        <div class="counter" id="counter">0</div>
        <button onclick="increment()">+</button>
        <button onclick="decrement()">-</button>
        <button onclick="reset()">Reset</button>
    </div>

    <div class="demo-section">
        <h2>Color Changer</h2>
        <div class="color-box" id="colorBox"></div>
        <button onclick="changeColor()">Change Color</button>
    </div>

    <div class="demo-section">
        <h2>Text Size Control</h2>
        <p id="sampleText">Adjust the text size with the slider below.</p>
        <input type="range" min="12" max="48" value="16" oninput="changeTextSize(this.value)">
    </div>

    <script>
        let count = 0;
        function increment() { document.getElementById('counter').textContent = ++count; }
        function decrement() { document.getElementById('counter').textContent = --count; }
        function reset() { count = 0; document.getElementById('counter').textContent = count; }

        function changeColor() {
            const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7', '#dda0dd'];
            const box = document.getElementById('colorBox');
            box.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        }

        function changeTextSize(size) {
            document.getElementById('sampleText').style.fontSize = size + 'px';
        }
    </script>
</body>
</html>`,
    features: ['JavaScript interactivity', 'Event handling', 'DOM manipulation', 'User controls'],
    useCase: ['Demos', 'Interactive tutorials', 'Web applications'],
  },
]

// Validation functions
const validateHTML = (html: string): HTMLValidation => {
  const validation: HTMLValidation = {
    isValid: true,
    errors: [],
    warnings: [],
    suggestions: [],
  }

  if (!html.trim()) {
    validation.isValid = false
    validation.errors.push({
      message: 'HTML content cannot be empty',
      type: 'structure',
      severity: 'error',
    })
    return validation
  }

  // Basic HTML structure checks
  if (!html.toLowerCase().includes('<!doctype')) {
    validation.warnings.push('Missing DOCTYPE declaration')
    validation.suggestions.push('Add <!DOCTYPE html> at the beginning of your document')
  }

  if (!html.toLowerCase().includes('<html')) {
    validation.warnings.push('Missing <html> element')
    validation.suggestions.push('Wrap your content in <html> tags')
  }

  if (!html.toLowerCase().includes('<head>')) {
    validation.warnings.push('Missing <head> section')
    validation.suggestions.push('Add <head> section with meta tags and title')
  }

  if (!html.toLowerCase().includes('<title>')) {
    validation.warnings.push('Missing <title> element')
    validation.suggestions.push('Add <title> element for better SEO and accessibility')
  }

  // Check for common syntax errors
  const openTags = html.match(/<[^/][^>]*>/g) || []
  const closeTags = html.match(/<\/[^>]*>/g) || []

  if (openTags.length !== closeTags.length) {
    validation.warnings.push('Potential unclosed HTML tags detected')
  }

  // Security checks
  if (html.includes('javascript:') || html.includes('vbscript:')) {
    validation.errors.push({
      message: 'Potentially unsafe JavaScript protocol detected',
      type: 'security',
      severity: 'error',
    })
  }

  if (html.includes('<script') && html.includes('eval(')) {
    validation.errors.push({
      message: 'Use of eval() function detected - potential security risk',
      type: 'security',
      severity: 'warning',
    })
  }

  // Accessibility checks
  const imgTags = html.match(/<img[^>]*>/gi) || []
  const imgsWithoutAlt = imgTags.filter((img) => !img.includes('alt='))

  if (imgsWithoutAlt.length > 0) {
    validation.warnings.push(`${imgsWithoutAlt.length} image(s) missing alt attributes`)
    validation.suggestions.push('Add alt attributes to images for better accessibility')
  }

  return validation
}

// Custom hooks
const useHTMLProcessing = () => {
  const processSingle = useCallback((html: string, settings: ProcessingSettings): HTMLProcessingResult => {
    const startTime = performance.now()

    try {
      if (settings.sanitizeHTML) {
        // Basic HTML sanitization (remove script tags for security)
        html = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      }

      const htmlMetrics = analyzeHTML(html)
      const performanceMetrics = calculatePerformanceMetrics(html, htmlMetrics)
      const analysis = performHTMLAnalysis(html, htmlMetrics, performanceMetrics)

      const endTime = performance.now()
      const processingTime = endTime - startTime

      const inputSize = new Blob([html]).size

      return {
        id: nanoid(),
        input: html,
        isValid: true,
        statistics: {
          inputSize,
          lineCount: html.split('\n').length,
          characterCount: html.length,
          processingTime,
          htmlMetrics,
          performanceMetrics,
        },
        analysis,
        createdAt: new Date(),
      }
    } catch (error) {
      const endTime = performance.now()
      const processingTime = endTime - startTime

      return {
        id: nanoid(),
        input: html,
        isValid: false,
        error: error instanceof Error ? error.message : 'Processing failed',
        statistics: {
          inputSize: new Blob([html]).size,
          lineCount: html.split('\n').length,
          characterCount: html.length,
          processingTime,
          htmlMetrics: {
            elementCount: 0,
            tagTypes: [],
            hasDoctype: false,
            hasHead: false,
            hasBody: false,
            hasTitle: false,
            hasMeta: false,
            hasCSS: false,
            hasJavaScript: false,
            externalResources: [],
            semanticElements: [],
            accessibilityFeatures: [],
          },
          performanceMetrics: {
            renderTime: 0,
            domComplexity: 0,
            cssComplexity: 0,
            jsComplexity: 0,
            seoScore: 0,
            accessibilityScore: 0,
          },
        },
        createdAt: new Date(),
      }
    }
  }, [])

  const processBatch = useCallback(
    (htmlInputs: string[], settings: ProcessingSettings): ProcessingBatch => {
      try {
        const results = htmlInputs.map((html) => processSingle(html, settings))

        const validCount = results.filter((result) => result.isValid).length
        const invalidCount = results.length - validCount

        const totalInputSize = results.reduce((sum, result) => sum + result.statistics.inputSize, 0)
        const averageQuality =
          results.length > 0
            ? results.reduce((sum, result) => sum + (result.analysis?.qualityScore || 0), 0) / results.length
            : 0

        const statistics: BatchStatistics = {
          totalProcessed: results.length,
          validCount,
          invalidCount,
          averageQuality,
          totalInputSize,
          successRate: (validCount / results.length) * 100,
        }

        return {
          id: nanoid(),
          results,
          count: results.length,
          settings,
          createdAt: new Date(),
          statistics,
        }
      } catch (error) {
        console.error('Batch processing error:', error)
        throw new Error(error instanceof Error ? error.message : 'Batch processing failed')
      }
    },
    [processSingle]
  )

  return { processSingle, processBatch }
}

// Real-time validation hook
const useRealTimeValidation = (html: string) => {
  return useMemo(() => {
    if (!html.trim()) {
      return {
        isValid: false,
        error: null,
        isEmpty: true,
      }
    }

    const validation = validateHTML(html)
    return {
      isValid: validation.isValid,
      error: validation.errors.length > 0 ? validation.errors[0].message : null,
      isEmpty: false,
      warnings: validation.warnings,
      suggestions: validation.suggestions,
      errors: validation.errors,
    }
  }, [html])
}

// Copy to clipboard functionality
const useCopyToClipboard = () => {
  const [copiedText, setCopiedText] = useState<string | null>(null)

  const copyToClipboard = useCallback(async (text: string, label?: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedText(label || 'text')
      toast.success(`${label || 'Text'} copied to clipboard`)

      // Reset copied state after 2 seconds
      setTimeout(() => setCopiedText(null), 2000)
    } catch (error) {
      toast.error('Failed to copy to clipboard')
    }
  }, [])

  return { copyToClipboard, copiedText }
}

// Export functionality
const useHTMLExport = () => {
  const exportResults = useCallback((results: HTMLProcessingResult[], format: ExportFormat, filename?: string) => {
    let content = ''
    let mimeType = 'text/plain'
    let extension = '.txt'

    switch (format) {
      case 'html':
        content = results.map((result) => result.input).join('\n\n<!-- Next HTML Document -->\n\n')
        mimeType = 'text/html'
        extension = '.html'
        break
      case 'json':
        const jsonData = results.map((result) => ({
          id: result.id,
          input: result.input,
          isValid: result.isValid,
          error: result.error,
          statistics: result.statistics,
          analysis: result.analysis,
          createdAt: result.createdAt,
        }))
        content = JSON.stringify(jsonData, null, 2)
        mimeType = 'application/json'
        extension = '.json'
        break
      case 'txt':
      default:
        content = generateTextFromResults(results)
        mimeType = 'text/plain'
        extension = '.txt'
        break
    }

    const blob = new Blob([content], { type: `${mimeType};charset=utf-8` })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename || `html-preview${extension}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, [])

  return { exportResults }
}

// Generate text report from results
const generateTextFromResults = (results: HTMLProcessingResult[]): string => {
  return `HTML Preview Analysis Report
============================

Generated: ${new Date().toLocaleString()}
Total Results: ${results.length}
Valid Results: ${results.filter((result) => result.isValid).length}
Invalid Results: ${results.filter((result) => !result.isValid).length}

Results:
${results
  .map((result, i) => {
    return `${i + 1}. HTML Document
   Status: ${result.isValid ? 'Valid' : 'Invalid'}
   ${result.error ? `Error: ${result.error}` : ''}
   Size: ${formatFileSize(result.statistics.inputSize)}
   Lines: ${result.statistics.lineCount}
   Characters: ${result.statistics.characterCount}
   Elements: ${result.statistics.htmlMetrics.elementCount}
   Processing Time: ${result.statistics.processingTime.toFixed(2)}ms
   Quality Score: ${result.analysis?.qualityScore || 'N/A'}
   SEO Score: ${result.statistics.performanceMetrics.seoScore}/100
   Accessibility Score: ${result.statistics.performanceMetrics.accessibilityScore}/100
`
  })
  .join('\n')}

Statistics:
- Success Rate: ${((results.filter((result) => result.isValid).length / results.length) * 100).toFixed(1)}%
- Average Quality: ${(results.reduce((sum, result) => sum + (result.analysis?.qualityScore || 0), 0) / results.length).toFixed(1)}
- Total Size: ${formatFileSize(results.reduce((sum, result) => sum + result.statistics.inputSize, 0))}
`
}

/**
 * Enhanced HTML Preview Tool
 * Features: Advanced HTML preview, validation, analysis, multiple view modes, batch processing
 */
const HTMLPreviewCore = () => {
  const [activeTab, setActiveTab] = useState<'preview' | 'batch' | 'analyzer' | 'templates'>('preview')
  const [html, setHtml] = useState('')
  const [currentResult, setCurrentResult] = useState<HTMLProcessingResult | null>(null)
  const [batches, setBatches] = useState<ProcessingBatch[]>([])
  const [batchInput, setBatchInput] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [showAnalysis, setShowAnalysis] = useState(false)
  const [previewKey, setPreviewKey] = useState(0)
  const [settings, setSettings] = useState<ProcessingSettings>({
    previewMode: 'iframe',
    deviceSize: 'desktop',
    showLineNumbers: true,
    enableSyntaxHighlighting: true,
    autoRefresh: true,
    refreshInterval: 1000,
    exportFormat: 'html',
    includeCSS: true,
    includeJS: true,
    sanitizeHTML: false,
    validateHTML: true,
  })

  const iframeRef = useRef<HTMLIFrameElement>(null)

  const { processSingle, processBatch } = useHTMLProcessing()
  const { exportResults } = useHTMLExport()
  const { copyToClipboard, copiedText } = useCopyToClipboard()
  const htmlValidation = useRealTimeValidation(html)

  // Apply template
  const applyTemplate = useCallback((templateId: string) => {
    const template = htmlTemplates.find((t) => t.id === templateId)
    if (template) {
      setHtml(template.htmlCode)
      setSelectedTemplate(templateId)
      toast.success(`Applied template: ${template.name}`)
    }
  }, [])

  // Handle single processing
  const handleProcessSingle = useCallback(async () => {
    if (!html.trim()) {
      toast.error('Please enter HTML code to process')
      return
    }

    setIsProcessing(true)
    try {
      const result = processSingle(html, settings)
      setCurrentResult(result)

      if (result.isValid) {
        toast.success('HTML processed successfully')
      } else {
        toast.error(result.error || 'Processing failed')
      }
    } catch (error) {
      toast.error('Failed to process HTML')
      console.error(error)
    } finally {
      setIsProcessing(false)
    }
  }, [html, settings, processSingle])

  // Handle batch processing
  const handleProcessBatch = useCallback(async () => {
    const htmlInputs = batchInput.split('\n---\n').filter((input) => input.trim())

    if (htmlInputs.length === 0) {
      toast.error('Please enter HTML code to process')
      return
    }

    setIsProcessing(true)
    try {
      const batch = processBatch(htmlInputs, settings)
      setBatches((prev) => [batch, ...prev])
      toast.success(`Processed ${batch.results.length} HTML documents`)
    } catch (error) {
      toast.error('Failed to process batch')
      console.error(error)
    } finally {
      setIsProcessing(false)
    }
  }, [batchInput, settings, processBatch])

  // Refresh preview
  const refreshPreview = useCallback(() => {
    setPreviewKey((prev) => prev + 1)
    if (settings.validateHTML) {
      handleProcessSingle()
    }
  }, [settings.validateHTML, handleProcessSingle])

  // Auto-refresh when enabled
  useEffect(() => {
    if (settings.autoRefresh && html.trim()) {
      const timer = setTimeout(() => {
        refreshPreview()
      }, settings.refreshInterval)
      return () => clearTimeout(timer)
    }
  }, [html, settings.autoRefresh, settings.refreshInterval, refreshPreview])

  // Get device dimensions for preview
  const deviceDimensions = getDeviceDimensions(settings.deviceSize)

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* Skip link for keyboard users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-primary text-primary-foreground px-4 py-2 rounded-md z-50"
      >
        Skip to main content
      </a>

      <div id="main-content" className="flex flex-col gap-4">
        {/* Header */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code className="h-5 w-5" aria-hidden="true" />
              HTML Preview & Analysis Tool
            </CardTitle>
            <CardDescription>
              Advanced HTML preview tool with real-time rendering, validation, analysis, and multiple view modes. Write
              HTML code and see live preview with comprehensive analysis and quality metrics. Use keyboard navigation:
              Tab to move between controls, Enter or Space to activate buttons.
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Main Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as 'preview' | 'batch' | 'analyzer' | 'templates')}
        >
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="preview" className="flex items-center gap-2">
              <Monitor className="h-4 w-4" />
              Live Preview
            </TabsTrigger>
            <TabsTrigger value="batch" className="flex items-center gap-2">
              <Shuffle className="h-4 w-4" />
              Batch Processing
            </TabsTrigger>
            <TabsTrigger value="analyzer" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              HTML Analyzer
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Templates
            </TabsTrigger>
          </TabsList>

          {/* Live Preview Tab */}
          <TabsContent value="preview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* HTML Editor */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileCode className="h-5 w-5" />
                    HTML Editor
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="html-input" className="text-sm font-medium">
                      HTML Code
                    </Label>
                    <Textarea
                      id="html-input"
                      value={html}
                      onChange={(e) => setHtml(e.target.value)}
                      placeholder="Enter your HTML code here..."
                      className="mt-2 min-h-[300px] font-mono text-sm"
                      aria-label="HTML code input for live preview"
                    />
                    {settings.validateHTML && html && (
                      <div className="mt-2 text-sm">
                        {htmlValidation.isValid ? (
                          <div className="text-green-600 flex items-center gap-1">
                            <CheckCircle2 className="h-4 w-4" />
                            Valid HTML structure
                          </div>
                        ) : htmlValidation.error ? (
                          <div className="text-red-600 flex items-center gap-1">
                            <AlertCircle className="h-4 w-4" />
                            {htmlValidation.error}
                          </div>
                        ) : null}
                      </div>
                    )}
                  </div>

                  {/* Editor Settings */}
                  <div className="space-y-3 border-t pt-4">
                    <Label className="text-sm font-medium">Editor Settings</Label>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="device-size" className="text-xs">
                          Preview Device
                        </Label>
                        <Select
                          value={settings.deviceSize}
                          onValueChange={(value: DeviceSize) => setSettings((prev) => ({ ...prev, deviceSize: value }))}
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="desktop">
                              <div className="flex items-center gap-2">
                                <Monitor className="h-4 w-4" />
                                Desktop
                              </div>
                            </SelectItem>
                            <SelectItem value="tablet">
                              <div className="flex items-center gap-2">
                                <Tablet className="h-4 w-4" />
                                Tablet
                              </div>
                            </SelectItem>
                            <SelectItem value="mobile">
                              <div className="flex items-center gap-2">
                                <Smartphone className="h-4 w-4" />
                                Mobile
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="refresh-interval" className="text-xs">
                          Refresh Interval (ms)
                        </Label>
                        <Input
                          id="refresh-interval"
                          type="number"
                          value={settings.refreshInterval}
                          onChange={(e) =>
                            setSettings((prev) => ({ ...prev, refreshInterval: parseInt(e.target.value) || 1000 }))
                          }
                          min="100"
                          max="5000"
                          step="100"
                          className="h-8"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <input
                          id="auto-refresh"
                          type="checkbox"
                          checked={settings.autoRefresh}
                          onChange={(e) => setSettings((prev) => ({ ...prev, autoRefresh: e.target.checked }))}
                          className="rounded border-input"
                        />
                        <Label htmlFor="auto-refresh" className="text-xs">
                          Auto-refresh preview
                        </Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <input
                          id="validate-html"
                          type="checkbox"
                          checked={settings.validateHTML}
                          onChange={(e) => setSettings((prev) => ({ ...prev, validateHTML: e.target.checked }))}
                          className="rounded border-input"
                        />
                        <Label htmlFor="validate-html" className="text-xs">
                          Real-time validation
                        </Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <input
                          id="sanitize-html"
                          type="checkbox"
                          checked={settings.sanitizeHTML}
                          onChange={(e) => setSettings((prev) => ({ ...prev, sanitizeHTML: e.target.checked }))}
                          className="rounded border-input"
                        />
                        <Label htmlFor="sanitize-html" className="text-xs">
                          Sanitize HTML (remove scripts)
                        </Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <input
                          id="show-line-numbers"
                          type="checkbox"
                          checked={settings.showLineNumbers}
                          onChange={(e) => setSettings((prev) => ({ ...prev, showLineNumbers: e.target.checked }))}
                          className="rounded border-input"
                        />
                        <Label htmlFor="show-line-numbers" className="text-xs">
                          Show line numbers
                        </Label>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={refreshPreview} disabled={!html.trim() || isProcessing} className="flex-1">
                      {isProcessing ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2" />
                      ) : (
                        <RefreshCw className="mr-2 h-4 w-4" />
                      )}
                      Refresh Preview
                    </Button>
                    <Button
                      onClick={() => copyToClipboard(html, 'HTML Code')}
                      variant="outline"
                      disabled={!html.trim()}
                    >
                      {copiedText === 'HTML Code' ? (
                        <Check className="mr-2 h-4 w-4" />
                      ) : (
                        <Copy className="mr-2 h-4 w-4" />
                      )}
                      Copy
                    </Button>
                    <Button
                      onClick={() => {
                        setHtml('')
                        setCurrentResult(null)
                      }}
                      variant="outline"
                    >
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Clear
                    </Button>
                  </div>

                  {htmlValidation.warnings && htmlValidation.warnings.length > 0 && (
                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <h4 className="font-medium text-sm mb-2 text-yellow-800">Warnings:</h4>
                      <div className="text-xs space-y-1">
                        {htmlValidation.warnings.map((warning, index) => (
                          <div key={index} className="text-yellow-700">
                            {warning}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {htmlValidation.suggestions && htmlValidation.suggestions.length > 0 && (
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <h4 className="font-medium text-sm mb-2 text-blue-800">Suggestions:</h4>
                      <div className="text-xs space-y-1">
                        {htmlValidation.suggestions.map((suggestion, index) => (
                          <div key={index} className="text-blue-700">
                            {suggestion}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Live Preview */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Monitor className="h-5 w-5" />
                    Live Preview
                    <div className="ml-auto flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {settings.deviceSize} ({deviceDimensions.width} × {deviceDimensions.height})
                      </span>
                      <Button size="sm" variant="ghost" onClick={() => setShowAnalysis(!showAnalysis)}>
                        {showAnalysis ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {html.trim() ? (
                    <div className="space-y-4">
                      {/* Preview Frame */}
                      <div className="border rounded-lg overflow-hidden">
                        <div className="bg-muted px-3 py-2 text-sm flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Globe className="h-4 w-4" />
                            <span>Preview</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button size="sm" variant="ghost" onClick={refreshPreview}>
                              <RefreshCw className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                const newWindow = window.open()
                                if (newWindow) {
                                  newWindow.document.write(html)
                                  newWindow.document.close()
                                }
                              }}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <div
                          className="bg-white"
                          style={{
                            width: deviceDimensions.width,
                            height: deviceDimensions.height,
                            maxWidth: '100%',
                            overflow: 'auto',
                          }}
                        >
                          <iframe
                            key={previewKey}
                            ref={iframeRef}
                            srcDoc={html}
                            className="w-full h-full border-0"
                            title="HTML Preview"
                            sandbox="allow-scripts allow-same-origin allow-forms"
                          />
                        </div>
                      </div>

                      {/* Analysis Results */}
                      {showAnalysis && currentResult && currentResult.isValid && (
                        <div className="space-y-4">
                          {/* HTML Statistics */}
                          <div className="border rounded-lg p-3">
                            <Label className="font-medium text-sm mb-3 block">HTML Statistics</Label>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                              <div>
                                <div>
                                  <strong>Elements:</strong> {currentResult.statistics.htmlMetrics.elementCount}
                                </div>
                                <div>
                                  <strong>Tag Types:</strong> {currentResult.statistics.htmlMetrics.tagTypes.length}
                                </div>
                                <div>
                                  <strong>Lines:</strong> {currentResult.statistics.lineCount}
                                </div>
                              </div>
                              <div>
                                <div>
                                  <strong>Characters:</strong>{' '}
                                  {currentResult.statistics.characterCount.toLocaleString()}
                                </div>
                                <div>
                                  <strong>Size:</strong> {formatFileSize(currentResult.statistics.inputSize)}
                                </div>
                                <div>
                                  <strong>Processing Time:</strong> {currentResult.statistics.processingTime.toFixed(2)}
                                  ms
                                </div>
                              </div>
                              <div>
                                <div>
                                  <strong>Has CSS:</strong> {currentResult.statistics.htmlMetrics.hasCSS ? 'Yes' : 'No'}
                                </div>
                                <div>
                                  <strong>Has JavaScript:</strong>{' '}
                                  {currentResult.statistics.htmlMetrics.hasJavaScript ? 'Yes' : 'No'}
                                </div>
                                <div>
                                  <strong>External Resources:</strong>{' '}
                                  {currentResult.statistics.htmlMetrics.externalResources.length}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Quality Scores */}
                          <div className="border rounded-lg p-3">
                            <Label className="font-medium text-sm mb-3 block">Quality Scores</Label>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <div>
                                  <strong>Overall Quality:</strong>{' '}
                                  {currentResult.analysis?.qualityScore?.toFixed(1) || 'N/A'}/100
                                </div>
                              </div>
                              <div>
                                <div>
                                  <strong>SEO Score:</strong> {currentResult.statistics.performanceMetrics.seoScore}/100
                                </div>
                              </div>
                              <div>
                                <div>
                                  <strong>Accessibility:</strong>{' '}
                                  {currentResult.statistics.performanceMetrics.accessibilityScore}/100
                                </div>
                              </div>
                              <div>
                                <div>
                                  <strong>DOM Complexity:</strong>{' '}
                                  {currentResult.statistics.performanceMetrics.domComplexity.toFixed(1)}/100
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Document Structure */}
                          <div className="border rounded-lg p-3">
                            <Label className="font-medium text-sm mb-3 block">Document Structure</Label>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                              <div>
                                <div>
                                  <strong>DOCTYPE:</strong>{' '}
                                  {currentResult.statistics.htmlMetrics.hasDoctype ? '✓' : '✗'}
                                </div>
                                <div>
                                  <strong>Head Section:</strong>{' '}
                                  {currentResult.statistics.htmlMetrics.hasHead ? '✓' : '✗'}
                                </div>
                                <div>
                                  <strong>Body Section:</strong>{' '}
                                  {currentResult.statistics.htmlMetrics.hasBody ? '✓' : '✗'}
                                </div>
                              </div>
                              <div>
                                <div>
                                  <strong>Title Tag:</strong>{' '}
                                  {currentResult.statistics.htmlMetrics.hasTitle ? '✓' : '✗'}
                                </div>
                                <div>
                                  <strong>Meta Tags:</strong> {currentResult.statistics.htmlMetrics.hasMeta ? '✓' : '✗'}
                                </div>
                                <div>
                                  <strong>Semantic Elements:</strong>{' '}
                                  {currentResult.statistics.htmlMetrics.semanticElements.length}
                                </div>
                              </div>
                              <div>
                                <div>
                                  <strong>Accessibility Features:</strong>{' '}
                                  {currentResult.statistics.htmlMetrics.accessibilityFeatures.length}
                                </div>
                                <div>
                                  <strong>Modern Structure:</strong>{' '}
                                  {currentResult.analysis?.hasModernStructure ? '✓' : '✗'}
                                </div>
                                <div>
                                  <strong>Responsive:</strong> {currentResult.analysis?.isResponsive ? '✓' : '✗'}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Issues and Recommendations */}
                          {currentResult.analysis && (
                            <div className="space-y-4">
                              {currentResult.analysis.suggestedImprovements.length > 0 && (
                                <div className="border rounded-lg p-3">
                                  <Label className="font-medium text-sm mb-3 block text-blue-700">
                                    Suggested Improvements
                                  </Label>
                                  <ul className="text-sm space-y-1">
                                    {currentResult.analysis.suggestedImprovements.map((suggestion, index) => (
                                      <li key={index} className="flex items-center gap-2">
                                        <CheckCircle2 className="h-3 w-3 text-blue-600" />
                                        {suggestion}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {currentResult.analysis.securityIssues.length > 0 && (
                                <div className="border rounded-lg p-3">
                                  <Label className="font-medium text-sm mb-3 block text-red-700">Security Issues</Label>
                                  <ul className="text-sm space-y-1">
                                    {currentResult.analysis.securityIssues.map((issue, index) => (
                                      <li key={index} className="flex items-center gap-2">
                                        <AlertCircle className="h-3 w-3 text-red-600" />
                                        {issue}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {currentResult.analysis.performanceIssues.length > 0 && (
                                <div className="border rounded-lg p-3">
                                  <Label className="font-medium text-sm mb-3 block text-orange-700">
                                    Performance Issues
                                  </Label>
                                  <ul className="text-sm space-y-1">
                                    {currentResult.analysis.performanceIssues.map((issue, index) => (
                                      <li key={index} className="flex items-center gap-2">
                                        <Zap className="h-3 w-3 text-orange-600" />
                                        {issue}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {currentResult && currentResult.isValid && (
                        <div className="flex gap-2 pt-4 border-t">
                          <Button
                            onClick={() => exportResults([currentResult], settings.exportFormat)}
                            variant="outline"
                            size="sm"
                          >
                            <Download className="mr-2 h-4 w-4" />
                            Export HTML
                          </Button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Code className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No HTML Code</h3>
                      <p className="text-muted-foreground mb-4">Enter HTML code in the editor to see live preview</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Batch Processing Tab */}
          <TabsContent value="batch" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Shuffle className="h-5 w-5" />
                  Batch HTML Processing
                </CardTitle>
                <CardDescription>Process multiple HTML documents simultaneously (separate with "---")</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="batch-input" className="text-sm font-medium">
                      HTML Documents (separate with "---")
                    </Label>
                    <Textarea
                      id="batch-input"
                      value={batchInput}
                      onChange={(e) => setBatchInput(e.target.value)}
                      placeholder="<!DOCTYPE html>&#10;<html>&#10;<head><title>Document 1</title></head>&#10;<body><h1>Hello World</h1></body>&#10;</html>&#10;---&#10;<!DOCTYPE html>&#10;<html>&#10;<head><title>Document 2</title></head>&#10;<body><h1>Another Document</h1></body>&#10;</html>"
                      className="mt-2 min-h-[200px] font-mono"
                      aria-label="Batch HTML input"
                    />
                    <div className="mt-2 text-xs text-muted-foreground">
                      Separate multiple HTML documents with "---" on a new line
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={handleProcessBatch} disabled={!batchInput.trim() || isProcessing}>
                      {isProcessing ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2" />
                      ) : (
                        <Zap className="mr-2 h-4 w-4" />
                      )}
                      Process Batch
                    </Button>
                    <Button onClick={() => setBatchInput('')} variant="outline">
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Clear
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Batch Results */}
            {batches.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Batch Results ({batches.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {batches.map((batch) => (
                      <div key={batch.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h4 className="font-medium">{batch.count} HTML documents processed</h4>
                            <div className="text-sm text-muted-foreground">
                              {batch.createdAt.toLocaleString()} • {batch.statistics.successRate.toFixed(1)}% success
                              rate
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => exportResults(batch.results, 'html')}>
                              <Download className="mr-2 h-4 w-4" />
                              Export
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setBatches((prev) => prev.filter((b) => b.id !== batch.id))}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-3">
                          <div>
                            <span className="font-medium">Valid:</span> {batch.statistics.validCount}
                          </div>
                          <div>
                            <span className="font-medium">Invalid:</span> {batch.statistics.invalidCount}
                          </div>
                          <div>
                            <span className="font-medium">Avg Quality:</span>{' '}
                            {batch.statistics.averageQuality.toFixed(1)}
                          </div>
                        </div>

                        <div className="max-h-48 overflow-y-auto">
                          <div className="space-y-2">
                            {batch.results.slice(0, 5).map((result) => (
                              <div key={result.id} className="text-xs border rounded p-2">
                                <div className="flex items-center justify-between">
                                  <span className="font-mono truncate flex-1 mr-2">
                                    HTML Document ({result.statistics.htmlMetrics.elementCount} elements)
                                  </span>
                                  <span
                                    className={`px-2 py-1 rounded text-xs ${
                                      result.isValid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                    }`}
                                  >
                                    {result.isValid ? 'Valid' : 'Invalid'}
                                  </span>
                                </div>
                                {result.isValid && (
                                  <div className="text-muted-foreground mt-1">
                                    Elements: {result.statistics.htmlMetrics.elementCount} • Size:{' '}
                                    {formatFileSize(result.statistics.inputSize)} • Quality:{' '}
                                    {result.analysis?.qualityScore?.toFixed(1) || 'N/A'}/100 • Time:{' '}
                                    {result.statistics.processingTime.toFixed(2)}ms
                                  </div>
                                )}
                                {result.error && <div className="text-red-600 mt-1">{result.error}</div>}
                              </div>
                            ))}
                            {batch.results.length > 5 && (
                              <div className="text-xs text-muted-foreground text-center">
                                ... and {batch.results.length - 5} more documents
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* HTML Analyzer Tab */}
          <TabsContent value="analyzer" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  HTML Quality Analyzer
                </CardTitle>
                <CardDescription>Detailed analysis of HTML structure, quality, and best practices</CardDescription>
              </CardHeader>
              <CardContent>
                {currentResult && currentResult.isValid ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Document Structure</CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm space-y-1">
                          <div>Elements: {currentResult.statistics.htmlMetrics.elementCount}</div>
                          <div>Tag Types: {currentResult.statistics.htmlMetrics.tagTypes.length}</div>
                          <div>Document Size: {formatFileSize(currentResult.statistics.inputSize)}</div>
                          <div>Lines: {currentResult.statistics.lineCount}</div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Quality Metrics</CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm space-y-1">
                          <div>Overall Quality: {currentResult.analysis?.qualityScore?.toFixed(1) || 'N/A'}/100</div>
                          <div>SEO Score: {currentResult.statistics.performanceMetrics.seoScore}/100</div>
                          <div>Accessibility: {currentResult.statistics.performanceMetrics.accessibilityScore}/100</div>
                          <div>
                            DOM Complexity: {currentResult.statistics.performanceMetrics.domComplexity.toFixed(1)}/100
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Features</CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm space-y-1">
                          <div>Modern Structure: {currentResult.analysis?.hasModernStructure ? 'Yes' : 'No'}</div>
                          <div>Responsive: {currentResult.analysis?.isResponsive ? 'Yes' : 'No'}</div>
                          <div>Accessibility: {currentResult.analysis?.hasAccessibilityFeatures ? 'Yes' : 'No'}</div>
                          <div>SEO Elements: {currentResult.analysis?.hasSEOElements ? 'Yes' : 'No'}</div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Semantic Elements */}
                    {currentResult.statistics.htmlMetrics.semanticElements.length > 0 && (
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Semantic Elements</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex flex-wrap gap-2">
                            {currentResult.statistics.htmlMetrics.semanticElements.map((element, index) => (
                              <span key={index} className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                                &lt;{element}&gt;
                              </span>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* External Resources */}
                    {currentResult.statistics.htmlMetrics.externalResources.length > 0 && (
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">External Resources</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {currentResult.statistics.htmlMetrics.externalResources.map((resource, index) => (
                              <div key={index} className="flex items-center justify-between text-xs">
                                <span className="font-mono truncate flex-1">{resource.url}</span>
                                <div className="flex gap-2">
                                  <span
                                    className={`px-2 py-1 rounded ${
                                      resource.type === 'css'
                                        ? 'bg-blue-100 text-blue-800'
                                        : resource.type === 'js'
                                          ? 'bg-yellow-100 text-yellow-800'
                                          : resource.type === 'image'
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-gray-100 text-gray-800'
                                    }`}
                                  >
                                    {resource.type}
                                  </span>
                                  <span
                                    className={`px-2 py-1 rounded ${
                                      resource.isLocal ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                                    }`}
                                  >
                                    {resource.isLocal ? 'Local' : 'External'}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Accessibility Features */}
                    {currentResult.statistics.htmlMetrics.accessibilityFeatures.length > 0 && (
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Accessibility Features</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {currentResult.statistics.htmlMetrics.accessibilityFeatures.map((feature, index) => (
                              <div key={index} className="flex items-center gap-2 text-sm">
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                                <span className="font-medium">{feature.type}:</span>
                                <span>{feature.description}</span>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Search className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Analysis Available</h3>
                    <p className="text-muted-foreground mb-4">
                      Process HTML code in the Live Preview tab to see detailed analysis
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Templates Tab */}
          <TabsContent value="templates" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  HTML Templates
                </CardTitle>
                <CardDescription>Pre-built HTML templates for common use cases</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {htmlTemplates.map((template) => (
                    <div
                      key={template.id}
                      className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                        selectedTemplate === template.id ? 'border-primary bg-primary/5' : 'hover:border-primary/50'
                      }`}
                      onClick={() => applyTemplate(template.id)}
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-sm">{template.name}</h4>
                          <span className="text-xs px-2 py-1 bg-muted rounded">{template.category}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">{template.description}</div>
                        <div className="space-y-2">
                          <div>
                            <div className="text-xs font-medium mb-1">Features:</div>
                            <div className="flex flex-wrap gap-1">
                              {template.features.map((feature, index) => (
                                <span key={index} className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
                                  {feature}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs font-medium mb-1">HTML Preview:</div>
                            <div className="font-mono text-xs bg-muted p-2 rounded max-h-24 overflow-y-auto">
                              {template.htmlCode.substring(0, 200)}...
                            </div>
                          </div>
                        </div>
                        {template.useCase.length > 0 && (
                          <div className="text-xs">
                            <strong>Use cases:</strong> {template.useCase.join(', ')}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Preview Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="export-format" className="text-sm font-medium">
                    Export Format
                  </Label>
                  <Select
                    value={settings.exportFormat}
                    onValueChange={(value: ExportFormat) => setSettings((prev) => ({ ...prev, exportFormat: value }))}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="html">HTML</SelectItem>
                      <SelectItem value="json">JSON</SelectItem>
                      <SelectItem value="txt">Text Report</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="preview-mode" className="text-sm font-medium">
                    Preview Mode
                  </Label>
                  <Select
                    value={settings.previewMode}
                    onValueChange={(value: PreviewMode) => setSettings((prev) => ({ ...prev, previewMode: value }))}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="iframe">Iframe</SelectItem>
                      <SelectItem value="popup">Popup Window</SelectItem>
                      <SelectItem value="split">Split View</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {batches.length > 0 && (
                <div className="flex gap-2 pt-4 border-t">
                  <Button
                    onClick={() => {
                      const allResults = batches.flatMap((batch) => batch.results)
                      exportResults(allResults, 'txt', 'html-analysis-report.txt')
                    }}
                    variant="outline"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Export All Statistics
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </Tabs>
      </div>
    </div>
  )
}

// Main component with error boundary
const HtmlPreview = () => {
  return <HTMLPreviewCore />
}

export default HtmlPreview
