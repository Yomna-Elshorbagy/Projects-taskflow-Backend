import { Router } from "express";
import * as taskControllers from "./task.controllers.js";
import { validate } from "../../middelwares/validate.js";
import { isAuthenticated } from "../../middelwares/auth.js";
import { 
  createTaskVal, 
  updateTaskVal, 
  getTaskVal,
  getTasksVal 
} from "./task.validation.js";

const taskRouter = Router({ mergeParams: true });

taskRouter.use(isAuthenticated);

taskRouter.route("/")
  .post(validate(createTaskVal), taskControllers.createTask)
  .get(validate(getTasksVal), taskControllers.getTasks);

taskRouter.route("/:taskId")
  .get(validate(getTaskVal), taskControllers.getTaskById)
  .put(validate(updateTaskVal), taskControllers.updateTask)
  .delete(validate(getTaskVal), taskControllers.deleteTask);

export default taskRouter;
