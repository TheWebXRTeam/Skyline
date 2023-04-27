import { useEffect, useState } from "react";
import { loadTexture } from "./loadTexture";


export const useFeedDataTextures = (feedData) => {
  const [textures, setTextures] = useState([]);

  useEffect(() => {
    if (!feedData)
      return;

    const loadTextures = async () => {
      const texturesPromises = feedData.map((item) => loadTexture(item?.post?.author.avatar)
      );

      const loadedTextures = await Promise.all(texturesPromises);
      setTextures(loadedTextures);
    };

    loadTextures();
  }, [feedData]);

  return textures;
};
