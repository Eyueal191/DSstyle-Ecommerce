const uploadMultipleFiles = (files, req) => {
  if (!files || !Array.isArray(files) || files.length === 0) return [];
  const host = req ? req.get("host") : null;
  const baseUrl = host ? `${req.protocol}://${host}` : "";

  return files.map((file) => {
    const normalizedPath = file.path.replace(/\\/g, "/");
    return baseUrl ? `${baseUrl}/${normalizedPath}` : `/${normalizedPath}`;
  });
};

export default uploadMultipleFiles;
