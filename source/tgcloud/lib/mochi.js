import { db } from 'sdk';
import { eq } from 'sdk/db';
import { profiles } from '../schema.js';

export async function ensureProfile(user) {
  const userId = Number(user.id);
  const name = (user.first_name || 'Friend').slice(0, 80);
  await db.insert(profiles).values({ userId, name, hearts: 0, level: 1 })
    .onConflictDoUpdate({ target: profiles.userId, set: { name } }).run();
  return await db.select().from(profiles).where(eq(profiles.userId, userId)).get();
}

export async function getProfile(user) {
  return await ensureProfile(user);
}

export async function performAction(user, action) {
  const profile = await ensureProfile(user);
  const today = new Date().toISOString().slice(0, 10);
  let hearts = 0;
  let message = '';

  if (action === 'pet') {
    hearts = 2;
    message = 'Prrrr! Mochi has accepted your affection. 🐰';
  } else if (action === 'quest') {
    const quests = [
      'Drink a glass of water like the hydrated legend you are. 💧',
      'Send someone a nice message. Tiny kindness, big magic. 💌',
      'Stretch for 30 seconds. Your future self says thanks. 🌱',
      'Find one thing nearby that makes you smile. ✨',
      'Take three slow breaths. Mochi is breathing with you. 🌸'
    ];
    message = `Your tiny quest: ${quests[Math.floor(Math.random() * quests.length)]}`;
    hearts = 1;
  } else if (action === 'fortune') {
    const fortunes = [
      'A pleasant surprise is looking for you. Keep a little room for joy. 🍓',
      'Your next small step matters more than your perfect plan. 🌷',
      'Someone will appreciate the real you today. 💗',
      'The universe recommends a snack and fewer overthinking sessions. 🍪',
      'A good thing is quietly getting closer. 🌙'
    ];
    message = `Mochi's fortune: ${fortunes[Math.floor(Math.random() * fortunes.length)]}`;
    hearts = 1;
  } else if (action === 'daily') {
    if (profile.lastDaily === today) {
      return { profile, message: 'You already collected today’s daily hug. Come back tomorrow! 🌙', gained: 0 };
    }
    hearts = 5;
    message = 'Daily hug collected! Five hearts for showing up. 💖';
    await db.update(profiles).set({ lastDaily: today }).where(eq(profiles.userId, Number(user.id))).run();
  } else {
    return { profile, message: 'Mochi blinked at you in confusion. Try another button! 🐣', gained: 0 };
  }

  const newHearts = profile.hearts + hearts;
  const newLevel = Math.floor(newHearts / 10) + 1;
  await db.update(profiles).set({ hearts: newHearts, level: newLevel })
    .where(eq(profiles.userId, Number(user.id))).run();

  return {
    profile: { ...profile, hearts: newHearts, level: newLevel, lastDaily: action === 'daily' ? today : profile.lastDaily },
    message,
    gained: hearts
  };
}