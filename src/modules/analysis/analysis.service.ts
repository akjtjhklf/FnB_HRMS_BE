import { Employee } from "../employees/employee.model";

// Ensure Employee is imported as a runtime value from the ORM
const EmployeeModel = require("../employees/employee.model");

export const getEmployeeStatistics = async () => {
  const totalEmployees = await EmployeeModel.count();
  const activeEmployees = await EmployeeModel.count({ where: { status: "active" } });
  const onLeaveEmployees = await EmployeeModel.count({ where: { status: "on_leave" } });
  const inactiveEmployees = await EmployeeModel.count({ where: { status: "terminated" } });

  return {
    totalEmployees,
    activeEmployees,
    onLeaveEmployees,
    inactiveEmployees,
  };
};