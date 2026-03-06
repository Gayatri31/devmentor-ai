"use client";

import { usePathname } from "next/navigation";
import Navbar from "./Navbar";

export default function ConditionalNavbar() {
  const pathname = usePathname();

  const hideOn = ["/", "/login"];
  if (hideOn.includes(pathname)) return null;

  return <Navbar />;
}