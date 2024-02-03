import { NextFunction, Request, Response } from "express";
import { User } from "../schema/User.js";
import { newUserRequestBody } from "../types/Types.js";
import { TryCatchBlockWrapper } from "../middlewares/Error.js";
import ErrorHandler from "../utils/Utility_Class.js";

export const newUser = TryCatchBlockWrapper(
    async (
        req: Request<{}, {}, newUserRequestBody>,
        res: Response,
        next: NextFunction
    ) => {
        const { name, email, photo, gender, _id, dob } = req.body;

        let user = await User.findById(_id);

        if(user)
        {
            return res.status(200).json({
                suceess: true,
                message: `Welcome, ${user.name} `
            })
        }

        if(!_id || !name || !email || !photo || !gender || !dob)
        {
            next(new ErrorHandler("Please add all fields",400));
        }

        user = await User.create(
            {
                name,
                email,
                photo,
                gender,
                _id,
                dob: new Date(dob)
            })

        res.status(201).json({
            success: true,
            message: `Welcome, ${user.name}`,
        });
    }
);

export const getAllUsers = TryCatchBlockWrapper(
    async(req,res,next)=> {
        const users = await User.find({});

        return res.status(200).json({
            success: true,
            users,
        })
    }
);

export const getUser = TryCatchBlockWrapper(
    async(
        req,
        res,
        next
        )=> { 
        const id = req.params.id;
        const user = await User.findById(id);

        if(!user)
        {
            return next(new ErrorHandler("Invalid Id",404));
        }

        return res.status(200).json({
            success: true,
            user,
        })
    }
);

export const deleteUser = TryCatchBlockWrapper(
    async(
        req,
        res,
        next
        )=> { 
        const id = req.params.id;
        const user = await User.findById(id);

        if(!user)
        {
            return next(new ErrorHandler("Invalid Id",404));
        }

        await user.deleteOne();

        return res.status(200).json({
            success: true,
            message: "Deleted Succesfully",
        })
    }
);