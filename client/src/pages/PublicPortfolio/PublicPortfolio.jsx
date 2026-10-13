import { Link, useParams } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Loader2,
  Link2Off,
  WifiOff,
} from "lucide-react";

import PortfolioDocument from "../../components/PortfolioDocument/PortfolioDocument";
import {
  PUBLIC_PORTFOLIO_STATUS,
  usePublicPortfolio,
} from "./usePublicPortfolio";

/*
 * The published, read-only portfolio at /p/:slug.
 *
 * This page is the ONLY one in the app that is reached without a session, and
 * it is deliberately built unlike the rest:
 *
 *   - no Sidebar, no AuthContext, no app chrome. A visitor has no account here
 *     and should not be shown navigation for one.
 *   - no local storage is read. The viewer's own saved resume and portfolio
 *     live on this device under their own account scope, and consulting either
 *     would render the viewer's data on someone else's link.
 *   - the document itself is the shared `PortfolioDocument` — the same
 *     component the builder's preview uses, so what the owner previews is what
 *     a visitor sees.
 */

/** Centred screen used for every non-rendering state. */
const StatusScreen = ({ icon, title, description, children }) => (
  <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center px-4 py-16">
    <div className="w-full max-w-md bg-white border border-[#E2E8F0] rounded-2xl p-8 text-center">
      <div className="w-12 h-12 mx-auto rounded-xl bg-[#F1F5F9] text-[#475569] flex items-center justify-center mb-5">
        {icon}
      </div>

      <h1 className="text-lg font-bold text-[#0F172A]">{title}</h1>

      {description && (
        <p className="text-sm text-[#64748B] mt-2 leading-6">{description}</p>
      )}

      {children && <div className="mt-6">{children}</div>}
    </div>
  </div>
);

/** Sits above every state so the brand is always reachable. */
const PublicHeader = () => (
  <header className="bg-white border-b border-[#E2E8F0]">
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
      <Link to="/" className="flex items-center gap-2 text-[#0F172A] font-bold">
        <span className="w-8 h-8 rounded-lg bg-[#2563EB] text-white text-sm font-bold flex items-center justify-center">
          SR
        </span>
        SmartResume
      </Link>

      <Link
        to="/register"
        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-[#E2E8F0] text-[#334155] text-sm font-semibold hover:bg-[#F8FAFC] transition"
      >
        Create your own
        <ArrowRight size={15} />
      </Link>
    </div>
  </header>
);

/* ------------------------------------------------------------------ */
/* Non-ready states                                                    */
/* ------------------------------------------------------------------ */

const LoadingScreen = () => (
  <StatusScreen
    icon={<Loader2 size={22} className="animate-spin" />}
    title="Loading portfolio"
    description="Fetching this portfolio's published content."
  />
);

const NotFoundScreen = () => (
  <StatusScreen
    icon={<Link2Off size={22} />}
    title="This portfolio isn't available"
    description="The link may be incorrect, or the owner may have stopped sharing this portfolio."
  >
    <Link
      to="/"
      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#2563EB] text-white text-sm font-semibold hover:bg-[#1D4ED8] transition"
    >
      <ArrowLeft size={16} />
      Go to SmartResume
    </Link>
  </StatusScreen>
);

const OfflineScreen = ({ message }) => (
  <StatusScreen
    icon={<WifiOff size={22} />}
    title="Couldn't reach the server"
    description={message || "Check your connection, then try again."}
  >
    <button
      type="button"
      onClick={() => window.location.reload()}
      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#2563EB] text-white text-sm font-semibold hover:bg-[#1D4ED8] transition"
    >
      Try again
    </button>
  </StatusScreen>
);

const ErrorScreen = ({ message }) => (
  <StatusScreen
    icon={<AlertTriangle size={22} />}
    title="Something went wrong"
    description={message || "This portfolio could not be loaded."}
  >
    <button
      type="button"
      onClick={() => window.location.reload()}
      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#2563EB] text-white text-sm font-semibold hover:bg-[#1D4ED8] transition"
    >
      Try again
    </button>
  </StatusScreen>
);

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

const PublicPortfolio = () => {
  const { slug } = useParams();
  const { status, data, message } = usePublicPortfolio(slug);

  if (status === PUBLIC_PORTFOLIO_STATUS.LOADING) {
    return <LoadingScreen />;
  }

  if (status === PUBLIC_PORTFOLIO_STATUS.NOT_FOUND) {
    return <NotFoundScreen />;
  }

  if (status === PUBLIC_PORTFOLIO_STATUS.OFFLINE) {
    return <OfflineScreen message={message} />;
  }

  // Rate limiting and any unexpected failure share a screen: both are
  // "temporary, try again", and neither is the visitor's fault.
  if (status === PUBLIC_PORTFOLIO_STATUS.RATE_LIMITED) {
    return <ErrorScreen message={message} />;
  }

  if (status !== PUBLIC_PORTFOLIO_STATUS.READY || !data) {
    return <ErrorScreen message={message} />;
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      <PublicHeader />

      <main className="flex-1">
        {/*
          Constrained on wide screens so the document keeps a readable measure,
          and edge-to-edge on phones where the theme background should fill the
          viewport. The theme colours come from PortfolioDocument itself.
        */}
        <div className="max-w-4xl mx-auto w-full sm:py-8 sm:px-6">
          <div className="bg-white sm:rounded-2xl sm:border sm:border-[#E2E8F0] sm:shadow-sm overflow-hidden">
            <PortfolioDocument
              portfolio={data.portfolio}
              resume={data.resume}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default PublicPortfolio;
