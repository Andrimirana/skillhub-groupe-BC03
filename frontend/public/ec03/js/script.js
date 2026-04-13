// Menu burger
var burger = document.getElementById("burger");
var liens = document.querySelector(".liens-navigation");

if (burger && liens) {
  burger.addEventListener("click", function () {
    liens.classList.toggle("active");
  });
}

// Session locale partagée avec l'app React
var utilisateurLocal = null;
try {
  utilisateurLocal = JSON.parse(
    localStorage.getItem("utilisateur_auth") || "null",
  );
} catch {
  utilisateurLocal = null;
}

var userLink = document.getElementById("userLink");
if (userLink && utilisateurLocal) {
  userLink.textContent = utilisateurLocal.nom || "Profil";
  userLink.href =
    utilisateurLocal.role === "apprenant"
      ? "/dashboard/apprenant"
      : "/dashboard/formateur";
}

var featuredFormations = document.getElementById("featuredFormations");
var API_BASE =
  window.location.hostname === "localhost"
    ? "http://127.0.0.1:8000/api"
    : `${window.location.protocol}//${window.location.hostname}:8000/api`;

function niveauAffichage(level) {
  if (level === "advanced") return "Avancé";
  if (level === "intermediaire") return "Intermédiaire";
  return "Débutant";
}

function chargerFormationsMisesEnAvant() {
  if (!featuredFormations) return;

  fetch(API_BASE + "/formations")
    .then(function (response) {
      if (!response.ok) throw new Error("Erreur API");
      return response.json();
    })
    .then(function (data) {
      featuredFormations.innerHTML = "";

      data.slice(0, 3).forEach(function (formation) {
        var carte = document.createElement("article");
        carte.className = "valeur-carte";
        carte.innerHTML =
          '<img src="assets/images/profile1.jfif" alt="" class="icon-carte" aria-hidden="true">' +
          "<h3>" +
          formation.titre +
          "</h3>" +
          '<p class="texte-carte">Niveau : ' +
          niveauAffichage(formation.level) +
          "</p>" +
          '<p class="texte-carte">Formateur : ' +
          (formation.formateur || "N/A") +
          "</p>";
        featuredFormations.appendChild(carte);
      });

      observerElements(featuredFormations.querySelectorAll(".valeur-carte"));
    })
    .catch(function () {
      featuredFormations.innerHTML =
        "<p>Impossible de charger les formations mises en avant.</p>";
    });
}

// Inscription via modale
var openBtn = document.getElementById("openModal");
var closeBtn = document.getElementById("closeModal");
var modal = document.getElementById("modal");
var overlay = document.getElementById("modalOverlay");
var lastFocusedElement = null;

if (openBtn && closeBtn && modal && overlay) {
  openBtn.addEventListener("click", ouvrirModal);
  closeBtn.addEventListener("click", fermerModal);
  overlay.addEventListener("click", fermerModal);
}

function ouvrirModal() {
  lastFocusedElement = document.activeElement;
  modal.hidden = false;
  overlay.hidden = false;
  document.body.classList.add("no-scroll");

  var firstInput = modal.querySelector("input");
  if (firstInput) {
    firstInput.focus();
  }

  document.addEventListener("keydown", piegerFocus);
  document.addEventListener("keydown", fermerAvecEchap);
}

function fermerModal() {
  modal.hidden = true;
  overlay.hidden = true;
  document.body.classList.remove("no-scroll");

  document.removeEventListener("keydown", piegerFocus);
  document.removeEventListener("keydown", fermerAvecEchap);

  if (lastFocusedElement) {
    lastFocusedElement.focus();
  }
}

function piegerFocus(e) {
  if (e.key !== "Tab") return;

  var focusables = modal.querySelectorAll(
    "button, input, [tabindex]:not([tabindex='-1'])",
  );
  var premier = focusables[0];
  var dernier = focusables[focusables.length - 1];

  if (e.shiftKey && document.activeElement === premier) {
    e.preventDefault();
    dernier.focus();
  }

  if (!e.shiftKey && document.activeElement === dernier) {
    e.preventDefault();
    premier.focus();
  }
}

function fermerAvecEchap(e) {
  if (e.key === "Escape") {
    fermerModal();
  }
}

// Soumission modal -> page d'inscription officielle
if (modal) {
  var formulaireModal = modal.querySelector("form");
  if (formulaireModal) {
    formulaireModal.addEventListener("submit", function (e) {
      e.preventDefault();
      window.location.href = "/inscription";
    });
  }
}

// Témoignages dynamiques
var temoignages = [
  {
    nom: "Nandrianina",
    photo: "assets/images/profile1.jfif",
    texte: "SkillHub m'a permis d'avancer rapidement.",
  },
  {
    nom: "Maholy",
    photo: "assets/images/profile1.jfif",
    texte: "J'ai adoré la progression module par module.",
  },
  {
    nom: "Irene",
    photo: "assets/images/profile1.jfif",
    texte: "Les ateliers sont très bien structurés.",
  },
  {
    nom: "Mathieu",
    photo: "assets/images/profile1.jfif",
    texte: "Une plateforme claire et efficace.",
  },
];

var temoignageCarte = document.getElementById("temoignageCarte");
var temoignagePoints = document.getElementById("temoignagePoints");
var pointActif = 0;
var observateurAnimation = null;

function afficherCarte() {
  if (!temoignageCarte || !temoignagePoints) return;

  temoignageCarte.innerHTML = "";
  temoignagePoints.innerHTML = "";

  for (var i = 0; i < temoignages.length; i++) {
    creerCarte(i);
    creerPoint(i);
  }
}

function creerCarte(index) {
  var data = temoignages[index];
  var carte = document.createElement("article");
  carte.className = "temoignage-carte";

  if (index === pointActif) {
    carte.classList.add("active");
  }

  carte.innerHTML =
    '<img src="' +
    data.photo +
    '" class="temoignage-profil">' +
    '<h3 class="temoignage-nom">' +
    data.nom +
    "</h3>" +
    '<p class="temoignage-texte">' +
    data.texte +
    "</p>";

  temoignageCarte.appendChild(carte);
}

function creerPoint(index) {
  var point = document.createElement("span");
  point.className = "temoignage-point";

  if (index === pointActif) {
    point.classList.add("active");
  }

  point.addEventListener("click", function () {
    pointActif = index;
    afficherCarte();
  });

  temoignagePoints.appendChild(point);
}

afficherCarte();
chargerFormationsMisesEnAvant();
initialiserAnimationAuScroll();
initialiserEffetHero();

// Formulaire section inscription
var form = document.getElementById("inscription");
var nomInput = document.getElementById("nom-form");
var emailInput = document.getElementById("email-form");
var mdpInput = document.getElementById("mdp-form");
var confirmerInput = document.getElementById("confirmer-form");
var envoiReussi = document.getElementById("envoiReussi");

if (form) {
  form.addEventListener("submit", function (e) {
    e.preventDefault();

    nettoyerErreurs();
    envoiReussi.textContent = "";

    var valide = true;

    if (!nomInput.value.trim()) {
      afficherErreur(nomInput, "Le nom est obligatoire");
      valide = false;
    }

    if (!emailValide(emailInput.value)) {
      afficherErreur(emailInput, "Email invalide");
      valide = false;
    }

    if (mdpInput.value.length < 6) {
      afficherErreur(mdpInput, "Mot de passe trop court");
      valide = false;
    }

    if (confirmerInput.value !== mdpInput.value) {
      afficherErreur(confirmerInput, "Les mots de passe ne correspondent pas");
      valide = false;
    }

    if (valide) {
      envoiReussi.textContent = "Redirection vers l'inscription...";
      window.location.href = "/inscription";
    }
  });
}

function afficherErreur(input, message) {
  var champ = input.parentElement;
  var small = champ.querySelector("small");

  if (small) {
    small.textContent = message;
  }

  input.classList.add("erreur-bordure");
}

function nettoyerErreurs() {
  var erreurs = document.querySelectorAll(".error");
  for (var i = 0; i < erreurs.length; i++) {
    erreurs[i].textContent = "";
  }

  var inputs = document.querySelectorAll(".champ input");
  for (var j = 0; j < inputs.length; j++) {
    inputs[j].classList.remove("erreur-bordure");
  }
}

function emailValide(email) {
  var regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

function initialiserAnimationAuScroll() {
  if (!("IntersectionObserver" in window)) {
    return;
  }

  observateurAnimation = new IntersectionObserver(
    function (entrees) {
      for (var i = 0; i < entrees.length; i++) {
        if (entrees[i].isIntersecting) {
          entrees[i].target.classList.add("visible");
          observateurAnimation.unobserve(entrees[i].target);
        }
      }
    },
    {
      threshold: 0.15,
    },
  );

  observerElements(
    document.querySelectorAll(
      ".hero-highlight-card, .hero-stat-card, .guide-carte, .valeur-carte, .temoignage-container",
    ),
  );
}

function observerElements(elements) {
  if (!elements || !elements.length) {
    return;
  }

  for (var i = 0; i < elements.length; i++) {
    elements[i].classList.add("reveal-on-scroll");

    if (observateurAnimation) {
      observateurAnimation.observe(elements[i]);
    } else {
      elements[i].classList.add("visible");
    }
  }
}

function initialiserEffetHero() {
  var hero = document.querySelector(".hero");
  var illustrations = document.querySelectorAll(".hero .illustration");

  if (!hero || !illustrations.length || window.innerWidth < 992) {
    return;
  }

  hero.addEventListener("mousemove", function (event) {
    var rect = hero.getBoundingClientRect();
    var offsetX = (event.clientX - rect.left) / rect.width - 0.5;
    var offsetY = (event.clientY - rect.top) / rect.height - 0.5;

    for (var i = 0; i < illustrations.length; i++) {
      var intensite = (i + 1) * 6;
      illustrations[i].style.transform =
        "translate(" +
        offsetX * intensite +
        "px, " +
        offsetY * intensite +
        "px)";
    }
  });

  hero.addEventListener("mouseleave", function () {
    for (var i = 0; i < illustrations.length; i++) {
      illustrations[i].style.transform = "translate(0, 0)";
    }
  });
}
