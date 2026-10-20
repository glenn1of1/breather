// PRD SUR-4: PH-XXXX-NN, Crockford base32 (no I, L, O, U), from a CSPRNG.
import "server-only";
import { randomInt } from "node:crypto";

const CROCKFORD = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

export function newClaimNumber(): string {
  const body = Array.from({ length: 4 }, () => CROCKFORD[randomInt(32)]).join("");
  return `PH-${body}-${String(randomInt(100)).padStart(2, "0")}`;
}
