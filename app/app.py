from flask import Flask, render_template, request, redirect, url_for, send_from_directory, abort
import os
import shutil  # to delete folders
from werkzeug.utils import secure_filename  # to check filenames
import json



app = Flask(__name__, template_folder='templates')


# =============================================================================
# directories

task_directory = os.path.join('app', 'Task')

images_directory = os.path.join(task_directory, 'Images')

annotations_directory = os.path.join(task_directory, 'Annotations')
# TaskAnnotations contains all the annotations during the work of a task (vanishing points, construction point and lines et cetera...)
task_annotations_directory = os.path.join(annotations_directory, 'TaskAnnotations')
# LabelAnnotations contains the actual annotations for computer vision model (label point and bounding boxes)
label_annotations_directory = os.path.join(annotations_directory, 'LabelAnnotations')


# =============================================================================

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/guide')
def guide():
    return render_template('guide.html')

@app.route('/task', methods=['GET', 'POST'])
def task():
    if request.method == 'POST':

        npoints = request.form['npoints']
        images = request.files.getlist('images[]')

        # creates the Task folder
        if not os.path.exists(task_directory):
            os.makedirs(task_directory)

        # saves the number of points and images in data.json in the Task folder
        data = {
            "npoints": int(npoints),
            "nimages": len(images)
        }
        with open(os.path.join(task_directory, 'data.json'), 'w') as f:
            json.dump(data, f, indent=4)

        # creates the Images folder inside Task folder
        os.makedirs(images_directory)

        # saves all of the images in the Images folder and prepares the list of the names of the images
        images_filenames = []
        for img in images:
            if img and img.filename:
                filename = secure_filename(img.filename)
                filepath = os.path.join(images_directory, filename)
                img.save(filepath)
                images_filenames.append(filename)

        # saves the names of the images in images.json
        with open(os.path.join(task_directory, 'images.json'), 'w') as f:
            json.dump(images_filenames, f)

        # create the Annotations folder inside Task folder
        os.makedirs(annotations_directory)
        # inside Annotations there are the 2 folders TaskAnnotations and LabelAnnotaions
        os.makedirs(task_annotations_directory)
        os.makedirs(label_annotations_directory)

        return redirect(url_for('task'))
    else:
        # based on the existance of the Task folder Task.html has 2 different behaviours
        # it can allow to create a task (if the Task folder doesn't exist)
        # or it can allow to work on the task (if the Task folder exists)
        task_created = os.path.exists(task_directory)

        if task_created:
            with open(os.path.join(task_directory, 'data.json'), 'r') as f:
                data = json.load(f)
            nimages = int(data.get('nimages'))
        else:
            nimages = 0  # but it's not really important this value if the task is not created

        return render_template('task.html', task_created=task_created, nimages=nimages)

@app.route('/delete-task')
def delete_task():
    if os.path.exists(task_directory):
        shutil.rmtree(task_directory)
    return redirect(url_for('task'))

@app.route('/task/<path:filename>')
def serve_task_file(filename):
    task_folder = os.path.join(app.root_path, 'Task')
    file_path = os.path.join(task_folder, filename)

    if not os.path.isfile(file_path):
        abort(404)

    return send_from_directory(task_folder, filename)


@app.route('/save-task-annotations', methods=['POST'])
def save_task_annotations():

    annotations = request.get_json()

    vanishing_points_x = annotations.get("vanishing_points_x")
    vanishing_points_y = annotations.get("vanishing_points_y")
    vanishing_points_z = annotations.get("vanishing_points_z")
    construction_points = annotations.get("construction_points")
    label_points = annotations.get("label_points")
    construction_lines = annotations.get("construction_lines")
    bounding_boxes = annotations.get("bounding_boxes")

    # we might check if those are good annotations
    # but we are local, so it doens't matter
    
    # we simply save the annotations in TaskAnnotations
    nimages = len(annotations.get("vanishing_points_x"))
    for i in range(nimages):
        filename = 'taskAnnotations_' + str(i) + '.json'
        data = {
            "vanishing_points_x": vanishing_points_x[i],
            "vanishing_points_y": vanishing_points_y[i],
            "vanishing_points_z": vanishing_points_z[i],
            "construction_points": construction_points[i],
            "label_points": label_points[i],
            "construction_lines": construction_lines[i],
            "bounding_boxes": bounding_boxes[i],
        }
        with open(os.path.join(task_annotations_directory, filename), 'w') as f:
            json.dump(data, f, indent=4)

    
    return {"response": "ok"}


@app.route('/export-task')
def export_task():
    return "export"


# =============================================================================

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)