# 🃏 Poker Planning

Application d'estimation collaborative (planning poker) pour équipe agile.
Front **Next.js**, backend temps réel **Supabase cloud**. Les votes se
synchronisent en direct entre tous les participants d'une même salle.

## Fonctionnalités

- Salles partagées par lien (`/room/sprint-42`)
- Vote masqué puis révélation, moyenne et détection de consensus
- Synchronisation temps réel via Supabase Realtime
- Trois jeux de cartes (Fibonacci, suite modifiée, T-shirt)

---

## 1. Récupérer le code sur GitHub

Crée un dépôt vide sur GitHub, puis depuis ce dossier :

```bash
git init
git add .
git commit -m "Poker planning initial"
git branch -M main
git remote add origin https://github.com/TON-COMPTE/poker-planning.git
git push -u origin main
```

## 2. Créer le projet Supabase

1. Va sur https://supabase.com → **New project** (le plan gratuit suffit).
2. Une fois le projet prêt, ouvre **SQL Editor**, colle le contenu de
   [`supabase/schema.sql`](supabase/schema.sql) et clique **Run**.
   Cela crée les tables `rooms` et `votes`, les règles de sécurité (RLS) et
   active la diffusion temps réel.
3. Va dans **Settings → API** et note :
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 3. Lancer en local

```bash
cp .env.example .env.local      # puis renseigne tes 2 valeurs Supabase
npm install
npm run dev
```

Ouvre http://localhost:3000. Teste le temps réel en ouvrant la même salle
dans deux onglets.

## 4. Déployer sur Railway

> **Note :** Supabase est le *backend* (données + temps réel) — il n'héberge
> pas le front. Railway héberge l'appli Next.js, qui parle à Supabase.

1. Va sur https://railway.app → **New Project** → **Deploy from GitHub repo**,
   et choisis `tdeker/planning-poker`.
2. Railway détecte Next.js via Nixpacks et lit `railway.json` pour le build
   (`npm run build`) et le démarrage (`npm run start`).
3. Dans l'onglet **Variables** du service, ajoute :
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

   (les mêmes valeurs que ton `.env.local`.)
4. Dans **Settings → Networking**, clique **Generate Domain** pour obtenir une
   URL publique. Railway injecte automatiquement la variable `PORT` ; le
   serveur Next l'écoute déjà, rien à configurer.
5. Chaque `git push` sur `main` redéclenche un déploiement.

Le projet est configuré en mode **`output: "standalone"`** (voir
`next.config.js`) : le build produit un serveur Node autonome dans
`.next/standalone`, démarré par `npm run start`. C'est le mode recommandé pour
un hébergeur de conteneurs comme Railway.

### Alternatives

Le code reste standard, donc il tourne aussi sur **Render** (service web Node,
même build/start) ou, pour du statique + serverless, sur **Vercel**, **Netlify**
ou **Cloudflare Pages** (ajoute les mêmes variables d'environnement).

---

## Sécurité

Les règles RLS de `schema.sql` sont **ouvertes** (lecture/écriture pour tous)
pour que la démo fonctionne sans authentification. Pour un usage interne
sérieux, ajoute Supabase Auth et restreins les policies, par exemple :

```sql
create policy "votes authenticated" on public.votes
  for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');
```

## Coûts

Sur le plan gratuit Supabase, le projet est mis en pause après 7 jours sans
activité (les données ne sont pas perdues, il faut juste le réveiller depuis
le dashboard). Le volume d'un poker planning reste très en dessous de toutes
les limites du tier gratuit.
