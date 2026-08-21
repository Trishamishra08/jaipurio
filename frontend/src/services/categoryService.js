import apiClient from '../api/apiClient';

export const categoryService = {
  /**
   * Fetch all categories
   * @returns {Promise<Array>} Array of category objects
   */
  getAllCategories: async () => {
    try {
      const response = await apiClient.get('/categories');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Fetch a single category by ID
   * @param {string} id 
   * @returns {Promise<Object>} Category object
   */
  getCategory: async (id) => {
    try {
      const response = await apiClient.get(`/categories/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Create a new category
   * @param {Object} categoryData - Data to create category ({ title, url })
   * @returns {Promise<Object>} Created category
   */
  createCategory: async (categoryData) => {
    try {
      const response = await apiClient.post('/categories', categoryData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Update an existing category
   * @param {string} id 
   * @param {Object} categoryData - Data to update ({ title, url })
   * @returns {Promise<Object>} Updated category
   */
  updateCategory: async (id, categoryData) => {
    try {
      const response = await apiClient.put(`/categories/${id}`, categoryData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Delete a category
   * @param {string} id 
   * @returns {Promise<Object>} Response data
   */
  deleteCategory: async (id) => {
    try {
      const response = await apiClient.delete(`/categories/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};
