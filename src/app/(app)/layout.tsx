import BottomNav from "@/components/BottomNav";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/login/actions";

// Toutes les pages de l'app : réservées aux membres de l'équipe.
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: isMember } = await supabase.rpc("is_team_member");

  if (!isMember) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-4 p-4 text-center">
        <p className="alert-error">
          Votre adresse n&apos;est pas dans la liste de l&apos;équipe. Demandez à l&apos;administrateur de vous ajouter.
        </p>
        <form action={signOut}>
          <button className="btn-secondary w-full">Se déconnecter</button>
        </form>
      </main>
    );
  }

  return (
    <>
      <main className="mx-auto max-w-2xl p-4 pb-24">{children}</main>
      <BottomNav />
    </>
  );
}
