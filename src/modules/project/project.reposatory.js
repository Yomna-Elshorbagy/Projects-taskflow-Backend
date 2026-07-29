import Project from "../../../database/models/project.model.js";
import { ApiFeatures } from "../../../utils/api-features.js";

export const createProject = async (data) => {
  const project = new Project(data);
  return await project.save();
};

export const findProjectById = async (id) => {
  return await Project.findById(id)
    .populate("creator members", "userName email role")
    .populate("totalTasks")
    .populate("completedTasks");
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
  return await Project.findByIdAndUpdate(id, data, { new: true }).populate("creator members", "userName email role");
};

export const deleteProject = async (id) => {
  return await Project.findByIdAndDelete(id);
};

export const addMember = async (projectId, userId) => {
  return await Project.findByIdAndUpdate(
    projectId,
    { $addToSet: { members: userId } },
    { new: true }
  ).populate("creator members", "userName email role");
};

export const removeMember = async (projectId, userId) => {
  return await Project.findByIdAndUpdate(
    projectId,
    { $pull: { members: userId } },
    { new: true }
  ).populate("creator members", "userName email role");
};
