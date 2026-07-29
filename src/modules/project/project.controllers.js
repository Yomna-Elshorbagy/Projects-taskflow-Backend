import * as projectRepo from "./project.reposatory.js";
import { AppError, catchAsyncError } from "../../../utils/catch-error.js";
import { roles } from "../../../utils/constant/enums.js";
import { messages } from "../../../utils/constant/messages.js";
import User from "../../../database/models/user.model.js";

export const createProject = catchAsyncError(async (req, res, next) => {
  const { name, description } = req.body;
  const project = await projectRepo.createProject({
    name,
    description,
    creator: req.authUser._id,
  });
  res.status(201).json({ success: true, message: messages.project.createdSuccessfully, data: project });
});

export const getProjects = catchAsyncError(async (req, res, next) => {
  let result;
  if (req.authUser.role === roles.ADMIN) {
    result = await projectRepo.findAllProjects(req.query);
  } else {
    result = await projectRepo.findProjectsByUser(req.authUser._id, req.query);
  }

  const { data, totalItems } = result;
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.max(parseInt(req.query.limit, 10) || 10, 1);
  const totalPages = Math.ceil(totalItems / limit);

  res.json({
    success: true,
    data,
    pagination: {
      page,
      limit,
      totalItems,
      totalPages,
    },
  });
});

export const getProjectById = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  const project = await projectRepo.findProjectById(id);
  
  if (!project) return next(new AppError(messages.project.notFound, 404));

  const isCreator = project.creator._id.toString() === req.authUser._id.toString();
  const isMember = project.members.some(member => member._id.toString() === req.authUser._id.toString());
  const isAdmin = req.authUser.role === roles.ADMIN;

  if (!isAdmin && !isCreator && !isMember) {
    return next(new AppError(messages.user.notAuthorized, 403));
  }

  res.json({ success: true, data: project });
});

export const updateProject = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  const project = await projectRepo.findProjectById(id);
  
  if (!project) return next(new AppError(messages.project.notFound, 404));

  const isCreator = project.creator._id.toString() === req.authUser._id.toString();
  const isAdmin = req.authUser.role === roles.ADMIN;

  if (!isAdmin && !isCreator) {
    return next(new AppError(messages.user.notAuthorized, 403));
  }

  const updatedProject = await projectRepo.updateProject(id, req.body);
  res.json({ success: true, message: messages.project.updatedSuccessfully, data: updatedProject });
});

export const deleteProject = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  const project = await projectRepo.findProjectById(id);
  
  if (!project) return next(new AppError(messages.project.notFound, 404));

  if (req.authUser.role !== roles.ADMIN) {
    return next(new AppError(messages.user.notAuthorized, 403));
  }

  await projectRepo.deleteProject(id);
  res.json({ success: true, message: messages.project.deletedSuccessfully });
});

export const addMember = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  const { userId } = req.body;

  if (req.authUser.role !== roles.ADMIN) {
    return next(new AppError(messages.user.notAuthorized, 403));
  }

  const userExists = await User.findById(userId);
  if (!userExists) {
    return next(new AppError(messages.user.notFound, 404));
  }

  const project = await projectRepo.addMember(id, userId);
  if (!project) return next(new AppError(messages.project.notFound, 404));

  res.json({ success: true, message: "member added successfully", data: project });
});

export const removeMember = catchAsyncError(async (req, res, next) => {
  const { id, userId } = req.params; 

  if (req.authUser.role !== roles.ADMIN) {
    return next(new AppError(messages.user.notAuthorized, 403));
  }

  const existingProject = await projectRepo.findProjectById(id);
  if (!existingProject) return next(new AppError(messages.project.notFound, 404));

  const isMember = existingProject.members.some(member => member._id.toString() === userId);
  if (!isMember) {
    return next(new AppError("User is not a member of this project", 400));
  }

  const project = await projectRepo.removeMember(id, userId);

  res.json({ success: true, message: "member removed successfully", data: project });
});
