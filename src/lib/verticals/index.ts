import { medicareVerticalPack } from "@/lib/verticals/medicare";

export const verticalPacks = {
  medicare: medicareVerticalPack
};

export type SupportedVerticalSlug = keyof typeof verticalPacks;

export function getVerticalPack(slug: SupportedVerticalSlug = "medicare") {
  return verticalPacks[slug];
}
