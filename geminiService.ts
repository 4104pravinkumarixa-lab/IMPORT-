
import { GoogleGenAI, Type } from "@google/genai";
import { ExcelRow, AuditResult, FileData, AuditStatus } from "../types";

export async function runAudit(
  excelData: ExcelRow[],
  documents: FileData[],
  onResult: (result: AuditResult) => void
): Promise<void> {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key is missing. Please ensure process.env.API_KEY is configured.");
  }

  const ai = new GoogleGenAI({ apiKey });

  // Matching Logic: For each row in Excel, find potential documents
  for (const row of excelData) {
    // Ensure we treat the identifiers as strings
    const rawInvoiceNo = row["Invoice No."] || row["B/E No."];
    if (rawInvoiceNo === undefined || rawInvoiceNo === null || rawInvoiceNo === '') continue;
    
    const invoiceNo = String(rawInvoiceNo);
    const invoiceNoLower = invoiceNo.toLowerCase().trim();

    // Find documents whose names contain the invoice number (strict heuristic)
    const relevantDocs = documents.filter(doc => {
      const docNameLower = doc.name.toLowerCase();
      // Only match if the invoice number is a distinct part of the filename
      // We look for boundaries around the invoice number to avoid partial number matches
      const nameParts = docNameLower.split(/[^a-zA-Z0-9]/);
      return nameParts.includes(invoiceNoLower) || docNameLower.includes(invoiceNoLower);
    });

    if (relevantDocs.length === 0) {
      // If no filename match, we report this as "Missing" so the user knows why it wasn't audited
      onResult({
        invoiceNo,
        partyName: String(row["Party Name"] || "N/A"),
        documentMatched: "NO MATCHING FILE FOUND",
        summary: `Warning: No uploaded document filename matched the identifier '${invoiceNo}'. Please ensure your PDF filename contains the Invoice/BE number.`,
        fields: Object.keys(row).map(key => ({
          fieldName: key,
          excelValue: String(row[key]),
          pdfValue: "N/A",
          status: "Missing" as AuditStatus
        }))
      });
      continue;
    }

    // Process the most relevant document (the one whose name contains the invoice ID)
    const docToProcess = relevantDocs[0];

    try {
      const result = await processSingleAudit(ai, row, docToProcess);
      onResult(result);
    } catch (err) {
      console.error(`Error auditing invoice ${invoiceNo}:`, err);
    }
  }
}

async function processSingleAudit(
  ai: any,
  row: ExcelRow,
  doc: FileData
): Promise<AuditResult> {
  const prompt = `
    You are a professional Document Audit Assistant. Your task is to perform a detailed comparison.
    
    EXPECTED EXCEL DATA:
    ${JSON.stringify(row, null, 2)}

    MANDATORY PRE-CHECK:
    Does this document actually contain data for Party: "${row["Party Name"]}" and Invoice/BE No: "${row["Invoice No."] || row["B/E No."]}"?
    If the document belongs to a different transaction entirely, report ALL fields as "Mismatch" and explain the confusion in the summary.

    AUDIT RULES:
    1. Dates: Matches if Day, Month, Year are the same (e.g. 2025-10-05 and 05-Oct-2025 are a MATCH).
    2. Currency: Matches if it's the same currency (e.g. USD and US Dollars are a MATCH).
    3. Numbers: Check numeric equality. If rounding differs by less than 1 (e.g. 1022000.4 and 1022000), use "Match (Rounded)".
    4. Formulas: Verify that Assessable Value, BCD, and IGST components look correct based on the Invoice Value.
    5. Status Options: "Match", "Mismatch", "Missing", "Match (Rounded)".

    Identify and extract these specific fields from the PDF to compare:
    - Party Name
    - Invoice No.
    - Invoice Date
    - Invoice QTY.
    - Invoice Value
    - Currency
    - B/E No.
    - B/E Date
    - Conversion Rate
    - Assessable Value
    - BCD (Amount)
    - IGST (A)
    - Total Payment
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [
      {
        parts: [
          { inlineData: { data: doc.base64, mimeType: doc.type } },
          { text: prompt }
        ]
      }
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          invoiceNo: { type: Type.STRING },
          partyName: { type: Type.STRING },
          documentMatched: { type: Type.STRING },
          summary: { type: Type.STRING },
          fields: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                fieldName: { type: Type.STRING },
                excelValue: { type: Type.STRING },
                pdfValue: { type: Type.STRING },
                status: { type: Type.STRING, description: "Match, Mismatch, Missing, or Match (Rounded)" },
                comment: { type: Type.STRING }
              },
              required: ["fieldName", "excelValue", "pdfValue", "status"]
            }
          }
        },
        required: ["invoiceNo", "partyName", "fields", "documentMatched"]
      }
    }
  });

  const rawJson = response.text.trim();
  const parsed = JSON.parse(rawJson);

  return {
    invoiceNo: parsed.invoiceNo || String(row["Invoice No."] || row["B/E No."] || "N/A"),
    partyName: parsed.partyName || String(row["Party Name"] || "N/A"),
    documentMatched: doc.name,
    summary: parsed.summary || "",
    fields: parsed.fields as any
  };
}
