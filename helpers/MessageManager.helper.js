/**
 * Simple Message Manager System
 * Format: action + model + status (success/failed)
 */

class MessageManager {
  constructor() {
    this.entities = {
      ebook: "e-book",
      ebookcategory: "e-book category",
      kidreading: "reading",
      readingcategory: "reading category",
      user: "user",
      student: "student",
      teacher: "teacher",
      parent: "parent",
      feedback: "feedback",
      question: "question",
      role: "role",
      grade: "grade",
      notification: "notification",
    };
  }

  /**
   * Get entity name
   * @param {string} entity - entity key
   * @returns {string} entity name
   */
  getEntity(entity) {
    return this.entities[entity] || entity;
  }

  /**
   * Generate message: action + model + status
   * @param {string} action - create, update, delete, fetch, toggle
   * @param {string} entity - entity name
   * @param {string} status - success/failed
   * @returns {string} formatted message
   */
  getMessage(action, entity, status) {
    const entityName = this.getEntity(entity);
    return `${action} ${entityName} ${status}`;
  }

  /**
   * Create standard response object
   * @param {boolean} success - success status
   * @param {string} message - response message
   * @param {any} data - response data
   * @param {number} statusCode - HTTP status code
   * @returns {object} response object
   */
  createResponse(success, message, data = null, statusCode = 200, error = null) {
    const response = {
      success,
      message,
      status: statusCode,
      errors: error ? [error] : null,
    };

    if (data !== null) {
      response.data = data;
    }

    return response;
  }

  createSuccess(entity, data = null, res) {
    const response = this.createResponse(
      true,
      this.getMessage("Create", entity, "success"),
      data,
      201
    );
    return res ? res.status(201).json(response) : response;
  }

  updateSuccess(entity, data = null, res) {
    const response = this.createResponse(
      true,
      this.getMessage("Update", entity, "success"),
      data
    );
    return res ? res.status(200).json(response) : response;
  }

  deleteSuccess(entity, res) {
    const response = this.createResponse(
      true,
      this.getMessage("Delete", entity, "success")
    );
    return res ? res.status(200).json(response) : response;
  }

  fetchSuccess(entity, data, res) {
    const response = this.createResponse(
      true,
      this.getMessage("Fetch", entity, "success"),
      data
    );
    return res ? res.status(200).json(response) : response;
  }

  toggleSuccess(entity, data, res) {
    const response = this.createResponse(
      true,
      this.getMessage("Update status", entity, "success"),
      data
    );
    return res ? res.status(200).json(response) : response;
  }

  createFailed(entity, res, error = null) {
    const response = this.createResponse(
      false,
      this.getMessage("Create", entity, "failed"),
      null,
      500,
      error = error
    );
    console.error(`[MessageManager] createFailed for ${entity}:`, error);
    return res ? res.status(500).json(response) : response;
  }

  updateFailed(entity, res, error = null) {
    const response = this.createResponse(
      false,
      this.getMessage("Update", entity, "failed"),
      null,
      500,
      error = error
    );
    console.error(`[MessageManager] updateFailed for ${entity}:`, error);
    return res ? res.status(500).json(response) : response;
  }

  deleteFailed(entity, res, error = null) {
    const response = this.createResponse(
      false,
      this.getMessage("Delete", entity, "failed"),
      null,
      500
    );
    console.error(`[MessageManager] deleteFailed for ${entity}:`, error);
    return res ? res.status(500).json(response) : response;
  }

  fetchFailed(entity, res, error = null) {
    const response = this.createResponse(
      false,
      this.getMessage("Fetch", entity, "failed"),
      null,
      400
    );
    console.error(`[MessageManager] fetchFailed for ${entity}:`, error);
    return res ? res.status(500).json(response) : response;
  }

  toggleFailed(entity, res) {
    const response = this.createResponse(
      false,
      this.getMessage("Update status", entity, "failed"),
      null,
      400
    );
    return res ? res.status(400).json(response) : response;
  }

  notFound(entity, res) {
    const response = this.createResponse(
      false,
      this.getMessage("Find", entity, "failed"),
      null,
      400,
    );
    return res ? res.status(400).json(response) : response;
  }

  validationFailed(entity, res, error = null) {
    const response = this.createResponse(
      false,
      this.getMessage("Validate", entity, "failed"),
      null,
      400,
      error = error
    );
    return res ? res.status(400).json(response) : response;
  }

  uploadFileFailed(entity, res, error = null) {
    const response = this.createResponse(
      false,
      this.getMessage("Upload file", entity, "failed"),
      null,
      500
    );
    console.error(`[MessageManager] uploadFileFailed for ${entity}:`, error);
    return res ? res.status(400).json(response) : response;
  }
}

const messageManager = new MessageManager();

module.exports = messageManager;
