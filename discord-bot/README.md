# Discord Voice Bot

This is a Discord bot built in TypeScript which uses the latest `discord.js` (v14) along with `@discordjs/voice`. The bot can:

- Join a voice channel via a `!join` command.
- Capture individual users' audio streams and save them as raw PCM files in the `recordings/` directory.
- Play a pre-recorded file (`play.mp3`) via a `!play` command.
- Leave the voice channel with a `!leave` command.

## Prerequisites

- [Node.js](https://nodejs.org/) (v16.9.0 or higher)
- A Discord bot token (create one at [Discord Developer Portal](https://discord.com/developers/applications))

## Setup

1. **Clone the repository or copy the code files into a folder named `discord-bot`.**

2. **Install dependencies:**

   In your terminal, navigate to the project directory and run:
   ```
   npm install
   ```

3. **Configure your bot token:**

   Replace `'YOUR_BOT_TOKEN'` in `src/index.ts` with your actual Discord bot token. For a production-grade app, consider using environment variables to manage tokens safely.

4. **Prepare the playback file:**

   Place a file named `play.mp3` in the `dist` folder (or in the same folder as the compiled JavaScript files). If you run the bot using `ts-node`, place it in the root directory of the project (or adjust the file path in the code).

5. **Create a recordings directory (optional):**

   The bot will create a `recordings` folder on first run to save the audio streams, but you can also create it manually:
   ```
   mkdir recordings
   ```

## Running the Bot

For development, run:
`npm run dev`

This uses `ts-node` to run the TypeScript directly.

For production:

1. Compile the TypeScript:
   ```
   npm run build
   ```

2. Then start the bot:
   ```
   npm start
   ```

## How the Bot Works

- **!join:**  
  When you type `!join` in a text channel, the bot will check if you're connected to a voice channel. If so, it will join that channel and set up listeners for users’ audio. Each time a user speaks, their audio is recorded separately as a PCM file in the `recordings/` directory.

- **!play:**  
  While the bot is in a voice channel, typing `!play` will make it play `play.mp3`.

- **!leave:**  
  Typing `!leave` will make the bot disconnect from the voice channel.

## Customization

- You can later extend the audio capture logic to process individual streams further, convert PCM to other formats, or generate sound clips.
- Modify the command handling logic in `src/index.ts` as needed.

## License
This project is licensed under the MIT License.