import Task from "../../../database/models/task.model.js";

export const createTask = async (data) => {
  const task = new Task(data);
  return await task.save();
};

export const findTaskById = async (id) => {
  return await Task.findById(id)
    .populate("creator assignee", "userName email role")
    .populate("statusHistory.changedBy", "userName email");
};

export const findTasksByProject = async (projectId, filters = {}) => {
  return await Task.find({ project: projectId, ...filters })
    .populate("creator assignee", "userName email role")
    .populate("statusHistory.changedBy", "userName email")
    .sort({ createdAt: -1 });
};

export const updateTask = async (id, data) => {
  return await Task.findByIdAndUpdate(id, data, { new: true })
    .populate("creator assignee", "userName email role")
    .populate("statusHistory.changedBy", "userName email");
};

export const deleteTask = async (id) => {
  return await Task.findByIdAndDelete(id);
};
