"use client";

import { usePathname } from "next/navigation";
import Navbar from "./Navbar";

// Exact pages that should NOT show the app navbar
const HIDE_NAVBAR_ON = ["/", "/sign-in", "/sign-up"];

export default function ConditionalNavbar() {
    const pathname = usePathname();

    // Use exact match for "/" 
    // Use startsWith for /sign-in and /sign-up only
    const isLanding = pathname === "/";
    const isAuthPage =
        pathname.startsWith("/sign-in") ||
        pathname.startsWith("/sign-up");

    if (isLanding || isAuthPage) return null;

    return <Navbar />;
}