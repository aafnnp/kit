export interface RegexTip {
  title: string
  pattern: string
  description: string
  example: string
}

export const regexTips: RegexTip[] = [
  { title: "Any character", pattern: ".", description: "Matches any character except line breaks by default.", example: "a.c → abc, a-c" },
  { title: "Digit", pattern: "\\d", description: "Matches one decimal digit; equivalent to [0-9] in JavaScript.", example: "\\d+ → 42" },
  { title: "Word character", pattern: "\\w", description: "Matches letters, digits or underscore.", example: "\\w+ → hello_2" },
  { title: "Whitespace", pattern: "\\s", description: "Matches whitespace such as spaces, tabs and line breaks.", example: "a\\sb → a b" },
  { title: "Start / end", pattern: "^text$", description: "^ anchors to the start; $ anchors to the end of the input or line.", example: "^kit$ → kit" },
  { title: "One or more", pattern: "a+", description: "Matches one or more occurrences of the preceding token.", example: "a+ → a, aaa" },
  { title: "Zero or more", pattern: "a*", description: "Matches zero or more occurrences of the preceding token.", example: "colou?r → color, colour" },
  { title: "Optional", pattern: "a?", description: "Makes the preceding token optional.", example: "https? → http, https" },
  { title: "Character set", pattern: "[abc]", description: "Matches any one character listed inside the brackets.", example: "[aeiou] → one vowel" },
  { title: "Negated set", pattern: "[^abc]", description: "Matches any one character not listed inside the brackets.", example: "[^0-9] → non-digit" },
  { title: "Capture group", pattern: "(abc)", description: "Groups tokens and captures the matched text.", example: "(\\d{4})-(\\d{2})" },
  { title: "Non-capturing group", pattern: "(?:abc)", description: "Groups tokens without creating a capture group.", example: "(?:jpg|png)" },
  { title: "Alternation", pattern: "cat|dog", description: "Matches either the expression before or after |.", example: "cat|dog → cat, dog" },
  { title: "Word boundary", pattern: "\\bword\\b", description: "Matches a word boundary around a token.", example: "\\bkit\\b → kit" },
  { title: "Lazy quantifier", pattern: ".*?", description: "Matches as little as possible while allowing the full expression to match.", example: "<.*?> → one tag" },
  { title: "Positive lookahead", pattern: "foo(?=bar)", description: "Matches foo only when it is followed by bar.", example: "foo(?=bar) → foo" },
]

export function searchRegexTips(query: string): RegexTip[] {
  const needle = query.trim().toLowerCase()
  if (!needle) return regexTips
  return regexTips.filter((tip) =>
    [tip.title, tip.pattern, tip.description, tip.example].some((value) => value.toLowerCase().includes(needle)),
  )
}
