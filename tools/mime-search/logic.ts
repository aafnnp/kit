export interface MimeEntry {
  mimeType: string
  extensions: string[]
  category: string
  description: string
}

export const mimeDatabase: MimeEntry[] = [
  { mimeType: "application/json", extensions: ["json"], category: "Data", description: "JSON data" },
  { mimeType: "application/ld+json", extensions: ["jsonld"], category: "Data", description: "JSON-LD linked data" },
  { mimeType: "application/pdf", extensions: ["pdf"], category: "Document", description: "PDF document" },
  { mimeType: "application/rtf", extensions: ["rtf"], category: "Document", description: "Rich Text Format document" },
  { mimeType: "application/sql", extensions: ["sql"], category: "Data", description: "SQL statements" },
  { mimeType: "application/wasm", extensions: ["wasm"], category: "Application", description: "WebAssembly binary module" },
  { mimeType: "application/xml", extensions: ["xml"], category: "Data", description: "XML data" },
  { mimeType: "application/zip", extensions: ["zip"], category: "Archive", description: "ZIP archive" },
  { mimeType: "application/gzip", extensions: ["gz"], category: "Archive", description: "GZip compressed archive" },
  { mimeType: "application/vnd.ms-excel", extensions: ["xls"], category: "Spreadsheet", description: "Microsoft Excel workbook" },
  { mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", extensions: ["xlsx"], category: "Spreadsheet", description: "Office Open XML spreadsheet" },
  { mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", extensions: ["docx"], category: "Document", description: "Office Open XML word-processing document" },
  { mimeType: "application/vnd.openxmlformats-officedocument.presentationml.presentation", extensions: ["pptx"], category: "Presentation", description: "Office Open XML presentation" },
  { mimeType: "audio/mpeg", extensions: ["mp3"], category: "Audio", description: "MPEG audio" },
  { mimeType: "audio/ogg", extensions: ["oga", "ogg"], category: "Audio", description: "Ogg audio" },
  { mimeType: "audio/wav", extensions: ["wav"], category: "Audio", description: "Waveform audio" },
  { mimeType: "font/woff", extensions: ["woff"], category: "Font", description: "Web Open Font Format" },
  { mimeType: "font/woff2", extensions: ["woff2"], category: "Font", description: "Web Open Font Format 2" },
  { mimeType: "image/avif", extensions: ["avif"], category: "Image", description: "AV1 Image File Format" },
  { mimeType: "image/gif", extensions: ["gif"], category: "Image", description: "Graphics Interchange Format image" },
  { mimeType: "image/jpeg", extensions: ["jpg", "jpeg"], category: "Image", description: "JPEG image" },
  { mimeType: "image/png", extensions: ["png"], category: "Image", description: "Portable Network Graphics image" },
  { mimeType: "image/svg+xml", extensions: ["svg"], category: "Image", description: "Scalable Vector Graphics image" },
  { mimeType: "image/webp", extensions: ["webp"], category: "Image", description: "WebP image" },
  { mimeType: "text/calendar", extensions: ["ics"], category: "Text", description: "iCalendar calendar data" },
  { mimeType: "text/csv", extensions: ["csv"], category: "Text", description: "Comma-separated values" },
  { mimeType: "text/css", extensions: ["css"], category: "Text", description: "Cascading Style Sheets" },
  { mimeType: "text/html", extensions: ["html", "htm"], category: "Text", description: "HTML document" },
  { mimeType: "text/javascript", extensions: ["js", "mjs"], category: "Text", description: "JavaScript source" },
  { mimeType: "text/markdown", extensions: ["md", "markdown"], category: "Text", description: "Markdown document" },
  { mimeType: "text/plain", extensions: ["txt"], category: "Text", description: "Plain text" },
  { mimeType: "text/xml", extensions: ["xml"], category: "Text", description: "XML document" },
  { mimeType: "video/mp4", extensions: ["mp4"], category: "Video", description: "MP4 video" },
  { mimeType: "video/webm", extensions: ["webm"], category: "Video", description: "WebM video" },
]

export function searchMime(query: string): MimeEntry[] {
  const needle = query.trim().toLowerCase().replace(/^\./, "")
  if (!needle) return mimeDatabase
  return mimeDatabase.filter((entry) =>
    [entry.mimeType, entry.category, entry.description, ...entry.extensions]
      .some((value) => value.toLowerCase().includes(needle)),
  )
}
