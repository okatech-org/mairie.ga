import * as React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { useIsMobile } from "@/hooks/use-mobile";

interface Column<T> {
  key: keyof T | string;
  header: string;
  render?: (item: T, index: number) => React.ReactNode;
  className?: string;
  hideOnMobile?: boolean;
  mobileLabel?: string;
}

interface ResponsiveTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (item: T, index: number) => string;
  onRowClick?: (item: T) => void;
  emptyMessage?: string;
  className?: string;
  mobileCardClassName?: string;
}

export function ResponsiveTable<T extends Record<string, any>>({
  data,
  columns,
  keyExtractor,
  onRowClick,
  emptyMessage = "Aucune donnée",
  className,
  mobileCardClassName,
}: ResponsiveTableProps<T>) {
  const isMobile = useIsMobile();

  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  // Mobile: Stacked Cards
  if (isMobile) {
    return (
      <div className={cn("space-y-3", className)}>
        {data.map((item, index) => (
          <Card
            key={keyExtractor(item, index)}
            className={cn(
              "cursor-pointer hover:shadow-md transition-shadow",
              mobileCardClassName
            )}
            onClick={() => onRowClick?.(item)}
          >
            <CardContent className="p-4 space-y-2">
              {columns
                .filter((col) => !col.hideOnMobile)
                .map((col) => {
                  const value = col.render
                    ? col.render(item, index)
                    : item[col.key as keyof T];

                  return (
                    <div
                      key={String(col.key)}
                      className="flex justify-between items-start gap-2"
                    >
                      <span className="text-xs font-medium text-muted-foreground shrink-0">
                        {col.mobileLabel || col.header}
                      </span>
                      <span className="text-sm text-right">{value}</span>
                    </div>
                  );
                })}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Desktop: Horizontal Scroll Table
  return (
    <div className={cn("w-full overflow-x-auto -mx-4 px-4", className)}>
      <table className="w-full min-w-[600px] border-collapse">
        <thead>
          <tr className="border-b border-border">
            {columns.map((col) => (
              <th
                key={String(col.key)}
                className={cn(
                  "text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3 px-4",
                  col.className
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <tr
              key={keyExtractor(item, index)}
              className={cn(
                "border-b border-border/50 hover:bg-muted/30 transition-colors",
                onRowClick && "cursor-pointer"
              )}
              onClick={() => onRowClick?.(item)}
            >
              {columns.map((col) => {
                const value = col.render
                  ? col.render(item, index)
                  : item[col.key as keyof T];

                return (
                  <td
                    key={String(col.key)}
                    className={cn("py-3 px-4 text-sm", col.className)}
                  >
                    {value}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Simple wrapper for existing tables to add horizontal scroll
export function ScrollableTable({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("w-full overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0", className)}>
      <div className="min-w-[600px]">{children}</div>
    </div>
  );
}

// Responsive Grid that switches to single column on mobile
export function ResponsiveGrid({
  children,
  className,
  cols = { default: 1, sm: 2, md: 3, lg: 4 },
}: {
  children: React.ReactNode;
  className?: string;
  cols?: {
    default?: number;
    sm?: number;
    md?: number;
    lg?: number;
  };
}) {
  const colClasses = [
    `grid-cols-${cols.default || 1}`,
    cols.sm && `sm:grid-cols-${cols.sm}`,
    cols.md && `md:grid-cols-${cols.md}`,
    cols.lg && `lg:grid-cols-${cols.lg}`,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={cn("grid gap-3 md:gap-4", colClasses, className)}>
      {children}
    </div>
  );
}