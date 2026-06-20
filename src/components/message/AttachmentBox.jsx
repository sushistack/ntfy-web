import { useState } from "react";
import { useTranslation } from "react-i18next";
import { isImage } from "@/app/notificationUtils";
import { formatBytes } from "@/app/utils";

const SAFE_URL = /^https?:\/\//i;

const DocumentIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
  </svg>
);

const AttachmentBox = ({ attachment }) => {
  const { t } = useTranslation();
  const [imgFailed, setImgFailed] = useState(false);

  if (!attachment) return null;
  if (!SAFE_URL.test(attachment.url)) return null;

  if (attachment.expires && attachment.expires * 1000 < Date.now()) {
    return <p className="text-body-sm text-muted">{t("notifications_attachment_link_expired")}</p>;
  }

  if (isImage(attachment) && !imgFailed) {
    return (
      <a
        href={attachment.url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={t("notifications_attachment_open_button")}
        className="block"
      >
        <img
          src={attachment.url}
          alt={t("notifications_attachment_image")}
          className="max-h-48 w-auto object-contain rounded-sm bg-surface-muted"
          onError={() => setImgFailed(true)}
        />
      </a>
    );
  }

  return (
    <a
      href={attachment.url}
      download={attachment.name}
      aria-label={t("detail_attachment_file_download_label", { name: attachment.name })}
      className="inline-flex items-center gap-2 px-3 py-2 rounded-sm bg-surface-muted border border-border text-body-sm text-text hover:bg-surface-active transition-colors"
    >
      <DocumentIcon />
      <span className="truncate max-w-[24ch]">{attachment.name}</span>
      {attachment.size > 0 && (
        <span className="text-muted text-caption shrink-0">{formatBytes(attachment.size)}</span>
      )}
    </a>
  );
};

export default AttachmentBox;
