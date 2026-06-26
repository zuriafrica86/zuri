# Emails de confirmation (gérés par Supabase, pas par le code)

Ces deux modèles ne sont PAS envoyés par l'application : ils sont envoyés par
Supabase lui-même (inscription, mot de passe oublié). Ils se modifient donc
dans le tableau de bord Supabase, pas dans le code.

## Où les coller

1. Ouvre **Supabase** → ton projet → **Authentication** → **Emails**
   (onglet « Templates »).
2. **Confirm signup** → colle le contenu de `confirmation.html`.
3. **Reset password** (facultatif) → colle le contenu de `reset-password.html`.
4. Enregistre. Tu peux laisser le **Subject** par défaut ou mettre par exemple
   « Confirme ton inscription sur Zuri ».

Le bouton utilise la variable Supabase `{{ .ConfirmationURL }}` : ne la modifie
pas, c'est elle qui contient le lien de validation.

Le logo pointe vers `https://zuriafrica.app/logo-zuri.png` (image en ligne) :
il s'affichera tant que le site est en ligne.
