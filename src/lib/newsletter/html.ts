/** Text into an HTML attribute or text node. */
export function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

/** A path on the site becomes absolute; a URL with a scheme is left alone. */
export function absolutise(siteUrl: string, url: string): string {
  if (/^https?:\/\//i.test(url)) return url;
  return `${siteUrl.replace(/\/+$/, "")}${url.startsWith("/") ? "" : "/"}${url}`;
}

/** Replace a placeholder everywhere. Split and join, never a regex replacement, so "$&" in a value cannot expand. */
export function fill(template: string, placeholder: string, value: string): string {
  return template.split(placeholder).join(value);
}

/** ICU-style {name} in a message string. */
export function withVars(text: string, vars: Record<string, string>): string {
  let out = text;
  for (const [k, v] of Object.entries(vars)) out = fill(out, `{${k}}`, v);
  return out;
}
