//Data structure used by the AlignmentGrid class.
//Stores info for each grid position.
class GridEntry
{
    constructor(x,y,email)
    {
        //"worldspace" coords corresponding to this spot in the grid
        this.position = {x: x, y:y};
        //whatever email is stored at this position. Set to null if empty.
        this.email = email; 
        //Whether to treat this space as empty during shifting calculations.
        //Primarily intended to denote the original space occupied by a menu item currently being dragged.
        this.treatAsEmpty = false;
    }
}