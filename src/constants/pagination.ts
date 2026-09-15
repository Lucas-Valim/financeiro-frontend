/**
 * Page size for the categorias and favorecidos grids (infinite scroll).
 */
export const GRID_PAGE_LIMIT = 20;

/**
 * Page size used when a list feeds a select/combobox and must come whole.
 * The backend defaults `limit` to 20 and rejects anything above 100 with a
 * 400, so 100 is the most a single request can bring. Lists longer than
 * this are flagged via `isTruncated` by the hooks that use it.
 */
export const SELECT_OPTIONS_LIMIT = 100;
