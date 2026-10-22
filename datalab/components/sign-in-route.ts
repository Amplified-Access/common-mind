// Where to send a volunteer after sign-in: the workspace unless ?next= names
// another path in this app. Only same-site paths are accepted, so a crafted
// ?next= can't bounce people to another site.
const signInHref = (next: string) => `/sign-in?next=${encodeURIComponent(next)}`;

const safeNext = (next: string | string[] | undefined) =>
  typeof next === "string" && /^\/(?![/\\])/.test(next) && next !== "/" && !next.startsWith("/sign-in")
    ? next
    : "/workspace";

export { safeNext, signInHref };
