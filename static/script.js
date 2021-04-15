
const fileSelector = document.getElementById("myFile");
fileSelector.addEventListener("change", (event) => {
    const fileList = event.target.files;
    document.getElementById("fileDescriptor").innerHTML = 'The file you uploaded is: ' + fileList[0]['name'];
    var file = fileList[0];

    // Check to see if the file uploaded is an image
    if (file.type && file.type.indexOf('image') === -1) {
        console.log('Wrong file type');
    }

    var img = new Image();
    const reader = new FileReader();
    reader.addEventListener('load', (event) => {
        img.src = event.target.result;
        // Create the canvases to store the images
        var canvas = document.getElementById('canvas');
        var ctx = canvas.getContext('2d');
        img.onload = function () {
            // Set the dimensions of the canvases to fit the images
            canvas.width = img.width;
            canvas.height = img.height;
            // canvasEdited.width = img.width;
            // canvasEdited.height = img.height;

            // Display the original image
            ctx.drawImage(img, 0, 0);

            let src = cv.imread('canvas');
            let dst = cv.Mat.zeros(src.cols, src.rows, cv.CV_8UC3);
            cv.cvtColor(src, src, cv.COLOR_RGBA2GRAY, 0);
            cv.threshold(src, src, 120, 200, cv.THRESH_BINARY);
            let contours = new cv.MatVector();
            let hierarchy = new cv.Mat();
            // You can try more different parameters
            cv.findContours(src, contours, hierarchy, cv.RETR_CCOMP, cv.CHAIN_APPROX_SIMPLE);

            var star_centers = [];
            for (let i = 0; i < contours.size(); ++i) {
                let cnt = cv.moments(contours.get(i), false);
                let cx = cnt.m10 / cnt.m00;
                let cy = cnt.m01 / cnt.m00;
                star_centers.push([cx, cy]);
            }
            // cv.imshow('canvasEdited', dst);
            console.log(star_centers);
            src.delete(); dst.delete(); contours.delete(); hierarchy.delete();
        }
    });
    reader.readAsDataURL(file);
});


