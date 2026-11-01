import { forumRepo } from '../repositories/forum.repo.js';
import { notificationService } from './notification.service.js';
import { dbAsync } from '../config/database.js';
import { auditLogService } from './auditLog.service.js';
import { NOTIFICATION_TYPES } from '../config/constants.js';

export const forumService = {
  async createPost({ module_id, learner_id, parent_id, content }, io) {
    // Vérifier accès : l'apprenante doit être inscrite au module
    const enrollment = await dbAsync.get(
      `SELECT * FROM enrollments WHERE learner_id = ? AND module_id = ? AND payment_status = 'paid'`,
      [learner_id, module_id]
    );
    if (!enrollment) {
      const err = new Error('Vous n\'êtes pas inscrite à ce module');
      err.status = 403;
      throw err;
    }

    const id = await forumRepo.createPost({ module_id, learner_id, parent_id, content });

    // Si c'est une réponse, notifier l'auteur du sujet parent
    if (parent_id) {
      const parent = await forumRepo.findPostById(parent_id);
      const author = await dbAsync.get(
        `SELECT full_name FROM learners WHERE id = ?`,
        [learner_id]
      );
      if (parent && parent.learner_id !== learner_id) {
        const notif = await notificationService.create(parent.learner_id, {
          type: NOTIFICATION_TYPES.FORUM_REPLY,
          author_name: author.full_name,
          post_title: parent.content.slice(0, 60),
          module_id,
        });
        if (io) notificationService.emit(io, parent.learner_id, notif);
      }
    }

    return forumRepo.findPostById(id);
  },

  async listModuleThreads(module_id, learner_id) {
    // Vérifier inscription
    const enrollment = await dbAsync.get(
      `SELECT * FROM enrollments WHERE learner_id = ? AND module_id = ? AND payment_status = 'paid'`,
      [learner_id, module_id]
    );
    if (!enrollment) {
      const err = new Error('Vous n\'êtes pas inscrite à ce module');
      err.status = 403;
      throw err;
    }

    const module = await dbAsync.get(`SELECT id, title FROM modules WHERE id = ?`, [module_id]);
    const threads = await forumRepo.listByModule(module_id);
    return { module, threads };
  },

  async getThreadDetail(post_id, learner_id) {
    const post = await forumRepo.findPostById(post_id);
    if (!post) {
      const err = new Error('Sujet introuvable');
      err.status = 404;
      throw err;
    }
    const enrollment = await dbAsync.get(
      `SELECT * FROM enrollments WHERE learner_id = ? AND module_id = ? AND payment_status = 'paid'`,
      [learner_id, post.module_id]
    );
    if (!enrollment) {
      const err = new Error('Accès refusé');
      err.status = 403;
      throw err;
    }
    const replies = await forumRepo.listReplies(post_id);
    return { post, replies };
  },

  async deletePost(post_id, actor) {
    const post = await forumRepo.findPostById(post_id);
    if (!post) {
      const err = new Error('Post introuvable');
      err.status = 404;
      throw err;
    }

    // Autoriser : auteur du post OU admin OU responsable avec forum:moderate
    const isAuthor = actor.type === 'learner' && actor.id === post.learner_id;
    const isModerator = actor.type === 'admin' ||
      (actor.type === 'responsible' && actor.permissions?.forum?.includes('moderate'));

    if (!isAuthor && !isModerator) {
      const err = new Error('Non autorisé à supprimer ce post');
      err.status = 403;
      throw err;
    }

    await forumRepo.deletePost(post_id);

    if (isModerator && !isAuthor) {
      await auditLogService.log(
        { type: actor.type, id: actor.id, name: actor.name },
        'moderate_forum_post',
        { type: 'forum_post', id: post_id },
        { author_learner_id: post.learner_id }
      );
    }

    return { deleted: true };
  },

  // ─── Admin ───
  async adminListAllModules() {
    return dbAsync.all(
      `SELECT m.id, m.title,
        (SELECT COUNT(*) FROM forum_posts fp WHERE fp.module_id = m.id AND fp.parent_id IS NULL) AS threads_count
       FROM modules m
       ORDER BY m.title`
    );
  },
};