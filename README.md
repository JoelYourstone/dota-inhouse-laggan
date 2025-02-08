## Disclaimer:
All of this is very wonky and might not be the best implementation. Single coder, no review, feature before stability, etc etc.


_ANY CONTRIBUTION OF ANY KIND IS HIGHLY APPRECIATED_

MAKE SURE YOU HAVE CONSENT OF ALL THE PARTICIPANTS TO RECORD THEIR VOICE.


## Projects inside

### Discord bot (Typescript)
1. `cd discord-bot && npm install`
1. These 3 env vars are needed (add /discord-bot/.env.local)
   ```
   OPEN_API_KEY
   DISCORD_TOKEN_2
   DISCORD_TOKEN_1
   ```
   The discord bots should have sufficient permission and added to the guild you're working with. Not sure exactly which permissions I used (TODO).
1. `npm run bot1` or `npm run bot2`


See `botConfigs` in `discord-bot/src/util.ts` for some config.

See `discord-bot/src/commands` folders for all commands.

#### Commands, write these in any text channel in the guild it's connected to
* `!join` | `!join2`, the bot will join the voice channel of the one who typed the command. 
* `!here` will mark the text channel (or thread) as the current channel the bot will listen to for "play" commands. Every message in this channel will be interpreted as prefixed with `!play `.
* `!leave` all connected bots will disconnect.
* `!list` lists the available player slugs from `discord-bot/src/players.ts` (TODO prolly not expose everyones steam and discord id...)
* `!listen` will start recording the voice of players in the voice channel the bot is in and store the audio in the `discord-bot/src/recordings` folder. It will store in subfolders named after the user id. Name of the file is the timestamp of when the recording started.
* `!play <player_slug>` will play the latest recording of the player with the given slug (doesn't need to be transcribed).
* `!play <player_slug> <message>` will look for a transcription of the message in the database and play the corresponding audio file (algorithm depending on mode 'embed' or 'keyword').
* `!play <message>` will first random a player and then find the closest transcription of the message in the database and play the corresponding audio file (algorithm depending on mode 'embed' or 'keyword').
* `!play <message>!` will ignore player and just play the closest transcription of the message in the database (algorithm depending on mode 'embed' or 'keyword').
* `!mode <mode>` will set the mode to either 'embed' or 'keyword'.
  * `embed` mode will use the embeddings to find the closest match in the database. Voice clips has to bed both transcribed and embedded. Using OpenAI embeddings model.
  * `keyword` mode will do a simpler keyword search in the database, still using some postgres vector magic. Voice clips has to bed transcribed.


### Text to speech (Typescript)
1. `cd text-to-speech && npm install`
1. `docker compose up`
1. Needs the following env vars (add /text-to-speech/.env.local)
   ```
   OPEN_API_KEY
   ```
1. Have a recent version of ffmpeg installed and available in the path.

#### Database 
```
CREATE TABLE public.transcription_embeddings (
    transcription_id integer,
    embedding vector(1536)
);

CREATE TABLE public.transcriptions (
    user_discord_id text,
    file text,
    message text,
    path_on_disk text,
    debug_info jsonb,
    embedding_generated boolean,
    id integer
);
```


#### Modes
*  `npm run start`
   This will transcribe the audio, using the OpenAI `whisper` model & ffmpeg. It stores the results in the database. Reads from the `discord-bot/src/recordings` folder and skips files that are already transcribed.
*  `npm run start embed`
   This will generate embeddings for the transcribed messages. It stores the results in the database, in a separate table. Skips rows that already have embeddings.
*  `npm run start query`
   Some test tooling to query the database. Prolly use the discord bot to do this.

### browser-script (Javascript)
Ignore. Was trying to join discord with multiple accounts automatically. And create a OBS overlay for dota that tracks who is speaking etc. Not finished.

### Game State Integration (C#)
Basically just a clone of https://github.com/antonpup/Dota2GSI, but it sends a http request to the discord bot when a player tips another player. See that repo for more info.


# TODO
* Stop storing all the audio files on disk.
* Make a better way to figure out which files have been transcribed.
* Possible for players to opt-out of being recorded. (probably should be opt-in tbh)
* Don't hard code player list
* Don't include low quality transcriptions, right now all are included.
* Refine query modes, it's still not optimal:
  * Embeddings doesn't work great on short messages. "Hi" is not close to "Hello" since both are so short.
  * Keyword search is not optimal atm, if you search for one word, longer transcriptions will be more likely to be returned, if they contain the word more than once.
* Build a mode where it never audio clips, just in memory to re-play the last recording.
