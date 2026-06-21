export interface BrandKit {
  ethnicity?: string;
  age?: string;
  body_type?: string;
  background?: string;
  pose?: string;
  scene?: string;
  lighting?: string;
  color_palette: string[];
  // reference image URLs of the selected presets
  model_image?: string;
  pose_image?: string;
  background_image?: string;
}

export type AssetStatus = "queued" | "running" | "completed" | "failed";

export interface Asset {
  type: string;
  status: AssetStatus;
  url: string | null;
  error: string | null;
}

export type JobStatus = "queued" | "running" | "completed" | "failed";

export interface ModelPreset {
  id: string;
  label: string;
  ethnicity: string;
  age: string;
  body_type: string;
  image?: string;
}

export interface OptionPreset {
  id: string;
  label: string;
  value: string;
  category?: string;
  image?: string;
}

export interface Presets {
  models: ModelPreset[];
  backgrounds: OptionPreset[];
  poses: OptionPreset[];
}

export interface Job {
  id: string;
  status: JobStatus;
  created_at: string;
  updated_at: string;
  product_url: string | null;
  brand_kit: BrandKit;
  output_types: string[];
  assets: Asset[];
  error: string | null;
}
