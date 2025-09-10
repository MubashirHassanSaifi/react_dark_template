import React, { useState, useRef } from 'react';
import CustomSocialButton from '../../../components/forms/theme-elements/CustomSocialButton';
import { Stack } from '@mui/system';
import { Avatar, Box } from '@mui/material';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import Button from '@mui/material/Button';
import * as faceapi from 'face-api.js';
import { useLoadFaceModels } from 'src/hooks/loadFaceModelsHook';
import { use } from 'react';

const FaceRecognition = ({ title }) => {
  const [open, setOpen] = useState(false);
  const models = useLoadFaceModels(); // load face-api models
  const streamRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const setVideoRef = async (e) => {
    if (e) {
      console.log('Video element:', e);
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      e.srcObject = stream;
      streamRef.current = stream;
      videoRef.current = e; // Store the video element reference
      console.log('models loaded:', models);
      let count = 0;
      const canvas = canvasRef.current;
      e.onloadeddata = async () => {
        const interval = setInterval(async () => {
          count += 1;
          console.log('Checking for face... Attempt:', count);
          if (models) {
            const faceDetection = await faceapi
              .detectSingleFace(e, new faceapi.SsdMobilenetv1Options())
              .withFaceLandmarks()
              .withFaceDescriptor();
            if (faceDetection) {
              clearInterval(interval); // Stop further detection attempts
              const resizedDetections = faceapi.resizeResults(faceDetection, {
                width: e.videoWidth,
                height: e.videoHeight,
              });

              // Clear old drawings
              const context = canvas.getContext('2d');
              context.clearRect(0, 0, canvas.width, canvas.height);

              // Draw landmarks
              faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
              faceapi.draw.drawDetections(canvas, resizedDetections);

              console.log('<<<<<<<< User Face Detection >>>>>>>', faceDetection);
            }
          }
        }, 500);
      };
    }
  };

  //open the dialog to start face detection
  const handleOpen = () => setOpen(true);

  // Close the dialog and stop the video stream
  const handleClose = () => {
    // Stop the video stream if it exists
    if (streamRef.current) {
      let tracks = streamRef.current.getTracks();
      tracks.forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null; // Disconnect the stream from the video element
    }
    console.log(streamRef);
    console.log(videoRef.current);
    setOpen(false);
  };

  return (
    <>
      <Stack direction="row" justifyContent="center" spacing={2} mt={3}>
        <CustomSocialButton onClick={handleOpen}>
          <Avatar
            sx={{
              width: 20,
              height: 20,
              borderRadius: 0,
              mr: 1,
            }}
          >
            {/* You can use a face icon here if available */}
            <span role="img" aria-label="face">
              👤
            </span>
          </Avatar>
          <Box
            sx={{
              display: { xs: 'none', sm: 'flex' },
              whiteSpace: 'nowrap',
              mr: { sm: '3px' },
            }}
          >
            {title}{' '}
          </Box>{' '}
          Face Detection
        </CustomSocialButton>
      </Stack>
      <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
        <DialogTitle>Face Detection Login</DialogTitle>
        <DialogContent>
          <video id="face-detection" ref={setVideoRef} autoPlay style={{ width: '100%' }} />
          <canvas
            ref={canvasRef}
            style={{ position: 'absolute', top: 0, left: 0, width: '100%' }}
          />
          <Button onClick={handleClose} sx={{ mt: 2 }} variant="contained" color="primary">
            Close
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default FaceRecognition;
