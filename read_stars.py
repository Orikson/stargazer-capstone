
import numpy as np


class Star:
    name = ''
    ra, dec, mag = 0, 0, 0

    def __init__(self, new_name, new_ra, new_dec, new_mag):
        self.name = new_name
        self.ra = new_ra
        self.dec = new_dec
        self.mag = new_mag

    @staticmethod
    def str_to_ra(string):
        string = string.strip()
        if len(string) == 0:
            return 0

        hrs = float(string[0:2])
        mins = float(string[2:4])
        secs = float(string[4:])

        return hrs + mins/60 + secs/3600

    @staticmethod
    def str_to_dec(string):
        string = string.strip()
        if len(string) == 0:
            return 0

        sign = string[0]
        sign = -1 if sign == '-' else 1

        degs = float(string[0:2])
        mins = float(string[2:4])
        secs = float(string[4:])

        return degs + mins/60 + secs/3600


stars = []

f = open('bsc5.dat', 'r')
for line in f:
    name = line[25:31].strip()  # Henry Draper number of the star
    ra = Star.str_to_ra(line[75:83])  # J2000 right ascension
    dec = Star.str_to_dec(line[83:90])  # J2000 declination

    mag = line[102:107].strip()
    mag = 999 if len(mag) == 0 else float(mag)

    stars.append(Star(name, ra, dec, mag))

stars.sort(key=lambda x: x.mag)

print(str(stars[0].mag) + ', ' + stars[0].name + ', ' +
      str(stars[0].ra) + ', ' + str(stars[0].dec))
print(str(stars[1].mag) + ', ' + stars[1].name)
