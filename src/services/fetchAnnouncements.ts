import { axios } from "api/axios";
import { ANOUNCEMENTS_URL } from "constants/constants";
import { Announcement } from "types/types";
import ServerError from "errors/ServerError";
import { stripHtml } from "string-strip-html";
import formatDate from "utils/formatDate";
import Logger from "@/utils/logger";

const logger = Logger.getLogger("FETCH_SERVICE");

async function fetchAnnouncements(
  pageNumber: number,
  dataSize: number,
  searchText = "",
  disableCache = false
): Promise<Announcement[]> {
  try {
    const payload = {
      number: pageNumber,
      size: dataSize,
      searchText,
    };

    let cache: boolean | any = {
      ttl: 1000 * 60 * 5,
    };

    if (disableCache) {
      cache = false;
    }

    const response = await axios.post(ANOUNCEMENTS_URL, payload, {
      cache: cache,
    });

    const relevantData = response.data.content.map((obj: any) => ({
      id: obj.id,
      subject: stripHtml(obj.subject || "").result,
      message: stripHtml(obj.message || "").result,
      date: formatDate(obj.announcementDate.split(" ")[0]),
      attachments: obj.attachmentList.map((attachment: any) => ({
        name: attachment.attachmentName,
        encryptId: attachment.encryptId,
      })),
    }));

    return relevantData;
  } catch (error: any) {
    logger.error(`Error in fetchAnnouncements: ${error}`);
    throw new ServerError();
  }
}

export default fetchAnnouncements;
