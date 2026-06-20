import { useRemark } from "react-remark";
import { useEffect } from "react";
import { cn } from "@/components/ui/utils";

const SAFE_SCHEMES = ["http://", "https://", "mailto:"];
const isSafeUrl = (url) => url && SAFE_SCHEMES.some((s) => url.toLowerCase().startsWith(s));

const componentMap = {
  p: ({ children }) => <p className="text-body-sm text-muted leading-relaxed">{children}</p>,
  a: ({ href, children }) => {
    const safeHref = isSafeUrl(href) ? href : undefined;
    return safeHref ? (
      <a href={safeHref} target="_blank" rel="noopener noreferrer" className="text-accent-text underline">
        {children}
      </a>
    ) : (
      <span className="text-accent-text">{children}</span>
    );
  },
  img: ({ src, alt }) => {
    if (!isSafeUrl(src)) return null;
    return <img src={src} alt={alt ?? ""} className="max-w-full rounded-sm mt-1" />;
  },
  code: ({ children }) => (
    <code className="font-mono text-body-sm bg-surface-2 rounded px-1">{children}</code>
  ),
  pre: ({ children }) => (
    <pre className="font-mono text-body-sm bg-surface-2 rounded p-3 overflow-x-auto my-1">{children}</pre>
  ),
  strong: ({ children }) => <strong className="font-semibold text-text">{children}</strong>,
  em: ({ children }) => <em className="italic text-muted">{children}</em>,
  ul: ({ children }) => (
    <ul className="list-disc list-inside text-body-sm text-muted space-y-0.5 my-1">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal list-inside text-body-sm text-muted space-y-0.5 my-1">{children}</ol>
  ),
  li: ({ children }) => <li>{children}</li>,
  blockquote: ({ children }) => (
    <blockquote className="border-l-2 border-border pl-3 text-muted my-1">{children}</blockquote>
  ),
  h1: ({ children }) => <h1 className="text-subtitle font-semibold text-text my-1">{children}</h1>,
  h2: ({ children }) => <h2 className="font-semibold text-text my-1">{children}</h2>,
  h3: ({ children }) => <h3 className="font-medium text-text my-0.5">{children}</h3>,
};

const MarkdownContent = ({ content, className }) => {
  const [reactContent, setMarkdownSource] = useRemark({
    remarkToReactComponents: componentMap,
  });

  useEffect(() => {
    setMarkdownSource(content ?? "");
  }, [content, setMarkdownSource]);

  return <div className={cn("markdown-content", className)}>{reactContent}</div>;
};

export default MarkdownContent;
