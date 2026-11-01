type Shape =
  | { kind: "primitive"; name: string }
  | { kind: "null" }
  | { kind: "array"; item: Shape }
  | { kind: "object"; fields: Field[] }
  | { kind: "union"; options: Shape[] }

interface Field {
  key: string
  type: Shape
  optional: boolean
}

function infer(value: unknown): Shape {
  if (value === null) return { kind: "null" }
  if (Array.isArray(value)) {
    return { kind: "array", item: value.length === 0 ? { kind: "primitive", name: "unknown" } : value.map(infer).reduce(merge) }
  }
  switch (typeof value) {
    case "string":
      return { kind: "primitive", name: "string" }
    case "number":
      return { kind: "primitive", name: "number" }
    case "boolean":
      return { kind: "primitive", name: "boolean" }
    case "object": {
      const fields: Field[] = Object.entries(value as Record<string, unknown>).map(([key, item]) => ({
        key,
        type: infer(item),
        optional: false,
      }))
      return { kind: "object", fields }
    }
    default:
      return { kind: "primitive", name: "unknown" }
  }
}

function signature(shape: Shape): string {
  switch (shape.kind) {
    case "primitive":
      return `p:${shape.name}`
    case "null":
      return "null"
    case "array":
      return `a:${signature(shape.item)}`
    case "object":
      return `o:{${shape.fields
        .map((field) => `${field.key}${field.optional ? "?" : ""}:${signature(field.type)}`)
        .sort()
        .join(",")}}`
    case "union":
      return `u:${shape.options.map(signature).sort().join("|")}`
  }
}

function union(options: Shape[]): Shape {
  const flattened: Shape[] = []
  for (const option of options) {
    if (option.kind === "union") flattened.push(...option.options)
    else flattened.push(option)
  }
  const unique: Shape[] = []
  const seen = new Set<string>()
  for (const option of flattened) {
    const key = signature(option)
    if (seen.has(key)) continue
    seen.add(key)
    unique.push(option)
  }
  if (unique.length === 1) return unique[0]!
  return { kind: "union", options: unique }
}

function merge(a: Shape, b: Shape): Shape {
  if (signature(a) === signature(b)) return a
  if (a.kind === "object" && b.kind === "object") {
    const keys = new Set([...a.fields.map((field) => field.key), ...b.fields.map((field) => field.key)])
    const fields: Field[] = []
    for (const key of keys) {
      const left = a.fields.find((field) => field.key === key)
      const right = b.fields.find((field) => field.key === key)
      if (left && right) fields.push({ key, type: merge(left.type, right.type), optional: left.optional || right.optional })
      else if (left) fields.push({ ...left, optional: true })
      else if (right) fields.push({ ...right, optional: true })
    }
    return { kind: "object", fields }
  }
  if (a.kind === "array" && b.kind === "array") return { kind: "array", item: merge(a.item, b.item) }
  return union([a, b])
}

function pascal(value: string): string {
  const words = value
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean)
  const name = words.map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join("")
  if (!name) return "Item"
  return /^[A-Za-z_$]/.test(name) ? name : `Type${name}`
}

function singular(value: string): string {
  if (value.endsWith("ies")) return `${value.slice(0, -3)}y`
  if (value.endsWith("ses")) return value.slice(0, -2)
  if (value.endsWith("s") && value.length > 1) return value.slice(0, -1)
  return value
}

function propertyKey(key: string): string {
  return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(key) ? key : JSON.stringify(key)
}

interface Emitter {
  interfaces: string[]
  names: Map<string, string>
  used: Set<string>
}

function uniqueName(base: string, emitter: Emitter): string {
  let name = base
  let index = 2
  while (emitter.used.has(name)) {
    name = `${base}${index}`
    index += 1
  }
  emitter.used.add(name)
  return name
}

function typeName(shape: Shape, hint: string, emitter: Emitter): string {
  switch (shape.kind) {
    case "primitive":
      return shape.name
    case "null":
      return "null"
    case "array": {
      const item = typeName(shape.item, singular(pascal(hint)), emitter)
      return item.includes(" ") ? `(${item})[]` : `${item}[]`
    }
    case "union":
      return shape.options.map((option) => typeName(option, hint, emitter)).join(" | ")
    case "object": {
      const key = signature(shape)
      const existing = emitter.names.get(key)
      if (existing) return existing

      const name = uniqueName(pascal(hint), emitter)
      emitter.names.set(key, name)
      const body = shape.fields
        .map((field) => `  ${propertyKey(field.key)}${field.optional ? "?" : ""}: ${typeName(field.type, pascal(field.key), emitter)}`)
        .join("\n")
      emitter.interfaces.push(`export interface ${name} {\n${body}\n}`)
      return name
    }
  }
}

export function jsonToTs(input: string, rootName = "Root"): { ok: true; output: string } | { ok: false; error: string } {
  if (!input.trim()) return { ok: false, error: "Input is empty" }
  let value: unknown
  try {
    value = JSON.parse(input)
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) }
  }

  const shape = infer(value)
  const root = pascal(rootName)
  if (shape.kind === "primitive" || shape.kind === "null") {
    return { ok: true, output: `export type ${root} = ${typeName(shape, rootName, { interfaces: [], names: new Map(), used: new Set() })}` }
  }

  const emitter: Emitter = { interfaces: [], names: new Map(), used: new Set() }
  const type = typeName(shape, root, emitter)
  const alias = type === root ? "" : `export type ${root} = ${type}\n\n`
  return { ok: true, output: `${emitter.interfaces.join("\n\n")}\n\n${alias}`.trim() }
}
