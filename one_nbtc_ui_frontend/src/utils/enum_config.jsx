// Configuration for enum values
export const registerEnums = {
  
};

export const getEnumValue = (type, value) => {
  return registerEnums[type]?.[value] || value;
};