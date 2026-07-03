import type { Schema } from "hast-util-sanitize";
import { defaultSchema } from "hast-util-sanitize";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";

/** Allowed `class` values on `<span>` from the CMS toolbar (font-size presets). */
const CMS_SIZE_CLASS = /^cms-size-(sm|base|lg|xl|2xl)$/;

export const CMS_SIZE_CLASS_NAMES = [
  "cms-size-sm",
  "cms-size-base",
  "cms-size-lg",
  "cms-size-xl",
  "cms-size-2xl",
] as const;

const cmsMarkdownSanitizeSchema: Schema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    span: [...(defaultSchema.attributes?.span ?? []), ["className", CMS_SIZE_CLASS]],
  },
};

/**
 * Rehype pipeline for trusted CMS markdown: parse a small subset of HTML, then sanitize.
 * Must stay in sync with {@link CMS_SIZE_CLASS_NAMES} and `globals.css`.
 */
export const cmsMarkdownRehypePlugins = [
  rehypeRaw,
  [rehypeSanitize, cmsMarkdownSanitizeSchema] as [typeof rehypeSanitize, Schema],
];
