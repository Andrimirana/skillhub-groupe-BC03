import { useEffect } from "react";
import { useLocation } from "react-router-dom";

// Ramene la page en haut a chaque changement de route
function RemonterEnHaut() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

export default RemonterEnHaut;
