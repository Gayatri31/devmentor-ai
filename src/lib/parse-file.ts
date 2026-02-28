const pdfParse = require("pdf-parse");
import mammoth from "mammoth";

export async function parseFile(buffer: Buffer, mimeType: string): Promise<string>{
    // PDF conversion
    if(mimeType == "application/pdf"){
        const data = await pdfParse(buffer);
        return data.text;
    }
    // DOCX conversion
    if(mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"){
        const result = await mammoth.extractRawText({buffer});
        return result.value; 
    }
    // Unsupported file type
    throw new Error("Unsupported file type. Please upload PDF or DOCX only.");
}