export const FEEDBACK_MAX_FILES = 5;
export const FEEDBACK_MAX_FILE_BYTES = 10 * 1024 * 1024;

export const FEEDBACK_ACCEPTED_MIME = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
] as const;

export const FEEDBACK_ACCEPT_ATTR =
  'image/jpeg,image/png,image/webp,image/gif,application/pdf,.pdf';

export const isFeedbackFileAllowed = (file: File): boolean => {
  if (file.size > FEEDBACK_MAX_FILE_BYTES) return false;
  if (FEEDBACK_ACCEPTED_MIME.includes(file.type as (typeof FEEDBACK_ACCEPTED_MIME)[number])) {
    return true;
  }
  const lower = file.name.toLowerCase();
  return lower.endsWith('.pdf') || /\.(jpe?g|png|webp|gif)$/.test(lower);
};
