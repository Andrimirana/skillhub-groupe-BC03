// Message encourageant selon la progression (0 à 100)
export function messageProgression(progression, modulesRestants = null) {
  const valeur = Number(progression) || 0;

  if (valeur >= 100) return "Bravo, formation terminée !";
  if (valeur >= 75) return "Dernière ligne droite, vous y êtes presque.";
  if (valeur >= 40) {
    return modulesRestants
      ? `Beau rythme : plus que ${modulesRestants} module${modulesRestants > 1 ? "s" : ""}.`
      : "Beau rythme, continuez ainsi.";
  }
  if (valeur > 0) return "Bon départ, chaque leçon compte.";
  return "Prêt à commencer ? La première leçon vous attend.";
}

// Nombre de lecons d'un module (stockees en JSON dans son contenu)
function nombreLecons(module) {
  try {
    const contenu = typeof module?.contenu === "string" ? JSON.parse(module.contenu) : module?.contenu;
    return Array.isArray(contenu?.lessons) && contenu.lessons.length > 0 ? contenu.lessons.length : 1;
  } catch {
    return 1;
  }
}

// Un module est termine quand toutes ses lecons sont marquees comme terminees
export function moduleEstTermine(module, elementsTermines = []) {
  const cle = String(module?.id ?? module?.titre ?? "");
  const termines = elementsTermines.map(String);

  if (termines.includes(cle)) return true;

  const leconsTerminees = termines.filter((element) => element.startsWith(`${cle}:lesson:`)).length;
  return leconsTerminees >= nombreLecons(module);
}
