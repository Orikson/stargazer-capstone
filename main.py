
import math
from math import pi

import cv2
import matplotlib.image as mpimg
import numpy as np
import pandas


class star:
    name = ''
    ra, dec, mag = 0, 0, 0

    def __init__(self, new_name, new_ra, new_dec, new_mag):
        self.name = new_name
        self.ra = new_ra
        self.dec = new_dec
        self.mag = new_mag

    @staticmethod
    def to_ra(string):
        string = string.strip()
        if len(string) == 0:
            return 0

        hrs = float(string[0:2])
        mins = float(string[2:4])
        secs = float(string[4:])

        return hrs + mins/60 + secs/3600

    @staticmethod
    def to_dec(string):
        string = string.strip()
        if len(string) == 0:
            return 0

        sign = string[0]
        sign = -1 if sign == '-' else 1

        degs = float(string[0:2])
        mins = float(string[2:4])
        secs = float(string[4:])

        return sign*(degs + mins/60 + secs/3600)


# read all of the star info from the bsc5.dat file
# and write it to the stars array
stars = []
f = open('bsc5.dat', 'r')
for line in f:
    name = line[25:31].strip()  # Henry Draper number of the star
    ra = star.to_ra(line[75:83])  # J2000 right ascension
    dec = star.to_dec(line[83:90])  # J2000 declination

    mag = line[102:107].strip()
    mag = 999 if len(mag) == 0 else float(mag)

    stars.append(star(name, ra, dec, mag))

stars.sort(key=lambda x: x.mag)

# read an image and find the locations of the stars
filename = input('Enter an image filename here: ')
img = cv2.imread(filename)

# convert the image to grayscale
gray_image = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY) 

# convert the grayscale image to binary image
thresh = cv2.threshold(
    gray_image, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)[1]

# find contours in the binary image
contours = cv2.findContours(thresh, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)[0]

# new image to draw the star centers on
img2 = np.full(img.shape, 0)  # sets the dimensions equal to the original image
img2 = img2.astype(dtype=np.uint8)

# array to store the coordinates of the star centers
star_centers = []
x_length, y_length = img2.shape[:2]

for c in contours:
    M = cv2.moments(c)  # calculate moments for each contour
    if M["m00"] != 0:  # calculate x and y coordinates of center
        cX = int(M["m10"] / M["m00"])
        cY = int(M["m01"] / M["m00"])

        cv2.circle(img, (cX, cY), 1, (255, 0, 0), -1)
        cv2.circle(img2, (cX, cY), 0, (255, 0, 0), -1)
        if cX < x_length and cY < y_length:
            star_centers.append([cX/x_length, cY/y_length])

cv2.imshow("Image", img)
cv2.waitKey(0)

# find the centermost star
x_avg = sum(np.array(star_centers)[:, 0]/len(star_centers))
y_avg = sum(np.array(star_centers)[:, 1]/len(star_centers))

print(x_avg, y_avg)
center_star = min(star_centers, key=lambda a: math.dist(a, [x_avg, y_avg]))
print(center_star)

distances = sorted([math.dist(i, center_star) for i in star_centers])
# print(distances)

# check each star in the database to see how well it works as the centermost star
# by computing the array of distances from the selected star to each other star
# and compare the array to the given image
def hav(x):
    return (1 - math.cos(x))/2

def haversine_distance(x, y):
    x[0] = math.radians(x[0])
    x[1] = math.radians(x[1])
    y[0] = math.radians(y[0])
    y[1] = math.radians(y[1])

    h = hav(y[0] - x[0]) + math.cos(x[0])*math.cos(y[0])*hav(y[1] - x[1])
    return 2*math.asin(math.sqrt(h)) #assume unit sphere


def similarity(x, y):
    # return np.dot(x, y) / (np.linalg.norm(x) * np.linalg.norm(y))
    return math.dist(x, y)

best_similarity = 200
best_star = -1
for s in stars:
    ref_distances = [haversine_distance([i.dec, i.ra], [s.dec, s.ra]) for i in stars]
    ref_distances = sorted(ref_distances)

    # find the star that works best as the center star by comparing the set of distances
    if similarity(distances, ref_distances) < best_similarity:
        best_similarity = similarity(distances, ref_distances)
        best_star = s

print(s.name + ", " + str(s.mag))
print(best_similarity)