import Task from "../../../database/models/task.model.js";
import { ApiFeatures } from "../../../utils/api-features.js";
import redisService from "../../services/redis.service.js";

export const createTask = async (data) => {
  const task = new Task(data);
  return await task.save();
};

export const findTaskById = async (id) => {
  const cacheKey = `task:${id}`;
  const cachedTask = await redisService.get(cacheKey);
  if (cachedTask) return cachedTask;

  const task = await Task.findById(id)
    .populate("creator assignee", "userName email role")
    .populate("statusHistory.changedBy", "userName email");

  if (task) {
    await redisService.set(cacheKey, task, 3600);
  }
  return task;
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
  const task = await Task.findByIdAndUpdate(id, data, { new: true })
    .populate("creator assignee", "userName email role")
    .populate("statusHistory.changedBy", "userName email");
  await redisService.del(`task:${id}`);
  return task;
};

export const deleteTask = async (id) => {
  await redisService.del(`task:${id}`);
  return await Task.findByIdAndDelete(id);
};
