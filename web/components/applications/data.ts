import { site } from "@/lib/site";

export type Application = {
  name: string;
  href: string;
  /** What the card's link names: the site's own address. */
  domain: string;
  logo: string;
  width: number;
  height: number;
  /** Logo height class, tuned so the marks read at a similar weight. */
  logoSize: string;
  description: string;
  tags: string[];
};

// The applications CommonMind powers. Each description is the project's
// own, from its site or README; each runs in thirteen languages.
export const applications: Application[] = [
  {
    name: "ActionChallenge",
    href: site.links.actionchallenge,
    domain: "theactionchallenge.org",
    logo: "/partners/action-challenge.svg",
    width: 154,
    height: 107,
    logoSize: "h-20",
    description:
      "The Action Challenge invites anyone, anywhere, to take one small, practical action that makes their community better. Free to join, with one month to act.",
    tags: ["Community action", "13 languages"],
  },
  {
    name: "WatchTower",
    href: site.links.watchtower,
    domain: "thewatchtower.tech",
    logo: "/partners/watchtower-white.svg",
    width: 219,
    height: 37,
    logoSize: "h-10",
    description:
      "An incident monitoring and reporting platform built for civil society organizations: structured reporting of security incidents, real-time alerting, geolocation-based mapping, and AI-assisted analysis.",
    tags: ["Incident reporting", "13 languages"],
  },
];
