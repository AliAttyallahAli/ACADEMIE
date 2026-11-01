import { forumService } from '../../services/forum.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

export const forumAdminController = {
  listModules: asyncHandler(async (req, res) => {
    const items = await forumService.adminListAllModules();
    res.json({ items });
  }),

  deletePost: asyncHandler(async (req, res) => {
    const result = await forumService.deletePost(
      Number(req.params.id),
      {
        type: req.user.type,
        id: req.user.id,
        name: req.user.full_name,
        permissions: req.user.permissions_json ? JSON.parse(req.user.permissions_json) : {},
      }
    );
    res.json(result);
  }),
};