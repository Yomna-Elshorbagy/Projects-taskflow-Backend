import { z } from "zod";
import { taskPriority, taskStatus } from "../../../utils/constant/enums.js";
import { generalFields } from "../../middelwares/validate.js";

export const createTaskVal = z.object({
  projectId: generalFields.objectId,
  title: z.string().min(3).max(100),
  description: generalFields.description,
  dueDate: z.coerce.date(),
  assignee: generalFields.objectId,
  status: z.enum(Object.values(taskStatus)).optional(),
  priority: z.enum(Object.values(taskPriority)).optional(),
});

export const updateTaskVal = z.object({
  projectId: generalFields.objectId,
  taskId: generalFields.objectId,
  title: z.string().min(3).max(100).optional(),
  description: generalFields.description.optional(),
  dueDate: z.coerce.date().optional(),
  assignee: generalFields.objectId.optional(),
  status: z.enum(Object.values(taskStatus)).optional(),
  priority: z.enum(Object.values(taskPriority)).optional(),
});

export const getTaskVal = z.object({
  projectId: generalFields.objectId,
  taskId: generalFields.objectId,
});

export const getTasksVal = z.object({
  projectId: generalFields.objectId,
  status: z.enum(Object.values(taskStatus)).optional(),
  priority: z.enum(Object.values(taskPriority)).optional(),
  assignee: generalFields.objectId.optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
  sort: z.string().optional(),
  search: z.string().optional(),
});
