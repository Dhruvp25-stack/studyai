import { NextRequest, NextResponse } from 'next/server'

export const config = {
  api: {
    bodyParser: false,
  },
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Only PDF files are supported' }, { status: 400 })
    }

    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 })
    }

    const buffer = await file.arrayBuffer()
    const bytes = new Uint8Array(buffer)

    // Extract text from PDF by parsing PDF structure
    const text = extractTextFromPDF(bytes)

    if (!text || text.trim().length < 50) {
      // Return a message about the PDF being image-based
      return NextResponse.json({
        text: `[PDF uploaded: ${file.name}]\n\nThis PDF appears to be image-based or has limited extractable text. The file has been uploaded successfully. You can still use AI features with a manual description of the content.\n\nFile: ${file.name}\nSize: ${(file.size / 1024).toFixed(1)} KB`,
        fileName: file.name,
        fileSize: file.size,
        warning: 'Limited text extracted - PDF may be image-based'
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

function extractTextFromPDF(bytes: Uint8Array): string {
  try {
    // Convert to string for pattern matching
    const decoder = new TextDecoder('latin1')
    const pdfString = decoder.decode(bytes)

    const textParts: string[] = []

    // Extract text from BT...ET blocks (standard PDF text blocks)
    const btEtRegex = /BT([\s\S]*?)ET/g
    let match

    while ((match = btEtRegex.exec(pdfString)) !== null) {
      const block = match[1]

      // Extract strings from Tj and TJ operators
      // Tj: (text)Tj
      const tjRegex = /\(([^)]*)\)\s*Tj/g
      let tjMatch
      while ((tjMatch = tjRegex.exec(block)) !== null) {
        const decoded = decodePDFString(tjMatch[1])
        if (decoded.trim()) textParts.push(decoded)
      }

      // TJ: [(text) spacing (text)]TJ
      const tjArrayRegex = /\[([\s\S]*?)\]\s*TJ/g
      let tjArrayMatch
      while ((tjArrayMatch = tjArrayRegex.exec(block)) !== null) {
        const arrayContent = tjArrayMatch[1]
        const stringRegex = /\(([^)]*)\)/g
        let strMatch
        while ((strMatch = stringRegex.exec(arrayContent)) !== null) {
          const decoded = decodePDFString(strMatch[1])
          if (decoded.trim()) textParts.push(decoded)
        }
      }
    }

    // Also try to extract from stream objects for newer PDFs
    const streamRegex = /stream\r?\n([\s\S]*?)\r?\nendstream/g
    while ((match = streamRegex.exec(pdfString)) !== null) {
      const streamContent = match[1]
      // Look for readable text patterns in streams
      const readableText = streamContent.replace(/[^\x20-\x7E\n\r\t]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
      if (readableText.length > 20 && /[a-zA-Z]{3,}/.test(readableText)) {
        // Only add if it looks like real text (multiple words)
        const words = readableText.split(/\s+/).filter(w => /[a-zA-Z]{3,}/.test(w))
        if (words.length > 5) {
          textParts.push(readableText.slice(0, 1000))
        }
      }
    }

    // Combine and clean up
    let fullText = textParts.join(' ')
      .replace(/\s+/g, ' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2') // Fix concatenated words
      .trim()

    // If we got very little text, try a simpler approach
    if (fullText.length < 100) {
      // Extract all printable ASCII sequences of reasonable length
      const printableRegex = /[ -~]{10,}/g
      const printableMatches = pdfString.match(printableRegex) || []
      const filteredMatches = printableMatches
        .filter(s => /[a-zA-Z]{4,}/.test(s)) // Must have real words
        .filter(s => !s.includes('>>') && !s.includes('obj') && !s.startsWith('/'))
        .filter(s => s.split(/\s+/).filter(w => /[a-zA-Z]{3,}/.test(w)).length >= 3)

      fullText = filteredMatches.join('\n').trim()
    }

    return fullText
  } catch (e) {
    console.error('PDF parse error:', e)
    return ''
  }
}

function decodePDFString(str: string): string {
  // Handle octal escape sequences and common PDF string encodings
  return str
    .replace(/\\(\d{3})/g, (_, oct) => String.fromCharCode(parseInt(oct, 8)))
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, '\t')
    .replace(/\\\\/g, '\\')
    .replace(/\\([()])/g, '$1')
}
