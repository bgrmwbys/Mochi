import { getProfile } from '../lib/mochi.js';

export default async function (_input, ctx) {
  const user = ctx.initData?.user;
  if (!user) throw new Error('Open Mochi from inside Telegram.');
  const p = await getProfile(user);
  return { name: p.name, hearts: p.hearts, level: p.level, lastDaily: p.lastDaily };
}