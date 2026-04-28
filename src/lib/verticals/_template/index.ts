export interface VerticalPack {
  slug: string;
  displayName: string;
  complianceRules: unknown[];
  workflowTemplates: unknown[];
  documentTemplates: unknown[];
  vocabulary: Record<string, string>;
  aiPrompts: Record<string, string>;
  seasonality: unknown;
}

export const verticalPackTemplate: VerticalPack = {
  slug: "_template",
  displayName: "Template vertical",
  complianceRules: [],
  workflowTemplates: [],
  documentTemplates: [],
  vocabulary: {},
  aiPrompts: {},
  seasonality: {
    description:
      "Future vertical packs must define the industry's operating seasons, filing windows, renewal cycles, or review periods."
  }
};
