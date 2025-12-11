import { useState, useRef, useCallback, TouchEvent } from 'react';

interface SwipeConfig {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  threshold?: number; // minimum distance for swipe
  allowedTime?: number; // maximum time for swipe
}

interface SwipeHandlers {
  onTouchStart: (e: TouchEvent) => void;
  onTouchMove: (e: TouchEvent) => void;
  onTouchEnd: (e: TouchEvent) => void;
}

export function useSwipeNavigation(config: SwipeConfig): SwipeHandlers {
  const {
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    threshold = 50,
    allowedTime = 300,
  } = config;

  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const touchStartTime = useRef(0);

  const onTouchStart = useCallback((e: TouchEvent) => {
    const touch = e.touches[0];
    touchStartX.current = touch.clientX;
    touchStartY.current = touch.clientY;
    touchStartTime.current = Date.now();
  }, []);

  const onTouchMove = useCallback((e: TouchEvent) => {
    // Prevent default only if we detect horizontal swipe
    if (!e.touches[0]) return;
  }, []);

  const onTouchEnd = useCallback((e: TouchEvent) => {
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartX.current;
    const deltaY = touch.clientY - touchStartY.current;
    const elapsedTime = Date.now() - touchStartTime.current;

    // Check if swipe was fast enough
    if (elapsedTime > allowedTime) return;

    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    // Horizontal swipe
    if (absX > threshold && absX > absY) {
      if (deltaX > 0 && onSwipeRight) {
        onSwipeRight();
      } else if (deltaX < 0 && onSwipeLeft) {
        onSwipeLeft();
      }
    }
    // Vertical swipe
    else if (absY > threshold && absY > absX) {
      if (deltaY > 0 && onSwipeDown) {
        onSwipeDown();
      } else if (deltaY < 0 && onSwipeUp) {
        onSwipeUp();
      }
    }
  }, [onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, threshold, allowedTime]);

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd,
  };
}

// Hook for tab navigation with swipe
export function useSwipeTabs(
  currentIndex: number,
  totalTabs: number,
  onTabChange: (index: number) => void
) {
  const swipeHandlers = useSwipeNavigation({
    onSwipeLeft: () => {
      if (currentIndex < totalTabs - 1) {
        onTabChange(currentIndex + 1);
      }
    },
    onSwipeRight: () => {
      if (currentIndex > 0) {
        onTabChange(currentIndex - 1);
      }
    },
    threshold: 75,
    allowedTime: 400,
  });

  return swipeHandlers;
}