import React from "react";
function Loading() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-col items-center justify-center gap-3 min-h-screen"
    >
      <div className="em-spinner" />
      <span className="sr-only">Loading…</span>
    </div>
  );
}
export default Loading;
