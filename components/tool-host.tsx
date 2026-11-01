import type { Component } from "nsh"
import { activeSlug } from "../lib/state"
import JsonPretty from "../tools/json-pretty"
import JsonToTs from "../tools/json-to-ts"
import CsvToJson from "../tools/csv-to-json"
import JwtDecode from "../tools/jwt-decode"
import Base64Encode from "../tools/base64-encode"
import UrlEncode from "../tools/url-encode"
import WordCount from "../tools/word-count"
import CharCase from "../tools/char-case"
import DiffViewer from "../tools/diff-viewer"
import RegexTester from "../tools/regex-tester"
import LoremIpsum from "../tools/lorem-ipsum"
import HashTool from "../tools/hash"
import UuidGenerator from "../tools/uuid-generator"
import PasswordGenerator from "../tools/password-generator"
import UnixTimestamp from "../tools/unix-timestamp"
import RomanNumeral from "../tools/roman-numeral"
import PrimeChecker from "../tools/prime-checker"
import QuadraticSolver from "../tools/quadratic-solver"
import MarkdownToc from "../tools/markdown-toc"
import JsonDiff from "../tools/json-diff"
import HexRgb from "../tools/hex-rgb"
import UrlParser from "../tools/url-parser"
import TimeDiff from "../tools/time-diff"
import CssClamp from "../tools/css-clamp"
import BorderRadius from "../tools/border-radius"
import GradientMaker from "../tools/gradient-maker"
import ShadowGenerator from "../tools/shadow-generator"
import RandomColor from "../tools/random-color"
import TimezoneConvert from "../tools/timezone-convert"
import MimeSearch from "../tools/mime-search"
import HttpStatus from "../tools/http-status"
import FakeUserGenerator from "../tools/fake-user"
import LotteryPicker from "../tools/lottery-picker"
import MatrixMath from "../tools/matrix-math"
import RegexCheatsheet from "../tools/regex-cheatsheet"
import CronParser from "../tools/cron-parser"
import TableSorter from "../tools/table-sorter"
import GitHelper from "../tools/git-helper"
import LegacyMigrationTool from "../tools/legacy-migration"
import { tools } from "../tools/registry"
import { legacyToolSlugs } from "../tools/legacy-migration/catalog"

const toolComponents: Record<string, Component> = {
  "json-pretty": JsonPretty,
  "json-to-ts": JsonToTs,
  "csv-to-json": CsvToJson,
  "jwt-decode": JwtDecode,
  "base64-encode": Base64Encode,
  "url-encode": UrlEncode,
  "word-count": WordCount,
  "char-case": CharCase,
  "diff-viewer": DiffViewer,
  "regex-tester": RegexTester,
  "lorem-ipsum": LoremIpsum,
  "hash": HashTool,
  "uuid-generator": UuidGenerator,
  "password-generator": PasswordGenerator,
  "unix-timestamp": UnixTimestamp,
  "roman-numeral": RomanNumeral,
  "prime-checker": PrimeChecker,
  "quadratic-solver": QuadraticSolver,
  "markdown-toc": MarkdownToc,
  "json-diff": JsonDiff,
  "hex-rgb": HexRgb,
  "url-parser": UrlParser,
  "time-diff": TimeDiff,
  "css-clamp": CssClamp,
  "border-radius": BorderRadius,
  "gradient-maker": GradientMaker,
  "shadow-generator": ShadowGenerator,
  "random-color": RandomColor,
  "timezone-convert": TimezoneConvert,
  "mime-search": MimeSearch,
  "http-status": HttpStatus,
  "fake-user": FakeUserGenerator,
  "lottery-picker": LotteryPicker,
  "matrix-math": MatrixMath,
  "regex-cheatsheet": RegexCheatsheet,
  "cron-parser": CronParser,
  "table-sorter": TableSorter,
  "git-helper": GitHelper,
}

for (const tool of tools) {
  if (!legacyToolSlugs.has(tool.slug) && !toolComponents[tool.slug]) {
    throw new Error(`No component registered for tool "${tool.slug}"`)
  }
}

/** Mounts exactly one registry tool; switching slugs unmounts the old tool. */
export function ToolHost() {
  return (
    <Each of={tools}>
      {(tool) => {
        const slug = tool().slug
        const Component = toolComponents[slug] ?? (legacyToolSlugs.has(slug) ? LegacyMigrationTool : undefined)
        return (
          <If when={activeSlug() === slug}>
            {Component ? <Component /> : null}
          </If>
        )
      }}
    </Each>
  )
}
