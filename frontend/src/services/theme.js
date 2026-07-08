const CLE_THEME = "theme-dashboard";

export function recupererTheme() {
  return localStorage.getItem(CLE_THEME) === "dark" ? "dark" : "light";
}

export function appliquerTheme(theme) {
  const themeValide = theme === "dark" ? "dark" : "light";
  document.documentElement.dataset.theme = themeValide;
  document.documentElement.style.colorScheme = themeValide;
  localStorage.setItem(CLE_THEME, themeValide);
  return themeValide;
}

export function initialiserTheme() {
  return appliquerTheme(recupererTheme());
}
