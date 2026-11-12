import { hasGoogleSession } from "./google-only.mjs";
import { hasSharedSession } from "./shared-account.mjs";

export function hasMemberSession(user, claims) {
  return hasGoogleSession(user, claims) || hasSharedSession(user, claims);
}
