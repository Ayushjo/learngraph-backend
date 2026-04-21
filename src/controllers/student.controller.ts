import { Request, Response, NextFunction } from "express";
import { studentService } from "../services/student.service";

export const studentController = {
  async findOrCreate(req: Request, res: Response, next: NextFunction) {
    try {
      const { name } = req.body;
      const student = await studentService.findOrCreate(name);
      res.status(200).json({ success: true, data: student });
    } catch (error) {
      next(error);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const student = await studentService.getById(id);
      res.status(200).json({ success: true, data: student });
    } catch (error) {
      next(error);
    }
  },

  async getWithHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const student = await studentService.getWithHistory(id);
      res.status(200).json({ success: true, data: student });
    } catch (error) {
      next(error);
    }
  },
};
