# DS Style Telegram Bot (`@DS_Style_bot`)

Role-aware Telegram bot and Mini App launcher for the DS Style store. It starts together with the
backend (`index.js`) and uses long polling, so only **one** running copy per bot token is allowed.

## What it does

- **Registers users**: `/start` links the Telegram account to a DS Style user and reads its role
  (`Admin`, `Seller` or `User`).
- **Role-based buttons**
  - Customers: open the DS Style shop (Mini App) and contact support (`SUPPORT_TELEGRAM_URL`, @Dsstyle1).
  - Admins and sellers: also open the admin dashboard and upload products.
- **Product upload wizard**: admins and sellers can add products step by step inside Telegram.
- **Order notifications**: new orders are sent to admins in this chat.

## Commands

| Command   | Allowed roles  | Description                                      |
| --------- | -------------- | ------------------------------------------------ |
| `/start`  | Everyone       | Registers the user and shows the welcome buttons |
| `/upload` | Admin, Seller  | Starts the product upload wizard                 |
| `/cancel` | Admin, Seller  | Aborts the active upload wizard                  |

## Configuration (`backend/.env` / `backend/.env.production`)

Never commit real tokens. Get the token from @BotFather.

```env
Bot_UserName=DS_Style_bot
TELEGRAM_BOT_USERNAME=DS_Style_bot
Bot_Token=<your-bot-token>
TELEGRAM_BOT_TOKEN=<your-bot-token>

FRONTEND_URL=https://dsstyle.endmartaddis.com          # Mini App "Open shop" button
ADMIN_FRONTEND_URL=https://admin-dsstyle.endmartaddis.com
SUPPORT_TELEGRAM_URL=https://t.me/Dsstyle1             # "Contact Seller" buttons

# Telegram IDs or usernames that get admin buttons (comma-separated)
ADMIN_TELEGRAM_IDS=
```
