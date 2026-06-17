// app/api/auth/[...nextauth]/route.ts
// Exposes the Auth.js endpoints (sign-in, callback, sign-out).

import { handlers } from "@/auth";

export const { GET, POST } = handlers;