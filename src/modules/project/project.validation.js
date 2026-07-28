import { z } from "zod";
import { generalFields } from "../../middelwares/validate.js";

export const createProjectVal = z.object({
  name: z.string().min(3).max(100),
  description: generalFields.description.optional(),
});

export const updateProjectVal = z.object({
  name: z.string().min(3).max(100).optional(),
  description: generalFields.description.optional(),
  id: generalFields.objectId,
});

export const getProjectVal = z.object({
  id: generalFields.objectId,
});

export const addMemberVal = z.object({
  id: generalFields.objectId,
  userId: generalFields.objectId,
});

export const removeMemberVal = z.object({
  id: generalFields.objectId,
  userId: generalFields.objectId,
});
