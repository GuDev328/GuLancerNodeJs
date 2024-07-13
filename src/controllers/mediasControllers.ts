import { Console } from 'console';
import { Request, Response } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';
import formidable from 'formidable';
import path from 'path';
import { httpStatus } from '~/constants/httpStatus';
import { ErrorWithStatus } from '~/models/Errors';
import mediasService from '~/services/mediaServices';
import { sendFileFromS3 } from '~/utils/s3';

export const uploadImage = async (req: Request<ParamsDictionary, any, any>, res: Response) => {
  const result = await mediasService.handleUploadImage(req);
  res.status(200).json({
    result,
    message: 'Upload image suscess'
  });
};

export const uploadVideo = async (req: Request<ParamsDictionary, any, any>, res: Response) => {
  const result = await mediasService.handleUploadVideo(req);
  res.status(200).json({
    result,
    message: 'Upload video suscess'
  });
};

export const uploadVideoHLS = async (req: Request<ParamsDictionary, any, any>, res: Response) => {
  const result = await mediasService.handleUploadVideoHLS(req);
  res.status(200).json({
    result,
    message: 'Upload video HLS suscess'
  });
};

export const getVideoHLSController = async (req: Request<ParamsDictionary, any, any>, res: Response) => {
  const { id } = req.params;
  const data = sendFileFromS3(res, 'videos-hls/' + id + '/master.m3u8');
  // const pathM3U8 = path.resolve('uploads/videos', id, 'master.m3u8');
  // return res.sendFile(pathM3U8, (err) => {
  //   if (err) {
  //     console.log(err);
  //     throw new ErrorWithStatus({
  //       message: 'Error while send file',
  //       status: httpStatus.NOT_FOUND
  //     });
  //   }
  // });
};

export const getSegmentControllser = async (req: Request<ParamsDictionary, any, any>, res: Response) => {
  const { id, v, segment } = req.params;
  const data = sendFileFromS3(res, 'videos-hls/' + id + '/' + v + '/' + segment);
  // const pathSegment = path.resolve('uploads/videos', id, v, segment);
  // return res.sendFile(pathSegment, (err) => {
  //   if (err) {
  //     console.log(err);
  //     throw new ErrorWithStatus({
  //       message: 'Error while send file',
  //       status: httpStatus.NOT_FOUND
  //     });
  //   }
  // });
};

export const getStatusUploadHLSVideoController = async (req: Request<ParamsDictionary, any, any>, res: Response) => {
  const { id } = req.params;
  const result = await mediasService.checkStatusEncodeHLSVideo(id);
  res.status(200).json({
    result
  });
};
