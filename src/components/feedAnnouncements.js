export const findArrivingNotifications = (notifications, seenIds) =>
  notifications.filter((notification) => notification.new && !seenIds.has(notification.id));
