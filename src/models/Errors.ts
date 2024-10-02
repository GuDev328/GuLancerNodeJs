export class ErrorWithStatus {
  message: string;
  code: string;
  status: number;

  constructor({ message, code = '', status }: { message: string; code?: string; status: number }) {
    this.message = message;
    this.code = code;
    this.status = status;
  }
}
