import { ParamsDictionary } from 'express-serve-static-core';
import { Request, Response } from 'express';
import { ErrorWithStatus } from '~/models/Errors';
import { httpStatus } from '~/constants/httpStatus';
import db from '~/services/databaseServices';
import Payment from '~/models/schemas/PaymentSchema';
import { ObjectId } from 'mongodb';
import { env } from '~/constants/config';
import crypto from 'crypto';
import querystring from 'querystring';
import moment from 'moment';
import userService from '~/services/usersServices';
function sortParams(obj: any) {
  const sortedObj = Object.entries(obj)
    .filter(([key, value]) => value !== '' && value !== undefined && value !== null)
    .sort(([key1], [key2]) => key1.toString().localeCompare(key2.toString()))
    .reduce((acc: { [key: string]: any }, [key, value]) => {
      acc[key] = value;
      return acc;
    }, {});

  return sortedObj;
}

export const createPaymentController = async (req: Request<ParamsDictionary, any, any>, res: Response) => {
  const { amount } = req.body;
  const user_id = req.body.decodeAuthorization.payload.userId;

  if (!amount || amount <= 0)
    throw new ErrorWithStatus({
      status: httpStatus.BAD_REQUEST,
      message: 'Số tiền không hợp lệ !'
    });
  const newPayment = await db.payments.insertOne(
    new Payment({
      user_id: new ObjectId(user_id),
      amount: amount as number
    })
  );

  const orderId = newPayment.insertedId;

  const date = new Date();
  const createDate = moment(date).format('YYYYMMDDHHmmss');
  const expireDate = moment(date).add(15, 'minutes').format('YYYYMMDDHHmmss');
  const ipAddr = req.ip || '127.0.0.1';
  const tmnCode = env.vnp_TMNCode;
  const secretKey = env.vnp_HashSecret;
  const vnpUrl = env.vnp_Url;
  const returnUrl = env.vnp_returnUrl;

  const locale = 'vn';
  const currCode = 'VND';

  const vnp_Params = {
    vnp_Version: '2.1.0',
    vnp_Command: 'pay',
    vnp_TmnCode: tmnCode,
    vnp_Locale: locale,
    vnp_CurrCode: currCode,
    vnp_TxnRef: orderId.toString(),
    vnp_OrderInfo: `Payment for ${orderId.toString()}`,
    vnp_OrderType: 'other',
    vnp_Amount: amount * 100,
    vnp_ReturnUrl: returnUrl,
    vnp_IpAddr: ipAddr,
    vnp_CreateDate: createDate,
    vnp_ExpireDate: expireDate
  };
  const sortedParams = sortParams(vnp_Params);
  const urlParams = new URLSearchParams();
  for (const [key, value] of Object.entries(sortedParams)) {
    urlParams.append(key, value as string);
  }
  const querystring = urlParams.toString();

  const hmac = crypto.createHmac('sha512', secretKey);
  const signed = hmac.update(querystring).digest('hex');

  urlParams.append('vnp_SecureHash', signed);

  const paymentUrl = `${vnpUrl}?${urlParams.toString()}`;

  res.status(200).json({
    message: 'Tạo đơn yêu cầu nạp tiền thành công',
    result: paymentUrl
  });
};

export const vnPayPaymentReturnController = async (req: Request<ParamsDictionary, any, any>, res: Response) => {
  const { vnp_ResponseCode, vnp_TxnRef, vnp_TransactionNo, vnp_CardType, vnp_PayDate } = req.query;
  if (!vnp_ResponseCode || !vnp_TxnRef) {
    return res.status(400).json({
      success: false,
      message: 'All fields are required'
    });
  }
  const order = await db.payments.findOneAndUpdate(
    {
      _id: new ObjectId(vnp_TxnRef.toString())
    },
    {
      $set: {
        paymentMethod: vnp_CardType?.toString(),
        vnp_TransactionNo: vnp_TransactionNo?.toString(),
        vnp_ResponseCode: vnp_ResponseCode?.toString(),
        vnp_PayDate: moment(vnp_PayDate?.toString(), 'YYYYMMDDHHmmss').toDate(),
        status: vnp_ResponseCode !== '00' ? (vnp_ResponseCode !== '24' ? 'FAILED' : 'CANCELED') : 'SUCCESS'
      }
    }
  );
  if (!order) {
    return res.status(401).json({
      success: false,
      message: 'OrderId not found'
    });
  }
  let redirectUrl = '';
  if (vnp_ResponseCode !== '00') {
    redirectUrl = `${env.feBillingURL}?status=fail`;
  } else {
    redirectUrl = `${env.feBillingURL}?status=success`;
  }
  res.redirect(redirectUrl);
};

export const getPaymentOrderController = async (req: Request<ParamsDictionary, any, any>, res: Response) => {
  const { page, limit } = req.query;
  const user_id = new ObjectId(req.body.decodeAuthorization.payload.userId);
  const result = await userService.getPaymentOrders(Number(page), Number(limit), user_id);
  res.status(200).json({
    result,
    message: 'Lấy thông tin thành công'
  });
};
