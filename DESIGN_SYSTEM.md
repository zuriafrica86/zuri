# ZURI — Design System

> Source unique de vérité pour l'interface. Objectif : une app **minimaliste, premium, chaleureuse, élégante, respirante**, où **la photo est l'élément principal** et où le design s'efface au profit du contenu. Inspirations : Airbnb (réservation, cartes), Apple (finesse, hiérarchie), Linear (cohérence des composants), Instagram (portfolios), Pinterest (exploration).

## 1. Principes directeurs

1. **Le contenu d'abord.** Les photos des réalisations sont les héros. L'UI est un cadre discret.
2. **Moins, mais mieux.** Chaque écran retire le superflu. On augmente l'espace, on réduit le bruit.
3. **Un seul système.** Tous les composants partagent les mêmes tokens (rayons, ombres, espacements). Si deux composants font la même chose, on les fusionne.
4. **Chaleureux et fiable.** Tons cacao/rose poudré, ombres chaudes, jamais de noir pur ni d'ombre dure.
5. **Mobile-first et accessible.** Focus visible, contrastes suffisants, `prefers-reduced-motion` respecté, cibles tactiles ≥ 44px.

## 2. Couleurs (identité — INCHANGÉE)

| Token | Hex | Usage |
|---|---|---|
| `cacao` | #2A1A12 | Texte principal, surfaces sombres, CTA primaire |
| `or` | #E2B0A0 | Accent, CTA secondaire, badges |
| `or-clair` | #EDCBC0 | Hover de l'accent, aplats doux |
| `rose` | #F3DAD0 | Fonds doux, états hover, sélection |
| `sable` | #EBD9CF | Bordures discrètes |
| `ivoire` | #F7F0E6 | Aplats chauds ponctuels (legacy) |
| blanc | #FFFFFF | **Fond principal** |

**Texte sur blanc :** titres `cacao`, corps `cacao/70`, secondaire `cacao/50`, placeholder `cacao/30`.
**Statuts :** succès vert-700, attente `or`, erreur rouge-700 (sobre).

## 3. Espacement — grille 4px

`4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 96 · 144`

- **Rythme des sections** (marketing) : `py-28`→`py-36` (112–144px).
- **Padding cartes** : 20–24px.
- **Gouttières de grille** : 16–24px.
- **Espace entre champs de formulaire** : 16–20px.
- **Container** : dashboard 1024px, pages larges 1280px, admin 1152px, centré, marge latérale 24px.

## 4. Rayons (hiérarchie)

| Token | Valeur | Usage |
|---|---|---|
| `rounded-lg` | 12px | Petits contrôles internes, pastilles de menu |
| `rounded-xl2` | **16px** | **Standard** : cartes, boutons, champs |
| `rounded-3xl` | 22px | Grands blocs |
| `rounded-4xl` | 28px | Médias / panneaux héros premium |
| `rounded-full` | — | Avatars, chips, badges-pastilles |

## 5. Ombres (chaudes, en couches)

| Token | Usage |
|---|---|
| `shadow-soft` | Cartes au repos |
| `shadow-card` | Cartes interactives / survol |
| `shadow-pop` | Menus, modales, popovers, toasts |
| `shadow-focus` | Anneau de focus (or) |

Règle : **ombre douce OU bordure sable**, rarement les deux à pleine intensité.

## 6. Mouvement

- **Easing premium** : `ease-soft` = `cubic-bezier(0.22, 1, 0.36, 1)`.
- **Durées** : 150ms (micro-interactions), 250ms (standard), 400ms (entrées `animate-fade-in-up`).
- Survol : élévation `shadow-card` + `-translate-y-0.5`. Pression : `scale-[0.98]`.
- Toujours sous condition `prefers-reduced-motion`.

## 7. Typographie

- **Display** : Noto Serif — titres éditoriaux. Tracking `-0.01em`, `text-wrap: balance`. Signature : un mot en *italique doré* (`italic text-or`).
- **UI / texte** : DM Sans.

| Rôle | Taille | Poids |
|---|---|---|
| Display XL (héros) | 40–56 | 400 |
| Display L (section) | 28–36 | 400 |
| Titre M | 22–24 | 600 |
| Sous-titre | 18–20 | 600 |
| Corps | 16 | 400 |
| Petit | 14 | 400/500 |
| Légende / label | 12 | 500–600, parfois `uppercase tracking-wide` |

## 8. Standards des composants

### Boutons (unifier toutes les variantes existantes)
- **Primaire** : `bg-cacao text-ivoire`, `rounded-xl2`, h 44–48, `transition ease-soft`, hover opacité, `active:scale-[0.98]`.
- **Accent** : `bg-or text-cacao`, hover `bg-or-clair`.
- **Secondaire** : `border border-sable text-cacao`, hover `bg-rose/30`.
- **Ghost** : `text-cacao/70`, hover `bg-rose/30`.
- **Focus** : `shadow-focus`. **Disabled** : `opacity-50`.

### Cartes
- Fond blanc, `rounded-xl2`, **soit** `border border-sable` **soit** `shadow-soft`, padding 20–24.
- Hover (si cliquable) : `shadow-card` + `-translate-y-0.5`.
- **Carte photo** (Zuriste / réalisation) : image plein cadre, ratio cohérent (**4:5** portfolio, **3:2** cartes liste), titre/infos en dessous ou en superposition avec dégradé cacao.

### Champs & formulaires
- Input/Select/Textarea : h 44–48, `rounded-xl2`, `border border-sable`, focus `border-or` + `shadow-focus`, placeholder `cacao/30`.
- Label 14 `cacao/80` au-dessus. Aide/erreur 12 sous le champ. Espace 16–20 entre champs.

### Badges & puces
- **Badge statut** : pastille pleine `rounded-full`, 12px, sans icône superflue (ex. *Ambassadrice*).
- **Badge label** : `text-or` + icône fine (ex. *Vérifiée* avec coche).
- **Chip de filtre** : `rounded-full border border-sable`; actif = `bg-cacao text-ivoire`.

### Avatars
- Cercle, `rounded-full`, bordure blanche 2px sur photo. Tailles 32 / 40 / 56 / 96. Fallback : initiales sur `bg-rose text-cacao`.

### Menus & onglets
- **Menu** : `shadow-pop`, `rounded-xl2`, items `rounded-lg` hover `bg-rose/30`.
- **Onglets** : libellés `cacao/60`, actif `cacao` + soulignement `or` 2px, transition douce.

### Modales
- Overlay `bg-cacao/40 backdrop-blur-sm`, panneau blanc `rounded-4xl shadow-pop`, largeur max 480–560, padding 24–32, fermeture par bouton + clic extérieur, `animate-fade-in-up`.

### Notifications (toasts) & emails
- Toast : `shadow-pop`, `rounded-xl2`, accent gauche selon le type. Emails : gabarit existant (déjà cohérent), accent `or`, vouvoiement pour la sécurité.

### Recherche (Pinterest / Airbnb)
- Barre `rounded-full`, ombre `soft`, icône loupe. Filtres en **chips** horizontales scrollables. Résultats en **grille de cartes photo** (masonry ou colonnes régulières), image en hero.

### Réservation (Airbnb)
- Récap clair : photo, prestation, prix unique, date/heure. CTA primaire plein largeur sur mobile. Créneaux en chips. États (en attente / confirmé / annulé) en badges-pastilles cohérents.

### Portefeuille Zuri (Crédit)
- Carte « solde » mise en avant (chiffre large display), historique en liste aérée, actions en boutons accent. Hiérarchie : solde > actions > historique.

## 9. Plan de migration (écran par écran)

Chaque écran, dans cet ordre, sera repris en suivant ce système — un déploiement testable à la fois :
1. **Recherche / exploration** (vitrine, Pinterest/Airbnb).
2. **Profil public Zuriste** (magazine + réservation).
3. **Réservation (RDV)**.
4. **Dashboard Zuriste** (accueil, services, agenda, portefeuille).
5. **Dashboard cliente** (mes RDV, favoris).
6. **Auth** (connexion / inscription).
7. **Admin**.

Pour chaque écran : audit → hiérarchie → réorganisation → espacements → cartes → boutons → icônes → animations → mobile → accessibilité.
