// FILE LOCATION: app/api/upload/route.ts
// This handles PDF file uploads and extracts text from them.
// It REPLACES the old upload/route.ts which was incorrectly
// containing the Supabase auth callback logic.

import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 30

export async function POST(request: NextRequest) {
  try {
    let formData: FormData
    try {
      formData = await request.formData()
    } catch {
      return NextResponse.json(
        { error: 'Failed to parse form data. Make sure you are uploading a valid PDF file.' },
        { status: 400 }
      )
    }

    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Accept by MIME type or extension (some browsers omit MIME type)
    const isPDF =
      file.type === 'application/pdf' || file.name?.toLowerCase().endsWith('.pdf')
    if (!isPDF) {
      return NextResponse.json(
        { error: 'Only PDF files are supported' },
        { status: 400 }
      )
    }

    const maxSize = 10 * 1024 * 1024 // 10 MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 10 MB.' },
        { status: 400 }
      )
    }

    const buffer = await file.arrayBuffer()
    const bytes = new Uint8Array(buffer)
    const text = extractTextFromPDF(bytes)

    if (!text || text.trim().length < 50) {
      return NextResponse.json({
        text: `[PDF uploaded: ${file.name}]\n\nThis PDF appears to be image-based or has limited extractable text. The file has been uploaded successfully. You can still use AI features — try generating a summary or chatting with the AI tutor.\n\nFile: ${file.name}\nSize: ${(file.size / 1024).toFixed(1)} KB`,
        fileName: file.name,
        fileSize: file.size,
        warning: 'Limited text extracted – PDF may be image-based',
      })
    }

    return NextResponse.json({
      text: text.trim(),
      fileName: file.name,
      fileSize: file.size,
    })
  } catch (error: unknown) {
    console.error('Upload error:', error)
    const message = error instanceof Error ? error.message : 'Upload failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// ─── PDF text extraction ──────────────────────────────────────────────────────

function extractTextFromPDF(bytes: Uint8Array): string {
  try {
    const decoder = new TextDecoder('latin1')
    const pdfString = decoder.decode(bytes)

    const textParts: string[] = []

    // Primary: BT … ET text blocks
    const btEtRegex = /BT([\s\S]*?)ET/g
    let match: RegExpExecArray | null

    while ((match = btEtRegex.exec(pdfString)) !== null) {
      const block = match[1]

      // Simple Tj strings  e.g. (Hello World) Tj
      const tjRegex = /\(([^)]*)\)\s*Tj/g
      let tjMatch: RegExpExecArray | null
      while ((tjMatch = tjRegex.exec(block)) !== null) {
        const decoded = decodePDFString(tjMatch[1])
        if (decoded.trim()) textParts.push(decoded)
      }

      // Array TJ strings  e.g. [(Hello) -200 (World)] TJ
      const tjArrayRegex = /\[([\s\S]*?)\]\s*TJ/g
      let tjArrayMatch: RegExpExecArray | null
      while ((tjArrayMatch = tjArrayRegex.exec(block)) !== null) {
        const arrayContent = tjArrayMatch[1]
        const stringRegex = /\(([^)]*)\)/g
        let strMatch: RegExpExecArray | null
        while ((strMatch = stringRegex.exec(arrayContent)) !== null) {
          const decoded = decodePDFString(strMatch[1])
          if (decoded.trim()) textParts.push(decoded)
        }
      }
    }

    let fullText = textParts
      .join(' ')
      .replace(/\s+/g, ' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .trim()

    // Fallback: printable character runs (for non-standard PDFs)
    if (fullText.length < 100) {
      const printableRegex = /[ -~]{10,}/g
      const printableMatches = pdfString.match(printableRegex) || []
      const filteredMatches = printableMatches
        .filter(s => /[a-zA-Z]{4,}/.test(s))
        .filter(s => !s.includes('>>') && !s.includes('obj') && !s.startsWith('/'))
        .filter(
          s => s.split(/\s+/).filter(w => /[a-zA-Z]{3,}/.test(w)).length >= 3
        )
      fullText = filteredMatches.join('\n').trim()
    }

    return fullText
  } catch (e) {
    console.error('PDF parse error:', e)
    return ''
  }
}

function decodePDFString(str: string): string {
  return str
    .replace(/\\(\d{3})/g, (_, oct) => String.fromCharCode(parseInt(oct, 8)))
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, '\t')
    .replace(/\\\\/g, '\\')
    .replace(/\\([()])/g, '$1')
}
