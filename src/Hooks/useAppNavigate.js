import { useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";

export const useAppNavigate = () => {
  const navigate = useNavigate();
  const { clubSlug } = useParams(); // Get the slug currently in the URL
  const { userHomeGroup } = useSelector((state) => state.groupData);

  const appNavigate = (path, options = {}) => {
    const globalPaths = ["/profile", "/global-select"];
    if (globalPaths.includes(path)) {
      navigate(path, options);
      return;
    }

    let currentSlug = clubSlug;

    if (!currentSlug && userHomeGroup?.groupClubId) {
      currentSlug = userHomeGroup?.slug || null;
    }

    const finalPath = currentSlug ? `/${currentSlug}${path}` : path;

    navigate(finalPath, options);
  };

  return appNavigate;
};
