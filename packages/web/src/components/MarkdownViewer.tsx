import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { SpecDoc } from "../lib/api";

interface MarkdownViewerProps {
  doc: SpecDoc;
  onNavigate: (path: string) => void;
}

export function MarkdownViewer({ doc, onNavigate }: MarkdownViewerProps) {
  return (
    <article className="markdown-viewer">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1({ children }) {
            return <h1 id={slugFromChildren(children)}>{children}</h1>;
          },
          h2({ children }) {
            return <h2 id={slugFromChildren(children)}>{children}</h2>;
          },
          h3({ children }) {
            return <h3 id={slugFromChildren(children)}>{children}</h3>;
          },
          a({ href, children }) {
            if (href?.includes(".md")) {
              return (
                <button
                  className="inline-link"
                  type="button"
                  onClick={() => onNavigate(resolveDocLink(doc.path, href))}
                >
                  {children}
                </button>
              );
            }

            return <a href={href}>{children}</a>;
          },
        }}
      >
        {doc.markdown}
      </ReactMarkdown>
    </article>
  );
}

function resolveDocLink(currentPath: string, href: string): string {
  const base = currentPath.split("/").slice(0, -1);
  const [pathOnly] = href.split("#");
  const parts = [...base, ...pathOnly.split("/")];
  const resolved: string[] = [];

  for (const part of parts) {
    if (part === "..") {
      resolved.pop();
    } else if (part !== ".") {
      resolved.push(part);
    }
  }

  return resolved.join("/");
}

function slugFromChildren(children: React.ReactNode): string {
  return String(children)
    .toLocaleLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}
