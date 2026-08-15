export const resolveRequiredPermissions = (
  path: string,
  routePermissions: Readonly<Record<string, readonly string[]>>
): string[] => {
  const matchedRoute = Object.keys(routePermissions)
    .filter((route) => path === route || path.startsWith(`${route}/`))
    .sort((left, right) => right.length - left.length)[0];

  return matchedRoute ? [...routePermissions[matchedRoute]] : [];
};
