import { NextFunction, Request, Response } from "express"
import ErrorHandler from "../utils/Utility_Class.js"
import { Controller } from "../types/Types.js";


export const errorMiddleware = (
    err: ErrorHandler,
    req: Request,
    res: Response,
    next: NextFunction
    )=>{
        
        err.message ||= "server error"
        err.statusCode ||= 500;

        if (err.name === "CastError") err.message = "Invalid ID";

        return res.status(err.statusCode).json({
            success: false,
            message: err.message,
        })
}

export const TryCatchBlockWrapper = (func: Controller) => (
    req: Request,
    res: Response,
    next: NextFunction
    )=> {
    return Promise.resolve(func(req,res,next)).catch(next);
}