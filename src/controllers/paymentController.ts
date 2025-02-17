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
  console.log('Raw', vnp_Params);
  const sortedParams = sortParams(vnp_Params);
  console.log('sorted', sortedParams);
  const urlParams = new URLSearchParams();
  for (const [key, value] of Object.entries(sortedParams)) {
    urlParams.append(key, value as string);
  }
  const querystring = urlParams.toString();
  console.log('urlToSign', querystring);

  const hmac = crypto.createHmac('sha512', secretKey);
  const signed = hmac.update(querystring).digest('hex');

  urlParams.append('vnp_SecureHash', signed);

  const paymentUrl = `${vnpUrl}?${urlParams.toString()}`;

  res.json({
    success: true,
    paymentUrl: paymentUrl
  });
};
