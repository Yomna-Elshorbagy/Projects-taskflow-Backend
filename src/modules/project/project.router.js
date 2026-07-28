import { Router } from "express";
import * as projectControllers from "./project.controllers.js";
import { validate } from "../../middelwares/validate.js";
import { isAuthenticated } from "../../middelwares/auth.js";
import { 
  createProjectVal, 
  updateProjectVal, 
  getProjectVal, 
  addMemberVal, 
  removeMemberVal 
} from "./project.validation.js";

import taskRouter from "../task/task.router.js";

const projectRouter = Router();

projectRouter.use("/:projectId/tasks", taskRouter);

projectRouter.use(isAuthenticated);

projectRouter.route("/")
  .post(validate(createProjectVal), projectControllers.createProject)
  .get(projectControllers.getProjects);

projectRouter.route("/:id")
  .get(validate(getProjectVal), projectControllers.getProjectById)
  .put(validate(updateProjectVal), projectControllers.updateProject)
  .delete(validate(getProjectVal), projectControllers.deleteProject);

projectRouter.post(
  "/:id/members",
  validate(addMemberVal),
  projectControllers.addMember
);

projectRouter.delete(
  "/:id/members/:userId",
  validate(removeMemberVal),
  projectControllers.removeMember
);

export default projectRouter;
