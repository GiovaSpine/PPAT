import { Line, Point, BoundingBox, ConstructionLine } from "./taskClasses.js";
import { task_directory, images_directory, save_task_annotations_url, task_annotations_directory, state } from "./taskState.js";
import { points_structures } from "./taskMain.js"


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

// SESSION


export function save_task_annotations_to_session(){
  // saves the task annotations for the current index

  const task_annotations = {
    "vanishing_points_x": points_structures.vanishing_points_x[state.index],
    "vanishing_points_y": points_structures.vanishing_points_y[state.index],
    "vanishing_points_z": points_structures.vanishing_points_z[state.index],
    "construction_points": points_structures.construction_points[state.index],
    "label_points": points_structures.label_points[state.index],
    "construction_lines": points_structures.construction_lines[state.index],
    "bounding_boxes": points_structures.bounding_boxes[state.index]
  };

  const task_annotations_name = `taskAnnotations_${state.index}`;

  sessionStorage.setItem(task_annotations_name, JSON.stringify(task_annotations));
}


export function load_task_annotations_from_session(){
  // load the task annotations for the current index
  
  const task_annotations_name = `taskAnnotations_${state.index}`;
  const task_annotations = JSON.parse(sessionStorage.getItem(task_annotations_name));
  
  // not necesserly there are annotations
  if(task_annotations){

    points_structures.vanishing_points_x[state.index] = task_annotations.vanishing_points_x;
    points_structures.vanishing_points_y[state.index] = task_annotations.vanishing_points_y;
    points_structures.vanishing_points_z[state.index] = task_annotations.vanishing_points_z;

    // the problem is that some of points structures are complex, so we have to recreate them
    for(let i = 0; i < state.nconstructionpoints; i++){
      if(task_annotations.construction_points[i] != null){
        const x = task_annotations.construction_points[i].x;
        const y = task_annotations.construction_points[i].y;
        const color = task_annotations.construction_points[i].color;
        const visibility = task_annotations.construction_points[i].visibility;
        const hide = task_annotations.construction_points[i].hide;
        const lx = task_annotations.construction_points[i].line_to_vp_x;
        const ly = task_annotations.construction_points[i].line_to_vp_y;
        const lz = task_annotations.construction_points[i].line_to_vp_z;

        points_structures.construction_points[state.index][i] = new Point(x, y, color);
        points_structures.construction_points[state.index][i].visibility = visibility;
        points_structures.construction_points[state.index][i].hide = hide;
        points_structures.construction_points[state.index][i].line_to_vp_x = new Line(lx.px, lx.py, lx.dx, lx.dy, lx.color);
        points_structures.construction_points[state.index][i].line_to_vp_x.hide = lx.hide
        points_structures.construction_points[state.index][i].line_to_vp_y = new Line(ly.px, ly.py, ly.dx, ly.dy, ly.color);
        points_structures.construction_points[state.index][i].line_to_vp_y.hide = ly.hide
        points_structures.construction_points[state.index][i].line_to_vp_z = new Line(lz.px, lz.py, lz.dx, lz.dy, lz.color);
        points_structures.construction_points[state.index][i].line_to_vp_z.hide = lz.hide
      }
    }

    for(let i = 0; i < state.npoints; i++){
      if(task_annotations.label_points[i] != null){
        const x = task_annotations.label_points[i].x;
        const y = task_annotations.label_points[i].y;
        const color = task_annotations.label_points[i].color;
        const visibility = task_annotations.label_points[i].visibility;
        const hide = task_annotations.label_points[i].hide;
        const lx = task_annotations.label_points[i].line_to_vp_x;
        const ly = task_annotations.label_points[i].line_to_vp_y;
        const lz = task_annotations.label_points[i].line_to_vp_z;

        points_structures.label_points[state.index][i] = new Point(x, y, color);
        points_structures.label_points[state.index][i].visibility = visibility;
        points_structures.label_points[state.index][i].hide = hide;
        points_structures.label_points[state.index][i].line_to_vp_x = new Line(lx.px, lx.py, lx.dx, lx.dy, lx.color);
        points_structures.label_points[state.index][i].line_to_vp_x.hide = lx.hide
        points_structures.label_points[state.index][i].line_to_vp_y = new Line(ly.px, ly.py, ly.dx, ly.dy, ly.color);
        points_structures.label_points[state.index][i].line_to_vp_y.hide = ly.hide
        points_structures.label_points[state.index][i].line_to_vp_z = new Line(lz.px, lz.py, lz.dx, lz.dy, lz.color);
        points_structures.label_points[state.index][i].line_to_vp_z.hide = lz.hide
      }
    }

    for(let i = 0; i < state.nconstructionlines; i++){
      if(task_annotations.construction_lines[i] != null){
        const x1 = task_annotations.construction_lines[i].x1;
        const y1 = task_annotations.construction_lines[i].y1;
        const x2 = task_annotations.construction_lines[i].x2;
        const y2 = task_annotations.construction_lines[i].y2;
        const color = task_annotations.construction_lines[i].color;
        const hide = task_annotations.construction_lines[i].hide;
        points_structures.construction_lines[state.index][i] = new ConstructionLine(x1, y1, x2, y2, color);
        points_structures.construction_lines[state.index][i].hide = hide;
      }
    }

    if(task_annotations.bounding_boxes != null){
      const x1 = task_annotations.bounding_boxes.x1;
      const y1 = task_annotations.bounding_boxes.y1;
      const x2 = task_annotations.bounding_boxes.x2;
      const y2 = task_annotations.bounding_boxes.y2;
      const color = task_annotations.bounding_boxes.color;
      const hide = task_annotations.bounding_boxes.hide;
      points_structures.bounding_boxes[state.index] = new BoundingBox(x1, y1, x2, y2, color);
      points_structures.bounding_boxes[state.index].hide = hide;
    }
    
  } else {
    // there are no task annotations
  }

}


// ========================================================

// SECONDARY MEMORY (IN THE SERVER)


export function save_task_annotations_to_server(){
  const annotations = {
    "vanishing_points_x": points_structures.vanishing_points_x,
    "vanishing_points_y": points_structures.vanishing_points_y,
    "vanishing_points_z": points_structures.vanishing_points_z,
    "construction_points": points_structures.construction_points,
    "label_points": points_structures.label_points,
    "construction_lines": points_structures.construction_lines,
    "bounding_boxes": points_structures.bounding_boxes,
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
      throw new Error("Error in save_task_annotations");
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


export async function load_task_annotations_from_server() {
  
  for (let i = 0; i < state.nimages; i++) {
    const filename = `taskAnnotations_${i}.json`;
    const url = task_annotations_directory + filename;

    try {
      const response = await fetch(url);

      // if file doesn't exist
      if (response.status === 404) {
        console.warn(`File not found (it's possible that the user never saved): ${filename}`);
        // we can already return, because right now it annotations are saved on the server, they are all saved
        // (if one of them is not present, no other else is present)
        return;
      } 
      // other errors
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status} on ${filename}`);
      }
      const task_annotations = await response.json();
      console.log("data:", task_annotations);

      // let's save these structure in the session
      // so we use the same mechanism to obtain the points structures

      // THOUGH we do it only if there isn't already a task annotations in the session
      // because if it's there, that means that it's more update than this
      if (sessionStorage.getItem(`taskAnnotations_${i}`) === null) {
        sessionStorage.setItem(`taskAnnotations_${i}`, JSON.stringify(task_annotations));
      }

    } catch (error) {
      console.error("Error during load_task_annotations_from_server fetch", error);
      return;
    }

  }


}