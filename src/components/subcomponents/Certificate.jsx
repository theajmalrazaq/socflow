import React, { forwardRef } from "react";
import { Award } from "lucide-react";

export const Certificate = forwardRef(({ name, eventName, date, code, type, position }, ref) => {
  return (
    <div
      ref={ref}
      className="w-[800px] h-[600px] bg-white relative overflow-hidden flex flex-col items-center justify-center text-center p-12 border-8 border-double border-blue-900"
      style={{
        background: "linear-gradient(135deg, #ffffff 0%, #f0f4ff 100%)",
      }}
    >
      {}
      <div className="absolute top-0 left-0 w-32 h-32 bg-blue-600 transform -translate-x-16 -translate-y-16 rotate-45 opacity-20"></div>
      <div className="absolute bottom-0 right-0 w-32 h-32 bg-blue-600 transform translate-x-16 translate-y-16 rotate-45 opacity-20"></div>
      <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-400 transform translate-x-12 -translate-y-12 rotate-45 opacity-20"></div>
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-cyan-400 transform -translate-x-12 translate-y-12 rotate-45 opacity-20"></div>

      {}
      <div className="mb-8 space-y-2">
        <h1 className="text-3xl font-bold text-blue-900 uppercase tracking-widest">
          Microsoft Learn Student Ambassador
        </h1>
        <div className="w-24 h-1 bg-gradient-to-r from-blue-600 to-cyan-400 mx-auto rounded-full"></div>
      </div>

      {}
      <div className="mb-8">
        <h2 className="text-5xl font-serif text-blue-800 mb-2">
          Certificate of {type === "Winner" ? "Achievement" : "Participation"}
        </h2>
        <p className="text-lg text-blue-600/80 font-medium">
          This certificate is proudly presented to
        </p>
      </div>

      {}
      <div className="mb-8 relative">
        <h3 className="text-4xl font-bold text-slate-800 border-b-2 border-slate-300 pb-2 px-12 inline-block min-w-[400px]">
          {name}
        </h3>
      </div>

      {}
      <div className="mb-10 max-w-2xl text-slate-600 leading-relaxed">
        <p>
          For successfully{" "}
          {type === "Winner"
            ? `securing ${position}${getPositionSuffix(position)} position in`
            : "participating in"}{" "}
          the event
          <span className="font-bold text-blue-900 mx-2">"{eventName}"</span>
          organized by MLSACFD.
        </p>
        <p className="mt-2">Your dedication and enthusiasm are truly appreciated.</p>
      </div>

      {}
      <div className="w-full flex items-end justify-between mt-auto px-8">
        <div className="text-left">
          <div className="text-sm text-slate-500 mb-1">Date</div>
          <div className="font-semibold text-slate-700 border-t border-slate-300 pt-1 px-2">
            {new Date(date).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </div>
        </div>

        <div className="flex flex-col items-center">
          <Award className="w-16 h-16 text-blue-600 mb-2 opacity-80" />
          <div className="text-xs text-blue-900/50 font-mono tracking-widest">MLSACFD</div>
        </div>

        <div className="text-right">
          <div className="text-sm text-slate-500 mb-1">Certificate ID</div>
          <div className="font-mono font-semibold text-slate-700 border-t border-slate-300 pt-1 px-2">
            {code}
          </div>
        </div>
      </div>
    </div>
  );
});

function getPositionSuffix(position) {
  if (position === 1) return "st";
  if (position === 2) return "nd";
  if (position === 3) return "rd";
  return "th";
}

Certificate.displayName = "Certificate";
