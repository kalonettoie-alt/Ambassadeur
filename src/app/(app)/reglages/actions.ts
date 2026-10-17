"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { parseNumberInput } from "@/lib/format";
import { MAX_TIERS, validateTiers, normalizeTiers, type CommissionTier } from "@/lib/settings";

function fail(message: string): never {
  redirect(`/reglages?${new URLSearchParams({ error: message })}`);
}

function wholeNumber(formData: FormData, name: string, label: string, min = 0): number {
  const n = parseNumberInput(formData.get(name));
  if (n === null || !Number.isInteger(n) || n < min) fail(`${label} : nombre entier attendu (minimum ${min}).`);
  return n;
}

export async function saveSettings(formData: FormData) {
  const product_name = String(formData.get("product_name") ?? "").trim();
  if (!product_name) fail("Le nom du produit est obligatoire.");

  const unit_price = wholeNumber(formData, "unit_price", "Prix de vente");
  const unit_cost = wholeNumber(formData, "unit_cost", "Coût unitaire");
  const partners_count = wholeNumber(formData, "partners_count", "Nombre d'associés", 1);

  const pot_percent = parseNumberInput(formData.get("pot_percent"));
  if (pot_percent === null || pot_percent < 0 || pot_percent > 100) {
    fail("Pot commun : pourcentage entre 0 et 100 attendu.");
  }

  // Paliers : on ignore les lignes laissées vides.
  const tiers: CommissionTier[] = [];
  for (let i = 0; i < MAX_TIERS; i++) {
    const from = parseNumberInput(formData.get(`tier_from_${i}`));
    const amount = parseNumberInput(formData.get(`tier_amount_${i}`));
    if (from === null && amount === null) continue;
    if (from === null || amount === null) fail(`Palier ${i + 1} : remplissez l'unité de départ ET le montant.`);
    tiers.push({ from, amount });
  }
  const tierError = validateTiers(tiers);
  if (tierError) fail(tierError);

  // Numéro WhatsApp : chiffres uniquement, avec indicatif pays (ex. 2250700000000).
  const whatsapp_number = String(formData.get("whatsapp_number") ?? "").replace(/\D/g, "");
  if (whatsapp_number && whatsapp_number.length < 8) fail("Numéro WhatsApp trop court (indicatif pays compris).");

  const supabase = await createClient();
  const { error } = await supabase
    .from("settings")
    .update({
      product_name,
      unit_price,
      unit_cost,
      pot_percent,
      partners_count,
      commission_tiers: normalizeTiers(tiers),
      whatsapp_number,
      updated_at: new Date().toISOString(),
    })
    .eq("id", 1);
  if (error) fail(`Enregistrement impossible : ${error.message}`);

  revalidatePath("/", "layout");
  redirect("/reglages?ok=1");
}
