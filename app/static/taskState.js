console.log("Testing task_script.js");

// the counter of images (exxample: 1/48)
export const counter = document.getElementById("counter");

// we have the lower and upper canvas
// the upper canvas contains the points
// the lower canvas contains the rest of the things
export const lcanvas = document.getElementById("lower_canvas");
export const lctx = lcanvas.getContext("2d");
export const ucanvas = document.getElementById("upper_canvas");
export const uctx = ucanvas.getContext("2d");
lcanvas.width = 1200;
lcanvas.height = 780;
ucanvas.width = 1200;
ucanvas.height = 780;


// the message element where we write the various messages for the user
export const message_element = document.getElementById("message");

// directories
export const task_directory = '/task/';
export const images_directory = task_directory + 'Images/';
export const icons_directory = '/static/static_images/icons/';
export const icons_directories = {"artist-palette": icons_directory + 'artist-palette.svg',
                                  "trash": icons_directory + 'trash.svg', 
                                  "eye": icons_directory + 'eye.svg', 
                                  "eye-hidden": icons_directory + 'eye-hidden.svg', 
                                  "eye-x": icons_directory + 'eye-x.svg', 
                                  "eye-hidden-x": icons_directory + 'eye-hidden-x.svg', 
                                  "eye-y": icons_directory + 'eye-y.svg', 
                                  "eye-hidden-y": icons_directory + 'eye-hidden-y.svg', 
                                  "eye-z": icons_directory + 'eye-z.svg', 
                                  "eye-hidden-z": icons_directory + 'eye-hidden-z.svg'};
export const save_task_annotations_url = '/save-task-annotations';
export const annotations_directory = task_directory + 'Annotations/';
export const task_annotations_directory = annotations_directory + 'TaskAnnotations/'



export const state = {
  npoints: 0,  //  the number of label points
  nimages: 0,  // the number of images
  image_list: [],  // the list of the names of the images

  nconstructionpoints: 50,  // the max number of construction points
  nconstructionlines: 50,  // the max number of construction lines

  index: parseInt(sessionStorage.getItem('index') || "0"),  // the index of the current image shown in the page

  image: null,  // the image corresponding to the index
  image_x: 0,
  image_y: 0,
  image_scale: 1.0,
};

// the colors that the project uses
export const colors = {"x": "red", 
                       "y": "rgb(0, 220, 0)", 
                       "z": "rgb(0, 0, 255)", 
                       "label": "blue", 
                       "construction": "gray", 
                       "construction_line": "rgb(240, 138, 0)",
                       "bounding_box": "rgb(200, 0, 0)",
                       "label_points_possibile_colors": ["blue", "rgb(220, 0, 0)", "green", "rgb(220, 120, 0)", "rgb(150, 0, 150)"],
                       "construction_points_possibile_colors": ["gray", "rgb(0, 220, 220)", "rgb(50, 50, 50)", "rgb(100, 50, 0)", "rgb(255, 0, 255)"],
                       "construction_lines_possibile_colors": ["rgb(240, 138, 0)", "rgb(220, 0, 80)", "blue", "green", "rgb(190, 0, 190)"],
                       "highlight": "yellow"};

