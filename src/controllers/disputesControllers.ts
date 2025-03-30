import { Request, Response } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';
import { ObjectId } from 'mongodb';
import {
  CancelDisputeRequest,
  ChangeStatusDisputeRequest,
  CreateDisputeRequest,
  DisputeListSearchRequest,
  UpdateDisputeRequest
} from '~/models/requests/DisputeRequest';
import {
  ChangeStatusTaskRequest,
  CreateTaskRequest,
  GetAllTaskRequest,
  UpdateTaskRequest
} from '~/models/requests/TaskRequest';
import disputesService from '~/services/disputesService';

export const createDisputeController = async (
  req: Request<ParamsDictionary, any, CreateDisputeRequest>,
  res: Response
) => {
  const result = await disputesService.createDispute(req.body);
  res.status(200).json({
    message: 'Create dispute success',
    result
  });
};

export const getDisputeByIdController = async (req: Request<ParamsDictionary, any, any>, res: Response) => {
  const { id } = req.params;
  const { decodeAuthorization } = req.body;
  const dispute = await disputesService.getDisputeById(
    id,
    new ObjectId(decodeAuthorization.payload.userId),
    decodeAuthorization
  );
  res.status(200).json({
    message: 'Get dispute by id success',
    result: dispute
  });
};

export const updateDisputeController = async (
  req: Request<ParamsDictionary, any, UpdateDisputeRequest>,
  res: Response
) => {
  const { id } = req.params;
  const dispute = await disputesService.updateDispute(id, req.body);
  res.status(200).json({
    message: 'Update dispute success',
    result: dispute
  });
};

export const updateDisputeStatusController = async (
  req: Request<ParamsDictionary, any, ChangeStatusDisputeRequest>,
  res: Response
) => {
  const { id } = req.params;
  const dispute = await disputesService.changeStatusDispute(id, req.body);
  res.status(200).json({
    message: 'Update dispute status success',
    result: dispute
  });
};

export const cancelDisputeController = async (
  req: Request<ParamsDictionary, any, CancelDisputeRequest>,
  res: Response
) => {
  const dispute = await disputesService.cancelDispute(req.body);
  res.status(200).json({
    message: 'Cancel dispute success',
    result: dispute
  });
};

export const getListDisputeController = async (
  req: Request<ParamsDictionary, any, DisputeListSearchRequest>,
  res: Response
) => {
  const { page, limit } = req.query;
  const disputes = await disputesService.getListDispute(Number(page), Number(limit), req.body);
  res.status(200).json({
    message: 'Get list dispute success',
    result: disputes
  });
};

export const payAllDisputeController = async (req: Request<ParamsDictionary, any, any>, res: Response) => {
  const { id } = req.params;
  const dispute = await disputesService.payAllDispute(id, req.body);
  res.status(200).json({
    message: 'Pay all dispute success',
    result: dispute
  });
};

export const payOneDisputeController = async (req: Request<ParamsDictionary, any, any>, res: Response) => {
  const { id } = req.params;
  const dispute = await disputesService.payOneDispute(id, req.body);
  res.status(200).json({
    message: 'Pay one dispute success',
    result: dispute
  });
};

export const notPayDisputeController = async (req: Request<ParamsDictionary, any, any>, res: Response) => {
  const { id } = req.params;
  const dispute = await disputesService.notPayDispute(id, req.body);
  res.status(200).json({
    message: 'Not pay dispute success',
    result: dispute
  });
};
