import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Menu, MenuTrigger, MenuContent, MenuItem, MenuSeparator } from "@/components/ui/Menu";
import { Dialog, DialogContent, DialogClose } from "@/components/ui/Dialog";
import Button from "@/components/ui/Button";
import subscriptionManager from "@/app/SubscriptionManager";
import { copyToClipboard } from "@/app/utils";
import { formatMessage } from "@/app/notificationUtils";

const MoreHorizontalIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <circle cx="5" cy="12" r="2" />
    <circle cx="12" cy="12" r="2" />
    <circle cx="19" cy="12" r="2" />
  </svg>
);

const CardOverflowMenu = ({ notification }) => {
  const { t } = useTranslation();
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const handleMarkRead = () => {
    // Note: detail open also clears the dot — Story 3.5 handles that path with the same call.
    subscriptionManager.markNotificationRead(notification.id);
  };

  const handleCopy = () => {
    copyToClipboard(formatMessage(notification));
  };

  const handleDeleteSelect = () => {
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = () => {
    subscriptionManager.deleteNotification(notification.id);
    setDeleteConfirmOpen(false);
  };

  return (
    <>
      <Menu>
        <MenuTrigger asChild>
          <button
            type="button"
            aria-label={t("card_overflow_trigger_label")}
            className="p-1 rounded-sm text-muted hover:text-text hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring transition-colors"
          >
            <MoreHorizontalIcon />
          </button>
        </MenuTrigger>
        <MenuContent align="end">
          {notification.new === 1 && (
            <MenuItem onSelect={handleMarkRead}>
              {t("card_overflow_mark_read")}
            </MenuItem>
          )}
          <MenuItem onSelect={handleCopy}>
            {t("card_overflow_copy")}
          </MenuItem>
          <MenuSeparator />
          <MenuItem
            onSelect={handleDeleteSelect}
            className="text-priority-max focus:text-priority-max"
          >
            {t("card_overflow_delete")}
          </MenuItem>
        </MenuContent>
      </Menu>

      {/* Delete confirm — lives OUTSIDE the Menu so it survives menu unmount */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent title={t("card_overflow_delete_confirm_body")}>
          <div className="flex gap-2 justify-end mt-4">
            <DialogClose asChild>
              <Button variant="ghost" onClick={() => setDeleteConfirmOpen(false)}>
                {t("card_overflow_delete_confirm_cancel")}
              </Button>
            </DialogClose>
            <Button variant="primary" onClick={handleDeleteConfirm}>
              {t("card_overflow_delete_confirm_action")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CardOverflowMenu;
