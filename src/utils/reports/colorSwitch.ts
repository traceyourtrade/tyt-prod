
import { chartsGridClasses, ChartsLegend,legendClasses, useDrawingArea, useYScale } from "@mui/x-charts";

function ColorSwitch({ threshold, color1, color2, id }) {
  const { top, height, bottom } = useDrawingArea();
  const svgHeight = top + bottom + height;

  const scale = useYScale(); // You can provide the axis Id if you have multiple ones
  const y0 = scale(threshold); // The coordinate of the origin
  const off = y0 !== undefined ? y0 / svgHeight : 0;

  return (
    <defs>
      <linearGradient
        id={id}
        x1="0"
        x2="0"
        y1="0"
        y2={`${svgHeight}px`}
        gradientUnits="userSpaceOnUse" // Use the SVG coordinate instead of the component ones.
      >
        <stop offset={off} stopColor={color1} stopOpacity={1} />
        <stop offset={off} stopColor={color2} stopOpacity={1} />
      </linearGradient>
    </defs>
  );
}
export default ColorSwitch;
