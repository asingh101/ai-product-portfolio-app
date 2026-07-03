export type HeroCarouselImage = {
  src: string;
  alt: string;
};

export type HeroCarouselCmsItem = {
  src?: string;
  title?: string;
  description?: string;
};

/** Built-in hub hero slideshow, add entries here when shipping new static assets. */
export const DEFAULT_HERO_IMAGES: HeroCarouselImage[] = [
  {
    src: "/images/Pic1.jpg",
    alt: "Hub hero image",
  },
  {
    src: "/images/home-hero-strategy-session.jpg",
    alt: "Ankit Singh leading a product strategy session at a whiteboard",
  },
  {
    src: "/images/home-hero-fountain.jpg",
    alt: "Santa Clara campus fountain at sunset",
  },
  {
    src: "/images/home-hero-sobrato-mall.jpg",
    alt: "Abby Sobrato Mall at Santa Clara University",
  },
];

/** Uses dedicated `heroCarousel` CMS field only, never the Story Gallery. */
export function resolveHeroImages(
  heroCarousel?: HeroCarouselCmsItem[]
): HeroCarouselImage[] {
  const fromCms = (heroCarousel ?? [])
    .map((item) => {
      const src = typeof item.src === "string" ? item.src.trim() : "";
      if (!src) return null;
      const alt =
        (typeof item.description === "string" && item.description.trim()) ||
        (typeof item.title === "string" && item.title.trim()) ||
        "Hub hero image";
      return { src, alt };
    })
    .filter((item): item is HeroCarouselImage => item !== null);

  return fromCms.length >= 2 ? fromCms : DEFAULT_HERO_IMAGES;
}
