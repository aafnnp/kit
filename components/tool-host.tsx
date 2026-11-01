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
import { legacyToolSlugs } from "../tools/legacy-migration/catalog"

/**
 * Mounts exactly one tool. Each branch is its own `If`, so switching tools
 * removes the old component and mounts the new one with fresh state.
 */
export function ToolHost() {
  return (
    <>
      <If when={activeSlug() === "json-pretty"}>
        <JsonPretty />
      </If>
      <If when={activeSlug() === "json-to-ts"}>
        <JsonToTs />
      </If>
      <If when={activeSlug() === "csv-to-json"}>
        <CsvToJson />
      </If>
      <If when={activeSlug() === "jwt-decode"}>
        <JwtDecode />
      </If>
      <If when={activeSlug() === "base64-encode"}>
        <Base64Encode />
      </If>
      <If when={activeSlug() === "url-encode"}>
        <UrlEncode />
      </If>
      <If when={activeSlug() === "word-count"}>
        <WordCount />
      </If>
      <If when={activeSlug() === "char-case"}>
        <CharCase />
      </If>
      <If when={activeSlug() === "diff-viewer"}>
        <DiffViewer />
      </If>
      <If when={activeSlug() === "regex-tester"}>
        <RegexTester />
      </If>
      <If when={activeSlug() === "lorem-ipsum"}>
        <LoremIpsum />
      </If>
      <If when={activeSlug() === "hash"}>
        <HashTool />
      </If>
      <If when={activeSlug() === "uuid-generator"}>
        <UuidGenerator />
      </If>
      <If when={activeSlug() === "password-generator"}>
        <PasswordGenerator />
      </If>
      <If when={activeSlug() === "unix-timestamp"}>
        <UnixTimestamp />
      </If>
      <If when={activeSlug() === "roman-numeral"}>
        <RomanNumeral />
      </If>
      <If when={activeSlug() === "prime-checker"}>
        <PrimeChecker />
      </If>
      <If when={activeSlug() === "quadratic-solver"}>
        <QuadraticSolver />
      </If>
      <If when={activeSlug() === "markdown-toc"}>
        <MarkdownToc />
      </If>
      <If when={activeSlug() === "json-diff"}>
        <JsonDiff />
      </If>
      <If when={activeSlug() === "hex-rgb"}>
        <HexRgb />
      </If>
      <If when={activeSlug() === "url-parser"}>
        <UrlParser />
      </If>
      <If when={activeSlug() === "time-diff"}>
        <TimeDiff />
      </If>
      <If when={activeSlug() === "css-clamp"}>
        <CssClamp />
      </If>
      <If when={activeSlug() === "border-radius"}>
        <BorderRadius />
      </If>
      <If when={activeSlug() === "gradient-maker"}>
        <GradientMaker />
      </If>
      <If when={activeSlug() === "shadow-generator"}>
        <ShadowGenerator />
      </If>
      <If when={activeSlug() === "random-color"}>
        <RandomColor />
      </If>
      <If when={activeSlug() === "timezone-convert"}>
        <TimezoneConvert />
      </If>
      <If when={activeSlug() === "mime-search"}>
        <MimeSearch />
      </If>
      <If when={activeSlug() === "http-status"}>
        <HttpStatus />
      </If>
      <If when={activeSlug() === "fake-user"}>
        <FakeUserGenerator />
      </If>
      <If when={activeSlug() === "lottery-picker"}>
        <LotteryPicker />
      </If>
      <If when={activeSlug() === "matrix-math"}>
        <MatrixMath />
      </If>
      <If when={activeSlug() === "regex-cheatsheet"}>
        <RegexCheatsheet />
      </If>
      <If when={activeSlug() === "cron-parser"}>
        <CronParser />
      </If>
      <If when={activeSlug() === "table-sorter"}>
        <TableSorter />
      </If>
      <If when={activeSlug() === "git-helper"}>
        <GitHelper />
      </If>
      <If when={legacyToolSlugs.has(activeSlug() ?? "")}>
        <LegacyMigrationTool />
      </If>
    </>
  )
}
