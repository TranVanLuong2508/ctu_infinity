import slugify from 'slugify';

export const generateUniqueSlug = (input: string): string => {
  const result = slugify(input, {
    replacement: '-',
    remove: undefined,
    lower: true,
    strict: true,
    locale: 'vi',
    trim: true,
  });

  return result;
};
