import { api } from 'sdk';
import { ensureProfile, performAction } from '../lib/mochi.js';

const keyboard = {
  inline_keyboard: [
    [{ text: '🐰 Pet Mochi', callback_data: 'pet' }, { text: '🌱 Tiny quest', callback_data: 'quest' }],
    [{ text: '🔮 Fortune cookie', callback_data: 'fortune' }, { text: '💖 Daily hug', callback_data: 'daily' }]
  ]
};

export default async function (message) {
  if (!message?.chat?.id || !message?.from) return;
  const text = (message.text || '').trim();
  const name = message.from.first_name || 'friend';

  if (text.startsWith('/start')) {
    await ensureProfile(message.from);
    await api.sendMessage({
      chat_id: message.chat.id,
      text: `Hewwo, ${name}! 🌸\n\nI'm Mochi, your pocket-sized serotonin bunny. Pet me, collect hearts, get a tiny quest, or ask for a fortune.\n\nOpen my little garden for your stats and buttons, too!`,
      reply_markup: {
        inline_keyboard: [
          [{ text: '🌸 Open Mochi Garden', web_app: { url: 'https://REPLACE_WITH_YOUR_APP_URL/' } }],
          ...keyboard.inline_keyboard
        ]
      }
    });
    return;
  }

  if (text.startsWith('/help')) {
    await api.sendMessage({
      chat_id: message.chat.id,
      text: 'Mochi commands 🐰\n/start — meet Mochi\n/pet — give Mochi affection\n/quest — get a tiny quest\n/fortune — receive a fortune\n/daily — collect your daily hug\n/stats — check your hearts and level',
      reply_markup: keyboard
    });
    return;
  }

  const commands = { '/pet': 'pet', '/quest': 'quest', '/fortune': 'fortune', '/daily': 'daily' };
  const action = commands[text.split(/\s/)[0].toLowerCase()];
  if (action) {
    const result = await performAction(message.from, action);
    const p = result.profile;
    await api.sendMessage({
      chat_id: message.chat.id,
      text: `${result.message}\\n\\n🌸 ${p.name}'s Mochi Garden\\n💖 Hearts: ${p.hearts}\\n⭐ Level: ${p.level}${result.gained ? `\\n✨ +${result.gained} heart${result.gained === 1 ? '' : 's'}` : ''}`,
      reply_markup: keyboard
    });
    return;
  }

  if (text.startsWith('/stats')) {
    const p = await ensureProfile(message.from);
    await api.sendMessage({
      chat_id: message.chat.id,
      text: `🌸 Mochi Garden for ${p.name}\n💖 Hearts: ${p.hearts}\n⭐ Level: ${p.level}\n\nEvery 10 hearts unlocks a new level!`,
      reply_markup: keyboard
    });
    return;
  }

  await api.sendMessage({
    chat_id: message.chat.id,
    text: 'Mochi understood approximately 3% of that, but supports you 100%. 🐰💗\n\nTry /help or pick a button!',
    reply_markup: keyboard
  });
}