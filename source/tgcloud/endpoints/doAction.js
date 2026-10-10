import { performAction } from '../lib/mochi.js';

export default async function (input, ctx) {
  const user = ctx.initData?.user;
  if (!user) throw new Error('Open Mochi from inside Telegram.');
  const allowed = ['pet', 'quest', 'fortune', 'daily'];
  if (!allowed.includes(input?.action)) throw new Error('Unknown Mochi action.');
  const result = await performAction(user, input.action);
  return {
    message: result.message,
    gained: result.gained,
    profile: {
      name: result.profile.name,
      hearts: result.profile.hearts,
      level: result.profile.level,
      lastDaily: result.profile.lastDaily
    }
  };
}