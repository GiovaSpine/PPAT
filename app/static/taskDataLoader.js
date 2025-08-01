import { Line, Point, BoundingBox, ConstructionLine } from "./taskClasses.js";
import { task_directory, images_directory, state } from "./taskState.js";

// various functions for fetching...

export async function fetch_data() {
  const response = await fetch(task_directory + "data.json");
  if (!response.ok) throw new Error("Error during data.json fetch");
  const data = await response.json();
  console.log("data: ", data);
  state.npoints = data.npoints;
  state.nimages = data.nimages;
  return null;
}

export async function fetch_image_list() {
  const response = await fetch(task_directory + "images.json");
  if (!response.ok) throw new Error("Error during images.json fetch");
  const data = await response.json();
  console.log("image list: ", data);
  state.image_list = data;
  return null;
}

export async function fetch_image(index) {
  if (index >= 0 && index < state.nimages) {
    const response = await fetch(images_directory + state.image_list[index]);
    if (!response.ok) throw new Error("Error during fetch of an image");
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        resolve(img);
        URL.revokeObjectURL(url);
      };
      img.src = url;
    });
  } else {
    console.log("Not valid index in fetch_image(index)");
    return null;
  }
}


// ========================================================

// function to obtain the points structures from the session
// the problem is that these structures are complex, so we have to recreate them

export function load_points_structure_from_session(key){

  function load_from_session() {
    const item = sessionStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  }

  if(key == 'vanishing_points_x'){
    const item = load_from_session();
    if(item == null) return new Array(state.nimages);  // that means bounding_boxes was not in the session
    // else vanishing_points is just the item (it's not a complex structure)
    return item;
  }
  
  if(key == 'vanishing_points_y'){
    const item = load_from_session();
    if(item == null) return new Array(state.nimages);  // that means bounding_boxes was not in the session
    // else vanishing_points is just the item (it's not a complex structure)
    return item
  }

  if(key == 'vanishing_points_z'){
    const item = load_from_session();
    if(item == null) return new Array(state.nimages);  // that means bounding_boxes was not in the session
    // else vanishing_points is just the item (it's not a complex structure)
    return item
  }

  if(key == 'label_points'){
    const item = load_from_session();
    if(item == null) {
      // that means construction_points was not in the session 
      let label_points = new Array(state.nimages);
      for(let i = 0; i < state.nimages; i++){
        // for an image there are exactly npoints points
        label_points[i] = new Array(state.npoints);
      }
      return label_points;
    }
    // else construction_points was in the session 
    
    let label_points = new Array(state.nimages);
    for(let i = 0; i < state.nimages; i++){
      /// for an image there are exactly npoints points
      label_points[i] = new Array(state.npoints);
      for(let j = 0; j < state.npoints; j++){
        if(item[i][j] != null){
          // we have to rebuild the objects based on what was saved in the session
          label_points[i][j] = new Point(item[i][j].x, item[i][j].y, item[i][j].color);
          label_points[i][j].hide = item[i][j].hide;
          label_points[i][j].line_to_vp_x = new Line(item[i][j].line_to_vp_x.px, item[i][j].line_to_vp_x.py, item[i][j].line_to_vp_x.dx, item[i][j].line_to_vp_x.dy, item[i][j].line_to_vp_x.color);
          label_points[i][j].line_to_vp_x.hide = item[i][j].line_to_vp_x.hide;
          label_points[i][j].line_to_vp_y = new Line(item[i][j].line_to_vp_y.px, item[i][j].line_to_vp_y.py, item[i][j].line_to_vp_y.dx, item[i][j].line_to_vp_y.dy, item[i][j].line_to_vp_y.color);
          label_points[i][j].line_to_vp_y.hide = item[i][j].line_to_vp_y.hide;
          label_points[i][j].line_to_vp_z = new Line(item[i][j].line_to_vp_z.px, item[i][j].line_to_vp_z.py, item[i][j].line_to_vp_z.dx, item[i][j].line_to_vp_z.dy, item[i][j].line_to_vp_z.color);
          label_points[i][j].line_to_vp_z.hide = item[i][j].line_to_vp_z.hide;
        }
      }
    }
    return label_points;
  }

  if(key == 'construction_points'){
    const item = load_from_session();
    if(item == null) {
      // that means construction_points was not in the session 
      let construction_points = new Array(state.nimages);
      for(let i = 0; i < state.nimages; i++){
        // for an image there are max nconstructionpoints construction points
        construction_points[i] = new Array(state.nconstructionpoints);
      }
      return construction_points;
    }
    // else construction_points was in the session 
    
    let construction_points = new Array(state.nimages);
    for(let i = 0; i < state.nimages; i++){
      // for an image there are max nconstructionpoints construction points
      construction_points[i] = new Array(state.nconstructionpoints);
      for(let j = 0; j < state.nconstructionpoints; j++){
        if(item[i][j] != null){
          // we have to rebuild the objects based on what was saved in the session
          construction_points[i][j] = new Point(item[i][j].x, item[i][j].y, item[i][j].color);
          construction_points[i][j].hide = item[i][j].hide;
          construction_points[i][j].line_to_vp_x = new Line(item[i][j].line_to_vp_x.px, item[i][j].line_to_vp_x.py, item[i][j].line_to_vp_x.dx, item[i][j].line_to_vp_x.dy, item[i][j].line_to_vp_x.color);
          construction_points[i][j].line_to_vp_x.hide = item[i][j].line_to_vp_x.hide;
          construction_points[i][j].line_to_vp_y = new Line(item[i][j].line_to_vp_y.px, item[i][j].line_to_vp_y.py, item[i][j].line_to_vp_y.dx, item[i][j].line_to_vp_y.dy, item[i][j].line_to_vp_y.color);
          construction_points[i][j].line_to_vp_y.hide = item[i][j].line_to_vp_y.hide;
          construction_points[i][j].line_to_vp_z = new Line(item[i][j].line_to_vp_z.px, item[i][j].line_to_vp_z.py, item[i][j].line_to_vp_z.dx, item[i][j].line_to_vp_z.dy, item[i][j].line_to_vp_z.color);
          construction_points[i][j].line_to_vp_z.hide = item[i][j].line_to_vp_z.hide;
        }
      } 
    }
    return construction_points;
    
  }

  if(key == 'construction_lines'){
    const item = load_from_session();
    if(item == null) {
      // that means construction_lines was not in the session 
      let construction_lines = new Array(state.nimages);
      for(let i = 0; i < state.nimages; i++){
        // for an image there are max nconstructionlines construction lines
        construction_lines[i] = new Array(state.nconstructionlines);
      }
      return construction_lines;
    }
    // else construction_lines was in the session 
    
    let construction_lines = new Array(state.nimages);
    for(let i = 0; i < state.nimages; i++){
      // for an image there are max nconstructionlines construction lines
      construction_lines[i] = new Array(state.nconstructionlines);
      for(let j = 0; j < state.nconstructionlines; j++){
        if(item[i][j] != null){
          // we have to rebuild the objects based on what was saved in the session
          construction_lines[i][j] = new ConstructionLine(item[i][j].x1, item[i][j].y1, item[i][j].x2, item[i][j].y2, item[i][j].color);
          construction_lines[i][j].hide = item[i][j].hide;
        }
      }
    }
    return construction_lines;
    
  }

  if(key == 'bounding_boxes'){
    const item = load_from_session();
    if(item == null) return new Array(state.nimages);  // that means bounding_boxes was not in the session 

    let bounding_boxes = new Array(state.nimages);
    for(let i = 0; i < state.nimages; i++){
      if(item[i] != null){
        // we have to rebuild the objects based on what was saved in the session
        bounding_boxes[i] = new BoundingBox(item[i].x1, item[i].y1, item[i].x2, item[i].y2, item[i].color);
        bounding_boxes[i].hide = item[i].hide;
      }
    }
    return bounding_boxes;
  }

}

