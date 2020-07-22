---
layout: post
title: OpenCV Basics
date: 2020-07-22 16:04
category: [Techology, OpenCV]
author: Vikas Srivastava
tags: [OpenCV, python, Cv2]
summary: Basics of OpenCV
---

OpenCV is OpenSource Computer Vision Library, which helps in reconizing images/videos using python and other languages. I will start with basics of computer vision. In This Blog we will be doing lots of hands on coding. I will be adding self explainatory code comments.

## **Types of Resolution**

| Type | Resolution  |
| ---- | :---------: |
| VGA  |  640 x 480  |
| HD   | 1280 x 720  |
| FHD  | 1920 x 1080 |
| 4K   | 3840 x 2160 |

## **Types of Images**

##### **Binary Images**
Binary Image consist of two colors black and white, We can also denote these two with 0's and 1's where 0 being white and 1 is black.

##### **Gray Images**
Gray Image consist of gray scale, Which is from 0-256. These are the levels of colors.

##### **Color Images**
Color Image consist of three colors *Red*, *Green* and *Blue*. So wheneven we see any color images its not single layer but three layers of color.

```python
Color images in VGA will have
RBG VGA = 3 * 640 * 480 (pixels) 
```

## **Example Codes**

#### **Requirement**
Before starting code we need to install few of python module, Below are the modules, I hope you already have basic understanding of python.
```bash
conda install opencv
conda install numpy 
```

#### **Reading Image**
Reading a simple images required few things image, `Cv2 module`
```python
import os, sys
import cv2

# Printing the cv2 version
print(cv2.__version__)

# read the image from the path {option 1=coloured, 0=grayed, -1=unchanged}
img = cv2.imread("Resources/bird.jpg", -1)

# show the images
cv2.imshow("Image", img)

# show the image for 5 seconds, 0 means undefinite
cv2.waitKey(5000)

# destroy all the image windows
cv2.destroyAllWindows()
```

#### **Reading Video**
Reading a video is little different from reading the image as in Image we use imread function to read but in video we need to use videocapture. We need to understand how video works in system.

Video is nothing but mutiple images running in continoues loop, Each image is a frame and have some properties attached to it. Let's see the code to see the video

```python
import cv2

def showVideo(video):
    # initiate the video
    cap = cv2.VideoCapture(video)

    # check if the capture is open the show the video
    while cap.isOpened():

        # Capture the response and frame
        success, frame = cap.read()

        # if response is true run further
        if success == True:

            # take the frame and flip false 0=true
            frame = cv2.flip(frame, 1)

            # show the video
            cv2.imshow("frame", frame)

            # press q to quit the video
            if cv2.waitKey(1) & 0xFF == ord("q"):
                break
        else:
            break
    # Release everything if job is finished
    cap.release()

    # destroy all the windows
    cv2.destroyAllWindows()

# main function
if __name__ == "__main__":
    video = "Resources/peoples.mp4"
    showVideo(video)
```

#### **Reading WebCam**
Reading video is pretty much similar as reading using webcam or laptop cam, All you need to do is to find the reference of your camera. Generally its `0` if it's your laptop or webcam and `1` if you have secondary camera attached to your system

```python
import cv2

# initiate the camera of the devide
cap = cv2.VideoCapture(0)

# define the size
cap.set(3, 640)
cap.set(4, 480)

# increase the brightness
cap.set(10, 200)

# check if the capture is open the show the video
while cap.isOpened():

    # Capture the response and frame
    ret, frame = cap.read()

    # if response is true run further
    if ret == True:

        # take the frame and flip false 0=true
        frame = cv2.flip(frame, 1)

        # show the video
        cv2.imshow("frame", frame)

        # press q to quit the video
        if cv2.waitKey(1) & 0xFF == ord("q"):
            break
    else:
        break
# Release everything if job is finished
cap.release()

# destroy all the windows
cv2.destroyAllWindows()
```
Now as you have the code to try, let me know how it went. If you want to download the code you can download from [here](https://github.com/vikassri/OpenCV_Learning)

Hope you have learned something, please let me know in the comments. Happy Learning.
