
export interface ExcelRow {
  "Party Name": string;
  "Invoice No.": string;
  "Invoice Date": string;
  "Invoice QTY.": string;
  "Invoice Value": string;
  "Currency": string;
  "B/E No.": string;
  "B/E Date": string;
  "Conversion Rate": string;
  "Assessable Value": string;
  "BCD (Amount)": string;
  "IGST (A)": string;
  "Total Payment": string;
  [key: string]: string;
}

export type AuditStatus = 'Match' | 'Mismatch' | 'Missing' | 'Match (Rounded)';

export interface AuditFieldResult {
  fieldName: string;
  excelValue: string;
  pdfValue: string;
  status: AuditStatus;
  comment?: string;
}

export interface AuditResult {
  invoiceNo: string;
  partyName: string;
  fields: AuditFieldResult[];
  summary: string;
  documentMatched: string;
}

export interface FileData {
  name: string;
  type: string;
  base64: string;
}
