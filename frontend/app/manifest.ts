/** Generates the installable web application manifest. */
import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return { name: "ACE AI Commerce Platform", short_name: "ACE", description: "AI-powered shopping discovery, comparison, and support.", start_url: "/", display: "standalone", background_color: "#090b13", theme_color: "#7c6cff" };
}
