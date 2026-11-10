import { z } from "zod";
import { LAUNCH_CONSENT_VERSION } from "@/lib/launch-interest";
import { readJsonBodyLimited, RequestBodyError } from "@/lib/request-body.mjs";
import { isSameOriginRequest } from "@/lib/same-origin.mjs";
import { createAdminClient } from "@/lib/supabase/admin";
import type { LaunchInterest } from "@/types/database";

const signupSchema = z.strictObject({
  email: z.string().trim().toLowerCase().max(254).pipe(z.email()),
  consent: z.literal(true),
  consentVersion: z.string().max(80),
});

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return new Response(null, { status: 403 });
  }

  let body: unknown;
  try {
    body = await readJsonBodyLimited(request, 1024);
  } catch (error) {
    return new Response(null, { status: error instanceof RequestBodyError ? error.status : 400 });
  }

  const parsed = signupSchema.safeParse(body);
  if (!parsed.success) return new Response(null, { status: 400 });
  if (parsed.data.consentVersion !== LAUNCH_CONSENT_VERSION) {
    return new Response(null, { status: 409 });
  }

  try {
    const signup: Pick<LaunchInterest, "email" | "consent_version"> = {
      email: parsed.data.email,
      consent_version: LAUNCH_CONSENT_VERSION,
    };
    const { error } = await createAdminClient()
      .from("launch_interests")
      .upsert(signup, { onConflict: "email", ignoreDuplicates: true })
      .abortSignal(AbortSignal.timeout(8_000));
    return new Response(null, { status: error ? 503 : 204 });
  } catch {
    return new Response(null, { status: 503 });
  }
}
