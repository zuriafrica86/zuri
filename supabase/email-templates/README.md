# Emails de confirmation (gérés par Supabase, pas par le code)

Ces deux modèles ne sont PAS envoyés par l'application : ils sont envoyés par
Supabase lui-même (inscription, mot de passe oublié). Ils se modifient donc
dans le tableau de bord Supabase, pas dans le code.

> ⚠️ **Ils viennent d'être redessinés (nouveau logo doré + bouton cacao).**
> Pense à **recoller** le contenu mis à jour dans Supabase pour que les emails
> Supabase correspondent aux autres.

## Où les coller

1. Ouvre **Supabase** → ton projet → **Authentication** → **Emails**
   (onglet « Templates »).
2. **Confirm signup** → colle le contenu de `confirmation.html`.
3. **Reset password** (facultatif) → colle le contenu de `reset-password.html`.
4. Enregistre. Tu peux laisser le **Subject** par défaut ou mettre par exemple
   « Confirme ton inscription sur Zuri ».

Le bouton utilise la variable Supabase `{{ .ConfirmationURL }}` : ne la modifie
pas, c'est elle qui contient le lien de validation.

Le logo pointe vers `https://zuriafrica.app/logo-zuri-email.png` (nouveau fichier
doré, en ligne) : un nom de fichier neuf évite que les boîtes mail réaffichent
l'ancien logo depuis leur cache.
