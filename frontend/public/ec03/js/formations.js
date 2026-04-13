var cardsContainer = document.getElementById("cardsContainer");
var categoryFilter = document.getElementById("categoryFilter");
var levelFilter = document.getElementById("levelFilter");
var minHours = document.getElementById("minHours");
var maxHours = document.getElementById("maxHours");
var minPrice = document.getElementById("minPrice");
var maxPrice = document.getElementById("maxPrice");
var filterBtn = document.getElementById("filterBtn");
var searchForm = document.querySelector(".search");
var searchInput = document.getElementById("search-bar");

var API_BASE =
  window.location.hostname === "localhost"
    ? "http://127.0.0.1:8000/api"
    : `${window.location.protocol}//${window.location.hostname}:8000/api`;

var formations = [];

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

function mapperCategorie(category) {
  var valeur = (category || "").toLowerCase();

  if (
    valeur.includes("développement") ||
    valeur.includes("developpement") ||
    valeur.includes("web")
  )
    return "dev";
  if (valeur.includes("design")) return "design";
  if (valeur.includes("marketing")) return "marketing";
  if (valeur.includes("data")) return "business";
  if (valeur.includes("devops")) return "business";
  return "dev";
}

function niveauAffichage(level) {
  if (level === "advanced") return "Avancé";
  if (level === "intermediaire") return "Intermédiaire";
  return "Débutant";
}

function initialiserCategories() {
  var categories = ["", "dev", "design", "business", "marketing"];
  categoryFilter.innerHTML = "";

  var labels = {
    "": "Toutes",
    dev: "Développement",
    design: "Design",
    business: "Business",
    marketing: "Marketing",
  };

  for (var i = 0; i < categories.length; i++) {
    var option = document.createElement("option");
    option.value = categories[i];
    option.textContent = labels[categories[i]];
    categoryFilter.appendChild(option);
  }
}

function displayCards(list) {
  cardsContainer.innerHTML = "";

  if (list.length === 0) {
    var empty = document.createElement("p");
    empty.textContent = "Aucune formation trouvée.";
    cardsContainer.appendChild(empty);
    return;
  }

  for (var i = 0; i < list.length; i++) {
    var f = list[i];

    var card = document.createElement("div");
    card.className = "card";

    var img = document.createElement("img");
    img.src = "assets/images/profile1.jfif";
    img.alt = "Illustration formation";

    var title = document.createElement("h3");
    title.textContent = f.nom;

    var badge = document.createElement("span");
    badge.className = "card-badge " + f.categorie;
    badge.textContent = f.categorie;

    var trainer = document.createElement("p");
    trainer.textContent = "Formateur : " + (f.formateur || "N/A");

    var description = document.createElement("p");
    description.textContent = f.description || "Aucune description disponible.";

    var level = document.createElement("p");
    level.textContent = "Niveau : " + niveauAffichage(f.level);

    var stats = document.createElement("p");
    stats.textContent = "Apprenants : " + f.apprenants + " • Vues : " + f.vues;

    var bottom = document.createElement("div");
    bottom.className = "card-bottom";

    var duration = document.createElement("span");
    duration.innerHTML = '<i class="fa-regular fa-clock"></i>' + f.duree + "h";

    var price = document.createElement("span");
    price.innerHTML = '<i class="fa-solid fa-tag"></i>' + f.prix + " Rs";

    var detailLink = document.createElement("a");
    detailLink.href = "/formation/" + f.id;
    detailLink.textContent = "Voir détail";
    detailLink.style.marginTop = "8px";

    bottom.appendChild(duration);
    bottom.appendChild(price);

    card.appendChild(badge);
    card.appendChild(img);
    card.appendChild(title);
    card.appendChild(trainer);
    card.appendChild(description);
    card.appendChild(level);
    card.appendChild(stats);
    card.appendChild(bottom);
    card.appendChild(detailLink);

    cardsContainer.appendChild(card);
  }
}

function appliquerRechercheEtFiltres() {
  var query = (searchInput.value || "").trim().toLowerCase();
  var cat = categoryFilter.value;
  var level = levelFilter.value;

  var minH = parseFloat(minHours.value);
  if (isNaN(minH)) minH = 0;

  var maxH = parseFloat(maxHours.value);
  if (isNaN(maxH)) maxH = Infinity;

  var minP = parseFloat(minPrice.value);
  if (isNaN(minP)) minP = 0;

  var maxP = parseFloat(maxPrice.value);
  if (isNaN(maxP)) maxP = Infinity;

  var result = [];

  for (var i = 0; i < formations.length; i++) {
    var f = formations[i];

    var matchQuery =
      f.nom.toLowerCase().indexOf(query) !== -1 ||
      f.description.toLowerCase().indexOf(query) !== -1 ||
      f.categorie.toLowerCase().indexOf(query) !== -1;

    var matchFiltres =
      (cat === "" || f.categorie === cat) &&
      (level === "" || f.level === level) &&
      f.duree >= minH &&
      f.duree <= maxH &&
      f.prix >= minP &&
      f.prix <= maxP;

    if (matchQuery && matchFiltres) {
      result.push(f);
    }
  }

  displayCards(result);
}

function rechercher(event) {
  event.preventDefault();
  appliquerRechercheEtFiltres();
}

function filtrer() {
  appliquerRechercheEtFiltres();
}

if (searchForm) {
  searchForm.addEventListener("submit", rechercher);
}

if (filterBtn) {
  filterBtn.addEventListener("click", filtrer);
}

// Menu burger
var burger = document.getElementById("burger");
var liens = document.querySelector(".liens-navigation");
if (burger && liens) {
  burger.addEventListener("click", function () {
    liens.classList.toggle("active");
  });
}

// Chargement API
initialiserCategories();
fetch(API_BASE + "/formations")
  .then(function (response) {
    if (!response.ok) {
      throw new Error("Erreur API");
    }
    return response.json();
  })
  .then(function (data) {
    formations = (data || []).map(function (item) {
      return {
        id: item.id,
        nom: item.titre || "Formation",
        description: item.description || "",
        formateur: item.formateur || "N/A",
        prix: Number(item.price || 0),
        duree: Number(item.duration || 0),
        categorie: mapperCategorie(item.category),
        level: item.level || "beginner",
        apprenants: Number(item.apprenants || 0),
        vues: Number(item.vues || 0),
      };
    });

    displayCards(formations);
  })
  .catch(function () {
    cardsContainer.innerHTML = "<p>Impossible de charger les formations.</p>";
  });
