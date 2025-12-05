import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

interface FormattedMessageProps {
  content: string;
}

export function FormattedMessage({ content }: FormattedMessageProps) {
  return (
    <ReactMarkdown
      components={{
        code(props: any) {
          const { className, children } = props;
          const match = /language-(\w+)/.exec(className || "");
          const isInline = !match && !String(children).includes("\n");
          return !isInline && match ? (
            <SyntaxHighlighter style={oneDark} language={match[1]} PreTag="div">
              {String(children).replace(/\n$/, "")}
            </SyntaxHighlighter>
          ) : (
            <code className="bg-muted px-1 py-0.5 rounded text-sm">
              {children}
            </code>
          );
        },
        p({ children }) {
          return <p className="mb-2 last:mb-0">{children}</p>;
        },
        ul({ children }) {
          return (
            <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>
          );
        },
        ol({ children }) {
          return (
            <ol className="list-decimal list-inside mb-2 space-y-1">
              {children}
            </ol>
          );
        },
        li({ children }) {
          return <li>{children}</li>;
        },
        blockquote({ children }) {
          return (
            <blockquote className="border-l-4 border-muted-foreground/30 pl-4 italic text-muted-foreground mb-2">
              {children}
            </blockquote>
          );
        },
        strong({ children }) {
          return <strong className="font-bold">{children}</strong>;
        },
        em({ children }) {
          return <em className="italic">{children}</em>;
        },
        h1({ children }) {
          return <h1 className="text-2xl font-bold mb-2">{children}</h1>;
        },
        h2({ children }) {
          return <h2 className="text-xl font-bold mb-2">{children}</h2>;
        },
        h3({ children }) {
          return <h3 className="text-lg font-bold mb-2">{children}</h3>;
        },
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
