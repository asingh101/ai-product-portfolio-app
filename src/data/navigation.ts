import { isAiPrototypesLocked } from "@/lib/featureFlags";

export interface NavLink {
  href: string;
  label: string;
  external?: boolean;
  /** Shown in nav with a lock when the route is not publicly launched yet. */
  locked?: boolean;
}

export const mainNavLinks: NavLink[] = [
  { href: "/", label: "Hub" },
  { href: "/about", label: "About" },
  { href: "/resume", label: "Resume" },
  { href: "/portfolio", label: "Portfolio" },
  { href: "/ai-prototypes", label: "AI Prototypes" },
  { href: "/events", label: "Events" },
  { href: "/blog", label: "Blog" },
  { href: "/linkedin", label: "LinkedIn" },
  { href: "/contact", label: "Contact" },
];

export function isNavLinkLocked(link: NavLink): boolean {
  if (link.href === "/ai-prototypes") return isAiPrototypesLocked();
  return Boolean(link.locked);
}

export const adminNavLinks: NavLink[] = [
  { href: "/admin", label: "Analytics" },
  { href: "/admin/feedback", label: "Feedback" },
  { href: "/admin/content", label: "Content" },
  { href: "/admin/portfolio", label: "Portfolio" },
  { href: "/admin/events", label: "Events" },
  { href: "/admin/blog", label: "Blog" },
  { href: "/admin/rag", label: "AI Context" },
  { href: "/admin/search", label: "Search Console" },
];

export const socialLinks: NavLink[] = [
  { href: "https://linkedin.com/in/ankitsingh", label: "LinkedIn", external: true },
  { href: "mailto:ankit.singh101@gmail.com", label: "Email", external: true },
];
