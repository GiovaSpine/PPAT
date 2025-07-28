
import { canvas, ctx, state } from "./taskState.js";
import { vector_add, vector_diff, vector_dot, vector_norm } from "./taskUtils.js";

// in an image x is the columns, y is the rows and (0, 0) is at the top left corner
// the positions for Point and Line are relative to the image


export class Line {
    constructor(px, py, dx, dy, color){
      // a line is rapresented as a point (px, py) plus a direction (dx, dy)
      this.px = px;
      this.py = py;
      this.dx = dx;
      this.dy = dy;

      this.hide = false;  // wheter the line is visibile or hidden
      this.thickness = 2;  // the thickness of the drawing of the line
      this.color = color;

      this.distance_thresold = 15;  // the thresold in which a point is defined as close to the line
    }

    is_point_close(point){
      // function that returns true if point is close the the line
      // (if the minimun distance between the point and the line is <= this.distance_thresold)
      
      // the vector that goes from point to [px, py]
      const dist_vect = vector_diff([this.px, this.py], [point.x, point.y]);

      const hypotenuse = vector_norm(dist_vect);
    
      // cos(theta) = vector_dot(a, b) / (vector_norm(a) * vector_norm(b))
      const cos_theta = vector_dot([this.dx, this.dy], [dist_vect[0], dist_vect[1]]) / (vector_norm([this.dx, this.dy]) * vector_norm([dist_vect[0], dist_vect[1]]));
      const theta = Math.acos(cos_theta);

      const minimun_distance = hypotenuse * Math.sin(theta);

      if(minimun_distance <= this.distance_thresold) return true;
      else return false;
    }

    #calculate_limits(xmin, ymin, xmax, ymax) {
      const points = [];

      // functions that add a point to points if it is valid (inside the boundaries)
      function add_if_inside(px, py) {
        if (px >= xmin && px <= xmax && py >= ymin && py <= ymax) {
          points.push([px, py]);
        }
      }

      // we have the following linear system
      // { limit_x = px + (t * dx)
      // { limit_y = py + (t * dy)

      // it seems to have 3 unknowns variables (limit_x, limit_y, t)
      // but based on the side that the line can hit we know limit_x or limit_y
      // (for example if the line hit the right side that means that limit_x = xmax)

      // intersection with left side (x = xmin)
      if (this.dx !== 0) {
        const t = (xmin - this.px) / this.dx;
        const limit_y = this.py + t * this.dy;
        add_if_inside(xmin, limit_y);
      }

      // intersection with right side (x = xmax)
      if (this.dx !== 0) {
        const t = (xmax - this.px) / this.dx;
        const limit_y = this.py + t * this.dy;
        add_if_inside(xmax, limit_y);
      }

      // intersection with upper side (y = ymin)
      if (this.dy !== 0) {
        const t = (ymin - this.py) / this.dy;
        const limit_x = this.px + t * this.dx;
        add_if_inside(limit_x, ymin);
      }

      // intersection with lower side (y = ymax)
      if (this.dy !== 0) {
        const t = (ymax - this.py) / this.dy;
        const limit_x = this.px + t * this.dx;
        add_if_inside(limit_x, ymax);
      }

      // removes duplicate in the corners
      const unique = [...new Set(points.map(p => p.toString()))].map(s => s.split(',').map(Number));

      if (unique.length >= 2) {
        return [unique[0], unique[1]];
      } else {
        return null;
      }
    }

    draw(){
      // we want to draw the line across all the image, so we have to calculate the limits
      const limits = this.#calculate_limits(0, 0, state.image.width, state.image.height);
      const [x1, y1] = limits[0];
      const [x2, y2] = limits[1];

      ctx.beginPath();
      ctx.moveTo(state.image_x + (x1 * state.image_scale), state.image_y + (y1 * state.image_scale));
      ctx.lineTo(state.image_x + (x2 * state.image_scale), state.image_y + (y2 * state.image_scale));
      ctx.strokeStyle = this.color;
      ctx.lineWidth = this.thickness;
      ctx.stroke();
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
