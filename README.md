## The Emails Lab

This is a digitized version of the email lab from ENSI, J. Loundagin, L. Flammer, and/or J. Lederman (see the "Licensing & Attribution" section for a full citation).

(TODO: EXPLAIN LAB'S PURPOSE/ETC. HERE)

## How to Download & Use This Project

Above & to the right of the document list above this text, you should see a green "Code" button. If you click it, it should open a menu with a few options; if you're inexperienced with git, you'll probably want to choose "Download ZIP," then extract the ZIP file to wherever you want to save the project.

Once you've downloaded the files, all you'll have to do is upload them to whatever webhosting site you plan on using. I'm assuming whatever service you're using will have instructions on how to do so, so I'll leave the uploading up to you.

Alternatively, if you just want to run it on your local machine you can do so using Python's `http.server` command. However, be aware that THIS IS ONLY USEFUL IF YOU WANT TO **TEST** THE LAB to make sure everything's working correctly, and as such THIS METHOD **CANNOT** BE USED TO LET YOUR STUDENTS DO THE LAB. The python server will only be visible to the machine it is run on, so students on different machines will be unable to see the lab.
1. Download & install [Python](https://www.python.org/downloads/).
2. Open a terminal window (AKA Command Prompt on Windows machines). Here's how to do it in [Mac](https://support.apple.com/guide/terminal/open-or-quit-terminal-apd5265185d-f365-44cb-8b09-71a064a42125/mac), and in [Windows 10](https://www.isunshare.com/windows-10/4-ways-to-open-command-prompt-in-windows-10.html).
3. In the terminal, navigate to the directory where you saved the project files (specifically, the directory that houses this README.md file, index.html, and the "assets," "debugAssets", and "scripts" folders).
    - In case you haven't used the terminal before, the simplest way to find the correct directory is to navigate there in your file explorer, then copy the path from the explorer and enter `cd pasteFilePathHere` into the terminal (obviously replacing pasteFilepathHere with the filepath you copied). FYI, some terminals don't support ctrl+v to paste; instead, you need to use shift+Insert (or just retype the path manually).
    - To verify that you're in the correct directory, you can type `ls` (or `dir` on Windows command prompt) to display a list of all files & folders in the current directory.
4. Once you're in the directory with index.html, enter the command `python -m http.server` to start up the web server. After a few seconds, you should see a message beginning with "Serving HTTP on 0.0.0.0", which indicates that the server has launched successfully.
    - Quick note: the above command only works for Python versions 3.0 and above. If you have an older Python 2 installation, you'll instead want to use `python -m SimpleHTTPServer`
5. Once the server has launched, open your browser and enter the URL `localhost:8000`. If you see a prompt to enter your name, that means you're done!
6. Once you're done testing out the lab, you can shut down the server by either going to the terminal window and hitting ctrl+c (which in terminal applications is used to terminate a running process), or by simply closing the terminal window.
    - Just so you know, if you still see the lab page in your browser after shutting down the server that's completely fine - the lab doesn't need a connection to the server after it first loads, so even if the server closes you won't see any effect on the page open in your browser until you either refresh the page or try to open it in a new tab.

## Licensing & Attribution
Credit for the original lab & materials:<br>
*Original idea from ’92 ENSI; Revised Oct. ’96 by J. Loundagin; adapted for ENSIweb 2/00 by L. Flammer; adapted for emails Sept. ’15 by J. Lederman*.

Adapted for online use by Benjamin Roisen.<br>
I do not own any of the original lab material, including the instructions (including both the general lab structure and the actual wording of the instructions) and the email materials. I only take credit for adapting it for online use.[^1]

This project makes use of the [p5.js](https://p5js.org/) library, available under the terms of the GNU Lesser General Public License. You can view their copyright info [here](https://p5js.org/copyright.html).

[^1]: As for licensing my work on this project, rest assured that after spending several hours researching licenses I have come to the conclusion that I don't really care what you do with it, so long as:
- You don't sue me
- If you break anything, you don't make *me* fix it (I have enough problems fixing my own bugs, I'm not solving yours)
- You don't use the code for evil
- If you do end up using the code for evil, for the love of god don't do anything worse than wipe my name from all the documents, claim "I made this," and then charge ludicrous prices for it.
- Crediting me would be nice, but don't feel too bad if you forget. We all make mistakes :)
