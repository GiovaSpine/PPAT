console.log("Testing task_script.js");

export const counter = document.getElementById("counter");

export const canvas = document.getElementById("canvas");
export const ctx = canvas.getContext("2d");
canvas.width = 1200;
canvas.height = 800;

export const message_element = document.getElementById("message");

export const task_directory = '/task/';
export const images_directory = task_directory + 'Images/';

export const state = {
  npoints: 0,
  nimages: 0,
  image_list: [],

  nconstructionpoints: 50,  // the max number of construction points

  index: 0,

  image: null,
  image_x: 0,
  image_y: 0,
  image_scale: 1.0,
};


