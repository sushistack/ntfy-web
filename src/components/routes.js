import config from "../app/config";
import { shortUrl } from "../app/utils";

const routes = {
  login: "/login",
  app: config.app_root,
  settings: "/settings",
  history: "/history",
  subscription: "/:topic",
  subscriptionExternal: "/:baseUrl/:topic",
  msgDetail: "/:topic/:msgId",
  forSubscription: (subscription) => {
    if (subscription.baseUrl !== config.base_url) {
      return `/${shortUrl(subscription.baseUrl)}/${subscription.topic}`;
    }
    return `/${subscription.topic}`;
  },
};

export default routes;
