import { useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { idToClub } from "./Helper_Functions"; // Your mapping utility

export const useAppNavigate = () => {
  const navigate = useNavigate();
  const { clubSlug } = useParams(); // Get the slug currently in the URL
  const { activeGroup } = useSelector((state) => state.groupData);

  /**
   * @param {string} path - The internal path (e.g., "/schedule" or "/profile")
   * @param {object} options - Standard useNavigate options
   */
  const appNavigate = (path, options = {}) => {
    // 1. Handle Global Routes (Paths that don't need a club slug)
    const globalPaths = ["/profile", "/global-select"];
    if (globalPaths.includes(path)) {
      navigate(path, options);
      return;
    }

    // 2. Determine the Slug
    // Priority 1: Current URL slug (if the user is browsing a club)
    // Priority 2: User's active group slug (if logged in)
    let currentSlug = clubSlug;

    if (!currentSlug && activeGroup?.groupClubId) {
      currentSlug = idToClub[activeGroup.groupClubId]?.slug;
    }

    // 3. Build the Final Path
    // If we have a slug, prepend it. Otherwise, go to root.
    const finalPath = currentSlug ? `/${currentSlug}${path}` : path;

    navigate(finalPath, options);
  };

  return appNavigate;
};
