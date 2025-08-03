import { Line, Point, BoundingBox, ConstructionLine } from "./taskClasses.js";
import { task_directory, images_directory, save_task_annotations_url, task_annotations_directory, state } from "./taskState.js";
import { vanishing_points_x, vanishing_points_y, vanishing_points_z, construction_points, label_points, construction_lines, bounding_boxes } from "./taskMain.js"


// function the fetch the main data (npoints, images'names list, nimages and images)

export async function fetch_data() {
  // warning! for data we refer to data.json, that contains npoints e nimages
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
          label_points[i][j].visibility = item[i][j].visibility;
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

// ========================================================

// save task annotations functions

export function save_task_annotations(){
  const annotations = {
    "vanishing_points_x": vanishing_points_x,
    "vanishing_points_y": vanishing_points_y,
    "vanishing_points_z": vanishing_points_z,
    "construction_points": construction_points,
    "label_points": label_points,
    "construction_lines": construction_lines,
    "bounding_boxes": bounding_boxes,
  };

  // Invio POST a Flask
  fetch(save_task_annotations_url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(annotations)
  })
  .then(response => {
    if (!response.ok) {
      throw new Error("Error in the request");
    }
    return response.json();
  })
  .then(data => {
    console.log("Server response", data);
  })
  .catch(error => {
    console.error("Error:", error);
  });
}

/*
export async function load_task_annotations() {
  for(let i = 0; i < state.nimages; i++){
    const filename = "taskAnnotation_" + i + '.json'
    const response = await fetch(task_annotations_directory + filename);
    if (!response.ok) throw new Error("Error during load_task_annotations fetch");
    const data = await response.json();

    // let's save it in the session
    console.log("data: ", data);
    state.npoints = data.npoints;
    state.nimages = data.nimages;

    
    sessionStorage.setItem('vanishing_points_x', JSON.stringify(vanishing_points_x));
    sessionStorage.setItem('vanishing_points_y', JSON.stringify(vanishing_points_y));
    sessionStorage.setItem('vanishing_points_z', JSON.stringify(vanishing_points_z));
    sessionStorage.setItem('construction_points', JSON.stringify(construction_points));
    sessionStorage.setItem('label_points', JSON.stringify(label_points));
    sessionStorage.setItem('construction_lines', JSON.stringify(construction_lines));
    sessionStorage.setItem('bounding_boxes', JSON.stringify(bounding_boxes));
    

    sessionStorage.setItem('vanishing_points_x', data.vanishing_points_x);
    sessionStorage.setItem('vanishing_points_y', data.vanishing_points_y);
    sessionStorage.setItem('vanishing_points_z', data.vanishing_points_z);
    sessionStorage.setItem('construction_points', data.construction_points);
    sessionStorage.setItem('label_points', data.label_points);
    sessionStorage.setItem('construction_lines', data.construction_lines);
    sessionStorage.setItem('bounding_boxes', data.bounding_boxes);
    
    return null;
  }
  
}
*/


export async function load_task_annotations() {

  let temp_vanishing_points_x = [];
  let temp_vanishing_points_y = [];
  let temp_vanishing_points_z = [];
  let temp_construction_points = [];
  let temp_label_points = [];
  let temp_construction_lines = [];
  let temp_bounding_boxes = [];
  
  for (let i = 0; i < state.nimages; i++) {
    const filename = `taskAnnotation_${i}.json`;
    const url = task_annotations_directory + filename;

    try {
      const response = await fetch(url);

      // if file doesn't exist
      if (response.status === 404) {
        console.warn(`File not found: ${filename}`);
        return;
      } 
      // other errors
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status} on ${filename}`);
      }
      // else we append the data in a temporary structure that we will save later
      const data = await response.json();
      console.log("data:", data);

      temp_vanishing_points_x.push(data.vanishing_points_x);
      temp_vanishing_points_y.push(data.vanishing_points_y);
      temp_vanishing_points_z.push(data.vanishing_points_z);
      temp_construction_points.push(data.construction_points);
      temp_label_points.push(data.label_points);
      temp_construction_lines.push(data.construction_lines);
      temp_bounding_boxes.push(data.bounding_boxes);

    } catch (error) {
      console.error("Error during load_task_annotations fetch", error);
      return;
    }

  }

  // let's save these structure in the session
  // so we use the same mechanism to obtain the points structures
  sessionStorage.setItem('vanishing_points_x', JSON.stringify(temp_vanishing_points_x));
  sessionStorage.setItem('vanishing_points_y', JSON.stringify(temp_vanishing_points_y));
  sessionStorage.setItem('vanishing_points_z', JSON.stringify(temp_vanishing_points_z));
  sessionStorage.setItem('construction_points', JSON.stringify(temp_construction_points));
  sessionStorage.setItem('label_points', JSON.stringify(temp_label_points));
  sessionStorage.setItem('construction_lines', JSON.stringify(temp_construction_lines));
  sessionStorage.setItem('bounding_boxes', JSON.stringify(temp_bounding_boxes));

  console.log(sessionStorage.getItem('vanishing_points_x'));
}
