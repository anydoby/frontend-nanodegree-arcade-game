frontend-nanodegree-arcade-game
===============================

1. The game requires the use of javascript Image API, which is restricted to only
   images which were loaded from the same host as the javascript file. Thus before
   launching the game it must be hosted on a webserver or in a simplest case a tiny
   webserver can be started in the application directory like this:
   
   		python -m SimpleHTTPServer
   
   When the web server starts point your browser to the http://localhost:8000 or the 
   port you have specified when you started the web server.
   
2. A player may move left/right/up or down with acceleration. The longer he is in movement
   the higher the speed. Do not touch the bugs. They kill instantly. When you reach the end
   of the level you get 10 points. If you touch a bug you lose a life. Bugs can not only move 
   in a straight line but also wobble to catch you and disappear.
   When you run out of lives the game is over. 