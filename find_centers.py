
import cv2
import matplotlib.image as mpimg
import numpy as np

filename = input('Enter an image filename here: ')

img = cv2.imread(filename)

# convert the image to grayscale
gray_image = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

# convert the grayscale image to binary image
# thresh = cv2.threshold(
    # gray_image, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)[1]

thresh = cv2.threshold(
    gray_image, 180, 255, cv2.THRESH_BINARY)[1]

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
# cv2.imshow("Image", img2)
cv2.waitKey(0)
print(star_centers)

# cv2.imwrite('centers_of_' + filename, img)