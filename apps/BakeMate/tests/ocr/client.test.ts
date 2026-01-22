import { createOcrClient } from "../../lib/ocr/client";

it("returns OCR text", async () => {
  const client = createOcrClient({
    endpoint: "https://example.test/ocr",
    fetchImpl: async () => ({
      ok: true,
      json: async () => ({ text: "hello" }),
    }) as Response,
    readFileAsBase64: async () => "base64",
  });

  await expect(client.requestOcr("file://photo.jpg")).resolves.toBe("hello");
});
