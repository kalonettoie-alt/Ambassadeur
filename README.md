# Ambassadeurs — suivi des ventes

Petite application web pour suivre les ventes du programme d'ambassadeurs (affiliés) :
saisie rapide des ventes, affiliés, tableau de bord, paiements des commissions, réglages.

- **Next.js** (le site) + **Supabase** (la base de données et la connexion), hébergé sur **Vercel**.
- Tout est gratuit, sans publicité ni suivi.
- Seuls les membres de l'équipe (3 personnes) peuvent se connecter et voir les données.

---

## Mise en place de Supabase (à faire une seule fois, ~15 minutes)

### 1. Créer le projet
1. Allez sur <https://supabase.com>, créez un compte gratuit (« Start your project »).
2. Cliquez sur **New project**. Nom : `ambassadeurs`. Choisissez un mot de passe
   (notez-le quelque part, il ne servira presque jamais). Région : **West EU (Paris)** ou
   **Frankfurt**. Cliquez sur **Create new project** et patientez 1 à 2 minutes.

### 2. Créer les tables et la sécurité
1. Dans le menu de gauche : **SQL Editor** → **New query**.
2. Ouvrez le fichier [`supabase/schema.sql`](supabase/schema.sql), copiez **tout** son contenu
   et collez-le dans l'éditeur.
3. **Tout en bas**, remplacez les 3 adresses `moi@exemple.com`, `associe1@exemple.com`,
   `associe2@exemple.com` par les vraies adresses e-mail (en minuscules) et les prénoms.
4. Cliquez sur **Run**. Le message « Success. No rows returned » signifie que c'est bon.

> Pour ajouter ou corriger une adresse plus tard, relancez simplement le script en entier
> avec la bonne liste : il ne supprime aucune donnée.

### 3. Fermer les inscriptions publiques
**Authentication** → **Sign In / Providers** (ou **Providers**) :
- Laissez **Email** activé.
- Désactivez **Allow new users to sign up** (« Autoriser les nouvelles inscriptions »). Enregistrez.

### 4. Inviter les 3 personnes
**Authentication** → **Users** → **Add user** → **Send invitation**, pour chacune des
3 adresses (la vôtre comprise). Chaque personne reçoit un e-mail d'invitation ; elle pourra
ensuite se connecter normalement.

### 5. Personnaliser l'e-mail de connexion
**Authentication** → **Emails** (ou **Email Templates**) → onglet **Magic Link**.

Sujet : `Votre connexion Ambassadeurs`

Contenu (remplacez tout) :
```html
<h2>Connexion à Ambassadeurs</h2>
<p><a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email">Cliquez ici pour vous connecter</a></p>
<p>Ou tapez ce code dans l'application : <strong>{{ .Token }}</strong></p>
<p>Si vous n'avez rien demandé, ignorez cet e-mail.</p>
```
Le **code à 6 chiffres** est pratique quand l'app est installée sur l'écran d'accueil
du téléphone : on tape le code au lieu de cliquer le lien.

### 6. Adresse du site
**Authentication** → **URL Configuration** → **Site URL** : l'adresse de l'app sur Vercel
(nous la remplirons à l'étape de mise en ligne).

### 7. Récupérer les clés
**Project Settings** (roue dentée) → **API** / **API Keys** : notez
- **Project URL** (ressemble à `https://abcdxyz.supabase.co`)
- la clé **anon public** ou **publishable** (commence par `eyJ…` ou `sb_publishable_…`).

Ces deux valeurs ne sont pas secrètes à elles seules : sans connexion, la sécurité de la
base (Row Level Security) ne laisse rien voir. **Ne communiquez jamais la clé `service_role`
ou `secret`.**

---

## Sécurité, en bref
- **Row Level Security** est activée sur toutes les tables.
- Un visiteur non connecté ne peut rien lire ni écrire.
- Une personne connectée mais absente de la liste `team_members` ne voit rien non plus.
- Les téléphones des clients ne sont donc jamais visibles sans connexion.

## Pour les développeurs
```bash
cp .env.example .env.local   # puis remplir les 2 valeurs
npm install
npm run dev                  # http://localhost:3000
```
Structure : `src/app/(app)/…` les écrans, `src/app/login` la connexion,
`src/lib` la logique, `supabase/schema.sql` la base.
