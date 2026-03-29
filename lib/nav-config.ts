import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  Compass,
  Crown,
  Gamepad2,
  Home,
  MessageCircle,
  Trophy,
  UserRound,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  shortLabel: string;
  icon: LucideIcon;
  /** Match pathname === href or startsWith (for nested routes) */
  match: "exact" | "prefix";
};

export const MAIN_NAV: NavItem[] = [
  { href: "/", label: "Home", shortLabel: "Home", icon: Home, match: "exact" },
  {
    href: "/games",
    label: "Games",
    shortLabel: "Games",
    icon: Gamepad2,
    match: "prefix",
  },
  { href: "/chat", label: "Chat", shortLabel: "Chat", icon: MessageCircle, match: "prefix" },
  {
    href: "/media",
    label: "Immersive Media",
    shortLabel: "Media",
    icon: BookOpen,
    match: "prefix",
  },
  {
    href: "/quests",
    label: "Adventures",
    shortLabel: "Quests",
    icon: Compass,
    match: "prefix",
  },
  {
    href: "/leaderboards",
    label: "Leaderboards",
    shortLabel: "Boards",
    icon: Crown,
    match: "exact",
  },
  {
    href: "/profile",
    label: "Perfil",
    shortLabel: "Perfil",
    icon: UserRound,
    match: "prefix",
  },
  {
    href: "/progress",
    label: "Progress Palace",
    shortLabel: "Progress",
    icon: Trophy,
    match: "prefix",
  },
];

export const DAILY_RITUAL_HREF = "/#daily-ritual";

export function isNavActive(pathname: string, item: NavItem): boolean {
  if (item.match === "exact") {
    return pathname === item.href || pathname === `${item.href}/`;
  }
  if (item.href === "/") return pathname === "/" || pathname === "";
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}
