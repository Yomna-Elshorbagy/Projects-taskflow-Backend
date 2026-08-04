import Project from "../../../database/models/project.model.js";
import { ApiFeatures } from "../../../utils/api-features.js";
import redisService from "../../services/redis.service.js";

export const createProject = async (data) => {
  const project = new Project(data);
  return await project.save();
};

export const findProjectById = async (id) => {
  const cacheKey = `project:${id}`;
  const cachedProject = await redisService.get(cacheKey);
  if (cachedProject) return cachedProject;

  const project = await Project.findById(id)
    .populate("creator members", "userName email role")
    .populate("totalTasks")
    .populate("completedTasks");

  if (project) {
    await redisService.set(cacheKey, project, 3600);
  }
  return project;
};

export const findProjectsByUser = async (userId, queryData = {}) => {
  const mongooseQuery = Project.find({
    $or: [{ creator: userId }, { members: userId }]
  });

  const features = new ApiFeatures(mongooseQuery, queryData)
    .filter()
    .search(["name", "description"])
    .sort();

  const totalItems = await Project.countDocuments(features.mongooseQuery.getFilter());

  features.paginate();

  const data = await features.mongooseQuery
    .populate("creator members", "userName email role")
    .populate("totalTasks")
    .populate("completedTasks");

  return { data, totalItems };
};

export const findAllProjects = async (queryData = {}) => {
  const mongooseQuery = Project.find();
  
  const features = new ApiFeatures(mongooseQuery, queryData)
    .filter()
    .search(["name", "description"])
    .sort();

  const totalItems = await Project.countDocuments(features.mongooseQuery.getFilter());

  features.paginate();

  const data = await features.mongooseQuery
    .populate("creator members", "userName email role")
    .populate("totalTasks")
    .populate("completedTasks");

  return { data, totalItems };
};

export const updateProject = async (id, data) => {
  const project = await Project.findByIdAndUpdate(id, data, { new: true }).populate("creator members", "userName email role");
  await redisService.del(`project:${id}`);
  return project;
};

export const deleteProject = async (id) => {
  await redisService.del(`project:${id}`);
  return await Project.findByIdAndDelete(id);
};

export const addMember = async (projectId, userId) => {
  const project = await Project.findByIdAndUpdate(
    projectId,
    { $addToSet: { members: userId } },
    { new: true }
  ).populate("creator members", "userName email role");
  await redisService.del(`project:${projectId}`);
  return project;
};

export const removeMember = async (projectId, userId) => {
  const project = await Project.findByIdAndUpdate(
    projectId,
    { $pull: { members: userId } },
    { new: true }
  ).populate("creator members", "userName email role");
  await redisService.del(`project:${projectId}`);
  return project;
};
