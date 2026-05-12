export function displayAuthor<
  T extends {
    guestAuthorName?: string | null;
    guestAuthorAvatar?: string | null;
    guestAuthorBio?: string | null;
    author?: {
      name?: string | null;
      avatar?: string | null;
      bio?: string | null;
    } | null;
  }
>(post: T) {
  const guestName = post.guestAuthorName?.trim() || null;
  const guestAvatar = post.guestAuthorAvatar?.trim() || null;
  const guestBio = post.guestAuthorBio?.trim() || null;

  const authorName = post.author?.name?.trim() || null;
  const authorAvatar = post.author?.avatar?.trim() || null;
  const authorBio = post.author?.bio?.trim() || null;

  return {
    name: guestName || authorName || null,
    avatar: safeImageUrl(guestAvatar) || safeImageUrl(authorAvatar) || null,
    bio: guestBio || authorBio || null,
  };
}
