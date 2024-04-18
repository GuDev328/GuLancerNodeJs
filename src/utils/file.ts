import path from 'path';
import { Request, Response } from 'express';
import { ErrorWithStatus } from '~/models/Errors';
import { httpStatus } from '~/constants/httpStatus';
import { File } from 'formidable';
import fs from 'fs-extra';
import { nanoid } from 'nanoid';

export const handleUploadImage = async (req: Request) => {
  const formidable = (await import('formidable')).default;
  const form = formidable({
    uploadDir: path.resolve('uploads/temp'),
    maxFiles: 10,
    keepExtensions: true,
    maxFileSize: 20 * 1024 * 1024, // 20MB
    maxTotalFileSize: 200 * 1024 * 1024, // 200MB
    filter: function ({ name, originalFilename, mimetype }) {
      const valid = name === 'image' && Boolean(mimetype?.includes('image/'));
      if (!valid) {
        form.emit(
          'error' as any,
          new ErrorWithStatus({
            status: httpStatus.BAD_REQUEST,
            message: 'Kiểu file không hợp lệ'
          }) as any
        );
      }
      return valid;
    }
  });
  return new Promise<File[]>((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) {
        reject(err);
      }
      if (!files.image) {
        reject(
          new ErrorWithStatus({
            status: httpStatus.BAD_REQUEST,
            message: 'File không được để trống'
          }) as any
        );
      }
      resolve(files.image as File[]);
    });
  });
};

export const handleUploadVideo = async (req: Request) => {
  const formidable = (await import('formidable')).default;
  const form = formidable({
    uploadDir: path.resolve('uploads/videos'),
    maxFiles: 5,
    keepExtensions: true,
    maxFileSize: 100 * 1024 * 1024, // 50MB
    maxTotalFileSize: 250 * 1024 * 1024, // 250MB
    filter: function ({ name, originalFilename, mimetype }) {
      const valid = name === 'video' && Boolean(mimetype?.includes('mp4') || mimetype?.includes('quicktime'));
      if (!valid) {
        form.emit(
          'error' as any,
          new ErrorWithStatus({
            status: httpStatus.BAD_REQUEST,
            message: 'Kiểu file không hợp lệ'
          }) as any
        );
      }
      return valid;
    }
  });
  return new Promise<File[]>((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) {
        reject(err);
      }
      if (!files.video) {
        reject(
          new ErrorWithStatus({
            status: httpStatus.BAD_REQUEST,
            message: 'File không được để trống'
          }) as any
        );
      }
      resolve(files.video as File[]);
    });
  });
};

export const handleUploadVideoHLS = async (req: Request) => {
  const formidable = (await import('formidable')).default;
  const uniqueName = nanoid();
  await fs.mkdir(path.resolve('uploads/videos/' + uniqueName), { recursive: true });
  const form = formidable({
    uploadDir: path.resolve('uploads/videos/' + uniqueName),
    maxFiles: 1,
    keepExtensions: false,
    maxFileSize: 100 * 1024 * 1024, // 100MB
    filename: (name, ext) => `${uniqueName}${ext}`,
    filter: function ({ name, originalFilename, mimetype }) {
      const valid = name === 'video' && Boolean(mimetype?.includes('mp4') || mimetype?.includes('quicktime'));
      if (!valid) {
        form.emit(
          'error' as any,
          new ErrorWithStatus({
            status: httpStatus.BAD_REQUEST,
            message: 'Kiểu file không hợp lệ'
          }) as any
        );
      }
      return valid;
    }
  });
  return new Promise<File[]>((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) {
        reject(err);
      }
      if (!files.video) {
        reject(
          new ErrorWithStatus({
            status: httpStatus.BAD_REQUEST,
            message: 'File không được để trống'
          }) as any
        );
      }
      resolve(files.video as File[]);
    });
  });
};

export const getFiles = (dir: string, files: string[] = []) => {
  const fileList = fs.readdirSync(dir);
  for (const file of fileList) {
    const name = `${dir}/${file}`;
    if (fs.statSync(name).isDirectory()) {
      getFiles(name, files);
    } else {
      files.push(name);
    }
  }
  return files;
};
