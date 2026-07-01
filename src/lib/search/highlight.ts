import { tokenize } from "./tokenizer";

export function highlightText(text: string, query: string): string {
  const tokens = tokenize(query);
  if (!tokens.length) return text;

  let result = text;
  for (const token of tokens) {
    const regex = new RegExp(`(${escapeRegex(token)})`, "gi");
    result = result.replace(regex, "<mark>$1</mark>");
  }
  return result;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
