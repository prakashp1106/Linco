/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";

interface CountUpStatProps {
  value: number;
  color: string;
}

export const CountUpStat: React.FC<CountUpStatProps> = ({ value, color }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = value;
    if (end === 0) {
      setDisplayValue(0);
      return;
    }
    const duration = 1200; // ms
    const increment = Math.ceil(end / (duration / 16)); // ~60fps
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        clearInterval(timer);
        setDisplayValue(end);
      } else {
        setDisplayValue(start);
      }
    }, 16);

    return () => clearInterval(timer);
  }, [value]);

  return <span className={`text-xl font-extrabold block ${color}`}>{displayValue}</span>;
};
