import { Request, Response, NextFunction } from "express";
import AccessService from "./access.service";
import { AssignAccessDto } from "./access.dto";

export class AccessController {
  async assignAccess(req: Request, res: Response, next: NextFunction) {
    try {
      const dto: AssignAccessDto = req.body;
      // Basic validation could be added here or via middleware
      if (!dto.userId || !dto.roleId) {
          throw new Error("Missing required fields: userId, roleId");
      }
      
      const result = await AccessService.assignAccess(dto);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async getAccess(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;
      const result = await AccessService.getAccess(userId);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async updateRolePolicies(req: Request, res: Response, next: NextFunction) {
      try {
          const { roleId } = req.params;
          const { policyIds } = req.body;
          const result = await AccessService.updateRolePolicies(roleId, policyIds);
          res.json({ success: true, data: result });
      } catch (error) {
          next(error);
      }
  }

  async getRolePolicies(req: Request, res: Response, next: NextFunction) {
      try {
          const { roleId } = req.params;
          const result = await AccessService.getRolePolicies(roleId);
          res.json({ success: true, data: result });
      } catch (error) {
          next(error);
      }
  }
}

export default new AccessController();
