import React from "react";

export default function FrontDeskLoading() {
    return (
        <div className="space-y-6 animate-pulse max-w-7xl mx-auto">
            {/* Title Skeleton */}
            <div className="space-y-2">
                <div className="h-8 w-48 bg-slate-200 rounded-lg" />
                <div className="h-4 w-72 bg-slate-100 rounded" />
            </div>

            {/* 4 Metric KPI Cards Skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-28 bg-slate-200/80 rounded-2xl p-5 space-y-3">
                        <div className="h-4 w-24 bg-slate-300/70 rounded" />
                        <div className="h-7 w-16 bg-slate-300 rounded" />
                    </div>
                ))}
            </div>

            {/* Main Content Card Skeleton */}
            <div className="h-96 bg-slate-200/70 rounded-2xl" />
        </div>
    );
}
