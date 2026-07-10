export const normalizeString = (value = "") => {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim().toLowerCase();
};

export const getConfiguredAdminEmail = (env = process.env) => {
  const configuredEmail = env.REACT_APP_ADMIN_EMAIL;
  if (typeof configuredEmail !== "string") {
    return "";
  }

  return normalizeString(configuredEmail);
};

export const isMatchingAdminEmail = (email, adminEmail) => {
  return normalizeString(email) === normalizeString(adminEmail);
};
