//All the global variables...
let images = []; //array to store email images
let thumbnails = []; //array to store email thumbnails
let emailPool = []; //array to store locked ("in the envelope") emails to draw from
let unlockedEmails = []; //array to store unlocked emails
//global variables for user input
let username; //name of the user
let initialHypothesis, initialReasoning; //hypothesis/reasoning from round 1
let updatedHypothesis, updatedReasoning; //hypothesis/reasoning from round 2
let thirdHypothesis, thirdReasoning; //hypothesis/reasoning from round 3
let finalHypothesis, finalReasoning; //hypothesis/reasoning from round 4
//global variables for state tracking
const states = {
    SETUP: 0,               //initial setup; ask for student's name
    INITIAL_HYPOTHESIS: 1,  //unlock 4 emails; form 1st tentative hypothesis
    UPDATED_HYPOTHESIS: 2,  //unlock 4 more emails; form 2nd tentative hypothesis
    THIRD_HYPOTHESIS: 3,    //unlock 2 final emails; form 3rd tentative hypothesis
    FINAL_HYPOTHESIS: 4,    //meet w/ other groups to compare data; form a final hypothesis
    QUESTIONS: 5,           //ask a series of followup/review questions
    END: 6                  //save user input & unlocked emails to PDF for assignment submission
};
let state = states.SETUP; //tracks where we are in the lab
let inZoomView = false; //whether or not we're currently zoomed in on an email
let zoomedPos; //stores the (r,c) position of the zoomed-in email in the alignment grid
let dragStartPos; //if we're dragging an email around, this stores where it used to be
let passedOrigin = false; //flag used to identify whether a push chain overrode the dragged email's original position. Part of a (hopefully) temporary workaround (see notes on PerformShift() in alignmentGrid.js).
let doDragHighlighting = true; //whether to highlight the spot the student is going to drop an email into
//global variables for input elements
let inputDiv; //reference to the <div> parent used for all input boxes
let hypoInputBox, reasonInputBox; //input boxes for hypothesis & reasoning
let hypoLabel, reasonLabel; //instructional text for hypothesis & reasoning boxes
let submitButton; //button used to submit hypothesis & reasoning
let questionInputBoxes = []; //array of references to input boxes for the final questions
let questionLabels = []; //array of references to the text of the final questions

let alignGrid; //AlignmentGrid object used in the grid-based menu system

let debugMode = false; //whether to run in debug mode

let qText = [ //array of the post-lab questions' text so I can spawn the question boxes via for loop
    "<b>1.</b> In this activity, you didn't get all of the data (the emails) at the same time.  How is this similar to how scientists work in the \'real world?\'",
    "<b>2.</b> As you got access to more emails, explain how that affected your hypothesis.  Include in your answer how it changed how confident you were in your hypothesis.",
    "<b>3.</b> In this activity, when you compared your results with another group, you may have found that they gotten some emails you didn't get.  Thinking about your answer to the previous questions, how is this like how science works?",
    "<b>4.</b> When you talked to the other group, was their storyline hypothesis identical to yours or different?  Why do you think this is?",
    "<b>5.</b> After collaboration, did you and the other group agree on a final hypothesis?  Why/why not?  How is this like \'real science?\'",
    "<b>6.</b> Sometimes in the news you'll see reports about a new experiment.  Pretend you read about a study of Food A that found 20 people on average were 45% healthier.  Another study of Food B used 10,000 people and found on average they were 25% healthier.  Based on what you've learned, which food would you be more confident in its health effects and why?",
    "<b>7.</b> Why do we say an explanation in science is \"tentative?\"",
    "<b>8.</b> Is your final hypothesis \"correct\"? Explain.",
    "<b>9.</b> Scientists sometimes use the term \"theory\" to describe their explanations, other times the term \"hypothesis.\"  What's the difference, and what would you need to turn your hypothesis into a theory?"
]


//load assets
function preload()
{
    //img_name = loadImage("assets/imgName.extension");
    //thank you PowerPoint for exporting with such nice filenames
    for (let i = 1; i < 17; i++)
    {
        if (debugMode)
        {
            images.push(loadImage("debugAssets/Slide" + i + ".PNG"));
            thumbnails.push(loadImage("debugAssets/Slide" + i + ".PNG"));
        }
        else
        {
            images.push(loadImage("assets/Slide" + i + ".PNG"));
            thumbnails.push(loadImage("assets/thumbnails/Slide" + i + ".PNG"));
        }
    }
}

//perform initial page setup
function setup()
{
    //populate the email database
    for (let i = 0; i < 16; i++)
    {
        let name = "email_" + (i+1);
        //constructor(img,menuX,menuY,menuW,menuH,zoomX,zoomY,zoomW,zoomH,name)
        emailPool.push(new Email(images[i],thumbnails[i],0,0,200,150,215,10,600,450,name));
    }

    //set up alignGrid
    alignGrid = new AlignmentGrid(3,5);
}

function draw()
{
    //If we're still in the setup state, abort (canvas isn't spawned yet)
    if (state == states.SETUP)
    {
        return;
    }

    //gray background
    background(128);
    //if the student is currently dragging an email, highlight the position they'll drop it into
    if(doDragHighlighting)
    {
        alignGrid.drawHighlight(mouseX, mouseY);
    }
    //draw the emails
    for (let i = 0; i < unlockedEmails.length; i++)
    {
        let email = unlockedEmails[i];
        email.draw();
        if (email.zoomMode)
        {
            break;
        }
    }
}

//toggle large view on clicked email
function doubleClicked()
{
    //if we're still in setup, abort - menu isn't properly set up
    if (state == states.SETUP)
    {
        return;
    }

    //if we're in zoom view, get out of it
    if (inZoomView)
    {
        console.log("UNZOOM");
        console.log(zoomedPos);
        console.log(alignGrid);
        //Make sure zoomedPos doesn't point to an empty square.
        //This should never happen (zooming in verifies the zoomed position,
        //and editing the menu should be disabled during zoom),
        //but if it somehow happens scream that we've got a problem.
        if (alignGrid.isOpen(zoomedPos.r, zoomedPos.c, true))
        {
            console.log("WARNING! zoomedPos points to an empty square!");
            console.log("This will prevent returning to normal view!");
            return;
        }
        alignGrid.grid[zoomedPos.r][zoomedPos.c].email.zoomMode = false;
        inZoomView = false;
    }
    else //if we're not zoomed in, become so
    {
        //figure out which email we clicked on
        zoomedPos = alignGrid.worldToGridSpaceCoords(mouseX, mouseY);
        //verify that we clicked within the menu, & abort if not
        if (!alignGrid.isValidCoords(zoomedPos.r, zoomedPos.c))
        {
            return;
        }
        //also abort if we clicked on an empty square
        else if (alignGrid.isOpen(zoomedPos.r, zoomedPos.c, true))
        {
            return;
        }
        inZoomView = true;
        console.log("Choosing spot " + zoomedPos.r + ", " + zoomedPos.c);
        console.log(alignGrid);
        //get the email at that position and tell it to enter zoom mode
        alignGrid.grid[zoomedPos.r][zoomedPos.c].email.zoomMode = true;
    }

    //unlockedEmails[0].zoomMode = !unlockedEmails[0].zoomMode;
    //chooseEmails(1); //debug utility for testing email spawning
}

//begin dragging a clicked email
function mousePressed()
{
    //if we're still in setup, abort - menu isn't properly set up
    if (state == states.SETUP)
    {
        return;
    }
    //also abort if we're in zoomed-in view - we SHOUlD NOT edit the menu
    else if (inZoomView)
    {
        return;
    }
    for (let i = 0; i < unlockedEmails.length; i++)
    {
        //Email.beginDrag() not only checks if the email was clicked,
        //but will also perform most of the drag setup.
        if (unlockedEmails[i].beginDrag())
        {
            console.log("beginning drag...");
            //To make sure that the email is rendered over all others, move it to the end of unlockedEmails
            //(since emails are drawn in order of appearance, so 1st is on the bottom)
            //Credit for this algorithm goes to https://stackoverflow.com/questions/24909371/move-item-in-array-to-last-position
            unlockedEmails.push(unlockedEmails.splice(i, 1)[0]);
            //tell the alignment grid that it can treat the dragged email's former spot as empty
            //if/when it tries to shift emails around when we drop it
            dragStartPos = alignGrid.worldToGridSpaceCoords(mouseX, mouseY); //which position should we adjust?
            alignGrid.grid[dragStartPos.r][dragStartPos.c].treatAsEmpty = true;

            //since we can only click one email, we don't need to keep looking
            break;
        }
    }
}

//end dragging a clicked email
function mouseReleased()
{
    //if we're still in setup, abort - menu isn't properly set up
    if (state == states.SETUP)
    {
        return;
    }
    //because we move any dragging emails to the end of unlockedEmails, we can assume
    //that that is the only position we'd need to check to turn off a dragged email.
    let draggedEmail = unlockedEmails[unlockedEmails.length - 1];
    if (draggedEmail.dragging) //make sure that draggedEmail was, in fact, being dragged
    {
        //figure out which grid position to go to
        let tgtGridSpot = alignGrid.worldToGridSpaceCoords(mouseX, mouseY);
        //sanity check - verify that tgtGridSpot is a location within the grid,
        //and if not send us back to our original position
        if (!alignGrid.isValidCoords(tgtGridSpot.r, tgtGridSpot.c)) //invalid coords
        {
            draggedEmail.endDrag();
            //now that drag is over, tell the grid it can no longer treat the dragged email's original position as empty
            alignGrid[dragStartPos.r][dragStartPos.c].treatAsEmpty = false;
        }
        //clear out that spot
        let spotClear = alignGrid.shiftEntry(tgtGridSpot.r, tgtGridSpot.c);
        if(spotClear) //shift successful
        {
            //clear out our old position, but ONLY if it hasn't been replaced by an email we pushed during the move
            if (!passedOrigin)
            {
                console.log("CHOSE TO CLEAR ORIGIN");
                let oldSpot = alignGrid.worldToGridSpaceCoords(draggedEmail.menuPos.x, draggedEmail.menuPos.y);
                let oldEntry = alignGrid.grid[oldSpot.r][oldSpot.c];
                oldEntry.email = null;
                //console.log("YOU WILL HAVE A PROBLEM");
            }
            //remove ourselves from our old position
            // let oldSpot = alignGrid.worldToGridSpaceCoords(draggedEmail.menuPos.x, draggedEmail.menuPos.y);
            // let oldEntry = alignGrid.grid[oldSpot.r][oldSpot.c];
            // oldEntry.email = null;
            //put ourselves in the new position
            let tgtEntry = alignGrid.grid[tgtGridSpot.r][tgtGridSpot.c]; //get the corresponding gridEntry object
            tgtEntry.email = draggedEmail; //store ourselves in tgtEntry
            
            //finish up
            draggedEmail.setMenuPosition(tgtEntry.position.x, tgtEntry.position.y, true); //update our position
            draggedEmail.endDrag();
            console.log("UP");
            console.log(alignGrid);
            passedOrigin = false; //make sure we ALWAYS clear passedOrigin to prevent a flag from a previous cycle affecting the current one
        }
        else //shift failed - spot is occupied or otherwise invalid
        {
            //return to where we were at the start of the drag
            draggedEmail.endDrag();
        }
        //now that drag is over, tell the grid it can no longer treat the dragged email's original position as empty
        //(regardless of whether or not we actually dragged it to a new position)
        alignGrid.grid[dragStartPos.r][dragStartPos.c].treatAsEmpty = false;
    }
}



//runs when user updates their name.
//The first time it's called, it also unlocks the first 4 emails.
//args: name = name of user; warningText = optional text object (from createP() call) used to display "invalid input" warnings
function enterName(name, warningText)
{
    if (name.length == 0) //simple check to make sure they entered a name
    {
        console.log("No name entered!");
        if (warningText) //if warningText was specified, use it to display an "invalid input" message
        {
            warningText.html("<p style=\"color:red;\">You must enter a name to proceed!</p>");
        }
    }
    else
    {
        username = name;
        if (warningText) //if warningText was specified, clear it
        {
            warningText.html("");
        }
        if (state == states.SETUP) //if this is the first time they entered their name, spawn in the rest of the page & transition to the next state.
        {
            console.log("Time to begin lab!");
            state = states.INITIAL_HYPOTHESIS;
            //create the email menu canvas
            spawnLabel("These are your currently unlocked emails."
                + "<br>Double-click on an image to read the full email; double-click again to return to the normal menu view."
                + "<br>Click & drag an email to move it to a different menu position, shifting any emails in the way."
                + "<br>Scroll down when you're ready to enter your hypothesis.");
            let canvas = createCanvas(1030,470);
            canvas.parent("container");
            
            //create the input boxes for hypothesis & reasoning
            inputDiv = createDiv();
            hypoLabel = spawnLabel("Observe the information on the emails. Think of the emails as clues to a series of connected events. Try to figure out a tentative storyline or hypothesis that explains the series of events represented by the emails."
                + "<br>Enter this hypothesis in the box below.");
            hypoLabel.parent(inputDiv);
            hypoInputBox = spawnTextArea("","container",800,100);
            hypoInputBox.parent(inputDiv);
            reasonLabel = spawnLabel("Using evidence from the emails, explain your reasoning behind the storyline you created.");
            reasonLabel.parent(inputDiv);
            reasonInputBox = spawnTextArea("","container",800,100);
            reasonInputBox.parent(inputDiv);

            //create the "submit" button
            let buttonDiv = createDiv();
            spawnLabel("Press the button below when you're ready to move to the next step.").parent(buttonDiv);
            submitButton = createButton("submit");
            submitButton.parent(buttonDiv);
            submitButton.mousePressed(submitHypothesis);

            //unlock the 1st four emails
            chooseEmails(4);
        }
    }
}

//helper function to spawn a text entry area.
//Args: initialText = initial text to display in the box; parent = what object to parent it to; width & height = width & height of the area
function spawnTextArea(initialText, parent, width, height)
{
    let newArea = createElement("textarea",initialText);
    newArea.parent(parent);
    newArea.size(width,height);
    return newArea;
}

//helper function to spawn a <p></p> text element, mostly intended for use in labeling other fields in the page.
//Args: text = HTML text to display; parent = what object to parent it to (optional, defaults to "container")
function spawnLabel(text, parent)
{
    let newLabel = createP();
    newLabel.html(text);
    if (parent)
    {
        newLabel.parent(parent);
    }
    else
    {
        newLabel.parent("container");
    }
    return newLabel;
}

//saves the user's hypothesis & reasoning & transitions to the next state.
function submitHypothesis()
{
    switch(state)
    {
        case states.INITIAL_HYPOTHESIS: //entered 1st hypothesis after seeing 1st 4 emails
            if(checkHypothesis()) //confirm hypothesis/reasoning was entered
            {
                console.log("Saved 1st hypothesis; unlocking 4 more emails");
                //save the hypothesis/reasoning
                initialHypothesis = hypoInputBox.value();
                initialReasoning = reasonInputBox.value();
                console.log(initialHypothesis);
                console.log(initialReasoning);
                //unlock 4 more emails
                chooseEmails(4);

                //update the hypothesis/reasoning labels w/ the prompt for the 2nd hypothesis
                hypoLabel.html("Using the new data from the 4 new emails, formulate a second tentative hypothesis that explains the storyline."
                    + "<br>You can add this to your original hypothesis, edit your original hypothesis, or completely change it.");
                reasonLabel.html("Explain your reasoning behind the storyline you created, including how you integrated new data into your hypothesis."
                    + "<br>You can add this to your reasoning, edit it, or completely change it.")

                //move to next state
                state = states.UPDATED_HYPOTHESIS;
            }
            break;
        case states.UPDATED_HYPOTHESIS: //entered 2nd hypothesis after seeing 4 new emails
            if(checkHypothesis(initialHypothesis, initialReasoning)) //confirm hypothesis/reasoning was entered & updated
            {
                console.log("Saved 2nd hypothesis; unlocking 2 more emails");
                //save the new hypothesis/reasoning
                updatedHypothesis = hypoInputBox.value();
                updatedReasoning = reasonInputBox.value();
                console.log(updatedHypothesis);
                console.log(updatedReasoning);
                //unlock 2 more emails
                chooseEmails(2);

                //update the hypothesis/reasoning labels w/ the prompt for the 3rd hypothesis
                hypoLabel.html("Using the new data from the 2 new emails, formulate a third tentative hypothesis that explains the storyline."
                    + "<br>You can add this to your original hypothesis, edit your original hypothesis, or completely change it.");
                //reasonLabel.html("Explain your reasoning behind the storyline you created, including how you integrated new data into your hypothesis.")

                //move to next state
                state = states.THIRD_HYPOTHESIS;
            }
            break;
        case states.THIRD_HYPOTHESIS: //entered 3rd hypothesis after seeing final 2 emails
            if(checkHypothesis(updatedHypothesis, updatedReasoning)) //confirm hypothesis/reasoning was entered & updated
            {
                console.log("Saved 3rd hypothesis; it's time to share!");
                //save the new hypothesis/reasoning
                thirdHypothesis = hypoInputBox.value();
                thirdReasoning = reasonInputBox.value();
                console.log(thirdHypothesis);
                console.log(thirdReasoning);

                /* Maybe save to PDF here to facilitate sharing without
                   relying on the student using screensharing or whatever?*/
                
                //update the hypothesis/reasoning labels w/ the prompt for the 4th hypothesis
                hypoLabel.html("To simulate the collaborative nature of science, take a few minutes to meet with other groups to compare data."
                     + " Remember, since each group received emails at random, groups may have different data."
                     + "<br>When you've finished sharing, formulate a final hypothesis based upon all the available data."
                     + " This hypothesis should attempt to explain the events in the life of the character(s) who wrote the emails."
                     + "<br>You can add this to your original hypothesis, edit your original hypothesis, or completely change it.");
                //reasonLabel.html("Explain your reasoning behind the storyline you created, including how you integrated new data into your hypothesis.")

                //move to next state
                state = states.FINAL_HYPOTHESIS;
            }
            break;
        case states.FINAL_HYPOTHESIS: //entered 4th & final hypothesis after sharing w/ another group
            if(checkHypothesis(thirdHypothesis, thirdReasoning)) //confirm hypothesis/reasoning was entered & updated
            {
                console.log("Saved final hypothesis; time to begin questions");
                //save the new hypothesis/reasoning
                finalHypothesis = hypoInputBox.value();
                finalReasoning = reasonInputBox.value();
                console.log(finalHypothesis);
                console.log(finalReasoning);
                
                //Disable the old hypothesis/reasoning fields
                hypoInputBox.remove();
                hypoLabel.remove();
                reasonInputBox.remove();
                reasonLabel.remove();

                //Display the final questions
                for (let i = 0; i < 9; i++)
                {
                    questionLabels[i] = spawnLabel(qText[i],inputDiv);
                    questionInputBoxes[i] = spawnTextArea("",inputDiv,800,100);
                }

                //move to next state
                state = states.QUESTIONS;
            }
            break;
        case states.QUESTIONS:
            //verify that the user answered all questions
            if (checkAnswers())
            {
                console.log("Saved answers, time to print to PDF");
                
                //save to PDF
                saveSubmission();

                //move to next state
                state = states.END;
            }
            break;
        default:
            //
    }
}

//performs a simple error-check of a hypothesis/reasoning submission
//(specifically, checks that neither was blank and that both were updated since the last submission).
//Args: the previous hypothesis & reasoning from the prior step of the lab (optional, used to make sure the student updates their thinking with the new data)
function checkHypothesis(previousHypothesis, previousReasoning)
{
    if (hypoInputBox.value() == "") //did they forget their hypothesis?
    {
        alert("You didn't submit a hypothesis!");
        return false;
    }
    else if (reasonInputBox.value() == "") //did they forget their reasoning?
    {
        alert("You didn't submit any reasoning!");
        return false;
    }
    else if (previousHypothesis && (hypoInputBox.value() == previousHypothesis)) //did they update their hypothesis?
    {
        alert("You haven't updated your hypothesis since the last stage.");
        return false;
    }
    else if (previousReasoning && (reasonInputBox.value() == previousReasoning)) //did they update their reasoning?
    {
        alert("You haven't updated your reasoning since the last stage.");
        return false;
    }
    else
    {
        return true;
    }
}

//Performs a simple error-check of all question answers
//(specifically, checks that no question is blank).
//Returns true if all questions were answered;
//otherwise, returns false and tells the user which ones they missed.
function checkAnswers()
{
    let success = true; //assume user answered them all
    let alertMsg = "Missing answers to questions: "; //text of the alert message if unanswered questions are detected
    for (let i = 0; i < questionInputBoxes.length; i++)
    {
        if (questionInputBoxes[i].value() == "") //unanswered question
        {
            if (success) //if this is the 1st unanswered question detected...
            {
                success = false; //log the failure
                alertMsg += ("" + (i+1)); //add the 1st unanswered question number 
            }
            else //this isn't the first missing answer we've found
            {
                alertMsg += (", " + (i+1)); //add the next number, separating by commas
            }
        }
    }
    if (success) //no missing answers found
    {
        return true;
    }
    else //missing answer detected
    {
        alert(alertMsg);
        return false;
    }
}

//Draws a specified # of emails from the available pool and adds them to emailList.
//Args: the # of emails to choose.
function chooseEmails(count)
{
    for(let i = 0; i < count; i++)
    {
        //pick the email
        let rand = floor(random(0,emailPool.length));
        let chosenEmail = emailPool.splice(rand,1)[0];

        //put the email in the correct position
        let tgtSlot = alignGrid.getFirstOpen(); //find 1st open slot
        let tgtEntry = alignGrid.grid[tgtSlot.r][tgtSlot.c]; //get the corresponding gridEntry object
        tgtEntry.email = chosenEmail; //store ourselves in tgtEntry
        chosenEmail.setMenuPosition(tgtEntry.position.x, tgtEntry.position.y, true);
        
        //add the email to unlockedEmails
        unlockedEmails.push(chosenEmail);
    }
    console.log(alignGrid);
}

//Saves the lab for student submission.
//Currently saves to .txt; will eventually be converted to save to PDF.
function saveSubmission()
{
    //saveText stores the output text, letting us build it as we go.
    let saveText = [];

    //save the student's name
    saveText.push("STUDENT NAME: " + username);
    //visual distinction between sections
    saveText.push("-----------------------------------------");
    //save a list of the emails the student had access to (temporarily disabled)
    // saveText.push("Here are the emails the student used:");
    // for (let i = 0; i < unlockedEmails.length; i++)
    // {
    //     saveText.push(unlockedEmails[i].name);
    // }
    // saveText.push("-----------------------------------------");
    //save their initial hypothesis/reasoning
    saveText.push("INITIAL HYPOTHESIS:");
    saveText.push(initialHypothesis);
    saveText.push("\nINITIAL REASONING:");
    saveText.push(initialReasoning);
    saveText.push("-----------------------------------------");
    //save their second hypothesis/reasoning
    saveText.push("SECOND HYPOTHESIS:");
    saveText.push(updatedHypothesis);
    saveText.push("\nSECOND REASONING:");
    saveText.push(updatedReasoning);
    saveText.push("-----------------------------------------");
    //save their third hypothesis/reasoning
    saveText.push("THIRD HYPOTHESIS:");
    saveText.push(thirdHypothesis);
    saveText.push("\nTHIRD REASONING:");
    saveText.push(thirdReasoning);
    saveText.push("-----------------------------------------");
    //save their final hypothesis/reasoning
    saveText.push("FINAL HYPOTHESIS:");
    saveText.push(finalHypothesis);
    saveText.push("\nFINAL REASONING:");
    saveText.push(finalReasoning);
    saveText.push("-----------------------------------------");
    //save their answers to the questions
    saveText.push("POST-LAB QUESTIONS:");
    for (let i = 0; i < questionInputBoxes.length; i++)
    {
        saveText.push(qText[i]);
        saveText.push(questionInputBoxes[i].value() + "\n");
    }
    saveText.push("-----------------------------------------");
    
    //generate the .txt output and prompt the user to save the file
    save(saveText, "emailLab.txt");
}
