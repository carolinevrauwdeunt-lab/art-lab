import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import ArtLab from "./ArtLab.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ArtLab />
  </StrictMode>
);
