import { useEffect, useState } from "react";

import { getPublicPortfolio } from "../../lib/api";
import { normalizePublicPortfolio } from "../../lib/portfolio";

/*
 * Loads one published portfolio by slug.
 *
 * The public page is the only surface in this app that renders for someone with
 * no account, so this hook deliberately:
 *
 *   - reads nothing from localStorage and touches no synced module. The resume
 *     and portfolio both have account-scoped local copies (lib/resumeSchema.js,
 *     pages/Portfolio/portfolioStorage.js), and consulting either would show a
 *     viewer their OWN data on someone else's link;
 *   - distinguishes "no such link" from "we could not check", because telling a
 *     visitor "this portfolio does not exist" when the server is merely down is a
 *     lie they cannot act on; and
 *   - has an explicit `not_found` state rather than falling through to an empty
 *     portfolio, which would render a plausible-looking blank page.
 */

export const PUBLIC_PORTFOLIO_STATUS = {
  LOADING: "loading",
  READY: "ready",
  NOT_FOUND: "not_found",
  RATE_LIMITED: "rate_limited",
  OFFLINE: "offline",
  ERROR: "error",
};

const initialState = {
  slug: null,
  status: PUBLIC_PORTFOLIO_STATUS.LOADING,
  data: null,
  message: "",
};

/** Title shown in the browser tab, before a name is known. */
const FALLBACK_TITLE = "Portfolio · SmartResume";

export const usePublicPortfolio = (slug) => {
  const [state, setState] = useState(initialState);
  const requestSlug =
    typeof slug === "string" && slug.trim() !== "" ? slug : null;
  const stateMatchesSlug = state.slug === requestSlug;
  const status =
    requestSlug === null
      ? PUBLIC_PORTFOLIO_STATUS.NOT_FOUND
      : stateMatchesSlug
        ? state.status
        : PUBLIC_PORTFOLIO_STATUS.LOADING;
  const data = stateMatchesSlug ? state.data : null;
  const message = stateMatchesSlug ? state.message : "";

  useEffect(() => {
    let active = true;

    // A route with no slug cannot name a portfolio, so there is nothing to ask
    // the server for.
    if (requestSlug === null) {
      return () => {
        active = false;
      };
    }

    (async () => {
      const result = await getPublicPortfolio(requestSlug);

      if (!active) {
        return;
      }

      if (result.ok) {
        setState({
          slug: requestSlug,
          status: PUBLIC_PORTFOLIO_STATUS.READY,
          data: normalizePublicPortfolio(result.data),
          message: "",
        });

        return;
      }

      /*
       * 404 covers three cases that are intentionally indistinguishable from
       * the outside — never existed, revoked, and malformed. The message must
       * not guess which, or it would confirm whether a link was ever real.
       */
      if (result.status === 404) {
        setState({
          slug: requestSlug,
          status: PUBLIC_PORTFOLIO_STATUS.NOT_FOUND,
          data: null,
          message: "",
        });

        return;
      }

      if (result.status === 429) {
        setState({
          slug: requestSlug,
          status: PUBLIC_PORTFOLIO_STATUS.RATE_LIMITED,
          data: null,
          message:
            result.message ||
            "Too many requests. Please wait a moment and try again.",
        });

        return;
      }

      // status 0 means the request never reached the server.
      if (result.status === 0) {
        setState({
          slug: requestSlug,
          status: PUBLIC_PORTFOLIO_STATUS.OFFLINE,
          data: null,
          message:
            result.message ||
            "Cannot reach the SmartResume server right now.",
        });

        return;
      }

      setState({
        slug: requestSlug,
        status: PUBLIC_PORTFOLIO_STATUS.ERROR,
        data: null,
        message:
          result.message || "This portfolio could not be loaded right now.",
      });
    })();

    return () => {
      active = false;
    };
  }, [requestSlug]);

  /*
   * Name the tab after the person, and put it back on the way out. A stale
   * name from a previously visited portfolio would be misleading in a visitor's
   * tab strip or history.
   */
  useEffect(() => {
    if (status !== PUBLIC_PORTFOLIO_STATUS.READY) {
      return undefined;
    }

    const previous = document.title;
    const name = data?.portfolio?.profile?.name;

    document.title = name ? `${name} · SmartResume` : FALLBACK_TITLE;

    return () => {
      document.title = previous;
    };
  }, [status, data]);

  return { status, data, message };
};
