export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  category: string;
  thumbnailUrl: string;
  readTimeMinutes: number;
  tags: string[];
  featured: boolean;
  publishedAt: Date;
  updatedAt: Date;
  status: "draft" | "published";
}

export interface Project {
  id: string;
  title: string;
  slug: string;
  category: string;
  description: string;
  body: string;
  thumbnailUrl: string;
  tags: string[];
  metrics: { label: string; value: string }[];
  publishedAt: Date;
  status: "draft" | "published";
}

export interface ChatMessage {
  role: "user" | "model";
  content: string;
  timestamp: Date;
}

export interface RagFile {
  id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  storageUrl: string;
  extractedText: string;
  tokenCount: number;
  active: boolean;
  uploadedAt: Date;
  updatedAt: Date;
}

export interface AnalyticsData {
  resumeDownloads: number;
  chatbotInteractions: number;
  totalVisitors: number;
}

export interface SearchPerformanceRow {
  keys: string[];
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}
