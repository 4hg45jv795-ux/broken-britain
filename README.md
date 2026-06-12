# Broken Britain — Vercel Deployment

## Files
- index.html       — the game (19KB, easy to share/edit)
- bg.jpg           — street background
- music.mp3        — Driver theme
- sprites/uk.png   — Union Jack fighter
- sprites/england.png — England fighter  
- sprites/scotland.png — Scotland fighter
- sprites/photog.png  — Photographer NPC
- sprites/crusader.png — ADD THIS when ready (see below)

## Adding the Crusader
1. Get the sprite from Gemini (transparent PNG background, side-view)
2. Name it crusader.png, put it in the sprites/ folder
3. In index.html, find the two commented lines:
   // {{key:'crusader', type:'img', src:'sprites/crusader.png'}},
   // {{id:'crusader',name:'The Crusader',flag:'ENGLAND (1099)'}},
   Uncomment both lines (remove the //)
4. Re-upload index.html + crusader.png to Vercel — done.

## Deploying to Vercel
1. Go to vercel.com → New Project → drag this whole folder in
2. No build settings needed — it's all static files
3. Your game will be live at a *.vercel.app URL

## Making changes in a new chat
- Just upload index.html (19KB) to a new Claude chat
- Ask for changes — Claude edits index.html only
- Re-upload the updated index.html to Vercel
- All other files (images, music) stay untouched on Vercel
