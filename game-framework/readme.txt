============================================================
 VIBE-CODED GAMES — STARTER PROJECT
============================================================

Hi! You're going to make a game in your web browser by
describing it to an AI. The AI writes the code. You don't
need to know JavaScript.


------------------------------------------------------------
 FIRST: MAKE THIS SKETCH YOUR OWN  (do this ONCE)
------------------------------------------------------------

Right now you're looking at the shared "AIPI Game Starter"
sketch. If you start typing into sketch.js here, you'll
either be blocked or your changes won't save under your
account. So before anything else:

  1. Sign in to editor.p5js.org with your Google account
     (top-right corner of the editor).

  2. Click File ▸ Duplicate.

     You'll be taken to a new sketch — a fresh copy that
     belongs to you. The browser tab title will change
     from "AIPI Game Starter" to something like "p5.js
     Web Editor | AIPI Game Starter copy".

  3. Click the title at the top of the editor and rename
     your copy. Pick whatever you want — "Asteroid Jumper",
     "Bubble Pop", "My Cool Game", anything.

  4. Click File ▸ Save (or press Ctrl+S / Cmd+S).

You're now working in YOUR sketch. Anything you do from
here on saves to your account.

Click the Play button (▶) to make sure it works. You
should see a working title screen — press Enter to start,
P to pause. That's the starting point you'll grow from.


------------------------------------------------------------
 HOW THIS WORKS
------------------------------------------------------------

The "vibe-coding" loop:

   1. You describe what you want your game to do.
   2. The AI replies with a chunk of code.
   3. You paste the code into sketch.js.
   4. You click Play and see what happened.
   5. You decide what to change next, and you do it again.

Each lap takes about a minute. You'll do a lot of laps.


------------------------------------------------------------
 STEP-BY-STEP, YOUR FIRST TIME
------------------------------------------------------------

  1. Open prompt.txt. SELECT ALL of it. COPY it.

  2. Open your AI helper (Claude, ChatGPT, Gemini, or
     Copilot). Start a new chat.

  3. PASTE prompt.txt as the first message. Send it.
     The AI will say it's ready.

  4. Now describe your game. Examples:

        "I want a side-scrolling space game where I dodge
         asteroids and shoot enemies."

        "Make a game where I'm a frog jumping between
         lily pads, and the pads sink after I leave them."

        "Update my game so that a boss appears at 100 pts."

  5. The AI replies with a code block. COPY everything
     inside the code block.

  6. In your editor, click sketch.js, SELECT ALL the
     existing code, and PASTE over it.

  7. Click Play. Try the game.

  8. Go back to the AI chat. Tell it what to change next.
     Loop from step 5.


------------------------------------------------------------
 !!!  IMPORTANT  !!!
------------------------------------------------------------

EVERY time you start a NEW chat with the AI, you have to
paste prompt.txt as the very first message. Without it,
the AI doesn't know about this framework and will write
code that won't work here.

If you're picking up where you left off, also paste your
current sketch.js so the AI sees the latest version. A
good "fresh chat" first message looks like:

       [contents of prompt.txt]

       Here's my current sketch.js — please add lasers
       when I press space:

       [contents of your sketch.js]


------------------------------------------------------------
 THE FILES IN THIS PROJECT
------------------------------------------------------------

   sketch.js      <-- YOUR GAME. The AI writes this. You
                      paste its replies here.

   framework.js   The "engine" that runs your game.
                  Don't touch — and tell the AI not to
                  touch it either. (The prompt already
                  tells the AI this, so you should be ok.)

   index.html     Loads the libraries. Don't change.

   style.css      Empty. Ignore.

   readme.txt     This file.

   prompt.txt     The thing you paste into the AI first.


------------------------------------------------------------
 WHAT THE FRAMEWORK ALREADY DOES
------------------------------------------------------------

These all work without you asking the AI for them. They're
just there in every game on this framework:

   * Title screen with a menu
   * Pause when you press P
   * "How to Play" screen
   * Top-5 high-score board with name entry
   * Game Over screen
   * Sound effects, theme music, music selector
   * Volume sliders, mute key, optional time limit
   * Screen shake, score popups, smooth fades

DON'T ask the AI to "add a pause menu" or "save high
scores" or "add a music slider" — you already have those.
Spend your prompts on the GAMEPLAY itself.


------------------------------------------------------------
 KEYBOARD SHORTCUTS YOUR PLAYERS GET
------------------------------------------------------------

Once your game is running, these always work, in any game:

   P or Esc       Pause
   M              Mute / unmute everything
   UP / DOWN      Navigate menus  (or use the mouse)
   Enter          Confirm
   LEFT / RIGHT   Adjust a slider, cycle an option


------------------------------------------------------------
 PROMPTING TIPS
------------------------------------------------------------

   * ONE change at a time. The smaller and clearer your
     ask, the better the AI does. Don't pile ten requests
     into one message.

   * DESCRIBE the behavior, not the code. "When I press
     space the player jumps" beats "add an event listener
     for the spacebar key."

   * TEST after every paste. Don't stack five AI replies
     on top of each other before hitting Play.

   * IF SOMETHING BREAKS, tell the AI. Copy the red error
     message from the console (the box at the bottom of
     the editor), paste it into the chat, and ask the AI
     to fix it.

   * BORROW from games you know. The AI knows about
     power-ups, lives, levels, bosses, combos, dashes,
     cooldowns, parries — describe the feel and it'll
     figure out the mechanic.

   * IF THE AI GOES OFF-TRACK, paste your last working
     sketch.js back into the chat and re-anchor: "Forget
     the previous changes. Here's the version that worked.
     Now add X."


------------------------------------------------------------
 START SMALL
------------------------------------------------------------

Pick ONE thing your game does. Get that working. THEN add
the next thing. A simple, polished game is way more fun to
play (and to demo) than a complicated, half-broken one.

Good first games to ask the AI for:

   * Catch falling objects with a paddle
   * Dodge things flying in from the right
   * Click bubbles before they pop
   * Jump between platforms
   * Eat dots while avoiding ghosts
   * Shoot UFOs that get faster over time

Start with one of those (or your own version) and add
flavor as you go. Have fun!
