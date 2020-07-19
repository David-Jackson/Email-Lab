//Data structure used by the AlignmentGrid class.
//Stores info for each grid position.
class GridEntry
{
    constructor(x,y,email)
    {
        this.position = {x: x, y:y}; //"worldspace" coords corresponding to this spot in the grid
        this.email = email; //whatever email is stored at this position. Set to null if empty.
    }
}