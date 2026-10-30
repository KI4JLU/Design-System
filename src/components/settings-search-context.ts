import * as React from "react";

/* The SettingsDialog's search context, in its own file so settings-dialog.tsx exports components only (react-refresh). */

export interface SettingsSearch {
  /** The dialog's search, trimmed and lower-cased; empty while there is none. */
  query: string;
  /** True while the open section is filtered to its matching rows (the query does not name it). */
  filtering: boolean;
}

export const SettingsSearchContext = React.createContext<SettingsSearch>({ query: "", filtering: false });

/**
 * The SettingsDialog's search, for a section's content. Rows inside a part that is not
 * rendered (a closed Collapsible, an unvisited tab) cannot be found: open such parts while
 * `filtering`, and the dialog hides the ones without a hit.
 */
export function useSettingsSearch(): SettingsSearch {
  return React.useContext(SettingsSearchContext);
}
