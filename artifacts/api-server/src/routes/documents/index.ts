import { type IRouter } from "express";
import { register as registerCrud } from "./crud.js";
import { register as registerSignatures } from "./signatures.js";
import { register as registerPdf } from "./pdf.js";

export function register(router: IRouter): void {
  registerCrud(router);
  registerSignatures(router);
  registerPdf(router);
}
