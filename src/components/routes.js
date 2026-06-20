import config from "../app/config";
import { shortUrl } from "../app/utils";

const routes = {
  login: "/login",
  signup: "/signup",
  app: config.app_root,
  account: "/account",
  settings: "/settings",
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
