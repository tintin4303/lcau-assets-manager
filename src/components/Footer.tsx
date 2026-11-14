import React from 'react';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-slate-200 mt-auto py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-slate-700">AIESEC in Assumption University</span>
            <span>•</span>
            <span className="text-[#037ef3] font-medium">LCAU 26.27</span>
          </div>
          <p className="text-center sm:text-right font-medium text-slate-600">
            Made and used by LCAU, Finance and Legality Function.
          </p>
        </div>
      </div>
    </footer>
  );
}
