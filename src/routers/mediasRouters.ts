import { Router } from 'express';
import { access } from 'fs';
import { get } from 'lodash';
import {
  getSegmentControllser,
  getStatusUploadHLSVideoController,
  getVideoHLSController,
  uploadFile,
  uploadImage,
  uploadVideo,
  uploadVideoHLS
} from '~/controllers/mediasControllers';
import { accessTokenValidator } from '~/middlewares/usersMiddlewares';
import { catchError } from '~/utils/handler';

const router = Router();
router.post('/upload-image', accessTokenValidator, catchError(uploadImage));
router.post('/upload-video', accessTokenValidator, catchError(uploadVideo));
router.post('/upload-video-hls', accessTokenValidator, catchError(uploadVideoHLS));
router.post('/upload-file', accessTokenValidator, catchError(uploadFile));
router.get('/video-hls/:id/master.m3u8', catchError(getVideoHLSController));
router.get('/video-hls/:id/:v/:segment', catchError(getSegmentControllser));
router.get('/getStatusUploadVideoHLS/:id', catchError(getStatusUploadHLSVideoController));

export default router;
