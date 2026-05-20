import { useEffect, useMemo, useRef, useState } from "react";
import { DocTree } from "../components/DocTree";
import { MarkdownViewer } from "../components/MarkdownViewer";
import { text } from "../i18n/en";
import type { NavigateOptions } from "../lib/route";
import type { SearchMatch, SpecDoc, SpecTreeNode } from "../lib/api";
import { fetchSpecDoc, fetchSpecTree, searchSpecs } from "../lib/api";

interface DocsPageProps {
  selectedDocPath: string | undefined;
  onSelectDocument: (path: string, options?: NavigateOptions) => void;
}

export function DocsPage({ selectedDocPath, onSelectDocument }: DocsPageProps) {
  const [tree, setTree] = useState<SpecTreeNode[]>([]);
  const [activeCategoryPath, setActiveCategoryPath] = useState<string>();
  const [selectedPath, setSelectedPath] = useState<string>();
  const [doc, setDoc] = useState<SpecDoc>();
  const [query, setQuery] = useState("");
  const [matches, setMatches] = useState<SearchMatch[]>([]);
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(true);
  const [activeHeadingSlug, setActiveHeadingSlug] = useState<string>();
  const documentPanelRef = useRef<HTMLElement>(null);

  const headingLinks = useMemo(
    () => doc?.headings.filter((heading) => heading.depth <= 3) ?? [],
    [doc],
  );
  const activeCategory = useMemo(
    () => findCategory(tree, activeCategoryPath) ?? tree[0],
    [activeCategoryPath, tree],
  );

  useEffect(() => {
    fetchSpecTree()
      .then(setTree)
      .catch((nextError: Error) => setError(nextError.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (tree.length === 0) {
      return;
    }

    const fallbackPath =
      findFirstDoc(tree, "spec/guides/index.md") ?? findFirstDoc(tree);
    const nextSelectedPath = findDoc(tree, selectedDocPath) ?? fallbackPath;
    const nextCategory = findCategoryForDoc(tree, nextSelectedPath);

    setActiveCategoryPath(nextCategory?.path);
    setSelectedPath(nextSelectedPath);

    if (nextSelectedPath && nextSelectedPath !== selectedDocPath) {
      onSelectDocument(nextSelectedPath, { replace: true });
    }
  }, [onSelectDocument, selectedDocPath, tree]);

  useEffect(() => {
    if (!selectedPath) {
      return;
    }

    fetchSpecDoc(selectedPath)
      .then((nextDoc) => {
        setDoc(nextDoc);
        setActiveHeadingSlug(nextDoc.headings[0]?.slug);
        documentPanelRef.current?.scrollTo({ top: 0 });
      })
      .catch((nextError: Error) => setError(nextError.message));
  }, [selectedPath]);

  useEffect(() => {
    const root = documentPanelRef.current;
    if (!root || headingLinks.length === 0) {
      return;
    }

    const headings = headingLinks
      .map((heading) => document.getElementById(heading.slug))
      .filter((element): element is HTMLElement => Boolean(element));

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

        if (visible[0]?.target.id) {
          setActiveHeadingSlug(visible[0].target.id);
        }
      },
      { root, rootMargin: "0px 0px -72% 0px", threshold: [0, 1] },
    );

    headings.forEach((heading) => observer.observe(heading));
    return () => observer.disconnect();
  }, [doc, headingLinks]);

  useEffect(() => {
    if (!activeHeadingSlug) {
      return;
    }

    document
      .querySelector(`[data-heading-link="${activeHeadingSlug}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [activeHeadingSlug]);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      if (!query.trim()) {
        setMatches([]);
        return;
      }

      searchSpecs(query)
        .then(setMatches)
        .catch((nextError: Error) => setError(nextError.message));
    }, 180);

    return () => window.clearTimeout(handle);
  }, [query]);

  function selectCategory(category: SpecTreeNode): void {
    setActiveCategoryPath(category.path);

    if (!category.children.some((child) => child.path === selectedPath)) {
      const nextPath = category.children[0]?.path;
      if (nextPath) {
        onSelectDocument(nextPath);
      }
    }
  }

  function selectDocument(path: string): void {
    const category = tree.find((node) =>
      node.children.some((child) => child.path === path),
    );
    if (category) {
      setActiveCategoryPath(category.path);
    }
    onSelectDocument(path);
  }

  return (
    <main className="docs-layout">
      <aside className="sidebar">
        <label className="search-box">
          <span>{text.docs}</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={text.searchPlaceholder}
          />
        </label>

        {query.trim() ? (
          <section className="search-results">
            <h2>{text.searchResults}</h2>
            {matches.length === 0 ? <p>{text.noSearchResults}</p> : null}
            {matches.map((match) => (
              <button
                key={`${match.path}:${match.line}`}
                type="button"
                onClick={() => selectDocument(match.path)}
              >
                <strong>{match.title}</strong>
                <span>{match.snippet}</span>
              </button>
            ))}
          </section>
        ) : (
          <>
            <nav className="category-tabs" aria-label={text.docSections}>
              {tree.map((category) => (
                <button
                  className={
                    category.path === activeCategory?.path
                      ? "category-tabs__item category-tabs__item--active"
                      : "category-tabs__item"
                  }
                  key={category.path}
                  type="button"
                  onClick={() => selectCategory(category)}
                >
                  <span>{category.title}</span>
                  <small>{category.children.length}</small>
                </button>
              ))}
            </nav>
            <DocTree
              category={activeCategory}
              selectedPath={selectedPath}
              onSelect={selectDocument}
            />
          </>
        )}
      </aside>

      <section className="document-panel" ref={documentPanelRef}>
        {error ? (
          <div className="notice">{`${text.error}: ${error}`}</div>
        ) : null}
        {loading ? <div className="notice">{text.loading}</div> : null}
        {!doc && !loading ? (
          <div className="notice">{text.noDocument}</div>
        ) : null}
        {doc ? (
          <>
            <div className="breadcrumbs">{doc.breadcrumbs.join(" / ")}</div>
            <div className="document-grid">
              <MarkdownViewer doc={doc} onNavigate={setSelectedPath} />
              <aside className="headings-panel" aria-label={text.headings}>
                <h2>{text.headings}</h2>
                {headingLinks.map((heading) => (
                  <button
                    className={
                      heading.slug === activeHeadingSlug
                        ? "headings-panel__link headings-panel__link--active"
                        : "headings-panel__link"
                    }
                    data-heading-link={heading.slug}
                    key={`${heading.slug}:${heading.line}`}
                    style={{
                      paddingLeft: `${Math.max(heading.depth - 1, 0) * 10}px`,
                    }}
                    type="button"
                    onClick={() =>
                      document.getElementById(heading.slug)?.scrollIntoView()
                    }
                  >
                    {heading.text}
                  </button>
                ))}
              </aside>
            </div>
          </>
        ) : null}
      </section>
    </main>
  );
}

function findCategory(
  tree: SpecTreeNode[],
  categoryPath: string | null | undefined,
): SpecTreeNode | undefined {
  return tree.find((node) => node.path === categoryPath);
}

function findDoc(tree: SpecTreeNode[], docPath: string | null | undefined) {
  if (!docPath) {
    return undefined;
  }

  return tree
    .flatMap((node) => node.children)
    .find((doc) => doc.path === docPath)?.path;
}

function findCategoryForDoc(
  tree: SpecTreeNode[],
  docPath: string | undefined,
): SpecTreeNode | undefined {
  return tree.find((node) =>
    node.children.some((child) => child.path === docPath),
  );
}

function findFirstDoc(
  tree: SpecTreeNode[],
  preferredPath?: string,
): string | undefined {
  const docs = tree.flatMap((node) => node.children);
  return docs.find((doc) => doc.path === preferredPath)?.path ?? docs[0]?.path;
}
