import { api } from 'sdk';
import { performAction } from '../lib/mochi.js';

const labels = {
  pet: '🐰 Pet Mochi',
  quest: '🌱 Tiny quest',
  fortune: '🔮 Fortune cookie',
  daily: '💖 Daily hug'
};

export default async function (query) {
  if (!query?.from || !query?.message?.chat?.id) return;
  const action = query.data;
  if (!Object.hasOwn(labels, action)) {
    await api.answerCallbackQuery({ callback_query_id: query.id, text: 'Mochi blinked. Try again!' });
    return;
  }

  const result = await performAction(query.from, action);
  await api.answerCallbackQuery({ callback_query_id: query.id, text: result.message.slice(0, 180) });
  const p = result.profile;
  await api.sendMessage({
    chat_id: query.message.chat.id,
    text: `${result.message}\n\n🌸 ${p.name}'s Mochi Garden\n💖 Hearts: ${p.hearts}\n⭐ Level: ${p.level}${result.gained ? `\n✨ +${result.gained} heart${result.gained === 1 ? '' : 's'}` : ''}`,
    reply_markup: {
      inline_keyboard: [
        [{ text: labels.pet, callback_data: 'pet' }, { text: labels.quest, callback_data: 'quest' }],
        [{ text: labels.fortune, callback_data: 'fortune' }, { text: labels.daily, callback_data: 'daily' }]
      ]
    }
  });
}