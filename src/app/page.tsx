// app/page.tsx
//
// Replaces the default page created by create-next-app.

import { RegistrationForm } from "@/components/registration-form";

export default function Page() {
  return (
    <main style={{ maxWidth: 480, margin: "2rem auto", padding: "0 1rem" }}>
      <h1>Pendaftaran Marching Band UGM</h1>
      <RegistrationForm />
    </main>
  );
}