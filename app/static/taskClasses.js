
import { canvas, ctx, state } from "./taskState.js";

// in an image x is the rows, y is the columns and (0, 0) is at the top left corner
// the positions for Point and Line are relative to the image

export class Line {
    constructor(px, py, dx, dy, color){
        // a line is rapresented as a point (px, py) plus a direction (dx, dy)
        this.px = px;
        this.py = py;
        this.dx = dx;
        this.dy = dy;

        this.hide = false;  // wheter the line is visibile or hidden
        this.thickness = 3;  // the thickness of the drawing of the line
        this.color = color;
    }

    draw(){

    }
}




export class Point {
  constructor(x, y, color){
    this.x = x;
    this.y = y;

    this.hide = false;  // wheter the point is visibile or hidden
    this.radius = 8;
    this.color = color;
    
    this.line_to_vp_x;  // line to the vanishing point for the x axis
    this.line_to_vp_y;
    this.line_to_vp_y;
  }

  draw(){
    if(!this.hide){
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(state.image_x + (this.x * state.image_scale), state.image_y + (this.y * state.image_scale), this.radius, 0, Math.PI * 2);
        ctx.fill();
    }
  }
}
