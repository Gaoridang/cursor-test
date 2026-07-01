function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function markdownToHtml(markdown: string): string {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const html: string[] = [];
  let inCode = false;
  let codeBuffer: string[] = [];
  let inList = false;

  const closeList = () => {
    if (inList) {
      html.push("</ul>");
      inList = false;
    }
  };

  for (const line of lines) {
    if (line.trim().startsWith("```")) {
      if (inCode) {
        html.push(`<pre><code>${escapeHtml(codeBuffer.join("\n"))}</code></pre>`);
        codeBuffer = [];
        inCode = false;
      } else {
        closeList();
        inCode = true;
      }
      continue;
    }

    if (inCode) {
      codeBuffer.push(line);
      continue;
    }

    if (/^### (.+)/.test(line)) {
      closeList();
      html.push(`<h3>${inlineFormat(line.replace(/^### /, ""))}</h3>`);
      continue;
    }
    if (/^## (.+)/.test(line)) {
      closeList();
      html.push(`<h2>${inlineFormat(line.replace(/^## /, ""))}</h2>`);
      continue;
    }
    if (/^# (.+)/.test(line)) {
      closeList();
      html.push(`<h1>${inlineFormat(line.replace(/^# /, ""))}</h1>`);
      continue;
    }

    if (/^- (.+)/.test(line)) {
      if (!inList) {
        html.push("<ul>");
        inList = true;
      }
      html.push(`<li>${inlineFormat(line.replace(/^- /, ""))}</li>`);
      continue;
    }

    closeList();

    if (!line.trim()) {
      continue;
    }

    html.push(`<p>${inlineFormat(line)}</p>`);
  }

  closeList();

  if (inCode && codeBuffer.length) {
    html.push(`<pre><code>${escapeHtml(codeBuffer.join("\n"))}</code></pre>`);
  }

  return html.join("\n");
}

function inlineFormat(text: string): string {
  let out = escapeHtml(text);
  out = out.replace(/`([^`]+)`/g, "<code>$1</code>");
  out = out.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  out = out.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  out = out.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  return out;
}

export function stripMarkdown(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]+`/g, " ")
    .replace(/[#*_>\[\]()!-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
