// Which categories belong in sitemap-categories.xml.
//
// The storefront only renders /product-categories/<slug> as its own page when the
// category has at least one live product (see getProductCategories in
// productController). For an empty category the page just redirects to a parent or
// /shop, so listing it in the sitemap sends Google to URLs that redirect or look
// empty ("Page with redirect" / soft 404). Keep the sitemap to categories that render.

/**
 * @param {Array<{_id:any,title:string,slug?:string,isActive?:boolean}>} categories
 * @param {Iterable<any>} categoryIdsWithProducts  ids found in live products' categoryIds
 * @param {Iterable<string>} categoryNamesWithProducts  plain category names of live products that have no ids yet
 */
function categoriesForSitemap(categories, categoryIdsWithProducts, categoryNamesWithProducts) {
  const ids = new Set([...categoryIdsWithProducts].map(String));
  const names = new Set([...categoryNamesWithProducts].map((n) => String(n).toLowerCase()));
  return categories.filter(
    (c) =>
      c.slug &&
      c.isActive !== false &&
      (ids.has(String(c._id)) || names.has(String(c.title || '').toLowerCase()))
  );
}

module.exports = { categoriesForSitemap };
