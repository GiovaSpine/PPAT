from flask import Flask, render_template, request, redirect, url_for
import os
import shutil
from werkzeug.utils import secure_filename
import json



app = Flask(__name__, template_folder='templates')
task_directory = os.path.join('app', 'Task')

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

        npunti = request.form['npoints']
        immagini = request.files.getlist('images[]')

        # creates the Task folder
        if not os.path.exists(task_directory):
            os.makedirs(task_directory)

        # saves the number of points and images in data.txt in the Task folder
        with open(os.path.join(task_directory, 'data.txt'), 'w') as f:
            f.write(f"npoints: {npunti}\n")
            f.write(f"nimages: {len(immagini)}\n")

        # creates the Images folder inside Task folder
        images_directory = os.path.join(task_directory, 'Images')
        os.makedirs(images_directory)

        # saves all of the images in the Images folder and prepares the list of the names of the images
        images_filenames = []
        for img in immagini:
            if img and img.filename:
                filename = secure_filename(img.filename)
                filepath = os.path.join(images_directory, filename)
                img.save(filepath)
                images_filenames.append(filename)

        # saves the names of the images in images.json
        with open(os.path.join(task_directory, 'images.json'), 'w') as f:
            json.dump(images_filenames, f)

        return redirect(url_for('task'))
    else:
        # based on the existance of the Task folder Task.html has 2 different behaviours
        # it can allow to create a task (if the Task folder doesn't exist)
        # or it can allow to work on the task (if the Task folder exists)
        task_created = os.path.exists(task_directory)
        return render_template('task.html', task_created=task_created)

@app.route('/delete-task')
def delete_task():
    if os.path.exists(task_directory):
        shutil.rmtree(task_directory)
    return redirect(url_for('task'))

# =============================================================================

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)