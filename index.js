
/* WEB SERVER INITIALIZATION */
const app = require('express')();
// const http = require('http').createServer(app);
const port = 3000;

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/static/index.html')
})



function dist(x, y) {
    let d = 0;
    for (let i = 0; i < x.length; i++) {
        d += (x[i] - y[i]) ** 2;
    }

    return Math.sqrt(d);
}


class Star {
    constructor(new_name, new_ra, new_dec, new_mag) {
        this.name = new_name
        this.ra = new_ra
        this.dec = new_dec
        this.mag = new_mag
    }

    static to_ra(string) {
        string = string.trim();
        if (string.length == 0) return 0;

        let hrs = parseFloat(string.substring(0, 2));
        let mins = parseFloat(string.substring(2, 4));
        let secs = parseFloat(string.substring(4));

        return hrs + mins / 60 + secs / 3600;
    }

    static to_dec(string) {
        string = string.trim()
        if (string.length == 0) return 0;

        let sign = (string[0] === '-') ? -1 : 1

        let degs = parseFloat(string.substring(0, 2));
        let mins = parseFloat(string.substring(2, 4));
        let secs = parseFloat(string.substring(4));

        return sign * (degs + mins / 60 + secs / 3600)
    }
}



/* Read data from `bsc5.txt` database */
const fs = require('fs');
var stars = [];
fs.readFile('bsc5.txt', 'utf-8', (err, data) => {
    if (err) throw err;

    let database = data.split('\n');

    for (let i = 0; i < database.length; i++) {
        let line = database[i];

        let name = line.substring(25, 31).trim()        // Henry Draper number of the star
        let ra = Star.to_ra(line.substring(75, 83))     // J2000 right ascension
        let dec = Star.to_dec(line.substring(83, 90))   // J2000 declination

        let mag = line.substring(102, 107).trim()
        mag = (mag.length === 0) ? 999 : parseFloat(mag)

        stars.push(new Star(name, ra, dec, mag))
    }

    stars.sort((a, b) => a.mag - b.mag);
    stars = stars.slice(0, 50);
});

let star_centers = [];
app.get("/centers", (req, res) => {
    star_centers = req.query.arr;

    console.log(star_centers);
});

// array to store the coordinates of the star centers

// find the centermost star
// x_avg = sum(np.array(star_centers)[:, 0]/len(star_centers))
// y_avg = sum(np.array(star_centers)[:, 1]/len(star_centers))

// print(x_avg, y_avg)
// center_star = min(star_centers, key=lambda a: math.dist(a, [x_avg, y_avg]))
// print(center_star)

// distances = sorted([math.dist(i, center_star) for i in star_centers])
// # distances = [[i[0] - center_star[0], i[1] - center_star[1]] for i in star_centers]
// print(distances)


// check each star in the database to see how well it works as the centermost star
// by computing the array of distances from the selected star to each other star
// and compare the array to the given image
function radians(x) {
    return x * Math.PI / 180;
}


function hav(x) {
    return (1 - Math.cos(x)) / 2
}


function haversine_distance(x, y) {
    x[0] = radians(x[0])
    x[1] = radians(x[1])
    y[0] = radians(y[0])
    y[1] = radians(y[1])

    h = hav(y[0] - x[0]) + Math.cos(x[0]) * Math.cos(y[0]) * hav(y[1] - x[1])
    return 2 * Math.asin(Math.sqrt(h)) // assume unit sphere
}





function similarity(x, y) {
    // return np.dot(x, y) / (np.linalg.norm(x) * np.linalg.norm(y))
    return dist(x, y)
}


let best_similarity = 200
let best_star = -1
for (let i = 0; i < stars.length; i++) {
    let s = stars[i];
    let ref_distances = [];
    for (let j = 0; j < stars.length; j++) {
        ref_distances.push(haversine_distance([stars[j].dec, stars[j].ra], [s.dec, s.ra]));
    }

    ref_distances.sort();
    ref_distances = ref_distances.splice(0, distances.length);

    // find the star that works best as the center star by comparing the set of distances
    if (similarity(distances, ref_distances) < best_similarity) {
        best_similarity = similarity(distances, ref_distances)
        best_star = s
    }
}


// print(s.name + ", " + str(s.mag))
// print(best_similarity)


//serving files
app.use((req, res) => {
    res.sendFile(__dirname + req.url);
});

app.listen(port, () => {
    console.log(`App listening at ${port}`)
})