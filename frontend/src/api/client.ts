import axios from "axios";
import type { BrandKit, Job, Presets } from "../types";

export const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:8000";

const http = axios.create({ baseURL: API_BASE });

/** Prefix a relative /media/... URL returned by the backend with the API base. */
export function mediaUrl(path: string | null): string | undefined {
  if (!path) return undefined;
  return path.startsWith("http") ? path : `${API_BASE}${path}`;
}

export async function getOutputTypes(): Promise<string[]> {
  const { data } = await http.get<{ output_types: string[] }>("/output-types");
  return data.output_types;
}

export async function getPresets(): Promise<Presets> {
  const { data } = await http.get<Presets>("/presets");
  return data;
}

export async function listJobs(): Promise<Job[]> {
  const { data } = await http.get<Job[]>("/jobs");
  return data;
}

export interface CreateJobInput {
  outputTypes: string[];
  brandKit: BrandKit;
  image?: File | null;
  productUrl?: string;
}

export async function createJob(input: CreateJobInput): Promise<{ id: string; status: string }> {
  const form = new FormData();
  form.append("output_types", JSON.stringify(input.outputTypes));
  form.append("brand_kit", JSON.stringify(input.brandKit));
  if (input.productUrl) form.append("product_url", input.productUrl);
  if (input.image) form.append("image", input.image);
  const { data } = await http.post("/jobs", form);
  return data;
}

export async function getJob(id: string): Promise<Job> {
  const { data } = await http.get<Job>(`/jobs/${id}`);
  return data;
}
