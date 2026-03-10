import PDFParser from "pdf2json";
import mammoth from "mammoth";

export async function parseDocument(fileBuffer: Buffer, filename: string, mimeType: string): Promise<string> {
  try {
    const ext = filename.split(".").pop()?.toLowerCase() || "";

    if (mimeType === "application/pdf" || ext === "pdf") {
      return new Promise((resolve, reject) => {
        const pdfParser = new PDFParser(null, true);
        
        pdfParser.on("pdfParser_dataReady", () => {
          resolve((pdfParser as any).getRawTextContent());
        });
        
        pdfParser.on("pdfParser_dataError", (errData: any) => {
          reject(new Error(errData.parserError));
        });
        
        pdfParser.parseBuffer(fileBuffer);
      });
    } 
    
    if (
      mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || 
      ext === "docx"
    ) {
      const result = await mammoth.extractRawText({ buffer: fileBuffer });
      return result.value;
    }

    if (mimeType === "text/plain" || ext === "txt") {
      return fileBuffer.toString("utf-8");
    }

    throw new Error(`Unsupported file type: ${mimeType} or extension: ${ext}`);
  } catch (error) {
    console.error(`Error parsing document ${filename}:`, error);
    throw new Error(`Failed to parse document: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}
