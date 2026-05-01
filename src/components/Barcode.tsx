import { useEffect, useRef } from "react";
import JsBarcode from "jsbarcode";

interface BarcodeProps {
  value: string;
  height?: number;
  width?: number;
  displayValue?: boolean;
  className?: string;
}

const Barcode = ({
  value,
  height = 60,
  width = 1.6,
  displayValue = true,
  className,
}: BarcodeProps) => {
  const ref = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!ref.current || !value) return;
    try {
      JsBarcode(ref.current, value, {
        format: "CODE128",
        height,
        width,
        displayValue,
        fontSize: 12,
        margin: 4,
        background: "transparent",
        lineColor: "#000",
      });
    } catch (err) {
      console.warn("[Barcode] failed:", err);
    }
  }, [value, height, width, displayValue]);

  return <svg ref={ref} className={className} aria-label={`Barcode: ${value}`} />;
};

export default Barcode;
