import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogClose } from "@/components/ui/Dialog";
import { Sheet, SheetContent, SheetClose } from "@/components/ui/Sheet";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { cn } from "@/components/ui/utils";
import { useIsMobile } from "@/components/hooks";
import { validTopic } from "@/app/utils";
import { usePublishQueue } from "@/components/contexts/PublishQueueContext";
import { Dialog as RadixDialog } from "radix-ui";

const PRIORITIES = [
  { value: 2, labelKey: "publish_priority_low" },
  { value: 3, labelKey: "publish_priority_default" },
  { value: 4, labelKey: "publish_priority_high" },
  { value: 5, labelKey: "publish_priority_urgent" },
];

const PRIORITY_SELECTED_CLASSES = {
  2: "border-border text-muted",
  3: "border-border text-text",
  4: "border-priority-high text-priority-high bg-priority-high/10",
  5: "border-priority-max text-priority-max bg-priority-max/10",
};

const PRIORITY_UNSELECTED_CLASS = "border-border text-muted bg-transparent";

const PublishDialog = ({ open, onOpenChange, initialTopic, baseUrl }) => {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const { enqueue } = usePublishQueue();

  const [topic, setTopic] = useState(initialTopic ?? "");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [priority, setPriority] = useState(3);
  const [tags, setTags] = useState("");

  useEffect(() => {
    if (!open) setTopic(initialTopic ?? "");
  }, [initialTopic, open]);

  const resetForm = () => {
    setTopic(initialTopic ?? "");
    setTitle("");
    setBody("");
    setPriority(3);
    setTags("");
  };

  const handleOpenChange = (isOpen) => {
    onOpenChange(isOpen);
  };

  const handleSubmit = () => {
    if (!body.trim() || !validTopic(topic)) return;
    enqueue({
      baseUrl,
      topic,
      title: title.trim(),
      body,
      priority,
      tags: tags.trim()
        ? tags
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean)
        : undefined,
    });
    onOpenChange(false);
    resetForm();
  };

  const formContent = (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="publish-topic" className="text-caption font-semibold text-muted uppercase tracking-wide">
          {t("publish_dialog_topic_label")}
        </label>
        <input
          id="publish-topic"
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          aria-label={t("publish_dialog_topic_label")}
          className="w-full bg-surface-2 border border-control-border rounded-sm px-3 py-2 text-body-sm text-text focus:outline-none focus:ring-2 focus:ring-focus-ring"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="publish-title" className="text-caption font-semibold text-muted uppercase tracking-wide">
          {t("publish_dialog_title_label")}
        </label>
        <input
          id="publish-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          aria-label={t("publish_dialog_title_label")}
          className="w-full bg-surface-2 border border-control-border rounded-sm px-3 py-2 text-body-sm text-text focus:outline-none focus:ring-2 focus:ring-focus-ring"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="publish-body" className="text-caption font-semibold text-muted uppercase tracking-wide">
          {t("publish_dialog_body_label")}
        </label>
        <textarea
          id="publish-body"
          rows={4}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          aria-label={t("publish_dialog_body_label")}
          className="w-full bg-surface-2 border border-control-border rounded-sm px-3 py-2 text-body-sm text-text resize-none focus:outline-none focus:ring-2 focus:ring-focus-ring"
        />
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-caption font-semibold text-muted uppercase tracking-wide">{t("publish_dialog_priority_label")}</span>
        <div className="flex gap-2" role="group" aria-label={t("publish_dialog_priority_label")}>
          {PRIORITIES.map(({ value, labelKey }) => (
            <Chip
              key={value}
              variant="priority"
              as="button"
              type="button"
              onClick={() => setPriority(value)}
              aria-pressed={priority === value}
              className={cn("flex-1 border", priority === value ? PRIORITY_SELECTED_CLASSES[value] : PRIORITY_UNSELECTED_CLASS)}
            >
              {t(labelKey)}
            </Chip>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="publish-tags" className="text-caption font-semibold text-muted uppercase tracking-wide">
          {t("publish_dialog_tags_label")}
        </label>
        <input
          id="publish-tags"
          type="text"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          aria-label={t("publish_dialog_tags_label")}
          className="w-full bg-surface-2 border border-control-border rounded-sm px-3 py-2 text-body-sm text-text focus:outline-none focus:ring-2 focus:ring-focus-ring"
        />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        {isMobile ? (
          <SheetClose asChild>
            <Button variant="ghost" size="sm" aria-label={t("publish_dialog_close")}>
              {t("publish_dialog_close")}
            </Button>
          </SheetClose>
        ) : (
          <DialogClose asChild>
            <Button variant="ghost" size="sm" aria-label={t("publish_dialog_close")}>
              {t("publish_dialog_close")}
            </Button>
          </DialogClose>
        )}
        <Button size="sm" onClick={handleSubmit} disabled={!body.trim() || !validTopic(topic)} aria-label={t("publish_dialog_send")}>
          {t("publish_dialog_send")}
        </Button>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetContent side="bottom" className="p-6 max-h-dialog overflow-y-auto">
          <RadixDialog.Title className="text-subtitle font-semibold text-text mb-4">{t("publish_dialog_title")}</RadixDialog.Title>
          {formContent}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent title={t("publish_dialog_title")}>{formContent}</DialogContent>
    </Dialog>
  );
};

export default PublishDialog;
