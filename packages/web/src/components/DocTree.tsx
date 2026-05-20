import type { SpecTreeNode } from "../lib/api";
import { text } from "../i18n/en";

interface DocTreeProps {
  category: SpecTreeNode | undefined;
  selectedPath: string | undefined;
  onSelect: (path: string) => void;
}

export function DocTree({ category, selectedPath, onSelect }: DocTreeProps) {
  if (!category) {
    return null;
  }

  return (
    <nav className="doc-tree" aria-label={text.specDocuments}>
      <section className="doc-tree__category">
        <h2>{category.title}</h2>
        <ul>
          {category.children.map((doc) => (
            <li key={doc.path}>
              <button
                className={
                  doc.path === selectedPath
                    ? "doc-tree__item doc-tree__item--active"
                    : "doc-tree__item"
                }
                type="button"
                onClick={() => onSelect(doc.path)}
              >
                <span>{doc.title}</span>
                <small>{doc.path.replace(/^spec\//, "")}</small>
              </button>
            </li>
          ))}
        </ul>
      </section>
    </nav>
  );
}
