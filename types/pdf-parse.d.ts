declare module "pdf-parse" {
  export interface PDFParseResult {
    numpages?: number;
    numrender?: number;
    info?: Record<string, any>;
    metadata?: any;
    version?: string;
    text: string;
  }

  // Minimal signature used in our API route
  function pdfParse(data: Buffer | Uint8Array, options?: any): Promise<PDFParseResult>;
  export default pdfParse;
}
