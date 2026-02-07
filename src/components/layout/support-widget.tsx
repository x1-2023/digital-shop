"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import { Headphones, MessageCircle, Mail, Send, ChevronUp, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function SupportWidget() {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);

    // Hide on admin routes
    if (pathname?.startsWith("/admin")) {
        return null;
    }

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2 isolate">
            {/* Background Overlay for mobile (optional, to close on click outside) */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-40 bg-transparent"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Popup Menu */}
            <div
                className={cn(
                    "z-50 bg-card border border-border rounded-xl shadow-xl p-2 w-60 mb-2 overflow-hidden transition-all duration-200 origin-bottom-right",
                    isOpen
                        ? "transform opacity-100 scale-100 translate-y-0"
                        : "transform opacity-0 scale-95 translate-y-4 pointer-events-none h-0 p-0 border-0"
                )}
            >
                <div className="flex flex-col gap-1">
                    <Link
                        href="https://t.me/SupportAgent" // Replace with actual link
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-secondary/50 transition-colors group"
                    >
                        <div className="bg-blue-500/10 p-2 rounded-full text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                            <Send className="w-4 h-4" />
                        </div>
                        <span className="font-medium text-sm">Telegram</span>
                    </Link>

                    <button
                        onClick={() => {/* Trigger chat logic */ }}
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-secondary/50 transition-colors text-left group w-full"
                    >
                        <div className="bg-green-500/10 p-2 rounded-full text-green-500 group-hover:bg-green-500 group-hover:text-white transition-colors">
                            <MessageCircle className="w-4 h-4" />
                        </div>
                        <span className="font-medium text-sm">Chat trực tiếp</span>
                    </button>

                    <Link
                        href="mailto:support@example.com"
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-secondary/50 transition-colors group"
                    >
                        <div className="bg-orange-500/10 p-2 rounded-full text-orange-500 group-hover:bg-orange-500 group-hover:text-white transition-colors">
                            <Mail className="w-4 h-4" />
                        </div>
                        <span className="font-medium text-sm">Email / Ticket</span>
                    </Link>
                </div>
            </div>

            {/* Main Button */}
            <Button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "h-12 rounded-full px-5 bg-[#0091b2] hover:bg-[#0887a5] text-white shadow-lg shadow-cyan-900/20 transition-all hover:scale-105 active:scale-95 flex items-center gap-2 z-50",
                    isOpen && "ring-2 ring-offset-2 ring-[#0091b2]"
                )}
                size="lg"
            >
                <div className="bg-white/20 p-1.5 rounded-full">
                    <Headphones className="w-5 h-5" />
                </div>
                <span className="font-bold">Hỗ trợ</span>
                {isOpen ? <ChevronDown className="w-4 h-4 ml-1" /> : <ChevronUp className="w-4 h-4 ml-1" />}
            </Button>
        </div>
    );
}
