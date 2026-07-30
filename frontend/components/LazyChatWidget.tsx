"use client";

/** Defers loading the floating assistant until the browser becomes idle. */

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const ChatWidget = dynamic(() => import("./ChatWidget").then((module) => module.ChatWidget), { ssr: false });

export function LazyChatWidget() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const browser = window as Window & { requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number; cancelIdleCallback?: (id: number) => void };
    if (browser.requestIdleCallback) {
      const id = browser.requestIdleCallback(() => setReady(true), { timeout: 1800 });
      return () => browser.cancelIdleCallback?.(id);
    }
    const id = window.setTimeout(() => setReady(true), 600);
    return () => window.clearTimeout(id);
  }, []);
  return ready ? <ChatWidget /> : null;
}
