class ErrorHandler extends Error{
  statusCode : number;

  constructor(errMessage : string, statusCode : number){
    super()
    this.message = errMessage
    this.statusCode = statusCode
  }
}

export default ErrorHandler