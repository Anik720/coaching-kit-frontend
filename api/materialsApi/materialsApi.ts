import api from '../axios';

const materialsApi = {
  // ─── Categories ───────────────────────────────────────────────────
  createCategory: (data: Record<string, any>) =>
    api.post('/academic-materials/categories', data),

  listCategories: (status?: string) =>
    api.get('/academic-materials/categories', { params: status ? { status } : {} }),

  updateCategory: (id: string, data: Record<string, any>) =>
    api.patch(`/academic-materials/categories/${id}`, data),

  // ─── Materials ────────────────────────────────────────────────────
  createMaterial: (data: Record<string, any>) =>
    api.post('/academic-materials/materials', data),

  listMaterials: (params?: Record<string, any>) =>
    api.get('/academic-materials/materials', { params }),

  getMaterialById: (id: string) =>
    api.get(`/academic-materials/materials/${id}`),

  updateMaterial: (id: string, data: Record<string, any>) =>
    api.patch(`/academic-materials/materials/${id}`, data),

  addStock: (id: string, data: Record<string, any>) =>
    api.post(`/academic-materials/materials/${id}/add-stock`, data),

  // ─── Batch Assignment ─────────────────────────────────────────────
  assignToBatch: (data: Record<string, any>) =>
    api.post('/academic-materials/assign-batch', data),

  getBatchAssignments: (params?: Record<string, any>) =>
    api.get('/academic-materials/batch-assignments', { params }),

  getAssignedMaterialsForBatch: (batchId: string) =>
    api.get(`/academic-materials/assigned-for-batch/${batchId}`),

  // ─── Distribution ─────────────────────────────────────────────────
  distribute: (data: Record<string, any>) =>
    api.post('/academic-materials/distribute', data),

  getDistributions: (params?: Record<string, any>) =>
    api.get('/academic-materials/distributions', { params }),

  // ─── Purchase History ─────────────────────────────────────────────
  getPurchaseHistory: (params?: Record<string, any>) =>
    api.get('/academic-materials/purchase-history', { params }),
};

export default materialsApi;
