/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Clock } from "lucide-react";

interface LiveMissingTimerProps {
  createdTime: number;
}

export const LiveMissingTimer: React.FC<LiveMissingTimerProps> = ({ createdTime }) => {
  const [elapsedText, setElapsedText] = useState("");

  useEffect(() => {
    const calculateElapsed = () => {
      const now = Date.now();
      const diffMs = now - createdTime;

      if (diffMs <= 0) {
        setElapsedText("Just now");
        return;
      }

      const diffSecs = Math.floor(diffMs / 1000);
      const diffMins = Math.floor(diffSecs / 60);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      const displayHours = diffHours % 24;
      const displayMins = diffMins % 60;
      const displaySecs = diffSecs % 60;

      if (diffDays > 0) {
        setElapsedText(`Missing for ${diffDays}d ${displayHours}h`);
      } else if (diffHours > 0) {
        setElapsedText(`Missing for ${diffHours}h ${displayMins}m`);
      } else if (diffMins > 0) {
        setElapsedText(`Missing for ${diffMins}m ${displaySecs}s`);
      } else {
        setElapsedText(`Missing for ${displaySecs}s`);
      }
    };

    calculateElapsed();
    const interval = setInterval(calculateElapsed, 10000); // update every 10 seconds
    return () => clearInterval(interval);
  }, [createdTime]);

  return (
    <span className="inline-flex items-center gap-1 text-[9px] font-extrabold text-amber-400 bg-amber-950/40 border border-amber-500/20 px-2 py-0.5 rounded-full animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.1)]">
      <Clock size={9} /> {elapsedText}
    </span>
  );
};
