
/* WEB SERVER INITIALIZATION */
const app = require('express')();
// const http = require('http').createServer(app);
const port = 3000;

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/static/index.html')
})


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

        let degs = parseFloat(string.substring(1, 3));
        let mins = parseFloat(string.substring(3, 5));
        let secs = parseFloat(string.substring(5));

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
    stars = stars.slice(0, 200);
    console.log(stars.splice(0, 10));
});

app.get("/centers", (req, res) => {
    let star_centers = [];
    let raw_data = req.query.arr.split(',');
    for (let i = 0; i < raw_data.length; i += 2) {
        let array = [parseFloat(raw_data[i]), parseFloat(raw_data[i + 1])];
        star_centers.push(array);
    }

    console.log(star_centers);

    let x_avg = 0, y_avg = 0;
    for (let i = 0; i < star_centers.length; i++) {
        x_avg += star_centers[i][0];
        y_avg += star_centers[i][1];
    }

    x_avg /= star_centers.length
    y_avg /= star_centers.length
    
    console.log(x_avg, y_avg);

    // find the centermost star
    let bestValue = 10000000;
    let center_star = '';

    for (let i = 0; i < star_centers.length; i++) {
        let check = dist(star_centers[i], [x_avg, y_avg]);
        if (check < bestValue) {
            center_star = star_centers[i];
            bestValue = check;
        }
    }

    console.log(center_star);

    let distances = [];
    for (let i = 0; i < star_centers.length; i++) {
        distances.push(dist(star_centers[i], center_star));
    }
    distances.sort((a, b) => a - b);

    console.log(distances);

    // check each star in the database to see how well it works as the centermost star
    // by computing the array of distances from the selected star to each other star
    // and compare the array to the given image

    let best_similarity = 2000000;
    let best_star = -1;
    console.log(stars.length);
    for (let i = 0; i < stars.length; i++) {
        let s = stars[i];
        let ref_distances = [];
        for (let j = 0; j < stars.length; j++) {
            ref_distances.push(haversine_distance([stars[j].dec, stars[j].ra], [s.dec, s.ra]));
        }

        ref_distances.sort((a, b) => a - b);
        ref_distances = ref_distances.splice(0, distances.length);

        // console.log(ref_distances);

        // find the star that works best as the center star by comparing the set of distances
        if (similarity(distances, ref_distances) < best_similarity && best_similarity > 3.5) {
            best_similarity = similarity(distances, ref_distances);
            best_star = s;

            console.log(s);
            console.log(best_similarity);
        }
    }

    console.log(best_star);
    console.log(best_similarity);

    console.log(best_constellation(best_star.ra, best_star.dec));

    res.send(JSON.stringify({
        constellation: best_constellation(best_star.ra, best_star.dec),
        star: best_star
    }));
});


/**
 * Constellation location is based on the location of the alpha star
 */
var constellations;
fs.readFile('constellations.json', (err, data) => {
    if (err) throw err;
    constellations = JSON.parse(data);
    console.log(constellations);
})

function best_constellation(ra, dec) {
    let best_constellation = -1;
    let best_similarity = 100000;
    for (let c of Object.keys(constellations)) {
        let constellation_ra = constellations[c].alpha.ra;
        let constellation_dec = constellations[c].alpha.dec;

        let distance = haversine_distance([constellation_ra, constellation_dec], [ra, dec]);
        if (distance < best_similarity) {
            best_similarity = distance;
            best_constellation = c;
        }
    }

    return best_constellation;
}

function dist(x, y) {
    let d = 0;
    for (let i = 0; i < x.length; i++) {
        d += (x[i] - y[i]) ** 2;
    }

    return Math.sqrt(d);
}


function radians(x) {
    return x * Math.PI / 180;
}


function hav(x) {
    return (1 - Math.cos(x)) / 2;
}


function haversine_distance(x, y) {
    x[0] = radians(x[0]);
    x[1] = radians(x[1]);
    y[0] = radians(y[0]);
    y[1] = radians(y[1]);

    h = hav(y[0] - x[0]) + Math.cos(x[0]) * Math.cos(y[0]) * hav(y[1] - x[1]);
    return 2 * Math.asin(Math.sqrt(h)); // assume unit sphere
}


function similarity(x, y) {
    return dist(x, y);
}


//serving files
app.use((req, res) => {
    res.sendFile(__dirname + req.url);
});

app.listen(port, () => {
    console.log(`App listening at ${port}`)
})