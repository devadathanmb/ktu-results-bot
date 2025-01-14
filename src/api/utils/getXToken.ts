import { axios } from "../axios";
import { BypassData } from "./getBypassData";
import Logger from "@/utils/logger";

const logger = Logger.getLogger("BYPASS_CAPTCHA");

const X_TOKEN_URL = "http://captcha-bypass:3000/get_token";

interface XToken {
  x_token: string;
}

async function getXToken(bypassData: BypassData): Promise<XToken | null> {
  try {
    logger.debug("Fetching X-Token");
    const response = await axios.post(X_TOKEN_URL, bypassData, {
      cache: false,
    });
    const xToken: XToken = response.data;
    return xToken;
  } catch (error) {
    logger.error(`Error in fetching X-Token: ${error}`);
    throw error;
  }
}

export { getXToken };
