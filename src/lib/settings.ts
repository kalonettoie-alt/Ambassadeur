import type { SupabaseClient } from "@supabase/supabase-js";

/** Un palier : à partir de la `from`-ième unité de la semaine, `amount` F par unité. */
export type CommissionTier = { from: number; amount: number };

export type Settings = {
  product_name: string;
  unit_price: number;
  unit_cost: number;
  pot_percent: number;
  partners_count: number;
  commission_tiers: CommissionTier[];
  whatsapp_number: string;
};

export const DEFAULT_SETTINGS: Settings = {
  product_name: "Brume parfumée",
  unit_price: 13000,
  unit_cost: 4000,
  pot_percent: 30,
  partners_count: 2,
  commission_tiers: [
    { from: 1, amount: 2500 },
    { from: 6, amount: 3000 },
    { from: 11, amount: 3500 },
  ],
  whatsapp_number: "",
};

export async function getSettings(supabase: SupabaseClient): Promise<Settings> {
  const { data, error } = await supabase
    .from("settings")
    .select("product_name, unit_price, unit_cost, pot_percent, partners_count, commission_tiers, whatsapp_number")
    .eq("id", 1)
    .maybeSingle();
  if (error) throw new Error(`Impossible de lire les réglages : ${error.message}`);
  if (!data) return DEFAULT_SETTINGS;
  return {
    ...data,
    pot_percent: Number(data.pot_percent),
    commission_tiers: normalizeTiers(data.commission_tiers as CommissionTier[]),
  };
}

/** Trie les paliers par unité de départ. */
export function normalizeTiers(tiers: CommissionTier[]): CommissionTier[] {
  return [...tiers]
    .map((t) => ({ from: Number(t.from), amount: Number(t.amount) }))
    .sort((a, b) => a.from - b.from);
}

/** Vérifie les paliers ; renvoie un message d'erreur en français, ou null si tout va bien. */
export function validateTiers(tiers: CommissionTier[]): string | null {
  if (tiers.length === 0) return "Il faut au moins un palier de commission.";
  const sorted = normalizeTiers(tiers);
  if (sorted[0].from !== 1) return "Le premier palier doit commencer à la 1re unité.";
  for (let i = 0; i < sorted.length; i++) {
    const t = sorted[i];
    if (!Number.isInteger(t.from) || t.from < 1) return "Les unités de départ doivent être des nombres entiers positifs.";
    if (!Number.isInteger(t.amount) || t.amount < 0) return "Les montants de commission doivent être des nombres entiers positifs.";
    if (i > 0 && t.from === sorted[i - 1].from) return `Deux paliers commencent à la même unité (${t.from}).`;
  }
  return null;
}

/** Nombre de lignes de paliers proposées dans l'écran Réglages. */
export const MAX_TIERS = 5;
