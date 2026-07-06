/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useRef } from "react";
import { QrCode, X, Download, ShieldCheck, DownloadCloud } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import QRCode from "qrcode";
import { Post } from "../types";
import { ErrorBoundary } from "./ErrorBoundary";

interface QRModalProps {
  isOpen: boolean;
  post: Post | null;
  onClose: () => void;
}

export const QRModal: React.FC<QRModalProps> = ({
  isOpen,
  post,
  onClose,
}) => {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState("");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (isOpen && post) {
      // Generate unique deep link URL pointing to this specific post ID
      const linkUrl = `${window.location.origin}${window.location.pathname}?id=${post.id}`;
      
      QRCode.toDataURL(
        linkUrl,
        {
          width: 300,
          margin: 2,
          color: {
            dark: "#0f172a", // Navy slate
            light: "#ffffff",
          },
        },
        (err, url) => {
          if (err) {
            console.error("Failed to generate QR Code:", err);
            return;
          }
          setQrCodeDataUrl(url);
        }
      );
    }
  }, [isOpen, post]);

  const downloadQrCode = () => {
    if (!qrCodeDataUrl || !post) return;
    const a = document.createElement("a");
    a.href = qrCodeDataUrl;
    a.download = `linco_qr_tag_${post.item.replace(/\s+/g, "_").toLowerCase()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <AnimatePresence>
      {isOpen && post && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md"
          id="qr-modal-overlay"
        >
          <motion.div
            initial={{ scale: 0.95, y: 15 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 15 }}
            className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-900 overflow-hidden shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)]"
          >
          {/* Header */}
          <div className="p-4 border-b border-slate-900 bg-slate-950 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <QrCode size={16} className="text-cyan-400" />
              <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">
                Print Physical QR Tag
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-500 hover:text-slate-300 transition hover:bg-slate-900 cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-5 text-center">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-200">
                {post.item}
              </h3>
              <p className="text-xs text-slate-400">
                Generate a physical sticker tags for this item.
              </p>
            </div>

            {/* QR Code Container with physical layout styling */}
            <div className="relative mx-auto w-64 p-4 rounded-3xl bg-white flex flex-col items-center justify-center border border-slate-200/20 shadow-[0_10px_30px_rgba(0,0,0,0.15)] overflow-hidden">
              <div className="absolute top-0 inset-x-0 py-1 bg-slate-950 text-white text-[8px] font-mono tracking-widest uppercase text-center font-bold">
                LINCO AI • OWNER VERIFIED TAG
              </div>
              
              <ErrorBoundary fallbackTitle="QR Generation Error">
                {qrCodeDataUrl ? (
                  <img
                    src={qrCodeDataUrl}
                    alt="LINCO AI QR Tag"
                    className="w-48 h-48 mt-4 referrer-policy-no-referrer"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-48 h-48 flex items-center justify-center text-slate-400 text-xs mt-4">
                    Generating QR...
                  </div>
                )}
              </ErrorBoundary>

              <div className="mt-2 text-slate-500 font-mono text-[8px] tracking-wide">
                SCAN TO REPORT FOUND OR INITIATE VERIFIED CLAIM
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-cyan-950/20 border border-cyan-500/10 text-left space-y-2">
              <div className="flex gap-2 text-cyan-400">
                <ShieldCheck size={16} className="shrink-0" />
                <h4 className="text-xs font-bold">How does this help?</h4>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Print and tape this QR Code on your keys, dog's collar, wallet, or luggage. If found, anyone scanning this code can instantly message you safely through our platform <strong>without knowing your phone number or identity</strong>.
              </p>
            </div>

            <button
              onClick={downloadQrCode}
              className="w-full py-3.5 rounded-2xl text-xs font-bold tracking-wider text-slate-900 bg-cyan-400 hover:bg-cyan-300 transition shadow-lg shadow-cyan-400/10 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Download size={14} />
              Download Printable PNG
            </button>
          </div>
        </motion.div>
      </motion.div>
      )}
    </AnimatePresence>
  );
};
