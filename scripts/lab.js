//All the global variables...
let images = []; //array to store email images
let thumbnails = []; //array to store email thumbnails
let emailPool = []; //array to store locked ("in the envelope") emails to draw from
let unlockedEmails = []; //array to store unlocked emails

let inZoomView = false; //whether or not we're currently zoomed in on an email
let zoomedPos; //stores the (r,c) position of the zoomed-in email in the alignment grid
let dragStartPos; //if we're dragging an email around, this stores where it used to be
let passedOrigin = false; //flag used to identify whether a push chain overrode the dragged email's original position. Part of a (hopefully) temporary workaround (see notes on PerformShift() in alignmentGrid.js).
let doDragHighlighting = true; //whether to highlight the spot the student is going to drop an email into

let alignGrid; //AlignmentGrid object used in the grid-based menu system

let debugMode = false; //whether to run in debug mode

//load assets
function preload()
{
    //img_name = loadImage("assets/imgName.extension");
    //thank you PowerPoint for exporting with such nice filenames
    for (let i = 1; i <= 16; i++)
    {
        if (debugMode)
        {
            images.push(loadImage("https://david-jackson.github.io/Email_Lab/debugAssets/Slide" + i + ".PNG"));
            thumbnails.push(loadImage("https://david-jackson.github.io/Email_Lab/debugAssets/Slide" + i + ".PNG"));
        }
        else
        {
            images.push(loadImage("https://david-jackson.github.io/Email_Lab/assets/Slide" + i + ".PNG"));
            thumbnails.push(loadImage("https://david-jackson.github.io/Email_Lab/assets/thumbnails/Slide" + i + ".PNG"));
        }
    }
}


function setup() {
  resetRandomSeed();
  //populate the email database
  for (let i = 0; i < 16; i++) {
    let name = "email_" + (i+1);
    //constructor(img,menuX,menuY,menuW,menuH,zoomX,zoomY,zoomW,zoomH,name)
    emailPool.push(new Email(images[i],thumbnails[i],0,0,200,150,215,10,600,450,name));
  }
  
  //set up alignGrid
  alignGrid = new AlignmentGrid(3,5);
  
  
  var submitButton = createButton("Draw First Four Emails");
  submitButton.mousePressed(drawFirstFour);
  createP();
    
  createCanvas(1030, 470);
}

function resetRandomSeed() {
  let params = getURLParams();
  console.log(params);
  let groupNumber = params.group;
  if (groupNumber) {
    console.log("Random seed set to", groupNumber);
    randomSeed(groupNumber);
  } else {
    console.log("Random seed NOT set");
  }
}


function drawFirstFour() {
  chooseEmails(4);
  
  this.mousePressed(drawSecondFour);
  this.html("Draw Four More Emails");
}


function drawSecondFour() {
  chooseEmails(4);
  
  this.mousePressed(drawLastTwo);
  this.html("Draw Last Two Emails");
}


function drawLastTwo() {
  chooseEmails(2);
  
  this.mousePressed(resetEmails);
  this.html("Reset");
}

function resetEmails() {
  unlockedEmails = [];
  emailPool = [];
  resetRandomSeed();
  
  
  //populate the email database
  for (let i = 0; i < 16; i++) {
    let name = "email_" + (i+1);
    //constructor(img,menuX,menuY,menuW,menuH,zoomX,zoomY,zoomW,zoomH,name)
    emailPool.push(new Email(images[i],thumbnails[i],0,0,200,150,215,10,600,450,name));
  }
  
  //set up alignGrid
  alignGrid = new AlignmentGrid(3,5);
  
  this.html("Draw First Four Emails");
  this.mousePressed(drawFirstFour);
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

function draw() {

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
    //also abort if we're in zoomed-in view - we SHOUlD NOT edit the menu
    if (inZoomView)
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
