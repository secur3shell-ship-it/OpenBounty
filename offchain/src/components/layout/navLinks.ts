// Main navigation links, shared by the desktop header and the mobile menu.

export const NAV_LINKS = [
  { label: "Explore", href: "/" },
  { label: "Your bounties", href: "/me" },
  { label: "Markets", href: "/markets" },
];

// "/" matches only the home page; other links also match their sub-pages.
export function isActivePath(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname.startsWith(href);
}
