export const filterResponse = (data: any, fields: string[]) => {
  const result: any = {};

  fields.forEach((field) => {
    if (field in data) {
      result[field] = data[field];
    }
  });

  return result;
};

export const excludeFields = (data: any, fieldsToExclude: string[]) => {
  const result: any = {};

  Object.keys(data).forEach((key) => {
    if (!fieldsToExclude.includes(key)) {
      result[key] = data[key];
    }
  });

  return result;
};
