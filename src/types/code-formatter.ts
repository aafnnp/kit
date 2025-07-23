export interface CodeFormatterState {
  input: string
  output: string
  language: 'javascript' | 'typescript' | 'css' | 'html' | 'json'
  options: {
    tabWidth: number
    useTabs: boolean
    semicolons: boolean
    singleQuote: boolean
    trailingComma: 'none' | 'es5' | 'all'
    bracketSpacing: boolean
    jsxBracketSameLine: boolean
  }
  isFormatting: boolean
  error: string | null
}

export interface FormatOptions {
  parser: string
  tabWidth: number
  useTabs: boolean
  semi: boolean
  singleQuote: boolean
  trailingComma: 'none' | 'es5' | 'all'
  bracketSpacing: boolean
  jsxBracketSameLine: boolean
}

export interface LanguageConfig {
  name: string
  parser: string
  example: string
}

export const LANGUAGE_CONFIGS: Record<string, LanguageConfig> = {
  javascript: {
    name: 'JavaScript',
    parser: 'babel',
    example: `function hello(name){console.log("Hello, "+name+"!");}
hello("World");`
  },
  typescript: {
    name: 'TypeScript',
    parser: 'typescript',
    example: `interface User{name:string;age:number;}\nfunction greet(user:User):string{return \`Hello, \${user.name}!\`;}`
  },
  css: {
    name: 'CSS',
    parser: 'css',
    example: `.container{display:flex;justify-content:center;align-items:center;height:100vh;background:#f0f0f0;}`
  },
  html: {
    name: 'HTML',
    parser: 'html',
    example: `<!DOCTYPE html><html><head><title>Test</title></head><body><div class="container"><h1>Hello World</h1></div></body></html>`
  },
  json: {
    name: 'JSON',
    parser: 'json',
    example: `{"name":"John","age":30,"city":"New York","hobbies":["reading","swimming"]}`
  }
}