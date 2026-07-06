export interface TextBlock {
  type: "text";
  data: { text: string };
}

export interface HeadingBlock {
  type: "heading";
  data: { text: string; level: 2 | 3 };
}

export interface ImageBlock {
  type: "image";
  data: { url: string; caption?: string; alt?: string };
}

export interface GalleryBlock {
  type: "gallery";
  data: { images: { url: string; caption?: string; alt?: string }[] };
}

export interface QuoteBlock {
  type: "quote";
  data: { text: string; attribution?: string };
}

export interface MetricsBlock {
  type: "metrics";
  data: { items: { value: string; label: string }[] };
}

export interface ListBlock {
  type: "list";
  data: { style: "bullet" | "numbered"; items: string[] };
}

export interface DividerBlock {
  type: "divider";
  data: Record<string, never>;
}

export interface DocsBlock {
  type: "docs";
  data: {
    /** PDF slide deck URL (Firebase Storage download URL). */
    deckUrl?: string;
    /** PDF report URL (Firebase Storage download URL). */
    reportUrl?: string;
    /** Label for the report download button (default: "Download Report"). */
    reportButtonText?: string;
  };
}

export interface ChartBlock {
  type: "chart";
  data: {
    /** "bars" = horizontal bar chart per item. "grouped" = grouped bars by category. */
    chartType: "bars" | "grouped";
    title: string;
    subtitle?: string;
    /** Unit appended to values, e.g. "%" or "$" */
    unit?: string;
    /** For chartType "bars" */
    items?: {
      label: string;
      value: number;
      /** Normalisation ceiling — defaults to max value across items */
      max?: number;
      sublabel?: string;
      /** Accent color key */
      color?: "primary" | "emerald" | "amber" | "rose" | "violet" | "blue" | "muted";
    }[];
    /** For chartType "grouped" */
    categories?: string[];
    series?: {
      name: string;
      values: number[];
      color?: "primary" | "emerald" | "amber" | "rose" | "violet";
    }[];
  };
}

export type ContentBlock =
  | TextBlock
  | HeadingBlock
  | ImageBlock
  | GalleryBlock
  | QuoteBlock
  | MetricsBlock
  | ListBlock
  | DividerBlock
  | DocsBlock
  | ChartBlock;

export type BlockType = ContentBlock["type"];

export const BLOCK_META: Record<BlockType, { label: string; icon: string }> = {
  text: { label: "Text", icon: "notes" },
  heading: { label: "Heading", icon: "title" },
  image: { label: "Image", icon: "image" },
  gallery: { label: "Gallery", icon: "photo_library" },
  quote: { label: "Quote", icon: "format_quote" },
  metrics: { label: "Metrics", icon: "bar_chart" },
  list: { label: "List", icon: "format_list_bulleted" },
  divider: { label: "Divider", icon: "horizontal_rule" },
  docs: { label: "Docs", icon: "picture_as_pdf" },
  chart: { label: "Chart", icon: "show_chart" },
};

export function createEmptyBlock(type: BlockType): ContentBlock {
  switch (type) {
    case "text":
      return { type: "text", data: { text: "" } };
    case "heading":
      return { type: "heading", data: { text: "", level: 2 } };
    case "image":
      return { type: "image", data: { url: "", caption: "", alt: "" } };
    case "gallery":
      return { type: "gallery", data: { images: [] } };
    case "quote":
      return { type: "quote", data: { text: "", attribution: "" } };
    case "metrics":
      return { type: "metrics", data: { items: [{ value: "", label: "" }] } };
    case "list":
      return { type: "list", data: { style: "bullet", items: [""] } };
    case "divider":
      return { type: "divider", data: {} as Record<string, never> };
    case "docs":
      return { type: "docs", data: { deckUrl: "", reportUrl: "", reportButtonText: "Download Report" } };
    case "chart":
      return { type: "chart", data: { chartType: "bars", title: "", items: [{ label: "", value: 0 }] } };
  }
}
