class AlignmentGrid
{
    constructor(rows, cols)
    {
        //create a 2D array to represent the grid squares
        this.grid = new Array(rows);
        for (let r = 0; r < rows; r++)
        {
            this.grid[r] = new Array(cols);
            for (let c = 0; c < cols; c++)
            {
                //fill entries w/the corresponding "worldspace" coords used in aligning the email menu
                this.grid[r][c] = new GridEntry(5+(205*c),5+(155*r),null)
            }
        }
    }

    //Converts "worldspace" coordinates to "gridspace" coords.
    //Returns an object {r,c} with the address of the corresponding grid entry.
    worldToGridSpaceCoords(x,y)
    {
        let gridR = floor(y/155);
        let gridC = floor(x/205);
        //Because of the margins, the "divide by image size" conversion doesn't quite work,
        //so to keep things within the bounds of the grid let's fudge things slightly
        //and cap the gridspace coords to the grid size
        //(basically, map the bottom/right margins) to the bottom row/right column, respectively).
        //Might look kinda jank, but since it's only about 5-6 pixels worth of area & this is a
        //heavily-used function it's better to use this jank conversion than write a more-complicated
        //pixel-perfect conversion. 
        gridR = min(gridR, this.grid.length);
        gridC = min(gridC, this.grid[0].length);
        return {r: gridR, c: gridC};
    }

    //Converts "gridspace" coordinates to "worldspace" coordinates.
    //Returns an object {x,y} with the address of the corresponding worldspace point.
    //NOTE: assumes you want the location of the top-left corner of the grid position.
    gridToWorldSpaceCoords(r,c)
    {
        //let worldX = 5 + (205*c);
        //let worldY = 5 + (155*r);
        //return {x: worldX, y: worldY};
        return this.grid[r][c].position;
    }

    //Checks whether a given set of grid coords is valid (within the grid)
    isValidCoords(r,c)
    {
        let temp = ((r >= 0) && (r < this.grid.length)
                    && (c >= 0) && (c < this.grid[0].length));
        return temp;
    }

    //Returns whether a given position is unoccupied.
    //Args:
    //  r,c         (integers) the (r,c) position to test
    //  strictMode  (bool, optional) whether or not to allow "tentatively" empty slots
    //              (i.e. those with the treatAsEmpty flag) or only "truly empty" slots
    //              (i.e. only slots with a null email in them)
    isOpen(r,c,strictMode)
    {
        let tgtContents = this.grid[r][c].email; //contents of the specified position
        //console.log(r + ", " + c + ": ");
        //console.log(tgtContents);
        if (strictMode)
        {
            return (tgtContents == null);
        }
        else
        {
            return((tgtContents == null) || this.grid[r][c].treatAsEmpty);
        }
        //
    }

    //Finds the first open spot on the grid, searching from left to right, top to bottom.
    //Returns an object {r,c} with the gridspace coords of the 1st open spot.
    //Returns {-1,-1} if it fails to find a spot
    //(which should never happen, as we should always have more spots than emails.)
    getFirstOpen()
    {
        //Iterate thru list until you find the 1st open slot.
        //O(n), but that's probably fine - it's only called about 10 times total,
        //and the 1st 4 of those are basically guaranteed to all be best-case
        //(i.e. open slot is at or near top left corner).
        for (let r = 0; r < this.grid.length; r++)
        {
            for (let c = 0; c < this.grid[0].length; c++)
            {
                if (this.isOpen(r,c))
                {
                    return {r: r, c: c};
                }
            }
        }
        //if we've looked at all entries & none of them are empty, signal an error
        return {r: -1, c: -1};
    }

    //Finds the right neighbor of the specified entry, as specified by "pushing rules"
    //(i.e. if you reach the end of a row, wrap down to the beginning of the next one).
    //Returns an object {r,c} with the neighbor's coords,
    //or {-1,-1} if there is no neighbor (i.e. slot is in bottom right corner)
    getRightNeighbor(r,c)
    {
        let newR = r; //assume we'll most likely remain on the same row
        let newC = c+1;
        if (newC >= this.grid[0].length) //exceeded end of row - wrap down to the next one
        {
            newC = 0;
            newR++;
            if (newR >= this.grid.length) //cannot wrap down - signal a failure
            {
                return {r: -1, c: -1};
            }
        }
        return {r: newR, c: newC};
    }

    //Finds the left neighbor of the specified entry, as specified by "pushing rules"
    //(i.e. if you reach the beginning of a row, wrap up to the end of the last one).
    //Returns an object {r,c} with the neighbor's coords,
    //or {-1,-1} if there is no neighbor (i.e. slot is in top left corner)
    getLeftNeighbor(r,c)
    {
        let newR = r; //assume we'll most likely remain on the same row
        let newC = c-1;
        if (newC < 0 ) //exceeded beginning of row - wrap up to the last one
        {
            newC = this.grid[0].length - 1;
            newR--;
            if (newR < 0) //cannot wrap up - signal a failure
            {
                return {r: -1, c: -1};
            }
        }
        return {r: newR, c: newC};
    }

    //Shifts the specified entry to make way for a new entry to be inserted in its place.
    //Prefers to shift right, but will default to shift left if right shift is blocked.
    //Entries that are pushed out-of-bounds on the left/right sides of the grid will attempt
    //to wrap up to the end of the last row/down to the beginning of the next row, respectively.
    //Entries that cannot wrap up/down without leaving the grid boundaries are considered "blocked"
    //and will cause the shift attempt to fail, triggering either a direction reversal or a
    //failure state.
    //Args: (row,col) coords of the entry to shift.
    //Returns: true for success (indicating position (r,c) is now empty),
    //false for failure
    shiftEntry(r,c)
    {
        if (this.isOpen(r,c)) //quick check - no need to shift if we're empty
        {
            console.log("Dropped into empty");
            return true;
        }
        else if (this.performShift(r,c,true)) //first, attempt a right shift
        {
            console.log("Right shift worked");
            return true; //right shift worked - signal success
        }
        else if (this.performShift(r,c,false)) //right-shift failed - attempt left shift
        {
            console.log("Left shift worked");
            return true; //left-shift worked - signal success
        }
        else //cannot shift - signal failure
        {
            return false;
        }
    }

    //Helper method for shiftEntry().
    //Attempts to shift the specified entry in the specified direction.
    //Args: the (r,c) coords of the entry to shift,
    //and an indicator of the direction to shift in (true for right, false for left)
    //Returns true on success, false on failure
    performShift(r,c,goRight)
    {
        let tgtPos; //where we want to go
        if (goRight) //we want to go right
        {
            tgtPos = this.getRightNeighbor(r,c);
        }
        else //we want to go left
        {
            tgtPos = this.getLeftNeighbor(r,c);
        }
        
        //begin push attempt
        if ((tgtPos.r < 0) || (tgtPos.c < 0)) //base case #1 - check for the (-1,-1) "invalid position" flag
        {
            //cannot move because we've reached the end of the grid or something - abort & signal failure
            return false;
        }
        else if (this.isOpen(tgtPos.r, tgtPos.c)) //base case #2 - shifting into empty slot
        {
            //update my email's position to match its new position
            let newPos = this.grid[tgtPos.r][tgtPos.c].position;
            let myEmail = this.grid[r][c].email;
            console.log(myEmail);
            myEmail.setMenuPosition(newPos.x, newPos.y, true);
            //give my email to my neighbor
            this.grid[tgtPos.r][tgtPos.c].email = myEmail;
            this.grid[r][c].email = null; //I gave up my email, so I'm empty now
            return true; //indicate success
        }
        else if (this.performShift(tgtPos.r, tgtPos.c, goRight)) //shifting into occupied slot - attempt a "push chain"
        {
            //if we're here, the push chain worked - we can treat tgtPos as a regular empty space now
            let newPos = this.grid[tgtPos.r][tgtPos.c].position;
            let myEmail = this.grid[r][c].email;
            myEmail.setMenuPosition(newPos.x, newPos.y, true);
            this.grid[tgtPos.r][tgtPos.c].email = myEmail;
            this.grid[r][c].email = null;
            return true;
        }
        else //all attempts to move have failed - abort & signal failure
        {
            return false;
        }
    }

    //draws a highlight on the currently moused-over grid box
    drawHighlight(x,y)
    {
        //figure out which box is highlighted
        let tgtBox = this.worldToGridSpaceCoords(x,y);
        //abort early if we have an invalid position, e.g. the mouse is outside of the menu area
        if ((tgtBox.r < 0) || (tgtBox.r >= this.grid.length) || (tgtBox.c < 0) || (tgtBox.c >= this.grid[0].length))
        {
            return;
        }
        //use the box's coords to find where in worldspace to draw the box...
        let drawPos = this.grid[tgtBox.r][tgtBox.c].position;
        //draw the highlight box
        fill(0,0,255); //blue color
        rect(drawPos.x - 5, drawPos.y - 5, 210, 160);
    }
}