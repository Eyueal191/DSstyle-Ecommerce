import React from "react";

function ErrorPage() {
  return (
    <div className="em-brand-glow min-h-screen flex items-center justify-center px-6 py-16 bg-[#f4f3f0] dark:bg-[#0c0b0a] text-gray-900 dark:text-gray-100">
      <div className="em-card w-full max-w-md p-8 sm:p-10 text-center">
        <img
          src="/logo.png"
          alt="DS Style"
          className="mx-auto h-14 w-14 rounded-2xl object-contain em-keep-light ring-1 ring-pink-600/25 bg-white p-1 shadow-sm"
        />
        <p className="em-eyebrow mt-6">Page not available</p>
        <h1 className="mt-2 !text-2xl sm:!text-3xl font-bold tracking-tight">
          We couldn't find that page
        </h1>
        <p className="mt-3 !text-sm text-gray-500 dark:text-gray-400">
          The link may be outdated, or something went wrong on our side. Your bag is safe.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <a href="/" className="em-btn em-btn-primary">
            Back to Home
          </a>
          <a href="/shop" className="em-btn em-btn-soft">
            Browse the Shop
          </a>
        </div>
      </div>
    </div>
  );
}

export default ErrorPage;
