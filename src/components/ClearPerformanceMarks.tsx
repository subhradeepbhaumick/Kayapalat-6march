'use client';

import { useEffect } from 'react';

export function ClearPerformanceMarks() {
  useEffect(() => {
    // Clear any existing performance marks for BlogReadPage to prevent negative timestamp errors
    if (typeof performance !== 'undefined' && performance.clearMarks) {
      performance.clearMarks('BlogReadPage-start');
      performance.clearMarks('BlogReadPage-end');
      performance.clearMeasures('BlogReadPage');
    }
  }, []);

  return null;
}
