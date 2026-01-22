import * as FileSystem from "expo-file-system";

type OcrClientDeps = {
  endpoint?: string;
  fetchImpl?: typeof fetch;
  readFileAsBase64?: (uri: string) => Promise<string>;
};

export function createOcrClient(deps: OcrClientDeps = {}) {
  const endpoint = deps.endpoint ?? process.env.EXPO_PUBLIC_OCR_ENDPOINT;
  const fetchImpl = deps.fetchImpl ?? fetch;
  const readFileAsBase64 =
    deps.readFileAsBase64 ??
    ((uri: string) =>
      FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      }));

  return {
    async requestOcr(photoUri: string): Promise<string> {
      if (!endpoint) {
        throw new Error("OCR endpoint not configured");
      }

      const imageBase64 = await readFileAsBase64(photoUri);
      const response = await fetchImpl(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64 }),
      });

      if (!response.ok) {
        throw new Error("OCR request failed");
      }

      const payload = await response.json();
      return String(payload.text ?? "");
    },
  };
}
