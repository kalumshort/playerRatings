import { useNavigate, useParams } from "react-router-dom";
import useGroupData from "./useGroupsData"; // ✅ Import the hook we just updated

export const useAppNavigate = () => {
  const navigate = useNavigate();
  const { clubSlug } = useParams();

  // ✅ Get the resolved object from your custom hook
  // This handles looking up the ID in the new 'byGroupId' dictionary
  const { userHomeGroup } = useGroupData();

  const appNavigate = (path, options = {}) => {
    // 1. Global Paths - Navigate immediately without prefix
    // Added root "/" and public group pages to this list
    const globalPaths = [
      "/profile",
      "/global-select",
      "/",
      "/contact",
      "/privacy-policy",
    ];

    // Check for exact match OR if it's a public group link (e.g. /groups/123)
    if (globalPaths.includes(path) || path.startsWith("/groups/")) {
      navigate(path, options);
      return;
    }

    // 2. Determine the Context (Slug)
    // Priority: 1. Current URL (stay in current context) -> 2. User's Home Group -> 3. None
    let targetSlug = clubSlug;

    if (!targetSlug && userHomeGroup?.slug) {
      targetSlug = userHomeGroup.slug;
    }

    // 3. Construct the URL
    // Ensure path starts with "/" to avoid double slashes or missing slashes
    const cleanPath = path.startsWith("/") ? path : `/${path}`;

    const finalPath = targetSlug ? `/${targetSlug}${cleanPath}` : cleanPath;

    navigate(finalPath, options);
  };

  return appNavigate;
};
