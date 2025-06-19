import * as pdfjsLib from 'pdfjs-dist';

// Set up the worker for PDF.js
if (typeof window !== 'undefined') {
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.min.mjs',
      import.meta.url
    ).toString();
  } catch (error) {
    // Fallback for environments where import.meta.url might not work
    pdfjsLib.GlobalWorkerOptions.workerSrc = '/node_modules/pdfjs-dist/build/pdf.worker.min.mjs';
  }
}

export interface PDFExtractionResult {
  text: string;
  pageCount: number;
  error?: string;
}

export async function extractTextFromPDF(file: File): Promise<PDFExtractionResult> {
  try {
    // Convert file to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    
    // Load the PDF document
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    
    const pageCount = pdf.numPages;
    let fullText = '';
    
    // Extract text from each page
    for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
      try {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        
        // Combine text items into a single string
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        
        fullText += `--- Page ${pageNum} ---\n${pageText}\n\n`;
      } catch (pageError) {
        console.warn(`Error extracting text from page ${pageNum}:`, pageError);
        fullText += `--- Page ${pageNum} ---\n[Error extracting text from this page]\n\n`;
      }
    }
    
    return {
      text: fullText.trim(),
      pageCount,
    };
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    return {
      text: '',
      pageCount: 0,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

export async function generatePDFPreview(file: File): Promise<string | null> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    
    // Get the first page for preview
    const page = await pdf.getPage(1);
    const viewport = page.getViewport({ scale: 0.5 });
    
    // Create canvas element
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    if (!context) {
      throw new Error('Could not get canvas context');
    }
    
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    
    // Render page to canvas
    const renderContext = {
      canvasContext: context,
      viewport: viewport,
    };
    
    await page.render(renderContext).promise;
    
    // Convert canvas to data URL
    return canvas.toDataURL('image/png');
  } catch (error) {
    console.error('Error generating PDF preview:', error);
    return null;
  }
}

export function formatPDFInfo(result: PDFExtractionResult): string {
  if (result.error) {
    return `Error: ${result.error}`;
  }
  
  const wordCount = result.text.split(/\s+/).filter(word => word.length > 0).length;
  const charCount = result.text.length;
  
  return `${result.pageCount} page${result.pageCount !== 1 ? 's' : ''}, ${wordCount} words, ${charCount} characters`;
}