//Middleware to make sure only admin is allowed

import { User } from "../schema/User.js";
import ErrorHandler from "../utils/Utility_Class.js";
import { TryCatchBlockWrapper } from "./Error.js";

export const adminOnly = TryCatchBlockWrapper(
    async(req,res,next)=>
    {
        const {id} = req.query;

        if(!id)
        {
            return next(new ErrorHandler("Please Login First",401));
        }

        const user = await User.findById(id);

        if(!user)
        {
            return next(new ErrorHandler("ID doesn't exists",401));
        }

        if(user.role !== "admin")
        {
            return next(new ErrorHandler("Unauthorized Access",401));
        }

        next();
});