import { useState } from "react";
import {
  AlertTriangle,
  Check,
  Copy,
  ExternalLink,
  Globe,
  Link2,
  Loader2,
  RefreshCw,
} from "lucide-react";

import {
  buildPublicUrl,
  enablePortfolioShare,
  revokePortfolioShare,
  updatePortfolioShare,
} from "../../lib/api";

/*
 * Publishing and sharing controls for the owner.
 *
 * Everything here is an explicit action by the signed-in user, and every one of
 * them talks to the server. Share state is NEVER derived from the portfolio
 * payload: the server owns it (see server/src/models/Portfolio.js), so this card
 * renders whatever the server last reported and nothing else.
 *
 * Publishing is a two-step operation, and the order matters:
 *
 *   1. the portfolio must already exist on the server, because the share
 *      endpoints refuse to create an empty one (an empty document would make
 *      `GET /api/portfolio` answer 200 with blank data, and the builder treats
 *      404 as "nothing on the server, keep my local edits" — so an empty
 *      document would silently replace a user's unsaved work);
 *   2. only then is sharing enabled.
 *
 * So `onEnsureSaved` is called first and its failure is surfaced verbatim:
 * publishing must never appear to succeed when the portfolio it points at was
 * never saved.
 *
 * Props:
 *   share          { enabled, slug, publicPath, showContact } — server truth
 *   onShareChange  receives the updated share object from the server
 *   onEnsureSaved  async () => ({ ok, message }) — saves the portfolio
 *   canPublish     false while the portfolio is mid-save elsewhere
 */

/** Copy to the clipboard, with a fallback for non-secure contexts. */
const writeToClipboard = async (text) => {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);

      return true;
    }
  } catch {
    // Permission denied or an insecure origin. Fall through to the fallback.
  }

  /*
   * `navigator.clipboard` only exists in a secure context, and the app is
   * routinely developed over plain http on a phone or on a LAN address.
   */
  try {
    const field = document.createElement("textarea");

    field.value = text;
    field.setAttribute("readonly", "");
    field.style.position = "fixed";
    field.style.opacity = "0";

    document.body.appendChild(field);
    field.select();

    const copied = document.execCommand("copy");

    document.body.removeChild(field);

    return copied;
  } catch {
    return false;
  }
};

/** One line of the published-link panel. */
const LinkRow = ({ label, value, mono }) => (
  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
    <span className="text-xs font-semibold text-[#64748B] sm:w-28 flex-shrink-0">
      {label}
    </span>

    <span
      className={`text-sm text-[#0F172A] break-all ${mono ? "font-mono" : ""}`}
    >
      {value}
    </span>
  </div>
);

const ShareCard = ({ share, onShareChange, onEnsureSaved, canPublish }) => {
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const isPublished = Boolean(share?.enabled);
  const publicUrl = buildPublicUrl(share?.publicPath);

  /** Run one server action, reporting any failure in the card. */
  const run = async (action, request, failureMessage) => {
    setBusy(action);
    setError("");

    try {
      const result = await request();

      if (!result.ok) {
        setError(result.message || result.error || failureMessage);

        return false;
      }

      if (result.data?.share) {
        onShareChange(result.data.share);
      }

      return true;
    } finally {
      setBusy(null);
    }
  };

  const handlePublish = async () => {
    // The portfolio must exist on the server before it can be shared.
    const saved = await onEnsureSaved();

    if (!saved?.ok) {
      setError(
        saved?.message || "Could not save your portfolio. Please try again.",
      );

      return;
    }

    await run(
      "publish",
      () => enablePortfolioShare(),
      "Could not publish your portfolio.",
    );
  };

  const handleRevoke = () =>
    run(
      "revoke",
      () => revokePortfolioShare(),
      "Could not stop sharing your portfolio.",
    );

  const handleRotate = () => {
    const confirmed = window.confirm(
      "Create a new link? The current link will stop working immediately, so anyone you have already sent it to will no longer be able to open it.",
    );

    if (!confirmed) {
      return;
    }

    return run(
      "rotate",
      () => updatePortfolioShare({ rotate: true }),
      "Could not create a new link.",
    );
  };

  const handleContactToggle = (nextValue) =>
    run(
      "contact",
      () => updatePortfolioShare({ showContact: nextValue }),
      "Could not update your contact settings.",
    );

  const handleCopy = async () => {
    if (!publicUrl) {
      return;
    }

    const copiedOk = await writeToClipboard(publicUrl);

    if (!copiedOk) {
      setError(
        "Could not copy automatically. Select the link and copy it manually.",
      );

      return;
    }

    setError("");
    setCopied(true);

    setTimeout(() => setCopied(false), 2500);
  };

  const isBusy = busy !== null;

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5">
      <div className="flex items-start gap-3">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
            isPublished
              ? "bg-[#ECFDF5] text-[#059669]"
              : "bg-[#F1F5F9] text-[#475569]"
          }`}
        >
          <Globe size={18} />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-base font-bold text-[#0F172A]">
            Share your portfolio
          </h3>

          <p className="text-xs text-[#64748B] mt-1 leading-5">
            {isPublished
              ? "Anyone with the link can view a read-only copy. They do not need a SmartResume account."
              : "Publish a public link to your portfolio and send it to anyone. No account required to view it."}
          </p>
        </div>
      </div>

      {/* PUBLISHED STATE */}

      {isPublished && share?.slug && (
        <div className="mt-5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4 space-y-3">
          <LinkRow label="Public link" value={publicUrl} mono />

          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-[#2563EB] text-white text-sm font-semibold hover:bg-[#1D4ED8] transition"
            >
              {copied ? <Check size={15} /> : <Copy size={15} />}
              {copied ? "Copied" : "Copy link"}
            </button>

            <a
              href={share.publicPath}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-[#E2E8F0] bg-white text-[#334155] text-sm font-semibold hover:bg-[#F8FAFC] transition"
            >
              <ExternalLink size={15} />
              Open
            </a>

            <button
              type="button"
              onClick={handleRotate}
              disabled={isBusy}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-[#E2E8F0] bg-white text-[#334155] text-sm font-semibold hover:bg-[#F8FAFC] transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {busy === "rotate" ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <RefreshCw size={15} />
              )}
              New link
            </button>
          </div>

          {/* CONTACT VISIBILITY */}

          <label className="flex items-start gap-3 pt-3 border-t border-[#E2E8F0] cursor-pointer">
            <input
              type="checkbox"
              checked={share.showContact === true}
              disabled={isBusy}
              onChange={(event) => handleContactToggle(event.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-[#CBD5E1] text-[#2563EB] focus:ring-[#2563EB]"
            />

            <span>
              <span className="block text-sm font-semibold text-[#334155]">
                Show my contact details
              </span>

              <span className="block text-xs text-[#64748B] mt-0.5">
                Your email address appears on the public page. Turn this off to
                share your work without publishing a way to contact you.
              </span>
            </span>
          </label>
        </div>
      )}

      {/* ACTIONS */}

      <div className="mt-5 flex flex-col sm:flex-row sm:items-center gap-3">
        {isPublished ? (
          <button
            type="button"
            onClick={handleRevoke}
            disabled={isBusy}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-[#FECACA] bg-[#FEF2F2] text-[#B91C1C] text-sm font-semibold hover:bg-[#FEE2E2] transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {busy === "revoke" && (
              <Loader2 size={15} className="animate-spin" />
            )}
            Stop sharing
          </button>
        ) : (
          <button
            type="button"
            onClick={handlePublish}
            disabled={isBusy || canPublish === false}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#0F172A] text-white text-sm font-semibold hover:bg-[#1E293B] transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {busy === "publish" ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <Link2 size={15} />
            )}
            Publish portfolio
          </button>
        )}

        {isPublished && (
          <p className="text-xs text-[#64748B]">
            The link stops working the moment you stop sharing.
          </p>
        )}
      </div>

      {/* ERROR */}

      {error && (
        <div className="mt-4 flex items-start gap-2 bg-[#FEF2F2] border border-[#FECACA] text-[#B91C1C] text-sm px-4 py-3 rounded-xl">
          <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

export default ShareCard;
