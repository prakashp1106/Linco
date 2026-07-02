/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children?: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error inside LINCO boundary:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 rounded-3xl bg-slate-900/60 border border-red-500/20 backdrop-blur-md flex flex-col items-center justify-center text-center gap-4 my-2">
          <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
            <AlertTriangle size={24} className="animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-200">
              {this.props.fallbackTitle || "Component Encountered an Issue"}
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-xs">
              {this.state.error?.message || "An unexpected error occurred. Our AI agents are checking it."}
            </p>
          </div>
          <button
            onClick={this.handleReset}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-cyan-400 hover:text-cyan-300 bg-cyan-500/10 border border-cyan-500/20 hover:border-cyan-500/40 rounded-xl transition cursor-pointer"
          >
            <RefreshCw size={12} />
            Recover Component
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
