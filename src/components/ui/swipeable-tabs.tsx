import * as React from "react";
import { cn } from "@/lib/utils";
import { useSwipeTabs } from "@/hooks/useSwipeNavigation";
import { useIsMobile } from "@/hooks/use-mobile";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface Tab {
  value: string;
  label: string;
  icon?: React.ReactNode;
  content: React.ReactNode;
}

interface SwipeableTabsProps {
  tabs: Tab[];
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  className?: string;
}

export function SwipeableTabs({
  tabs,
  defaultValue,
  value: controlledValue,
  onValueChange,
  className,
}: SwipeableTabsProps) {
  const isMobile = useIsMobile();
  const [internalValue, setInternalValue] = React.useState(
    defaultValue || tabs[0]?.value || ""
  );

  const value = controlledValue ?? internalValue;
  const currentIndex = tabs.findIndex((t) => t.value === value);

  const handleValueChange = (newValue: string) => {
    setInternalValue(newValue);
    onValueChange?.(newValue);
  };

  const handleIndexChange = (index: number) => {
    if (index >= 0 && index < tabs.length) {
      handleValueChange(tabs[index].value);
    }
  };

  const swipeHandlers = useSwipeTabs(currentIndex, tabs.length, handleIndexChange);

  return (
    <Tabs
      value={value}
      onValueChange={handleValueChange}
      className={cn("w-full", className)}
    >
      {/* Scrollable Tab List for mobile */}
      <ScrollArea className="w-full">
        <TabsList className="inline-flex w-max min-w-full md:w-full md:min-w-0 h-auto p-1 gap-1">
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="flex items-center gap-2 px-3 py-2 text-xs md:text-sm whitespace-nowrap"
            >
              {tab.icon}
              <span>{tab.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>
        <ScrollBar orientation="horizontal" className="md:hidden" />
      </ScrollArea>

      {/* Swipe Indicator (mobile only) */}
      {isMobile && tabs.length > 1 && (
        <div className="swipe-indicator mt-2">
          {tabs.map((tab, index) => (
            <div
              key={tab.value}
              className={cn(
                "swipe-indicator-dot",
                index === currentIndex && "active"
              )}
            />
          ))}
        </div>
      )}

      {/* Tab Content with swipe support */}
      <div
        {...(isMobile ? swipeHandlers : {})}
        className="mt-4 touch-pan-y"
      >
        {tabs.map((tab) => (
          <TabsContent
            key={tab.value}
            value={tab.value}
            className="m-0 focus-visible:outline-none"
          >
            {tab.content}
          </TabsContent>
        ))}
      </div>
    </Tabs>
  );
}

// Simpler variant for sections/panels
interface SwipeablePanelsProps {
  panels: React.ReactNode[];
  currentIndex: number;
  onIndexChange: (index: number) => void;
  className?: string;
  showIndicator?: boolean;
}

export function SwipeablePanels({
  panels,
  currentIndex,
  onIndexChange,
  className,
  showIndicator = true,
}: SwipeablePanelsProps) {
  const isMobile = useIsMobile();
  const swipeHandlers = useSwipeTabs(currentIndex, panels.length, onIndexChange);

  return (
    <div className={cn("relative", className)}>
      {/* Swipe Indicator */}
      {isMobile && showIndicator && panels.length > 1 && (
        <div className="swipe-indicator mb-3">
          {panels.map((_, index) => (
            <button
              key={index}
              onClick={() => onIndexChange(index)}
              className={cn(
                "swipe-indicator-dot",
                index === currentIndex && "active"
              )}
              aria-label={`Go to panel ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Panel Content */}
      <div
        {...(isMobile ? swipeHandlers : {})}
        className="touch-pan-y overflow-hidden"
      >
        <div
          className="flex transition-transform duration-300 ease-out"
          style={{
            transform: isMobile ? `translateX(-${currentIndex * 100}%)` : "none",
            width: isMobile ? `${panels.length * 100}%` : "100%",
          }}
        >
          {panels.map((panel, index) => (
            <div
              key={index}
              className={cn(
                isMobile ? "w-full flex-shrink-0" : "",
                !isMobile && index !== currentIndex && "hidden"
              )}
              style={{ width: isMobile ? `${100 / panels.length}%` : "100%" }}
            >
              {panel}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}