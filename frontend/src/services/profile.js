import api from "./axios";

/**
 * Update profile — name, bio, and/or profile picture in one call.
 * Uses FormData because a file may be included.
 *
 * @param {{ name?: string, bio?: string, profilePic?: File | null }} payload
 */
export const updateProfile = ({ name, bio, profilePic }) => {
  const formData = new FormData();

  if (name     !== undefined) formData.append("name", name);
  if (bio      !== undefined) formData.append("bio",  bio);
  if (profilePic)             formData.append("profilePic", profilePic);

  return api.patch("/auth/update-profile", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

/**
 * Remove profile picture only (sends PATCH with no file — backend clears it).
 */
export const removeProfilePic = () =>
  api.patch("/auth/update-profile", { removePhoto: "true" });
