import Task from "../../../database/models/task.model.js";
import { ApiFeatures } from "../../../utils/api-features.js";

export const createTask = async (data) => {
  const task = new Task(data);
  return await task.save();
};

export const findTaskById = async (id) => {
  return await Task.findById(id)
    .populate("creator assignee", "userName email role")
    .populate("statusHistory.changedBy", "userName email");
};

export const findTasksByProject = async (projectId, queryData = {}) => {
  const mongooseQuery = Task.find({ project: projectId });
  const features = new ApiFeatures(mongooseQuery, queryData)
    .filter()
    .search(["title", "description"])
    .sort();

  const totalItems = await Task.countDocuments(features.mongooseQuery.getFilter());

  features.paginate();

  const data = await features.mongooseQuery
    .populate("creator assignee", "userName email role")
    .populate("statusHistory.changedBy", "userName email");

  return { data, totalItems };
};

export const updateTask = async (id, data) => {
  return await Task.findByIdAndUpdate(id, data, { new: true })
    .populate("creator assignee", "userName email role")
    .populate("statusHistory.changedBy", "userName email");
};

export const deleteTask = async (id) => {
  return await Task.findByIdAndDelete(id);
};
