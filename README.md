Duck Game: 

Duck Game is a three-level browser platformer inspired by Assumption University’s Duck Day. Guide the duck across platforms, land on each red carpet, and reach the pond celebration.

Run Locally: 

Install Python 3, download or clone the project, and open the "platform-game" folder in Cursor. In the terminal, run: python3 -m http.server 8765 --bind 127.0.0.1

Leave the terminal running and open "http://127.0.0.1:8765" in your browser. The game loads Pyodide from a CDN, so an internet connection is required. There are no Python packages to install with "pip". 

The browser runtime is Pyodide 0.26.4, loaded from jsDelivr. An internet connection is required. The local server uses Python 3, and no additional pip packages are required.

How to play: 

- Space: starts the game.
- Left arrow and right arrow: move the duck left and right.
- Up arrow:  jumps up and forward to the right with one tap.
- R: restarts from Level 1 after Game Over.

Level 1 uses separate grass circles. Level 2 introduces horizontally moving platforms. Level 3 adds thundercloud platforms that rise and lower at different times and a moving fireball. Land on the red carpet to complete each level.

Each level starts with three lives. A fall or fireball hit costs one life. With lives remaining, the duck returns to the start of the current level. At zero lives, the game displays Game Over. Complete all three levels to win.

How it works: 

Python runs in the browser through Pyodide and handles game logic such as jumping, platform landings, level transitions, and lives. JavaScript reads keyboard input and draws the game. I used Cursor Agent to help build and revise the game and ChatGPT to help plan prompts and playtests. I tested the gameplay in my browser.