import PublicNavbar from "./PublicNavbar";

function DashboardNavbar() {
  return (
    <PublicNavbar
      menuItems={[
        { label: "Accueil", to: "/" },
        { label: "Formations", to: "/formations" },
        { label: "Mon profil", to: "/profil" },
      ]}
    />
  );
}

export default DashboardNavbar;
