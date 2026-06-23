// Type partagé entre les server actions et les composants client.
// (Un fichier "use server" ne peut exporter que des fonctions async,
//  donc le type vit ici.)
export type ActionResult = { error: string } | null;
