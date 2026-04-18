import { type IRouter } from "express";
import { register as registerTenants } from "./tenants.js";
import { register as registerScim } from "./scim.js";
import { register as registerPowerbi } from "./powerbi.js";
import { register as registerIdentity } from "./identity.js";

export function register(router: IRouter): void {
  registerTenants(router);
  registerScim(router);
  registerPowerbi(router);
  registerIdentity(router);
}
