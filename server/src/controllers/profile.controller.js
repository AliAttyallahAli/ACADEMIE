import { profileService } from '../services/profile.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const profileController = {
  get: asyncHandler(async (req, res) => {
    const data = await profileService.getProfile(req.user.id);
    res.json(data);
  }),

  update: asyncHandler(async (req, res) => {
    const user = await profileService.updateProfile(req.user.id, req.body);
    res.json({ success: true, user });
  }),

  uploadPhoto: asyncHandler(async (req, res) => {
    const result = await profileService.uploadPhoto(req.user.id, req.file);
    res.json({ success: true, ...result });
  }),

  deletePhoto: asyncHandler(async (req, res) => {
    const result = await profileService.deletePhoto(req.user.id);
    res.json({ success: true, ...result });
  }),

  changePassword: asyncHandler(async (req, res) => {
    const result = await profileService.changePassword(req.user.id, req.body);
    res.json(result);
  }),
};