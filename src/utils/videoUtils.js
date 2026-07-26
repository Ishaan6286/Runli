export function convertYoutubeToEmbed(url) {
  if (!url) return { embedUrl: "", thumbnail: "", videoId: "" };
  
  let videoId = "";
  try {
    const urlObj = new URL(url);
    if (urlObj.hostname === "youtu.be") {
      videoId = urlObj.pathname.substring(1);
    } else if (urlObj.pathname.includes("/shorts/")) {
      videoId = urlObj.pathname.split("/shorts/")[1].split("?")[0];
    } else if (urlObj.hostname.includes("youtube")) {
      videoId = urlObj.searchParams.get("v");
    } else {
      videoId = url; // Fallback in case just ID is passed
    }
  } catch {
    videoId = url; // Fallback
  }

  return {
    videoId,
    embedUrl: videoId ? `https://www.youtube.com/embed/${videoId}` : "",
    thumbnail: videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : ""
  };
}
