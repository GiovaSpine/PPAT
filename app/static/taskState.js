console.log("Testing task_script.js");

export const counter = document.getElementById("counter");

export const canvas = document.getElementById("canvas");
export const ctx = canvas.getContext("2d");
canvas.width = 1400;
canvas.height = 800;

export const task_directory = '/task/';
export const images_directory = task_directory + 'Images/';

export const state = {
  npoints: 0,
  nimages: 0,
  image_list: [],

  index: 0,

  image: null,
  image_x: 0,
  image_y: 0,
  image_scale: 1.0,
};

/*
export let vanishing_points_x = new Array(nimages);
export let vanishing_points_y = new Array(nimages);
export let vanishing_points_z = new Array(nimages);
export let construction_points = new Array(nimages);
export let label_points = new Array(nimages);
*/


