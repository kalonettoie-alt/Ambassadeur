import { createClient } from "@/lib/supabase/server";
import { getSettings, MAX_TIERS } from "@/lib/settings";
import { formatMoney } from "@/lib/format";
import { signOut } from "@/app/login/actions";
import { saveSettings } from "./actions";

export const metadata = { title: "Réglages" };

export default async function ReglagesPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const { ok, error } = await searchParams;
  const supabase = await createClient();
  const settings = await getSettings(supabase);
  const { data: team } = await supabase.from("team_members").select("email, name").order("created_at");
  const tierRows = Array.from({ length: MAX_TIERS }, (_, i) => settings.commission_tiers[i]);

  return (
    <>
      <h1 className="mb-4 text-2xl font-bold">Réglages</h1>

      {ok && <p className="alert-ok mb-4">Réglages enregistrés.</p>}
      {error && <p className="alert-error mb-4">{error}</p>}

      <form action={saveSettings} className="flex flex-col gap-5">
        <section className="card flex flex-col gap-4">
          <h2 className="text-lg font-semibold">Produit</h2>
          <label className="field">
            <span>Nom du produit</span>
            <input name="product_name" defaultValue={settings.product_name} required className="input" />
          </label>
          <label className="field">
            <span>Prix de vente unitaire (F)</span>
            <input name="unit_price" inputMode="numeric" defaultValue={settings.unit_price} required className="input" />
          </label>
          <label className="field">
            <span>Coût unitaire livré à Abidjan (F)</span>
            <input name="unit_cost" inputMode="numeric" defaultValue={settings.unit_cost} required className="input" />
          </label>
          <p className="hint">
            Les ventes déjà enregistrées gardent le prix et le coût du jour où elles ont été saisies.
          </p>
        </section>

        <section className="card flex flex-col gap-4">
          <h2 className="text-lg font-semibold">Partage de la marge</h2>
          <label className="field">
            <span>Pot commun (%)</span>
            <input name="pot_percent" inputMode="decimal" defaultValue={settings.pot_percent} required className="input" />
          </label>
          <label className="field">
            <span>Nombre d&apos;associés qui se partagent le reste</span>
            <input name="partners_count" inputMode="numeric" defaultValue={settings.partners_count} required className="input" />
          </label>
        </section>

        <section className="card flex flex-col gap-3">
          <h2 className="text-lg font-semibold">Commissions par semaine</h2>
          <p className="hint">
            Les unités de chaque affilié sont additionnées du lundi au dimanche, puis payées par tranches.
            Laissez une ligne vide pour ne pas l&apos;utiliser.
          </p>
          {tierRows.map((tier, i) => (
            <div key={i} className="grid grid-cols-2 gap-3">
              <label className="field">
                <span className="text-sm">À partir de l&apos;unité n°</span>
                <input name={`tier_from_${i}`} inputMode="numeric" defaultValue={tier?.from ?? ""} className="input" />
              </label>
              <label className="field">
                <span className="text-sm">F par unité</span>
                <input name={`tier_amount_${i}`} inputMode="numeric" defaultValue={tier?.amount ?? ""} className="input" />
              </label>
            </div>
          ))}
          <ul className="hint list-disc pl-5">
            {settings.commission_tiers.map((t, i) => {
              const next = settings.commission_tiers[i + 1];
              const range = next ? `de la ${t.from}e à la ${next.from - 1}e unité` : `à partir de la ${t.from}e unité`;
              return <li key={i}>{range} : {formatMoney(t.amount)} par unité</li>;
            })}
          </ul>
        </section>

        <section className="card flex flex-col gap-4">
          <h2 className="text-lg font-semibold">Commande WhatsApp</h2>
          <label className="field">
            <span>Numéro WhatsApp de commande</span>
            <input
              name="whatsapp_number"
              inputMode="tel"
              placeholder="225 07 00 00 00 00"
              defaultValue={settings.whatsapp_number}
              className="input"
            />
            <span className="hint">Avec l&apos;indicatif du pays (225 pour la Côte d&apos;Ivoire), sans le +.</span>
          </label>
        </section>

        <button className="btn-primary">Enregistrer les réglages</button>
      </form>

      <section className="card mt-8 flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Équipe</h2>
        <ul className="text-stone-700">
          {(team ?? []).map((m) => (
            <li key={m.email}>
              {m.name ? `${m.name} — ` : ""}
              {m.email}
            </li>
          ))}
        </ul>
        <form action={signOut}>
          <button className="btn-secondary w-full">Se déconnecter</button>
        </form>
      </section>
    </>
  );
}
