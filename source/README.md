# Mochi Garden — Telegram Serverless bot + Mini App

## Requirements
- A Telegram bot created with @BotFather
- Telegram Serverless enabled for that bot
- Node.js 18+
- A terminal on your computer

## 1. Create/link your project
If you already extracted this folder, open a terminal inside it and run:

    npm install
    npx tgcloud login

When prompted, paste the **CLI Access token** from @BotFather → your bot → Serverless → CLI Access. This is NOT the normal Bot API token.

## 2. Set the Mini App URL
Deploy once first (steps below), then copy the exact `https://app<app_id>.tgcloud.ai/` URL printed by `push`.

Open `tgcloud/handlers/message.js` and replace:
`https://REPLACE_WITH_YOUR_APP_URL/`
with that exact URL. Push again.

## 3. Deploy code and database
Run:

    npx tgcloud push
    npx tgcloud migrate

Review the migration prompt and confirm creation of the `mochi_profiles` table. If the CLI asks to build or sync, follow its output.

## 4. Configure the Mini App in BotFather
In @BotFather, open your bot → Serverless → Mini App Files and confirm the frontend files are deployed. If the UI asks for a Mini App URL, use the exact URL printed by `npx tgcloud push` (usually `https://app<app_id>.tgcloud.ai/`).

If your BotFather interface exposes a Mini App configuration field, set the same URL there. Then push one final time after changing the handler URL.

## 5. Try it
Open your bot and send `/start`. Try `/help`, `/stats`, then use the buttons.
The Mini App opens from the “Open Mochi Garden” button after the URL is configured.

## Important
- There is no VPS or backend service to operate. The `tgcloud/` code, database, and `dist/` Mini App are deployed to Telegram Serverless.
- The first `push` may not know the final app URL until it prints it. That is why the URL replacement is a second step.
- The project uses no external runtime packages. The CLI is only a local development/deployment tool.
- Keep the CLI Access token private. Never put it in source files or share it.
