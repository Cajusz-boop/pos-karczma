"use client";

import { memo, useCallback, useMemo, useRef, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { FixedSizeGrid: Grid } = require("react-window") as {
  FixedSizeGrid: React.ComponentType<{
    columnCount: number;
    columnWidth: number;
    height: number;
    rowCount: number;
    rowHeight: number;
    width: number;
    overscanRowCount?: number;
    children: (props: { columnIndex: number; rowIndex: number; style: React.CSSProperties }) => React.ReactNode;
  }>;
};

interface Product {
  id: string;
  name: string;
  nameShort: string | null;
  priceGross: number;
  isAvailable: boolean;
  color: string | null;
}

interface VirtualizedProductGridProps {
  products: Product[];
  onProductClick: (product: Product) => void;
  onProductLongPress?: (product: Product) => void;
  columnCount?: number;
  rowHeight?: number;
}

const LONG_PRESS_DURATION = 500;

const ProductCell = memo(function ProductCell({
  product,
  style,
  onProductClick,
  onProductLongPress,
}: {
  product: Product;
  style: React.CSSProperties;
  onProductClick: (p: Product) => void;
  onProductLongPress?: (p: Product) => void;
}) {
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLongPressRef = useRef(false);

  const handlePointerDown = useCallback(() => {
    isLongPressRef.current = false;
    if (onProductLongPress) {
      longPressTimerRef.current = setTimeout(() => {
        isLongPressRef.current = true;
        onProductLongPress(product);
      }, LONG_PRESS_DURATION);
    }
  }, [product, onProductLongPress]);

  const handlePointerUp = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  const handleClick = useCallback(() => {
    if (!isLongPressRef.current) {
      onProductClick(product);
    }
  }, [product, onProductClick]);

  return (
    <div style={style} className="p-1">
      <button
        type="button"
        disabled={!product.isAvailable}
        onClick={handleClick}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onContextMenu={(e) => e.preventDefault()}
        className={cn(
          "flex h-full w-full flex-col rounded-xl border-2 bg-card p-2.5 text-left shadow-sm transition-all active:scale-95",
          product.isAvailable
            ? "border-border hover:border-primary/50 hover:shadow-md"
            : "border-muted opacity-50",
          product.color && "border-l-4"
        )}
        style={product.color ? { borderLeftColor: product.color } : undefined}
      >
        <span className="text-sm font-semibold leading-tight line-clamp-2">
          {product.name}
        </span>
        <span className="mt-auto pt-1 text-sm font-bold text-primary">
          {product.priceGross.toFixed(2)} zł
        </span>
      </button>
    </div>
  );
});

ProductCell.displayName = "ProductCell";

export const VirtualizedProductGrid = memo(function VirtualizedProductGrid({
  products,
  onProductClick,
  onProductLongPress,
  columnCount = 4,
  rowHeight = 100,
}: VirtualizedProductGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        });
      }
    };

    updateDimensions();
    
    const resizeObserver = new ResizeObserver(updateDimensions);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => resizeObserver.disconnect();
  }, []);

  const rowCount = useMemo(
    () => Math.ceil(products.length / columnCount),
    [products.length, columnCount]
  );

  const columnWidth = useMemo(
    () => Math.floor(dimensions.width / columnCount),
    [dimensions.width, columnCount]
  );

  const Cell = useCallback(
    ({ columnIndex, rowIndex, style }: { columnIndex: number; rowIndex: number; style: React.CSSProperties }) => {
      const index = rowIndex * columnCount + columnIndex;
      const product = products[index];
      
      if (!product) return null;
      
      return (
        <ProductCell
          product={product}
          style={style}
          onProductClick={onProductClick}
          onProductLongPress={onProductLongPress}
        />
      );
    },
    [products, columnCount, onProductClick, onProductLongPress]
  );

  if (products.length < 50) {
    return (
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4">
        {products.map((p) => (
          <ProductCell
            key={p.id}
            product={p}
            style={{}}
            onProductClick={onProductClick}
            onProductLongPress={onProductLongPress}
          />
        ))}
      </div>
    );
  }

  return (
    <div ref={containerRef} className="h-full w-full">
      <Grid
        columnCount={columnCount}
        columnWidth={columnWidth}
        height={dimensions.height}
        rowCount={rowCount}
        rowHeight={rowHeight}
        width={dimensions.width}
        overscanRowCount={2}
      >
        {Cell}
      </Grid>
    </div>
  );
});

VirtualizedProductGrid.displayName = "VirtualizedProductGrid";
