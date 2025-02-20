// Helper to handle errors in wizards
import deleteMessage from "utils/deleteMessage";
import { CustomContext } from "types/customContext.type";
import InvalidDataError from "errors/InvalidDataError";
import ServerError from "errors/ServerError";
import DataNotFoundError from "errors/DataNotFoundError";
import { TelegramError } from "telegraf";
import Logger from "utils/logger";

const logger = Logger.getLogger("WIZARD_ERROR_HANDLER");

async function handleError(ctx: CustomContext, error: any) {
  if (error instanceof TelegramError) {
    if (error.response.error_code === 403) {
      if (ctx.scene.current) {
        return await ctx.scene.leave();
      }
      return;
    }
  }
  await deleteMessage(ctx, ctx.scene.session.waitingMsgId);
  if (error instanceof InvalidDataError) {
    await ctx.reply(error.message);
    ctx.wizard.selectStep(2);
    const msg = await ctx.reply("Please enter your KTU Registration Number", {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "🔙 Back",
              callback_data: "back_to_1",
            },
          ],
        ],
      },
    });
    ctx.scene.session.tempMsgId = msg.message_id;
    return ctx.wizard.next();
  } else if (error instanceof ServerError) {
    await ctx.reply(error.message);
  } else if (error instanceof DataNotFoundError) {
    await ctx.reply(error.message);
  } else {
    logger.error(`Wizard error: ${error}`);
  }
  await deleteMessage(ctx, ctx.scene.session.waitingMsgId);
  return await ctx.scene.leave();
}

export default handleError;
