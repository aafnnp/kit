import React, { useState } from 'react'
/**
 * PDF 拆分工具
 * Split PDF file
 * 允许用户上传 PDF 并按页拆分导出，纯前端实现。
 */
import { PDFDocument } from 'pdf-lib'

const SplitPDF: React.FC = () => {
  const [file, setFile] = useState<File | null>(null)
  const [pageCount, setPageCount] = useState<number>(0)

  /**
   * 读取 PDF 页数
   * Read PDF page count
   */
  const handleFile = async (f: File) => {
    const bytes = await f.arrayBuffer()
    const pdf = await PDFDocument.load(bytes)
    setPageCount(pdf.getPageCount())
    setFile(f)
  }

  /**
   * 拆分 PDF 并导出所有页面
   * Split PDF and export all pages
   */
  const handleSplit = async () => {
    if (!file) return
    const bytes = await file.arrayBuffer()
    const pdf = await PDFDocument.load(bytes)
    for (let i = 0; i < pdf.getPageCount(); i++) {
      const newPdf = await PDFDocument.create()
      const [copiedPage] = await newPdf.copyPages(pdf, [i])
      newPdf.addPage(copiedPage)
      const newBytes = await newPdf.save()
      const blob = new Blob([newBytes], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `page-${i + 1}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    }
  }

  return (
    <div className="space-y-4">
      <input
        type="file"
        accept="application/pdf"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) handleFile(e.target.files[0])
        }}
      />
      {pageCount > 0 && (
        <div>
          共 {pageCount} 页 / Total {pageCount} pages
        </div>
      )}
      <button
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        onClick={handleSplit}
        disabled={!file}
      >
        拆分并导出所有页面 / Split & Export All Pages
      </button>
    </div>
  )
}

export default SplitPDF
