// Catalogue officiel ZURI — figé (modifiable par l'admin en Vague 2).
// Structure : Univers → Catégorie → Prestations. "Autre" (saisie libre)
// est ajouté par l'interface, pas listé ici.

export interface Categorie {
  nom: string;
  prestations: string[];
}
export interface Univers {
  nom: string;
  categories: Categorie[];
}

export const CATALOG: Univers[] = [
  {
    nom: "Coiffure",
    categories: [
      {
        nom: "Tresses",
        prestations: [
          "Tresses classiques",
          "Tresses avec extensions",
          "Knotless",
          "Vanilles",
          "Fulani",
        ],
      },
      {
        nom: "Crochets",
        prestations: ["Crochet braids", "Crochet curls", "Crochet locks"],
      },
      {
        nom: "Chignons plaqués",
        prestations: ["Chignon bas", "Chignon haut", "Chignon événementiel"],
      },
      {
        nom: "Pose tissage",
        prestations: ["Tissage ouvert", "Tissage fermé", "Tissage frontal"],
      },
      {
        nom: "Pose perruque",
        prestations: [
          "Pose lace frontal",
          "Pose closure",
          "Installation + customisation",
        ],
      },
      {
        nom: "Bouclettes de cheveux",
        prestations: [
          "Boucles naturelles",
          "Mise en forme boucles",
          "Définition de boucles",
        ],
      },
    ],
  },
  {
    nom: "Onglerie",
    categories: [
      {
        nom: "Pose gel avec capsules",
        prestations: ["Extensions capsules + gel", "French capsules gel"],
      },
      {
        nom: "Pose gel sans capsules",
        prestations: ["Gainage gel naturel", "Renforcement gel"],
      },
      {
        nom: "Semi-permanent / permanent avec capsules",
        prestations: ["Extensions + vernis semi-permanent", "Pose complète renforcée"],
      },
      {
        nom: "Semi-permanent / permanent sans capsules",
        prestations: ["Vernis semi-permanent mains", "Vernis semi-permanent pieds"],
      },
      {
        nom: "Vernis classique",
        prestations: ["Manucure classique", "Pédicure classique"],
      },
    ],
  },
  {
    nom: "Regard",
    categories: [
      {
        nom: "Extensions de cils",
        prestations: ["Cil à cil", "Volume russe", "Hybride"],
      },
      {
        nom: "Clusters Lashes (semi-extensions)",
        prestations: ["Pose clusters classique", "Pose clusters événementiel"],
      },
      {
        nom: "Rehaussement de cils",
        prestations: ["Lash lift", "Rehaussement + teinture"],
      },
      {
        nom: "Brow lift / Brow lamination",
        prestations: ["Brow lift simple", "Brow lamination + fixation"],
      },
      {
        nom: "Microblading",
        prestations: ["Microblading sourcils", "Retouche microblading"],
      },
      {
        nom: "Microshading",
        prestations: ["Shading complet", "Combo microblading + microshading"],
      },
    ],
  },
  {
    nom: "Maquillage",
    categories: [
      {
        nom: "Mariage",
        prestations: ["Mariée complète", "Invitée mariage"],
      },
      {
        nom: "Soirée",
        prestations: ["Maquillage glamour", "Maquillage intense"],
      },
      {
        nom: "Shooting",
        prestations: ["Shooting photo studio", "Shooting mode"],
      },
      {
        nom: "Anniversaire",
        prestations: ["Make-up festif"],
      },
      {
        nom: "Cérémonie de diplôme",
        prestations: ["Maquillage graduation"],
      },
      {
        nom: "Maquillage jour",
        prestations: ["Nude naturel", "Maquillage léger quotidien"],
      },
    ],
  },
];

export const AUTRE = "Autre";

export function universList(): string[] {
  return CATALOG.map((u) => u.nom);
}
export function categoriesOf(univers: string): Categorie[] {
  return CATALOG.find((u) => u.nom === univers)?.categories ?? [];
}
export function prestationsOf(univers: string, categorie: string): string[] {
  const base =
    categoriesOf(univers).find((c) => c.nom === categorie)?.prestations ?? [];
  return base.length ? [...base, AUTRE] : [];
}
