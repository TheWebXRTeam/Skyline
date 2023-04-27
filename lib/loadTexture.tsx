import { TextureLoader } from "three";
const defaultTexture =
  "https://cdn.bsky.social/imgproxy/9Th8ZuZuEvfOEohn22gMWnj7f7Cj31bonAtJSTUMH0s/rs:fill:1000:1000:1:0/plain/bafkreiftyjy6k3t2yi5hh7gwin4p4hkuhp3kqxbzbbzr4gjsgotvcyk73e@jpeg";

export const loadTexture = async (url) => {
  try {
    const apiUrl = "/api/image-proxy";
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url: url ?? defaultTexture }),
    });
    const jsonResponse = await response.json();
    const base64Image = jsonResponse.base64Image;
    const binaryImage = atob(base64Image.split(",")[1]);
    const arrayBuffer = new ArrayBuffer(binaryImage.length);
    const uint8Array = new Uint8Array(arrayBuffer);

    for (let i = 0; i < binaryImage.length; i++) {
      uint8Array[i] = binaryImage.charCodeAt(i);
    }

    const blob = new Blob([uint8Array], { type: "image/jpeg" });
    const newUrl = URL.createObjectURL(blob);
    const newTexture = new TextureLoader().load(newUrl);

    return newTexture;
  } catch (error) {
    console.error("Error loading texture:", error);
  }
};
