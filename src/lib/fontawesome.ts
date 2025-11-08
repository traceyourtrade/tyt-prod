// src/lib/fontawesome.ts
import { config } from "@fortawesome/fontawesome-svg-core";
import "@fortawesome/fontawesome-svg-core/styles.css";

// Prevent Font Awesome from adding its CSS automatically (since Next.js handles CSS)
config.autoAddCss = false;
