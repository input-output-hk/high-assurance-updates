import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";

/**
 * Renders trusted, git-reviewed Markdown (weekly narratives, product and
 * proposal copy) at build time. GFM tables + heading anchors; styled by the
 * `.md` block in globals.css. No `dangerouslySetInnerHTML` — react-markdown
 * builds real nodes.
 */
export function Markdown({ children, className = "" }: { children: string; className?: string }) {
  return (
    <div className={`md ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSlug, [rehypeAutolinkHeadings, { behavior: "wrap" }]]}
        components={{
          // Wrap tables so wide ones (e.g. long identifiers or hashes) scroll
          // inside their own container instead of overflowing the page.
          table: ({ node, ...props }) => (
            <div className="table-wrap">
              <table {...props} />
            </div>
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
