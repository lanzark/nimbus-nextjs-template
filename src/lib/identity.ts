export type NimbusIdentity = {
  userId: string;
  email: string;
  orgId: string;
  role: string;
  appId: string;
  sessionId: string;
};

const DEV_IDENTITY: NimbusIdentity = {
  userId: "dev-user",
  email: "dev@lucha.local",
  orgId: "dev-org",
  role: "user",
  appId: "dev-app",
  sessionId: "dev-session",
};

function header(headers: Headers, name: string): string {
  return headers.get(name) ?? "";
}

/** Read Nimbus proxy identity from a Request. Falls back to a fixed dev identity locally. */
export function identityFromRequest(req: Request): NimbusIdentity {
  return identityFromHeaders(req.headers);
}

export function identityFromHeaders(headers: Headers): NimbusIdentity {
  const userId = header(headers, "x-nimbus-user-id");
  const email = header(headers, "x-nimbus-email");
  const orgId = header(headers, "x-nimbus-org-id");
  const role = header(headers, "x-nimbus-role");
  const appId = header(headers, "x-nimbus-app-id");
  const sessionId = header(headers, "x-nimbus-session-id");

  if (!userId && !email) {
    if (process.env.NODE_ENV !== "production") {
      return DEV_IDENTITY;
    }
    return {
      userId: "",
      email: "",
      orgId: "",
      role: "",
      appId: "",
      sessionId: "",
    };
  }

  return { userId, email, orgId, role, appId, sessionId };
}

/** For Server Components that only have next/headers. */
export async function identityFromNextHeaders(): Promise<NimbusIdentity> {
  const { headers } = await import("next/headers");
  const h = await headers();
  const fake = new Headers();
  for (const name of [
    "x-nimbus-user-id",
    "x-nimbus-email",
    "x-nimbus-org-id",
    "x-nimbus-role",
    "x-nimbus-app-id",
    "x-nimbus-session-id",
  ]) {
    const v = h.get(name);
    if (v) fake.set(name, v);
  }
  return identityFromHeaders(fake);
}
