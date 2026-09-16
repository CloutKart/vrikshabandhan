"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Field, inputClass } from "@/components/ui/Field";
import { browserClient } from "@/lib/supabase/browser";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const sb = browserClient();
    if (!sb) return;
    setState("sending");
    const { error } = await sb.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/admin/auth/callback` },
    });
    if (error) {
      setState("error");
      setMessage(error.message);
      return;
    }
    setState("sent");
  }

  if (state === "sent") {
    return (
      <p role="status" className="max-w-[50ch]">
        A sign-in link is on its way to {email}. Open it on this device to continue.
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="grid max-w-md gap-5">
      <Field id="email" label="E-mail address" error={state === "error" ? message : undefined}>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClass}
          aria-invalid={state === "error"}
          aria-describedby={state === "error" ? "email-error" : undefined}
        />
      </Field>
      <div>
        <Button type="submit" disabled={state === "sending"}>
          {state === "sending" ? "Sending the link" : "Send me a sign-in link"}
        </Button>
      </div>
    </form>
  );
}
