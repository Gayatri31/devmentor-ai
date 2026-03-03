import PDFParser from "pdf2json";
import mammoth from "mammoth";

export async function parseFile(
  buffer: Buffer,
  mimeType: string
): Promise<string> {

  // PDF conversion
  if (mimeType === "application/pdf") {
    return new Promise((resolve, reject) => {
      const pdfParser = new (PDFParser as any)(null, 1);

      pdfParser.on("pdfParser_dataError", (err: any) => {
        reject(new Error("Failed to parse PDF: " + err.parserError));
      });

      pdfParser.on("pdfParser_dataReady", (pdfData: any) => {
        try {
          const text = pdfData.Pages.map((page: any) => {
            return page.Texts.map((textItem: any) => {
              // Each text item has R array
              // Each R item has T which is the actual text
              return textItem.R.map((r: any) => {
                try {
                  // Try decoding — some PDFs URL-encode text
                  return decodeURIComponent(r.T);
                } catch {
                  // If decode fails — use raw text as is
                  return r.T;
                }
              }).join("");
            }).join(" ");
          }).join("\n\n");

          // Clean up extra whitespace
          const cleanText = text
            .replace(/\s+/g, " ")
            .replace(/\n\s+\n/g, "\n\n")
            .trim();

          resolve(cleanText);
        } catch (e) {
          reject(new Error("Failed to extract text from PDF"));
        }
      });

      pdfParser.parseBuffer(buffer);
    });
  }

  // DOCX conversion
  if (
    mimeType ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  throw new Error("Unsupported file type. Please upload PDF or DOCX only.");
}