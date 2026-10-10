import { table, integer, text } from 'sdk/db';

export const profiles = table('mochi_profiles', {
  userId: integer('user_id').primaryKey(),
  name: text('name').notNull().default('Friend'),
  hearts: integer('hearts').notNull().default(0),
  level: integer('level').notNull().default(1),
  lastDaily: text('last_daily'),
});