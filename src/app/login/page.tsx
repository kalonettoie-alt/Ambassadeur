import { sendLoginEmail, verifyLoginCode } from "./actions";

export const metadata = { title: "Connexion" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; sent?: string; error?: string }>;
}) {
  const { email = "", sent, error } = await searchParams;

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-6 p-4">
      <h1 className="text-center text-2xl font-bold">Ambassadeurs</h1>

      {error && <p className="alert-error">{error}</p>}

      {!sent ? (
        <form action={sendLoginEmail} className="flex flex-col gap-4">
          <label className="field">
            <span>Votre adresse e-mail</span>
            <input name="email" type="email" required autoComplete="email" defaultValue={email} className="input" />
          </label>
          <button className="btn-primary">Recevoir mon lien de connexion</button>
        </form>
      ) : (
        <>
          <p className="alert-ok">
            E-mail envoyé à <strong>{email}</strong>. Cliquez sur le lien, ou tapez ci-dessous le code à 6 chiffres.
          </p>
          <form action={verifyLoginCode} className="flex flex-col gap-4">
            <input type="hidden" name="email" value={email} />
            <label className="field">
              <span>Code reçu par e-mail</span>
              <input
                name="code"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9 ]*"
                required
                className="input text-center text-2xl tracking-widest"
              />
            </label>
            <button className="btn-primary">Se connecter</button>
          </form>
          <a href="/login" className="text-center text-sm underline">
            Changer d&apos;adresse ou renvoyer l&apos;e-mail
          </a>
        </>
      )}
    </main>
  );
}
