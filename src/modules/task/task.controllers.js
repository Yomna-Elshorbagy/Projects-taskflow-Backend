import * as taskRepo from "./task.reposatory.js";
import * as projectRepo from "../project/project.reposatory.js";
import { AppError, catchAsyncError } from "../../../utils/catch-error.js";
import { roles } from "../../../utils/constant/enums.js";
import { messages } from "../../../utils/constant/messages.js";

const checkProjectAccess = async (projectId, userId, role) => {
  const project = await projectRepo.findProjectById(projectId);
  if (!project) return { error: new AppError(messages.project.notFound, 404) };

  const isCreator = project.creator._id.toString() === userId.toString();
  const isMember = project.members.some(member => member._id.toString() === userId.toString());
  const isAdmin = role === roles.ADMIN;

  if (!isAdmin && !isCreator && !isMember) {
    return { error: new AppError(messages.user.notAuthorized, 403) };
  }

  return { project, isCreator, isMember, isAdmin };
};

export const createTask = catchAsyncError(async (req, res, next) => {
  const { projectId } = req.params;
  
  const access = await checkProjectAccess(projectId, req.authUser._id, req.authUser.role);
  if (access.error) return next(access.error);

  const task = await taskRepo.createTask({
    ...req.body,
    project: projectId,
    creator: req.authUser._id
  });

  res.status(201).json({ success: true, message: messages.task.createdSuccessfully, data: task });
});

export const getTasks = catchAsyncError(async (req, res, next) => {
  const { projectId } = req.params;
  const { status, priority, assignee } = req.query;
  
  const access = await checkProjectAccess(projectId, req.authUser._id, req.authUser.role);
  if (access.error) return next(access.error);

  const filters = {};
  if (status) filters.status = status;
  if (priority) filters.priority = priority;
  if (assignee) filters.assignee = assignee;

  const tasks = await taskRepo.findTasksByProject(projectId, filters);
  res.json({ success: true, data: tasks });
});

export const getTaskById = catchAsyncError(async (req, res, next) => {
  const { projectId, taskId } = req.params;
  
  const access = await checkProjectAccess(projectId, req.authUser._id, req.authUser.role);
  if (access.error) return next(access.error);

  const task = await taskRepo.findTaskById(taskId);
  if (!task || task.project.toString() !== projectId) {
    return next(new AppError(messages.task.notFound, 404));
  }

  res.json({ success: true, data: task });
});

export const updateTask = catchAsyncError(async (req, res, next) => {
  const { projectId, taskId } = req.params;
  
  const access = await checkProjectAccess(projectId, req.authUser._id, req.authUser.role);
  if (access.error) return next(access.error);

  const task = await taskRepo.findTaskById(taskId);
  if (!task || task.project.toString() !== projectId) {
    return next(new AppError(messages.task.notFound, 404));
  }

  // Admin, Project Creator, or Task Creator can update
  const isTaskCreator = task.creator._id.toString() === req.authUser._id.toString();
  if (!access.isAdmin && !access.isCreator && !isTaskCreator) {
    return next(new AppError(messages.user.notAuthorized, 403));
  }

  const updatedTask = await taskRepo.updateTask(taskId, req.body);
  res.json({ success: true, message: messages.task.updatedSuccessfully, data: updatedTask });
});

export const deleteTask = catchAsyncError(async (req, res, next) => {
  const { projectId, taskId } = req.params;
  
  const access = await checkProjectAccess(projectId, req.authUser._id, req.authUser.role);
  if (access.error) return next(access.error);

  const task = await taskRepo.findTaskById(taskId);
  if (!task || task.project.toString() !== projectId) {
    return next(new AppError(messages.task.notFound, 404));
  }

  // Admin or Task Creator can delete
  const isTaskCreator = task.creator._id.toString() === req.authUser._id.toString();
  if (!access.isAdmin && !isTaskCreator) {
    return next(new AppError(messages.user.notAuthorized, 403));
  }

  await taskRepo.deleteTask(taskId);
  res.json({ success: true, message: messages.task.deletedSuccessfully });
});
