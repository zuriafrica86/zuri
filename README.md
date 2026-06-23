# ZURI — Bloc 1 : Fondation + Authentification

Web app de mise en relation clientes ↔ coiffeuses (tresses & coiffures), Gabon.
Ce bloc pose **toute la base de données** et **l'authentification**. Les écrans de
recherche, profils et prise de RDV viendront aux blocs suivants.

Stack : Next.js 15 (App Router) · Supabase (Postgres + Auth) · Tailwind · Vercel.

---

## 1. Prérequis
- Node.js 18.18+ (recommandé 20+)
- Un compte [Supabase](https://supabase.com) (gratuit)
- Un compte [Vercel](https://vercel.com) (gratuit) pour le déploiement

## 2. Créer la base Supabase
1. Crée un projet sur Supabase. Note le mot de passe de la base.
2. Va dans **SQL Editor** → **New query**.
3. Copie tout le contenu de `supabase/migrations/0001_init.sql` → **Run**.
   Ça crée les tables, la sécurité (RLS), le trigger d'inscription, la vue
   publique sans contacts et la fonction `reveal_contact`.
4. **Authentication → Providers → Email** : activé par défaut.
   - Pour tester vite sans email : **Authentication → Sign In / Up** →
     désactive temporairement « Confirm email ». (À réactiver pour la prod.)
5. **Project Settings → API** : copie `Project URL`, `anon public` et `service_role`.

## 3. Configurer le projet en local
```bash
cp .env.local.example .env.local
# colle tes valeurs Supabase dans .env.local
npm install
npm run dev
```
Ouvre http://localhost:3000

## 4. Tester l'auth
1. `/signup` → choisis « cliente » ou « coiffeuse », crée un compte.
2. Confirme par email (ou désactive la confirmation à l'étape 2.4).
3. `/login` → tu arrives sur `/dashboard`, qui affiche un message différent
   selon ton rôle. La déconnexion te ramène à `/login`.
4. Vérifie dans Supabase → **Table Editor → profiles** : une ligne a été créée
   automatiquement avec le bon rôle.

### Créer un admin
Dans Supabase → **Table Editor → profiles**, passe le champ `role` de ton
compte à `admin`. Le dashboard affichera l'espace admin.

## 5. Déployer sur Cloudflare Workers (via OpenNext)
Le build se fait dans le cloud Cloudflare (Workers Builds), connecté à GitHub.
Aucun build local requis.
1. Pousse le code sur GitHub.
2. Cloudflare Dashboard → **Workers & Pages** → **Create** → **Import a repository**
   → choisis le repo `zuri`.
3. **Build command** : `npx opennextjs-cloudflare build`
   **Deploy command** : `npx opennextjs-cloudflare deploy`
4. **Variables & Secrets** (build + runtime) :
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (en **secret**)
5. Déploie. Cloudflare buildera via OpenNext et publiera le Worker.
6. Dans Supabase → **Authentication → URL Configuration** : ajoute ton URL
   Cloudflare (et `zuri.ga` plus tard) dans **Redirect URLs**, sinon la
   confirmation email ne reviendra pas sur le bon site.

> Notes techniques : `images.unoptimized = true` car Workers n'a pas
> l'optimiseur d'images de Vercel (compression gérée à l'upload). Le runtime
> Edge n'est pas supporté par OpenNext : aucune route ne déclare
> `export const runtime = "edge"`.

---

## Notes de conception

**Téléphone.** L'auth se fait par email + mot de passe ; le téléphone est
collecté sur le profil (pour le WhatsApp et les notifs), pas comme méthode de
connexion. La connexion par SMS (OTP) demande un fournisseur SMS payant — on
pourra l'ajouter plus tard sans toucher au schéma.

**Le contact est verrouillé en base.** Le numéro d'une coiffeuse n'est jamais
dans les données publiques. Il n'est renvoyé que par `reveal_contact()`, qui
vérifie qu'un RDV `confirme` existe pour la cliente. Option A confirmée
(révélation après confirmation de la coiffeuse). Pour passer en Option B, voir
le commentaire dans `0001_init.sql`.

**Prochain bloc.** Recherche + filtres + cartes + page profil (lecture via la
vue `providers_public`), puis la prise de RDV.

## Arborescence
```
supabase/migrations/0001_init.sql   schéma + RLS + trigger + fonctions
lib/supabase/                       clients (navigateur, serveur, middleware)
middleware.ts                       refresh session + protection /dashboard
app/auth/actions.ts                 signup / login / logout (server actions)
app/auth/callback/route.ts          confirmation email
app/(auth)/                         écrans login & signup (split premium)
app/dashboard/                      espace protégé, routé par rôle
app/page.tsx                        landing minimale
components/                         logo, bouton submit, logout
```
