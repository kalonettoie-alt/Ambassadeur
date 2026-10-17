"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function back(params: Record<string, string>): never {
  redirect(`/login?${new URLSearchParams(params).toString()}`);
}

/** Étape 1 : envoie l'e-mail de connexion (lien + code à 6 chiffres). */
export async function sendLoginEmail(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email.includes("@")) back({ error: "Adresse e-mail invalide." });

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    // Pas d'inscription publique : seuls les comptes déjà invités reçoivent un e-mail.
    options: { shouldCreateUser: false },
  });
  if (error) {
    const msg = /signup|not allowed|not found/i.test(error.message)
      ? "Cette adresse n'est pas autorisée. Demandez une invitation."
      : /rate|seconds/i.test(error.message)
        ? "Trop de demandes. Patientez une minute puis réessayez."
        : `Envoi impossible : ${error.message}`;
    back({ error: msg, email });
  }
  back({ sent: "1", email });
}

/** Étape 2 : vérifie le code à 6 chiffres reçu par e-mail. */
export async function verifyLoginCode(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const token = String(formData.get("code") ?? "").replace(/\D/g, "");
  if (token.length < 6) back({ sent: "1", email, error: "Le code doit contenir 6 chiffres." });

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ email, token, type: "email" });
  if (error) back({ sent: "1", email, error: "Code incorrect ou expiré. Redemandez un e-mail." });
  redirect("/");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
