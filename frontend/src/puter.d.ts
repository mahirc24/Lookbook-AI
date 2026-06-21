// Puter.js is loaded via a <script> tag in index.html and exposes a global `puter`.
interface PuterTxt2ImgOptions {
  model?: string;
  input_images?: string[];
  quality?: string;
}
interface PuterAI {
  txt2img(prompt: string, options?: PuterTxt2ImgOptions): Promise<HTMLImageElement>;
}
interface Puter {
  ai: PuterAI;
}
declare const puter: Puter;
