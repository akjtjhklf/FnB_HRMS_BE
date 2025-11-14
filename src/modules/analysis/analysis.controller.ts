import { Request, Response } from "express";
import { getEmployeeStatistics } from "./analysis.service";
import { toAnalysisResponseDto } from "./analysis.dto";

export const getStatistics = async (req: Request, res: Response) => {
  try {
    const stats = await getEmployeeStatistics();
    const response = toAnalysisResponseDto(stats);
    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error", error });
  }
};