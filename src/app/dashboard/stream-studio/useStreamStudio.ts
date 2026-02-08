// src/app/dashboard/stream-studio/useStreamStudio.ts

import { useEffect, useRef, useState } from "react";
import { StreamStudioController, StreamState } from "@/lib/streamStudio/streamStateMachine";

export function useStreamStudio() {
  const controllerRef = useRef<StreamStudioController | null>(null);
  const [state, setState] = useState<StreamState>("idle");

  if (!controllerRef.current) {
    controllerRef.current = new StreamStudioController();
  }

  useEffect(() => {
    if (!controllerRef.current) return;
    const unsubscribe = controllerRef.current.subscribe(setState);
    return () => {
      unsubscribe();
    };
  }, []);

  return {
    state,
    controller: controllerRef.current!,
  };
}
