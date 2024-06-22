import { Middleware } from "telegraf";
import { CustomContext } from "types/customContext.type";

const warningMiddleWare: Middleware<CustomContext> = async (ctx, next) => {
  if (ctx.message && ctx.text) {
    if (ctx.text === "/result" || ctx.text === "/oldresults") {
      await ctx.reply("Sorry, result checking is temporarily disabled.");
      return;
    }
  }

  next();
};

export default warningMiddleWare;