"use client";

import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

export default function FrontDeskError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error("[FrontDesk Portal Error]:", error);
    }, [error]);

    return (
        <div className="min-h-[65vh] flex flex-col items-center justify-center text-center p-6 animate-fade-in max-w-lg mx-auto">
            <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mb-5 shadow-sm">
                <AlertTriangle className="w-7 h-7" />
            </div>

            <h2 className="text-2xl font-bold font-outfit text-slate-900 tracking-tight">
                Front Desk Portal Encountered an Issue
            </h2>
            <p className="text-sm text-slate-500 mt-2 mb-6 leading-relaxed">
                We were unable to complete this reception request. You can try refreshing the action or return to the front desk dashboard.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                <Button
                    onClick={() => reset()}
                    className="w-full sm:w-auto rounded-xl bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-dark)] text-white h-10 px-5 shadow-sm"
                >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Try Again
                </Button>

                <Link href="/front-desk/dashboard" className="w-full sm:w-auto">
                    <Button
                        variant="outline"
                        className="w-full sm:w-auto rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 h-10 px-5"
                    >
                        <Home className="w-4 h-4 mr-2" />
                        Go to Dashboard
                    </Button>
                </Link>
            </div>
        </div>
    );
}
