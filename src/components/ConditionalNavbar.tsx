"use client";

import { usePathname } from "next/navigation";
import Navbar from "./Navbar";

// Pages that should NOT show the app navbar
const HIDE_NAVBAR_ON = ["/", "/sign-in", "/sign-up"];

export default function ConditionalNavbar() {
  const pathname = usePathname();

  if (HIDE_NAVBAR_ON.includes(pathname)) return null;

  return <Navbar />;
}