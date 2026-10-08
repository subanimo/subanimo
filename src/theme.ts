import {continueRender, delayRender, staticFile} from "remotion";
import {loadFont as loadAnton} from "@remotion/google-fonts/Anton";
import {loadFont as loadInter} from "@remotion/google-fonts/Inter";

// Fonts are downloaded into public/fonts during setup so rendering works offline.
// If a file is missing, fall back to Google Fonts (needs internet).
const loadLocal = (family: string, file: string, weight: string, fallback: () => void) => {
  if (typeof document === "undefined") return;
  const handle = delayRender(`Loading font ${family}`);
  fetch(staticFile(`fonts/${file}`))
    .then((r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.arrayBuffer();
    })
    .then(async (buf) => {
      const face = new FontFace(family, buf, {weight});
      await face.load();
      document.fonts.add(face);
    })
    .catch(fallback)
    .finally(() => continueRender(handle));
};

loadLocal("RN Anton", "Anton-Regular.ttf", "400", () => loadAnton("normal", {subsets: ["latin", "latin-ext"]}));
loadLocal("RN Inter", "Inter.ttf", "100 900", () => loadInter("normal", {weights: ["600", "800"], subsets: ["latin", "latin-ext"]}));

export const FONT_DISPLAY = '"RN Anton", Anton, Impact, sans-serif';
export const FONT_BODY = '"RN Inter", Inter, Helvetica, Arial, sans-serif';

export const COLORS = {
  text: "#ffffff",
  accent: "#ffd84d",
  hot: "#ff4d6d",
  cool: "#4dd2ff",
  card: "rgba(10, 12, 28, 0.82)",
};

export const shadow = "0 6px 24px rgba(0,0,0,0.65)";
