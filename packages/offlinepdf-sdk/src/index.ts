export { mergePdfs } from "./merge";
export { splitPdf, type SplitOptions } from "./split";
export { rotatePdf, type RotationAngle } from "./rotate";
export { organizePages, type PageOp } from "./organize";
export { addWatermark, type WatermarkOptions } from "./watermark";
export {
  addPageNumbers,
  type PageNumberOptions,
  type PageNumberFormat,
  type PageNumberPosition,
} from "./pageNumbers";
export { flattenPdf } from "./flatten";
export { addHeaderFooter, type HeaderFooterOptions } from "./headerFooter";
export { cropPdf, type CropOptions, type CropMode, type CropFit, type CropTarget } from "./crop";
export {
  fingerprintPdf,
  generateFingerprintId,
  FINGERPRINT_ID_PATTERN,
  type FingerprintOptions,
  type FingerprintResult,
} from "./fingerprint";
