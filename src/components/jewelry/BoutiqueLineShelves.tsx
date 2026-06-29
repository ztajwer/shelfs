"use client";

import {
  getLineShelfBlockHeightPx,
  LINE_SHELF_COUNT,
  LINE_SHELF_GAP_PX,
  LINE_SHELF_SIDE_INSET_PX,
  LINE_SHELF_VERTICAL_LIFT_PX,
  LINE_SHELF_WIDTH_PX,
} from "@/lib/lineShelfLayout";
import {
  getLineShelfProductConfig,
  LINE_SHELF_PRODUCT_SIZE_PX,
} from "@/lib/lineShelfProductLayout";
import { SHOP_LINE_SHELF_PRODUCTS_ENABLED, SHOP_LINE_SHELVES_ENABLED } from "@/lib/shopTableEnabled";
import LineShelfProductMini from "./LineShelfProductMini";

function LineShelfRow({
  shelfLineIndex,
  side,
}: {
  shelfLineIndex: number;
  side: "left" | "right";
}) {
  const rowIndex = side === "left" ? shelfLineIndex : shelfLineIndex - LINE_SHELF_COUNT;
  const config1 = getLineShelfProductConfig(rowIndex, "left");
  const config2 = getLineShelfProductConfig(rowIndex + LINE_SHELF_COUNT, "right");

  return (
    <div className="line-shelf" data-shelf-line={shelfLineIndex} aria-hidden>
      <span className="line-shelf__bracket line-shelf__bracket--l" />
      <span className="line-shelf__bracket line-shelf__bracket--r" />
      <span className="line-shelf__rail line-shelf__rail--top" aria-hidden />
      <span className="line-shelf__rail line-shelf__rail--bottom" aria-hidden />
      <span className="line-shelf__led" />
      <span className="line-shelf__glass" />
      <span className="line-shelf__highlight" />
      {SHOP_LINE_SHELF_PRODUCTS_ENABLED && (
        <div className="line-shelf__product-mount">
          <LineShelfProductMini config={config1} />
          <LineShelfProductMini config={config2} />
        </div>
      )}
    </div>
  );
}

interface BoutiqueLineShelvesProps {
  visible: boolean;
}

export default function BoutiqueLineShelves({ visible }: BoutiqueLineShelvesProps) {
  if (!SHOP_LINE_SHELVES_ENABLED || !visible) return null;

  const blockH = getLineShelfBlockHeightPx();

  return (
    <div className="boutique-line-shelf-unit">
      <div
        className="boutique-line-shelves line-shelves"
        style={{
          ["--line-shelf-width" as string]: `${LINE_SHELF_WIDTH_PX}px`,
          ["--line-shelf-gap" as string]: `${LINE_SHELF_GAP_PX}px`,
          ["--line-shelf-block-h" as string]: `${blockH}px`,
          ["--line-col-inset" as string]: `${LINE_SHELF_SIDE_INSET_PX}px`,
          ["--product-size" as string]: `${LINE_SHELF_PRODUCT_SIZE_PX}px`,
          ["--line-shelf-lift" as string]: `${LINE_SHELF_VERTICAL_LIFT_PX}px`,
        }}
        aria-label="Display shelf lines"
      >
        <div className="line-shelves__col line-shelves__col--left">
          {Array.from({ length: LINE_SHELF_COUNT }, (_, i) => (
            <LineShelfRow key={`l-${i}`} shelfLineIndex={i} side="left" />
          ))}
        </div>
        <div className="line-shelves__col line-shelves__col--right">
          {Array.from({ length: LINE_SHELF_COUNT }, (_, i) => (
            <LineShelfRow
              key={`r-${i}`}
              shelfLineIndex={LINE_SHELF_COUNT + i}
              side="right"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
