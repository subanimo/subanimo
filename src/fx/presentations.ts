import {fade} from "@remotion/transitions/fade";
import {slide} from "@remotion/transitions/slide";
import {wipe} from "@remotion/transitions/wipe";
import {flip} from "@remotion/transitions/flip";
import {clockWipe} from "@remotion/transitions/clock-wipe";
import {iris} from "@remotion/transitions/iris";
import {none} from "@remotion/transitions/none";
import {blurSlide} from "@remotion/transitions/blur-slide";
import {bookFlip} from "@remotion/transitions/book-flip";
import {crosswarp} from "@remotion/transitions/crosswarp";
import {crossZoom} from "@remotion/transitions/cross-zoom";
import {dissolve} from "@remotion/transitions/dissolve";
import {dreamyZoom} from "@remotion/transitions/dreamy-zoom";
import {filmBurn} from "@remotion/transitions/film-burn";
import {linearBlur} from "@remotion/transitions/linear-blur";
import {pushCut} from "@remotion/transitions/push-cut";
import {ripple} from "@remotion/transitions/ripple";
import {swap} from "@remotion/transitions/swap";
import {zoomBlur} from "@remotion/transitions/zoom-blur";
import {zoomInOut} from "@remotion/transitions/zoom-in-out";
import type {TransitionPresentation} from "@remotion/transitions";

type Any = TransitionPresentation<any>;

export const getPresentation = (name: string, width: number, height: number, direction?: string): Any => {
  const dir = direction as never;
  switch (name) {
    case "fade": return fade();
    case "slide": return slide({direction: dir ?? "from-bottom"});
    case "wipe": return wipe({direction: dir ?? "from-left"});
    case "flip": return flip({direction: dir ?? "from-left"});
    case "clockWipe": return clockWipe({width, height});
    case "iris": return iris({width, height});
    case "blurSlide": return blurSlide({direction: dir ?? "from-right"} as never);
    case "bookFlip": return bookFlip({} as never);
    case "crosswarp": return crosswarp({} as never);
    case "crossZoom": return crossZoom({} as never);
    case "dissolve": return dissolve({} as never);
    case "dreamyZoom": return dreamyZoom({} as never);
    case "filmBurn": return filmBurn({} as never);
    case "linearBlur": return linearBlur({} as never);
    case "pushCut": return pushCut({} as never);
    case "ripple": return ripple({} as never);
    case "swap": return swap({} as never);
    case "zoomBlur": return zoomBlur({} as never);
    case "zoomInOut": return zoomInOut({} as never);
    default: return none();
  }
};
