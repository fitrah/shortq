export const openapi = {
  openapi: '3.1.0',
  info: {
    title: 'go.proyek.org REST API',
    version: '1.0.0',
    description: 'API untuk short link, analytics, dan QR. API key hanya ditampilkan sekali saat dibuat dari dashboard.',
  },
  servers: [{ url: '/api/v1' }],
  security: [{ bearerAuth: [] }],
  tags: [{ name: 'Links' }, { name: 'Analytics' }, { name: 'QR' }],
  paths: {
    '/links': {
      get: { tags: ['Links'], summary: 'Daftar short link', operationId: 'listLinks', responses: { '200': { description: 'Daftar link', content: { 'application/json': { schema: { type: 'object', properties: { data: { type: 'array', items: { $ref: '#/components/schemas/Link' } } } } } } }, '401': { $ref: '#/components/responses/Unauthorized' }, '429': { $ref: '#/components/responses/RateLimited' } } },
      post: { tags: ['Links'], summary: 'Buat short link', operationId: 'createLink', requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/LinkInput' } } } }, responses: { '201': { description: 'Link dibuat' }, '400': { description: 'Input tidak valid' }, '403': { description: 'Scope atau kuota tidak cukup' }, '429': { $ref: '#/components/responses/RateLimited' } } },
    },
    '/links/{id}': {
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      get: { tags: ['Links'], summary: 'Detail link', responses: { '200': { description: 'Detail link' }, '404': { description: 'Tidak ditemukan' } } },
      patch: { tags: ['Links'], summary: 'Ubah target, alias, status, password, atau expiry', requestBody: { required: true, content: { 'application/json': { schema: { allOf: [{ $ref: '#/components/schemas/LinkInput' }, { type: 'object', properties: { isActive: { type: 'boolean' }, removePassword: { type: 'boolean' } } }] } } } }, responses: { '200': { description: 'Link diperbarui' } } },
      delete: { tags: ['Links'], summary: 'Hapus link', responses: { '204': { description: 'Link dihapus' } } },
    },
    '/analytics': { get: { tags: ['Analytics'], summary: 'Ringkasan analytics', responses: { '200': { description: 'Total dan top links' } } } },
    '/qr': { post: { tags: ['QR'], summary: 'Generate QR PNG/SVG', requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/QrInput' } } } }, responses: { '201': { description: 'QR dibuat' } } } },
  },
  components: {
    securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'API key', description: 'Format: Bearer gop_...' } },
    responses: {
      Unauthorized: { description: 'API key tidak valid' },
      RateLimited: { description: 'Rate limit per menit terlampaui', headers: { 'Retry-After': { schema: { type: 'integer' } }, 'X-RateLimit-Limit': { schema: { type: 'integer' } }, 'X-RateLimit-Remaining': { schema: { type: 'integer' } } } },
    },
    schemas: {
      Link: { type: 'object', properties: { id: { type: 'string' }, alias: { type: 'string' }, targetUrl: { type: 'string', format: 'uri' }, title: { type: ['string', 'null'] }, isActive: { type: 'boolean' }, hasPassword: { type: 'boolean' }, expiresAt: { type: ['string', 'null'], format: 'date-time' }, clickCount: { type: 'integer' } } },
      LinkInput: { type: 'object', required: ['targetUrl'], properties: { targetUrl: { type: 'string', format: 'uri' }, alias: { type: 'string', pattern: '^[a-zA-Z0-9_-]{3,50}$' }, title: { type: 'string', maxLength: 100 }, password: { type: 'string', minLength: 4, maxLength: 100 }, expiresAt: { type: 'string', format: 'date-time' }, isActive: { type: 'boolean' } } },
      QrInput: { type: 'object', required: ['content'], properties: { name: { type: 'string' }, content: { type: 'string', maxLength: 2048 }, format: { type: 'string', enum: ['png', 'svg'], default: 'png' }, foreground: { type: 'string', pattern: '^#[0-9a-fA-F]{6}$' }, background: { type: 'string', pattern: '^#[0-9a-fA-F]{6}$' }, size: { type: 'integer', minimum: 256, maximum: 2048 }, margin: { type: 'integer', minimum: 0, maximum: 10 }, save: { type: 'boolean', default: true } } },
    },
  },
} as const;
