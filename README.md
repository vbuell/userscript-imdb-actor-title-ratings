# userscript-imdb-actor-title-ratings

Greasemonkey, ViolentMonkey, Tampermonkey compatible userscript to show user's and overal ratings on IMDB actor page. That's a continuation of work made by Nonya Beesnes and Wardenclyffe Tower.

![Screenshot](https://user-images.githubusercontent.com/82733/87590368-aaca0280-c6b4-11ea-9c70-a4064a3361f7.png)

Configuration:
-------------

In order to show the current ratings the key for OMDB shoudl be configured. To do so:

1. Open http://www.omdbapi.com/apikey.aspx and register a new key for you (either FREE account or Patreon will work. FREE has a daily linit of 1000 queries)
2. Being on imdb actor's page, click *Monkey button in a toolbar and open "IMDB Configuration" ![IMDB Configuration](https://user-images.githubusercontent.com/82733/87590371-abfb2f80-c6b4-11ea-88e4-939e75de9130.png)
3. Put the key into "Omdb username" feid and Save

Notes: In order to show user's rating you have to logged in into IMDB. User ratings are being loaded using export API and since this is quite costly operation the data caches for 60 minutes. Bedcause of that you may see a stale data in a actor's movies list, which shoudl be refreshed within an hour.