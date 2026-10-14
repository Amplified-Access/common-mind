// Where to send a volunteer after sign-in. Only Data Lab paths are accepted,
// so a crafted ?next= can't bounce people to another site.
const signInHref = (next: string) => `/data-lab/sign-in?next=${encodeURIComponent(next)}`;

const safeNext = (next: string | string[] | undefined) =>
  typeof next === "string" && /^\/data-lab(\/|$|\?)/.test(next) && !next.startsWith("//") ? next : "/data-lab";

export { safeNext, signInHref };
